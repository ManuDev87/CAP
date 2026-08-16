/** Temas CAP para clasificar fallos. Mercancías y viajeros no comparten el mismo temario específico. */

import type { CapTrack } from "./types";

export type CapTopicId =
  | "eficiencia"
  | "mecanica"
  | "carga"
  | "adr"
  | "cmr"
  | "tacografo"
  | "pesos"
  | "seguridad"
  | "salud"
  | "atp"
  | "animales"
  | "pasajeros"
  | "reglamentacion"
  | "vehiculo"
  | "empresa"
  | "otros";

export interface CapTopic {
  id: CapTopicId;
  name: string;
}

export const MERCANCIAS_TOPICS: CapTopic[] = [
  { id: "eficiencia", name: "Eficiencia y conducción racional" },
  { id: "mecanica", name: "Mecánica y técnicas del vehículo" },
  { id: "carga", name: "Carga, estiba y estabilidad" },
  { id: "adr", name: "Mercancías peligrosas" },
  { id: "cmr", name: "Documentos, CMR y transitarios" },
  { id: "tacografo", name: "Tacógrafo y tiempos de conducción" },
  { id: "pesos", name: "Pesos, dimensiones y autorizaciones" },
  { id: "seguridad", name: "Seguridad vial y emergencias" },
  { id: "salud", name: "Salud, ergonomía y primeros auxilios" },
  { id: "atp", name: "ATP y temperatura controlada" },
  { id: "animales", name: "Transporte de animales" },
  { id: "otros", name: "Otros" },
];

export const VIAJEROS_TOPICS: CapTopic[] = [
  { id: "eficiencia", name: "Eficiencia y conducción racional" },
  { id: "mecanica", name: "Mecánica y técnicas del vehículo" },
  { id: "pasajeros", name: "Seguridad y comodidad de los viajeros" },
  { id: "reglamentacion", name: "Reglamentación del transporte de viajeros" },
  { id: "vehiculo", name: "Características del autobús" },
  { id: "tacografo", name: "Tacógrafo y tiempos de conducción" },
  { id: "pesos", name: "Pesos, dimensiones y ejes" },
  { id: "seguridad", name: "Seguridad vial y emergencias" },
  { id: "salud", name: "Salud, ergonomía y primeros auxilios" },
  { id: "empresa", name: "Empresa, mercado y seguro" },
  { id: "otros", name: "Otros" },
];

/** @deprecated Use MERCANCIAS_TOPICS or topicsForTrack(). Kept for existing imports. */
export const CAP_TOPICS = MERCANCIAS_TOPICS;

const MERCANCIAS_BY_ID = new Map(MERCANCIAS_TOPICS.map((t) => [t.id, t]));
const VIAJEROS_BY_ID = new Map(VIAJEROS_TOPICS.map((t) => [t.id, t]));

export function topicsForTrack(track: CapTrack): CapTopic[] {
  return track === "viajeros" ? VIAJEROS_TOPICS : MERCANCIAS_TOPICS;
}

export function topicName(id: CapTopicId, track: CapTrack = "mercancias"): string {
  const table = track === "viajeros" ? VIAJEROS_BY_ID : MERCANCIAS_BY_ID;
  return table.get(id)?.name ?? "Otros";
}

