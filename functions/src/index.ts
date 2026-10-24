import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import * as bcrypt from "bcryptjs";
import Stripe from "stripe";

initializeApp();
const db = getFirestore();

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const stripePriceId = defineString("STRIPE_PRICE_ID", {
  default: "price_1UOcVpITd86hzBlX9fFVaDGZ",
});
const appUrl = defineString("APP_URL", {
  default: "https://testexamencap.info",
});

const REGION = "europe-west1";
const EURO_CENTS = 100;
const STUDENT_MONTH_CENTS = 5 * EURO_CENTS;
const SCHOOL_MONTH_CENTS = 1 * EURO_CENTS;
const SCHOOL_SEAT_MONTH_CENTS = 4 * EURO_CENTS;
const MIN_MONTHS = 1;
const MAX_MONTHS = 12;
const MIN_SEATS = 1;
const MAX_SEATS = 200;
const CORS_ORIGINS = [
  "https://testexamencap.info",
  "https://www.testexamencap.info",
  "https://cap-dtx.pages.dev",
  "http://localhost:3000",
];

type Role = "student" | "teacher" | "root";
type Billing = "school" | "prepaid";
type CheckoutParams = Stripe.Checkout.SessionCreateParams & {
  managed_payments?: { enabled: boolean };
};

const httpsOpts = {
  region: REGION,
  cors: CORS_ORIGINS,
  secrets: [stripeSecret],
};

function json(
  res: { status: (n: number) => { json: (b: unknown) => void } },
  status: number,
  body: unknown
) {
  res.status(status).json(body);
}

function stripeClient(): Stripe {
  return new Stripe(stripeSecret.value());
}

function normalizeUsername(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}

function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

function clampMonths(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_MONTHS || n > MAX_MONTHS) return null;
  return n;
}

function clampSeats(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_SEATS || n > MAX_SEATS) return null;
  return n;
}

function millisFromTs(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  return null;
}

function seatState(data: Record<string, unknown> | undefined) {
  const seatsPurchased = Number(data?.seatsPurchased ?? 0);
  const seatsUsed = Number(data?.seatsUsed ?? 0);
  const packUntil =
    data?.packPaidUntil instanceof Timestamp ? data.packPaidUntil : null;
  const packActive = packUntil != null && packUntil.toDate() > new Date();
  const hasSeat = packActive && seatsUsed < seatsPurchased;
  return { seatsPurchased, seatsUsed, packUntil, packActive, hasSeat };
}

const TRIAL_BILLING_MSG =
  "Esta autoescuela está en periodo de prueba. El alta y el pago se activan al terminar la prueba.";

function trialStillActive(value: unknown): boolean {
  const ms = millisFromTs(value);
  if (ms == null) return false;
  const end = new Date(ms);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return endDay >= today;
}

async function schoolTrialLocksBilling(
  teacherId: string,
  centerData: Record<string, unknown> | undefined
): Promise<boolean> {
  if (seatState(centerData).packActive) return false;
  if (!teacherId) return false;
  const teacher = await db.collection("users").doc(teacherId).get();
  return trialStillActive(teacher.data()?.trialEndsAt);
}

function publicCenter(schoolCode: string, data: Record<string, unknown> | undefined) {
  const { seatsPurchased, seatsUsed, packActive } = seatState(data);
  const packPaidUntil = millisFromTs(data?.packPaidUntil);
  const seatsLeft = packActive ? Math.max(0, seatsPurchased - seatsUsed) : 0;
  return {
    schoolCode,
    schoolName: data?.schoolName ?? "",
    seatsPurchased: packActive ? seatsPurchased : 0,
    seatsUsed: packActive ? seatsUsed : 0,
    seatsLeft,
    packPaidUntil,
    packActive,
    inviteUrl: `${appUrl.value()}/alumno?code=${encodeURIComponent(schoolCode)}`,
  };
}

function addCalendarMonths(from: Date, months: number): Date {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  next.setMonth(next.getMonth() + months);
  return next;
}

