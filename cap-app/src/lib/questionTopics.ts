/** Temas del CAP mercancías para clasificar fallos por palabras clave. */

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
  | "otros";

export interface CapTopic {
  id: CapTopicId;
  name: string;
}

export const CAP_TOPICS: CapTopic[] = [
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

const TOPIC_BY_ID = new Map(CAP_TOPICS.map((t) => [t.id, t]));

export function topicName(id: CapTopicId): string {
  return TOPIC_BY_ID.get(id)?.name ?? "Otros";
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/** Palabras/frases por tema. Las más específicas van primero y pesan más. */
const TOPIC_KEYWORDS: { id: Exclude<CapTopicId, "otros">; weight: number; keys: string[] }[] = [
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
    ],
  },
];

export function classifyQuestionText(question: string, optionsText = ""): CapTopicId {
  const blob = fold(`${question} ${optionsText}`);
  let best: { id: Exclude<CapTopicId, "otros">; score: number } | null = null;

  for (const topic of TOPIC_KEYWORDS) {
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
