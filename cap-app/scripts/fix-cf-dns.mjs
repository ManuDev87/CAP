/**
 * Point all testexamencap.* zones at Cloudflare Pages (cap-dtx.pages.dev).
 *
 * Requires API token with Zone.DNS Edit for each zone:
 *   https://dash.cloudflare.com/profile/api-tokens  → "Edit zone DNS"
 *
 * Usage:
 *   $env:CF_API_TOKEN = "your_token"
 *   node scripts/fix-cf-dns.mjs
 */
const TOKEN = process.env.CF_API_TOKEN;
const PAGES_TARGET = "cap-dtx.pages.dev";

const ZONES = [
  { id: "539cabdc2c4f35aac3e6c60bff8fe207", apex: "testexamencap.com" },
  { id: "8becc810576de7f8051315cd66c614c1", apex: "testexamencap.es" },
  { id: "a8b15f578b7674369f4234b76d48c8ae", apex: "testexamencap.info" },
  { id: "50188a143579227ed182de954cc03d43", apex: "testexamencap.store" },
];

if (!TOKEN) {
  console.error("Missing CF_API_TOKEN env var.");
  process.exit(1);
}

async function cf(path, opts = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!data.success) {
    console.error(path, JSON.stringify(data.errors, null, 2));
    throw new Error("Cloudflare API error");
  }
  return data.result;
}

async function fixZone({ id, apex }) {
  console.log(`\n=== ${apex} ===`);
  const records = await cf(`/zones/${id}/dns_records?per_page=100`);
  const hosts = new Set([apex, `www.${apex}`]);
  const toDelete = records.filter(
    (r) =>
      (r.type === "A" || r.type === "AAAA" || r.type === "CNAME") &&
      hosts.has(r.name)
  );
  for (const r of toDelete) {
    console.log(`Deleting ${r.type} ${r.name} -> ${r.content}`);
    await cf(`/zones/${id}/dns_records/${r.id}`, { method: "DELETE" });
  }
  for (const name of [apex, `www.${apex}`]) {
    console.log(`Creating CNAME ${name} -> ${PAGES_TARGET}`);
    await cf(`/zones/${id}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name,
        content: PAGES_TARGET,
        proxied: true,
        ttl: 1,
      }),
    });
  }
}

async function main() {
  for (const z of ZONES) await fixZone(z);
  console.log("\nDone. Wait 1–2 min, then check Custom domains in project `cap`.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