function makeSchoolCode(schoolName: string): string {
  const slug =
    schoolName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase() || "CAP";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug}-${rand}`;
}

async function uniqueSchoolCode(schoolName: string): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = makeSchoolCode(schoolName);
    const snap = await db.collection("centers").doc(code).get();
    if (!snap.exists) return code;
  }
  throw new Error("No se pudo generar un código de centro");
}

async function mintToken(
  username: string,
  role: Role,
  extra: { teacherId?: string; schoolCode?: string } = {}
): Promise<string> {
  const claims: Record<string, string> = { role };
  if (extra.teacherId) claims.teacherId = extra.teacherId;
  if (extra.schoolCode) claims.schoolCode = extra.schoolCode;
  try {
    return await getAuth().createCustomToken(username, claims);
  } catch (err) {
    logger.error("createCustomToken failed", err);
    throw err;
  }
}

async function callerFromRequest(
  req: Request
): Promise<{ uid: string; role: Role } | null> {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return null;
  try {
    const decoded = await getAuth().verifyIdToken(header.slice(7));
    const role: Role =
      decoded.role === "teacher" || decoded.role === "root"
        ? decoded.role
        : "student";
    return { uid: decoded.uid, role };
  } catch (err) {
    logger.warn("Invalid ID token", err);
    return null;
  }
}

async function requireCaller(
  req: Request,
  res: { status: (n: number) => { json: (b: unknown) => void } }
): Promise<{ uid: string; role: Role } | null> {
  const caller = await callerFromRequest(req);
  if (!caller) {
    json(res, 401, { error: "Sesión no válida. Entra otra vez." });
    return null;
  }
  return caller;
}

function publicUser(id: string, data: Record<string, unknown>) {
  return {
    username: id,
    name: data.name ?? id,
    role: (data.role as Role) ?? "student",
    teacherId: data.teacherId ?? null,
    schoolCode: data.schoolCode ?? null,
    schoolName: data.schoolName ?? null,
    capTrack: data.capTrack === "viajeros" ? "viajeros" : "mercancias",
    billing: data.billing === "prepaid" ? "prepaid" : data.billing === "school" ? "school" : null,
    paidUntil: data.paidUntil instanceof Timestamp ? data.paidUntil.toMillis() : null,
    trialEndsAt: data.trialEndsAt instanceof Timestamp ? data.trialEndsAt.toMillis() : null,
    connectStatus: data.connectStatus ?? null,
  };
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  return {};
}

export const login = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  if (!isValidUsername(username)) {
    json(res, 400, { error: "Usuario o contraseña no válidos" });
    return;
  }

  const userRef = db.collection("users").doc(username);
  const userSnap = await userRef.get();
  if (!userSnap.exists && username !== "root") {
    json(res, 401, { error: "Usuario no encontrado" });
    return;
  }
  const data = (userSnap.data() ?? { name: "root", role: "root" }) as Record<
    string,
    unknown
  >;
  const secretSnap = await db.collection("user_secrets").doc(username).get();
  const hash = secretSnap.data()?.passwordHash as string | undefined;
  const legacy = typeof data.password === "string" ? data.password : "";
  const uninitialized = !hash && (!legacy || legacy === "");

  let ok = false;
  let mustSetPassword = false;
  if (username === "root" && !password) {
    json(res, 401, { error: "Usuario o contraseña no válidos" });
    return;
  }
  if (!password) {
    if (!uninitialized) {
      json(res, 401, { error: "Usuario o contraseña no válidos" });
      return;
    }
    ok = true;
    mustSetPassword = true;
  } else if (hash) {
    ok = await bcrypt.compare(password, hash);
  } else if (legacy) {
    ok = legacy === password;
    if (ok) {
      const nextHash = await bcrypt.hash(password, 10);
      await db.collection("user_secrets").doc(username).set({
        passwordHash: nextHash,
        migratedAt: FieldValue.serverTimestamp(),
      });
      if (userSnap.exists) {
        await userRef.update({ password: FieldValue.delete() });
      }
    }
  } else if (username === "root" && password === "1234") {
    ok = true;
    mustSetPassword = true;
  }
  if (!ok) {
    json(res, 401, { error: "Credenciales incorrectas" });
    return;
  }

  const role: Role =
    username === "root" || data.role === "root"
      ? "root"
      : data.role === "teacher"
        ? "teacher"
        : "student";
  if (username === "root" && !userSnap.exists) {
    await userRef.set({ name: "root", role: "root" }, { merge: true });
  }
  try {
    const token = await mintToken(username, role, {
      teacherId: String(data.teacherId ?? ""),
      schoolCode: String(data.schoolCode ?? ""),
    });
    json(res, 200, {
      token,
      user: publicUser(username, { ...data, role, name: data.name ?? username }),
      mustSetPassword,
    });
  } catch (err) {
    logger.error("login mintToken failed", err);
    json(res, 500, {
      error: "No se pudo abrir la sesión. Inténtalo de nuevo.",
    });
  }
});

export const registerTeacher = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const schoolName = String(body.schoolName ?? "").trim();
  if (!isValidUsername(username) || password.length < 6) {
    json(res, 400, { error: "Usuario (3–32) y contraseña (mín. 6) obligatorios" });
    return;
  }
  if (!name || !schoolName) {
    json(res, 400, { error: "Nombre y autoescuela obligatorios" });
    return;
  }

  const userRef = db.collection("users").doc(username);
  if ((await userRef.get()).exists) {
    json(res, 409, { error: "Ese usuario ya existe" });
    return;
  }

  const schoolCode = await uniqueSchoolCode(schoolName);
  const trialEndsAt = Timestamp.fromDate(addCalendarMonths(new Date(), 1));
  const hash = await bcrypt.hash(password, 10);

  const batch = db.batch();
  batch.set(userRef, {
    name,
    role: "teacher",
    schoolName,
    schoolCode,
    trialEndsAt,
  });
  batch.set(db.collection("user_secrets").doc(username), {
    passwordHash: hash,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(db.collection("centers").doc(schoolCode), {
    teacherId: username,
    schoolName,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const token = await mintToken(username, "teacher", { schoolCode });
  json(res, 200, {
    token,
    user: publicUser(username, {
      name,
      role: "teacher",
      schoolName,
      schoolCode,
      trialEndsAt,
    }),
    inviteUrl: `${appUrl.value()}/alumno?code=${encodeURIComponent(schoolCode)}`,
  });
});

export const registerStudent = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  const name = String(body.name ?? "").trim();
  const schoolCode = String(body.schoolCode ?? "")
    .trim()
    .toUpperCase();
  const capTrack = body.capTrack === "viajeros" ? "viajeros" : "mercancias";
  if (!isValidUsername(username) || password.length < 6) {
    json(res, 400, { error: "Usuario (3–32) y contraseña (mín. 6) obligatorios" });
    return;
  }
  if (!name || !schoolCode) {
    json(res, 400, { error: "Nombre y código de autoescuela obligatorios" });
    return;
  }

  const centerSnap = await db.collection("centers").doc(schoolCode).get();
  if (!centerSnap.exists) {
    json(res, 404, { error: "Código de autoescuela no válido" });
    return;
  }
  const teacherId = String(centerSnap.data()?.teacherId ?? "");
  if (!teacherId) {
    json(res, 400, { error: "Centro sin profesor asignado" });
    return;
  }
  if (await schoolTrialLocksBilling(teacherId, centerSnap.data())) {
    json(res, 403, { error: TRIAL_BILLING_MSG });
    return;
  }

  const userRef = db.collection("users").doc(username);
  if ((await userRef.get()).exists) {
    json(res, 409, { error: "Ese usuario ya existe" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const center = centerSnap.data() ?? {};
  const { seatsUsed, packUntil, hasSeat } = seatState(center);
  const billing: Billing = hasSeat ? "school" : "prepaid";

  const userData: Record<string, unknown> = {
    name,
    role: "student",
    teacherId,
    schoolCode,
    capTrack,
    billing,
  };
  if (hasSeat && packUntil) userData.paidUntil = packUntil;

  const batch = db.batch();
  batch.set(userRef, userData);
  batch.set(db.collection("user_secrets").doc(username), {
    passwordHash: hash,
    createdAt: FieldValue.serverTimestamp(),
  });
  if (hasSeat) {
    batch.update(centerSnap.ref, { seatsUsed: seatsUsed + 1 });
  }
  await batch.commit();

  const token = await mintToken(username, "student", { teacherId, schoolCode });
  json(res, 200, {
    token,
    user: publicUser(username, userData),
    needsPayment: !hasSeat,
  });
});

export const addStudentByTeacher = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const teacherUsername = normalizeUsername(body.teacherUsername);
  const username = normalizeUsername(body.username);
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");
  const capTrack = body.capTrack === "viajeros" ? "viajeros" : "mercancias";
  if (!isValidUsername(teacherUsername) || !isValidUsername(username) || !name) {
    json(res, 400, { error: "Datos del alumno no válidos" });
    return;
  }
  if (password && password.length < 6) {
    json(res, 400, { error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }

  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.role !== "teacher" || caller.uid !== teacherUsername) {
    json(res, 403, { error: "Solo el profesor puede dar de alta alumnos" });
    return;
  }
  const teacherSnap = await db.collection("users").doc(teacherUsername).get();
  if (!teacherSnap.exists || teacherSnap.data()?.role !== "teacher") {
    json(res, 403, { error: "Solo el profesor puede dar de alta alumnos" });
    return;
  }
  const schoolCode = String(teacherSnap.data()?.schoolCode ?? "");
  if (!schoolCode) {
    json(res, 400, { error: "Este profesor no tiene código de centro" });
    return;
  }

  const userRef = db.collection("users").doc(username);
  if ((await userRef.get()).exists) {
    json(res, 409, { error: "Ese usuario ya existe" });
    return;
  }

  const centerRef = db.collection("centers").doc(schoolCode);
  const centerSnap = await centerRef.get();
  const { seatsUsed, packUntil, hasSeat } = seatState(centerSnap.data());
  if (await schoolTrialLocksBilling(teacherUsername, centerSnap.data())) {
    json(res, 403, { error: TRIAL_BILLING_MSG });
    return;
  }
  if (!hasSeat) {
    json(res, 402, {
      error: "Sin plazas. Compra un pack o envía el enlace para que pague el alumno.",
      code: "NO_SEATS",
    });
    return;
  }

  const userData: Record<string, unknown> = {
    name,
    role: "student",
    teacherId: teacherUsername,
    schoolCode,
    capTrack,
    billing: "school" satisfies Billing,
    paidUntil: packUntil,
  };
  if (!password) userData.password = "";

  const batch = db.batch();
  batch.set(userRef, userData);
  if (password) {
    batch.set(db.collection("user_secrets").doc(username), {
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  batch.update(centerRef, { seatsUsed: seatsUsed + 1 });
  await batch.commit();

  json(res, 200, {
    user: publicUser(username, userData),
    seatsLeft: Math.max(0, Number(centerSnap.data()?.seatsPurchased ?? 0) - seatsUsed - 1),
  });
});

export const createCheckoutSession = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  const months = clampMonths(body.months);
  if (!isValidUsername(username) || months == null) {
    json(res, 400, { error: "Indica usuario y meses (1 a 12)" });
    return;
  }

  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.uid !== username) {
    json(res, 403, { error: "El cobro solo puede hacerlo el propio alumno" });
    return;
  }
  const userSnap = await db.collection("users").doc(username).get();
  if (!userSnap.exists) {
    json(res, 404, { error: "Usuario no encontrado" });
    return;
  }
  const data = userSnap.data()!;
  if (data.role === "teacher") {
    json(res, 400, { error: "El cobro es solo para alumnos" });
    return;
  }

  const schoolCode = String(data.schoolCode ?? "");
  const teacherId = String(data.teacherId ?? "");
  let destination: string | undefined;
  if (schoolCode) {
    const centerRef = db.collection("centers").doc(schoolCode);
    const center = await centerRef.get();
    if (
      await schoolTrialLocksBilling(
        teacherId || String(center.data()?.teacherId ?? ""),
        center.data()
      )
    ) {
      json(res, 403, { error: TRIAL_BILLING_MSG });
      return;
    }
    const accountId = center.data()?.stripeAccountId as string | undefined;
    let chargesEnabled = center.data()?.chargesEnabled === true;
    if (accountId && !chargesEnabled) {
      try {
        const account = await stripeClient().accounts.retrieve(accountId);
        chargesEnabled = account.charges_enabled === true;
        if (chargesEnabled) {
          await centerRef.set(
            { chargesEnabled: true, connectStatus: "active" },
            { merge: true }
          );
        }
      } catch (err) {
        logger.warn("Connect account lookup failed", err);
      }
    }
    if (accountId && chargesEnabled) destination = accountId;
  }

  const origin = appUrl.value();
  const params: CheckoutParams = {
    mode: "payment",
    success_url: `${origin}/alumno?paid=1`,
    cancel_url: `${origin}/alumno?pay=1`,
    client_reference_id: username,
    customer_email: typeof data.email === "string" ? data.email : undefined,
    line_items: [{ price: stripePriceId.value(), quantity: months }],
    invoice_creation: { enabled: true },
    managed_payments: { enabled: false },
    metadata: {
      kind: "student",
      username,
      months: String(months),
      schoolCode,
      teacherId,
    },
    payment_intent_data: {
      metadata: {
        kind: "student",
        username,
        months: String(months),
        schoolCode,
        teacherId,
      },
    },
  };

  if (destination) {
    params.payment_intent_data = {
      ...params.payment_intent_data,
      application_fee_amount: (STUDENT_MONTH_CENTS - SCHOOL_MONTH_CENTS) * months,
      transfer_data: { destination },
    };
  }

  try {
    const session = await stripeClient().checkout.sessions.create(
      params as Stripe.Checkout.SessionCreateParams
    );
    json(res, 200, { url: session.url, months, amountCents: STUDENT_MONTH_CENTS * months });
  } catch (err) {
    logger.error("createCheckoutSession failed", err);
    json(res, 502, { error: "No se pudo abrir el pago. Inténtalo de nuevo." });
  }
});

export const createSchoolPackCheckout = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  const months = clampMonths(body.months);
  const seats = clampSeats(body.seats);
  if (!isValidUsername(username) || months == null || seats == null) {
    json(res, 400, { error: "Indica usuario, plazas (1–200) y meses (1–12)" });
    return;
  }

  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.role !== "teacher" || caller.uid !== username) {
    json(res, 403, { error: "Solo el profesor puede comprar plazas" });
    return;
  }
  const userSnap = await db.collection("users").doc(username).get();
  if (!userSnap.exists || userSnap.data()?.role !== "teacher") {
    json(res, 403, { error: "Solo el profesor puede comprar plazas" });
    return;
  }
  const schoolCode = String(userSnap.data()?.schoolCode ?? "");
  if (!schoolCode) {
    json(res, 400, { error: "Este profesor no tiene código de centro" });
    return;
  }
  const packCenter = await db.collection("centers").doc(schoolCode).get();
  if (await schoolTrialLocksBilling(username, packCenter.data())) {
    json(res, 403, { error: TRIAL_BILLING_MSG });
    return;
  }

  const origin = appUrl.value();
  const quantity = seats * months;
  try {
    const basePrice = await stripeClient().prices.retrieve(stripePriceId.value());
    const product =
      typeof basePrice.product === "string" ? basePrice.product : basePrice.product.id;
    const packParams: CheckoutParams = {
      mode: "payment",
      success_url: `${origin}/profesor?pack=1`,
      cancel_url: `${origin}/profesor?pack=0`,
      client_reference_id: username,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: SCHOOL_SEAT_MONTH_CENTS,
            product,
          },
          quantity,
        },
      ],
      invoice_creation: { enabled: true },
      managed_payments: { enabled: false },
      metadata: {
        kind: "school_pack",
        username,
        schoolCode,
        seats: String(seats),
        months: String(months),
      },
      payment_intent_data: {
        metadata: {
          kind: "school_pack",
          username,
          schoolCode,
          seats: String(seats),
          months: String(months),
        },
      },
    };
    const session = await stripeClient().checkout.sessions.create(
      packParams as Stripe.Checkout.SessionCreateParams
    );
    json(res, 200, {
      url: session.url,
      seats,
      months,
      amountCents: SCHOOL_SEAT_MONTH_CENTS * quantity,
    });
  } catch (err) {
    logger.error("createSchoolPackCheckout failed", err);
    json(res, 502, { error: "No se pudo abrir el pago. Inténtalo de nuevo." });
  }
});

export const stripeWebhook = onRequest(
  {
    region: REGION,
    secrets: [stripeSecret, stripeWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string") {
      res.status(400).send("Missing signature");
      return;
    }
    let event: Stripe.Event;
    try {
      event = stripeClient().webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      logger.error("Webhook signature failed", err);
      res.status(400).send("Invalid signature");
      return;
    }

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const schoolCode = String(account.metadata?.schoolCode || "");
      if (schoolCode) {
        await db.collection("centers").doc(schoolCode).set(
          {
            chargesEnabled: account.charges_enabled === true,
            connectStatus: account.charges_enabled ? "active" : "onboarding",
          },
          { merge: true }
        );
      }
      res.status(200).json({ received: true, kind: "account" });
      return;
    }

    if (event.type !== "checkout.session.completed") {
      res.status(200).json({ received: true });
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "payment" || session.payment_status !== "paid") {
      res.status(200).json({ received: true });
      return;
    }

    const paymentRef = db.collection("payments").doc(session.id);
    const already = await paymentRef.get();
    if (already.exists) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    const kind = String(session.metadata?.kind || "student");
    const username = String(session.metadata?.username || session.client_reference_id || "");
    const months = clampMonths(session.metadata?.months) ?? 1;
    if (!username) {
      logger.error("Checkout without username", session.id);
      res.status(200).json({ received: true, skipped: true });
      return;
    }

    if (kind === "school_pack") {
      const schoolCode = String(session.metadata?.schoolCode || "");
      const seats = clampSeats(session.metadata?.seats) ?? 0;
      if (!schoolCode || seats < 1) {
        logger.error("School pack missing seats/code", session.id);
        res.status(200).json({ received: true, skipped: true });
        return;
      }
      const centerRef = db.collection("centers").doc(schoolCode);
      const centerSnap = await centerRef.get();
      const center = centerSnap.data() ?? {};
      const now = new Date();
      const packUntil =
        center.packPaidUntil instanceof Timestamp ? center.packPaidUntil : null;
      const packStillActive = packUntil != null && packUntil.toDate() > now;
      const from = packStillActive && packUntil ? packUntil.toDate() : now;
      const currentSeats = packStillActive ? Number(center.seatsPurchased ?? 0) : 0;
      const used = packStillActive ? Number(center.seatsUsed ?? 0) : 0;
      await centerRef.set(
        {
          teacherId: username,
          seatsPurchased: currentSeats + seats,
          seatsUsed: used,
          packPaidUntil: Timestamp.fromDate(addCalendarMonths(from, months)),
        },
        { merge: true }
      );
      await paymentRef.set({
        kind: "school_pack",
        username,
        schoolCode,
        seats,
        months,
        amountCents: session.amount_total ?? SCHOOL_SEAT_MONTH_CENTS * seats * months,
        createdAt: FieldValue.serverTimestamp(),
      });
      res.status(200).json({ received: true, kind: "school_pack" });
      return;
    }

    const userRef = db.collection("users").doc(username);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      logger.error("Paid user missing", username);
      res.status(200).json({ received: true, skipped: true });
      return;
    }
    const current = userSnap.data()!;
    const now = new Date();
    const from =
      current.paidUntil instanceof Timestamp && current.paidUntil.toDate() > now
        ? current.paidUntil.toDate()
        : now;
    const paidUntil = Timestamp.fromDate(addCalendarMonths(from, months));
    const schoolCode = String(session.metadata?.schoolCode || current.schoolCode || "");
    const teacherId = String(session.metadata?.teacherId || current.teacherId || "");

    await userRef.update({
      billing: "prepaid",
      paidUntil,
      stripeCustomerId: session.customer || current.stripeCustomerId || null,
    });

    await paymentRef.set({
      kind: "student",
      username,
      months,
      amountCents: session.amount_total ?? STUDENT_MONTH_CENTS * months,
      schoolCode,
      teacherId,
      createdAt: FieldValue.serverTimestamp(),
    });

    if (schoolCode && teacherId) {
      await db.collection("commissions").add({
        teacherId,
        schoolCode,
        username,
        months,
        amountCents: SCHOOL_MONTH_CENTS * months,
        checkoutSessionId: session.id,
        status: session.payment_intent ? "transferred_or_platform" : "recorded",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    res.status(200).json({ received: true });
  }
);

export const ensureCenter = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  if (!isValidUsername(username)) {
    json(res, 400, { error: "Usuario no válido" });
    return;
  }
  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.role !== "teacher" || caller.uid !== username) {
    json(res, 403, { error: "Solo el profesor puede crear el código" });
    return;
  }
  const userRef = db.collection("users").doc(username);
  const userSnap = await userRef.get();
  if (!userSnap.exists || userSnap.data()?.role !== "teacher") {
    json(res, 403, { error: "Solo el profesor puede crear el código" });
    return;
  }
  const data = userSnap.data()!;
  let schoolCode = String(data.schoolCode ?? "");
  const schoolName = String(data.schoolName ?? username);
  if (!schoolCode) {
    schoolCode = await uniqueSchoolCode(schoolName);
    await userRef.update({ schoolCode });
  }
  const centerRef = db.collection("centers").doc(schoolCode);
  if (!(await centerRef.get()).exists) {
    await centerRef.set({
      teacherId: username,
      schoolName,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  const centerSnap = await centerRef.get();
  json(res, 200, publicCenter(schoolCode, centerSnap.data() as Record<string, unknown>));
});

export const connectOnboard = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const body = await readJson(req);
  const username = normalizeUsername(body.username);
  if (!isValidUsername(username)) {
    json(res, 400, { error: "Usuario no válido" });
    return;
  }
  const caller = await requireCaller(req, res);
  if (!caller) return;
  if (caller.role !== "teacher" || caller.uid !== username) {
    json(res, 403, { error: "Solo el profesor puede vincular Stripe" });
    return;
  }
  const userSnap = await db.collection("users").doc(username).get();
  if (!userSnap.exists || userSnap.data()?.role !== "teacher") {
    json(res, 403, { error: "Solo el profesor puede vincular Stripe" });
    return;
  }
  const schoolCode = String(userSnap.data()?.schoolCode ?? "");
  if (!schoolCode) {
    json(res, 400, { error: "Este profesor no tiene código de centro" });
    return;
  }
  const centerRef = db.collection("centers").doc(schoolCode);
  const centerSnap = await centerRef.get();
  let accountId = centerSnap.data()?.stripeAccountId as string | undefined;
  const stripe = stripeClient();
  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { teacherId: username, schoolCode },
      });
      accountId = account.id;
      await centerRef.set(
        {
          stripeAccountId: accountId,
          connectStatus: "onboarding",
          teacherId: username,
          schoolName: userSnap.data()?.schoolName ?? "",
        },
        { merge: true }
      );
    }
    const origin = appUrl.value();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/profesor?connect=refresh`,
      return_url: `${origin}/profesor?connect=return`,
      type: "account_onboarding",
    });
    json(res, 200, { url: link.url, accountId });
  } catch (err) {
    logger.error("connectOnboard failed", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("signed up for Connect")) {
      json(res, 503, {
        error:
          "Activa Stripe Connect una vez en el panel (modo test): dashboard.stripe.com/test/connect y pulsa Empezar. Luego vuelve a Cobrar 1 €.",
      });
      return;
    }
    json(res, 502, { error: "No se pudo abrir Stripe Connect. Inténtalo de nuevo." });
  }
});