export function isViajerosTestId(testId: string): boolean {
  return testId.startsWith("viajeros_");
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

type KeywordTopic = {
  id: Exclude<CapTopicId, "otros">;
  weight: number;
  keys: string[];
};

const SHARED_KEYWORDS: KeywordTopic[] = [
  {
    id: "tacografo",
    weight: 12,
    keys: [
      "tacografo",
      "disco-diagrama",
      "disco diagrama",
      "tarjeta de conductor",
      "tiempos de conduccion",
      "tiempo de conduccion",
      "periodo de descanso",
      "descanso diario",
      "descanso semanal",
      "pausa de 45",
      "4,5 horas",
      "4.5 horas",
      "561/2006",
      "reglamento 561",
      "disponibilidad",
      "otro trabajo",
      "hora de conduccion",
      "horas de conduccion",
      "descargar los datos",
      "descargar datos",
      "tiempo de trabajo",
    ],
  },
  {
    id: "eficiencia",
    weight: 8,
    keys: [
      "consumo de carburante",
      "consumo de combustible",
      "ahorro de combustible",
      "conduccion racional",
      "conduccion eficiente",
      "anticipacion",
      "inercia",
      "ralenti",
      "relacion de marchas",
      "cambio de marchas",
      "revoluciones",
      "par motor",
      "rendimiento del motor",
      "eco ",
      "emisiones de co2",
      "factor influye en el consumo",
      "ahorrar carburante",
      "resistencia",
      "rozamiento",
      "aerodinamic",
      "velocidad media",
      "ahorro de energia",
      "energia cinetica",
    ],
  },
  {
    id: "pesos",
    weight: 8,
    keys: [
      "masa maxima",
      "mma ",
      "mtma",
      "tara ",
      "dimensiones maximas",
      "autorizacion especial",
      "transporte especial",
      "conjunto de vehiculos",
      "eje ",
      "ejes ",
      "peso por eje",
      "anchura maxima",
      "longitud maxima",
      "altura maxima",
    ],
  },
  {
    id: "salud",
    weight: 7,
    keys: [
      "primeros auxilios",
      "ergonomia",
      "ergonomic",
      "fatiga",
      "alcohol",
      "drogas",
      "estupefacientes",
      "sueno",
      "postura",
      "estres",
      "alimentacion",
      "reanimacion",
      "rcp",
      "hemorragia",
      "enfermedad profesional",
      "enfermedades profesionales",
      "accidente laboral",
      "medicamento",
      "higiene en el trabajo",
    ],
  },
  {
    id: "mecanica",
    weight: 6,
    keys: [
      "freno",
      "frenos",
      "abs ",
      "ebs",
      "retarder",
      "ralentizador",
      "suspension",
      "neumatico",
      "neumaticos",
      "direccion",
      "embrague",
      "caja de cambios",
      "diferencial",
      "motor diesel",
      "turbo",
      "adblue",
      "lubricante",
      "circuito de",
      "abs/",
      "sistema tcs",
      "antipatinamiento",
      "asr",
      "frenado",
      "retardador",
      "numero de marchas",
      "mantenimiento del vehiculo",
    ],
  },
  {
    id: "seguridad",
    weight: 5,
    keys: [
      "accidente",
      "emergencia",
      "extintor",
      "triangulo",
      "chaleco",
      "itv",
      "distancia de seguridad",
      "velocidad maxima",
      "adelantamiento",
      "curva",
      "subviraje",
      "sobreviraje",
      "aquaplaning",
      "visibilidad",
      "punto ciego",
      "incendio",
      "airbag",
      "niebla",
      "autopista",
      "autovia",
      "carretera convencional",
      "permiso de conducir",
      "puntos del permiso",
      "carril",
      "semaforo",
    ],
  },
];

const MERCANCIAS_ONLY: KeywordTopic[] = [
  {
    id: "adr",
    weight: 12,
    keys: [
      "adr",
      "mercancias peligrosas",
      "mercancia peligrosa",
      "materia peligrosa",
      "panel naranja",
      "placa naranja",
      "numero onu",
      "n.º onu",
      "n. onu",
      "clase 1",
      "clase 2",
      "clase 3",
      "clase 4",
      "clase 5",
      "clase 6",
      "clase 7",
      "clase 8",
      "clase 9",
      "etiqueta de peligro",
      "etiquetas de peligro",
      "explosivo",
      "radiactiv",
      "inflamable",
      "corrosiv",
      "toxico",
      "cisterna adr",
      "unidad de transporte adr",
      "consejero de seguridad",
      "instrucciones escritas",
    ],
  },
  {
    id: "cmr",
    weight: 12,
    keys: [
      "cmr",
      "carta de porte",
      "cartas de porte",
      "transitario",
      "transitarios",
      "comisionista",
      "conocimiento de embarque",
      "t1 ",
      "documento t2",
      "dua ",
      "albaran",
      "remitente",
      "destinatario del transporte",
      "contrato de transporte",
      "convenio cmr",
    ],
  },
  {
    id: "atp",
    weight: 12,
    keys: [
      " atp",
      "acuerdo atp",
      "isoterm",
      "refrigerante",
      "frigorific",
      "calorific",
      "temperatura controlada",
      "cadena de frio",
      "certificado atp",
    ],
  },
  {
    id: "animales",
    weight: 12,
    keys: [
      "animales vivos",
      "transporte de animales",
      "bienestar animal",
      "ganado",
      "equidos",
      "1/2005",
    ],
  },
  {
    id: "carga",
    weight: 8,
    keys: [
      "estiba",
      "trincaje",
      "trincar",
      "amarre",
      "centro de gravedad",
      "reparto de la carga",
      "distribucion de la carga",
      "rompeolas",
      "cisterna",
      "cisternas",
      "palet",
      "contenedor",
      "indesplazable",
      "fuerza de inercia de la carga",
      "sobrecarga",
      "carga util",
      "volumen de carga",
    ],
  },
];

const VIAJEROS_ONLY: KeywordTopic[] = [
  {
    id: "reglamentacion",
    weight: 12,
    keys: [
      "transporte regular",
      "transporte discrecional",
      "transportes regulares",
      "transportes discrecionales",
      "regular de uso general",
      "regular de uso especial",
      "uso general",
      "uso especial",
      "servicio regular",
      "servicio discrecional",
      "transporte publico de viajeros",
      "transportes publicos de viajeros",
      "autorizacion de transporte de viajeros",
      "autorizacion administrativa que permite realizar transportes discrecionales",
      "lott",
      "rott",
      "1073/2009",
      "181/2011",
      "derechos de los viajeros",
      "derechos de los pasajeros",
      "titulo de transporte",
      "billete",
      "hoja de ruta",
      "libro de ruta",
      "contrato de gestion",
      "viajero-kilometro",
      "viajero kilometro",
      "cabotaje",
      "ambito internacional",
      "ambito nacional",
      "ambito autonomico",
      "mercancias peligrosas",
      "adr",
      "tarjeta de cualificacion",
      "formacion continua",
      "certificado de aptitud profesional",
      "transporte interior de viajeros",
    ],
  },
  {
    id: "pasajeros",
    weight: 12,
    keys: [
      "pasajero",
      "pasajeros",
      "comodidad de los viajeros",
      "seguridad de los viajeros",
      "movilidad reducida",
      "pmr",
      "silla de ruedas",
      "transporte escolar",
      "transporte de menores",
      "escolares",
      "cinturon de seguridad",
      "cinturones de seguridad",
      "evacuacion",
      "salida de emergencia",
      "salidas de emergencia",
      "equipaje",
      "bulto de mano",
      "bultos de mano",
      "maletero",
      "parada",
      "paradas",
      "apeadero",
      "peaton",
      "peatones",
      "area de maximo peligro",
      "desplazamientos de los pasajeros",
      "plazas sentadas",
      "plazas de pie",
      "numero de plazas",
      "discapacidad",
    ],
  },
  {
    id: "vehiculo",
    weight: 9,
    keys: [
      "voladizo",
      "voladizos",
      "autocar",
      "piso bajo",
      "piso alto",
      "dos pisos",
      "limitador de velocidad",
      "ejes directrices",
      "eje director",
      "motor trasero",
      "rampa",
      "plataforma elevadora",
      "maniobrabilidad del autobus",
      "giro con un autobus",
      "circula un autobus",
    ],
  },
  {
    id: "empresa",
    weight: 8,
    keys: [
      "satisfaccion del cliente",
      "calidad de los servicios",
      "calidad del servicio",
      "percepcion de calidad",
      "contrato de seguro",
      "asegurador",
      "siniestro",
      "responsabilidad civil",
      "seguro obligatorio",
      "sociedad de responsabilidad limitada",
      "empresa cap",
      "autorizacion de una empresa",
      "sociedad anonima",
      "sociedad limitada",
      "junta ordinaria",
      "escritura de constitucion",
      "capital social",
      "jefe de trafico",
      "junta arbitral",
      "juntas arbitrales",
      "administrativo",
      "sociedad cooperativa",
      "imagen de marca",
    ],
  },
  {
    id: "pesos",
    weight: 9,
    keys: [
      "carga util",
      "sobrecarga",
      "eje delantero",
      "eje trasero",
      "ejes directrices",
      "peso del vehiculo",
    ],
  },
  {
    id: "salud",
    weight: 8,
    keys: [
      "levantar cargas",
      "manipulacion de una carga",
      "manipulacion de cargas",
      "reposacabezas",
      "asiento de la cabina",
      "espacio de conduccion",
      "ritmo circadiano",
    ],
  },
];

const MERCANCIAS_KEYWORDS: KeywordTopic[] = [...MERCANCIAS_ONLY, ...SHARED_KEYWORDS];
const VIAJEROS_KEYWORDS: KeywordTopic[] = [...VIAJEROS_ONLY, ...SHARED_KEYWORDS];

function classifyWith(
  blob: string,
  table: KeywordTopic[]
): CapTopicId {
  let best: { id: Exclude<CapTopicId, "otros">; score: number } | null = null;

  for (const topic of table) {
    let hits = 0;
    for (const key of topic.keys) {
      if (blob.includes(key)) hits += 1;
    }
    if (hits === 0) continue;
    const score = hits * topic.weight;
    if (!best || score > best.score) {
      best = { id: topic.id, score };
    }
  }

  return best?.id ?? "otros";
}

export function classifyQuestionText(
  question: string,
  optionsText = "",
  track: CapTrack = "mercancias"
): CapTopicId {
  const blob = fold(`${question} ${optionsText}`);
  return classifyWith(
    blob,
    track === "viajeros" ? VIAJEROS_KEYWORDS : MERCANCIAS_KEYWORDS
  );
}