export const staff = onRequest(httpsOpts, async (req, res) => {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  const caller = await requireCaller(req, res);
  if (!caller) return;
  const body = await readJson(req);
  const action = String(body.action ?? "");

  if (action === "setPassword") {
    const password = String(body.password ?? "");
    if (password.length < 6) {
      json(res, 400, { error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    await db.collection("user_secrets").doc(caller.uid).set({
      passwordHash: await bcrypt.hash(password, 10),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await db
      .collection("users")
      .doc(caller.uid)
      .set({ password: FieldValue.delete() }, { merge: true });
    json(res, 200, { ok: true });
    return;
  }

  if (action === "deleteStudent") {
    const username = normalizeUsername(body.username);
    if (!isValidUsername(username)) {
      json(res, 400, { error: "Usuario no válido" });
      return;
    }
    const snap = await db.collection("users").doc(username).get();
    if (!snap.exists || snap.data()?.role === "teacher" || snap.data()?.role === "root") {
      json(res, 404, { error: "Alumno no encontrado" });
      return;
    }
    const owner = String(snap.data()?.teacherId ?? "");
    if (caller.role !== "root" && !(caller.role === "teacher" && caller.uid === owner)) {
      json(res, 403, { error: "No puedes borrar este alumno" });
      return;
    }
    await db.collection("users").doc(username).delete();
    await db.collection("user_secrets").doc(username).delete().catch(() => undefined);
    json(res, 200, { ok: true });
    return;
  }

  if (action === "studentScores") {
    const username = normalizeUsername(body.username);
    if (!isValidUsername(username)) {
      json(res, 400, { error: "Usuario no válido" });
      return;
    }
    const snap = await db.collection("users").doc(username).get();
    if (!snap.exists || snap.data()?.role === "teacher" || snap.data()?.role === "root") {
      json(res, 404, { error: "Alumno no encontrado" });
      return;
    }
    const owner = String(snap.data()?.teacherId ?? "");
    if (caller.role !== "root" && !(caller.role === "teacher" && caller.uid === owner)) {
      json(res, 403, { error: "No puedes ver este alumno" });
      return;
    }
    const recordsSnap = await db
      .collection("score_records")
      .where("user", "==", username)
      .get();
    const records = recordsSnap.docs.map((d) => {
      const data = d.data();
      const ts = data.timestamp;
      const timestamp =
        ts instanceof Timestamp ? ts.toMillis() : typeof ts === "number" ? ts : 0;
      return {
        testId: String(data.testId ?? ""),
        testName: String(data.testName ?? data.testId ?? ""),
        score: Number(data.score ?? 0),
        passed: data.passed === true,
        timestamp,
      };
    });
    records.sort((a, b) => a.timestamp - b.timestamp);
    json(res, 200, { records });
    return;
  }

  if (caller.role !== "root") {
    json(res, 403, { error: "Solo el administrador" });
    return;
  }

  if (action === "createUser") {
    const username = normalizeUsername(body.username);
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const role: Role = body.role === "teacher" ? "teacher" : "student";
    if (!isValidUsername(username) || !name) {
      json(res, 400, { error: "Datos no válidos" });
      return;
    }
    if (password && password.length < 6) {
      json(res, 400, { error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    const userRef = db.collection("users").doc(username);
    if ((await userRef.get()).exists) {
      json(res, 409, { error: "Ese usuario ya existe" });
      return;
    }
    const userData: Record<string, unknown> = { name, role };
    if (role === "teacher") {
      const schoolName = String(body.schoolName ?? "").trim();
      if (!schoolName) {
        json(res, 400, { error: "Nombre de autoescuela obligatorio" });
        return;
      }
      userData.schoolName = schoolName;
      const trialEndsAt = Number(body.trialEndsAt);
      if (Number.isFinite(trialEndsAt) && trialEndsAt > 0) {
        userData.trialEndsAt = Timestamp.fromMillis(trialEndsAt);
      }
    } else {
      const teacherId = normalizeUsername(body.teacherId);
      if (!isValidUsername(teacherId)) {
        json(res, 400, { error: "Profesor obligatorio" });
        return;
      }
      userData.teacherId = teacherId;
      userData.capTrack = body.capTrack === "viajeros" ? "viajeros" : "mercancias";
    }
    const batch = db.batch();
    batch.set(userRef, userData);
    if (password) {
      batch.set(db.collection("user_secrets").doc(username), {
        passwordHash: await bcrypt.hash(password, 10),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    json(res, 200, { ok: true, user: publicUser(username, userData) });
    return;
  }

  if (action === "deleteUser") {
    const username = normalizeUsername(body.username);
    if (!isValidUsername(username) || username === "root") {
      json(res, 400, { error: "Usuario no válido" });
      return;
    }
    await db.collection("users").doc(username).delete();
    await db.collection("user_secrets").doc(username).delete().catch(() => undefined);
    json(res, 200, { ok: true });
    return;
  }

  if (action === "assignStudent") {
    const username = normalizeUsername(body.username);
    const teacherId = normalizeUsername(body.teacherId);
    if (!isValidUsername(username) || !isValidUsername(teacherId)) {
      json(res, 400, { error: "Datos no válidos" });
      return;
    }
    const teacher = await db.collection("users").doc(teacherId).get();
    if (!teacher.exists || teacher.data()?.role !== "teacher") {
      json(res, 400, { error: "Profesor no válido" });
      return;
    }
    await db.collection("users").doc(username).set(
      { teacherId, role: "student" },
      { merge: true }
    );
    json(res, 200, { ok: true });
    return;
  }

  if (action === "setTrial") {
    const username = normalizeUsername(body.username);
    const trialEndsAt = Number(body.trialEndsAt);
    if (!isValidUsername(username) || !Number.isFinite(trialEndsAt)) {
      json(res, 400, { error: "Datos no válidos" });
      return;
    }
    await db.collection("users").doc(username).set(
      { trialEndsAt: Timestamp.fromMillis(trialEndsAt) },
      { merge: true }
    );
    json(res, 200, { ok: true });
    return;
  }

  if (action === "setSeed") {
    const username = normalizeUsername(body.username);
    if (!isValidUsername(username)) {
      json(res, 400, { error: "Usuario no válido" });
      return;
    }
    await db.collection("users").doc(username).set(
      { showSeedBtn: body.enabled === true },
      { merge: true }
    );
    json(res, 200, { ok: true });
    return;
  }

  json(res, 400, { error: "Acción no válida" });
});
