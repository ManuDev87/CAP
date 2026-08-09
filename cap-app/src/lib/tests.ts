import type { CommunityRegion, Question, TestMeta } from "./types";

const andaluciaTests: TestMeta[] = [
  { id: "febrero_2023", name: "Febrero 2023", img: "/img/truck1.jpg" },
  { id: "marzo_2023", name: "Marzo 2023", img: "/img/truck2.jpg" },
  { id: "junio_2023", name: "Junio 2023", img: "/img/truck3.jpg" },
  { id: "julio_2023", name: "Julio 2023", img: "/img/truck4.jpg" },
  { id: "septiembre_2023", name: "Septiembre 2023", img: "/img/truck1.jpg" },
  { id: "noviembre_2023", name: "Noviembre 2023", img: "/img/truck2.jpg" },
  { id: "enero_2024", name: "Enero 2024", img: "/img/truck3.jpg" },
  { id: "marzo_2024", name: "Marzo 2024", img: "/img/truck4.jpg" },
  { id: "mayo_2024", name: "Mayo 2024", img: "/img/truck1.jpg" },
  { id: "julio_2024", name: "Julio 2024", img: "/img/truck2.jpg" },
  { id: "septiembre_2024", name: "Septiembre 2024", img: "/img/truck3.jpg" },
  { id: "noviembre_2024", name: "Noviembre 2024", img: "/img/truck4.jpg" },
  { id: "enero_2025", name: "Enero 2025", img: "/img/truck1.jpg" },
  { id: "marzo_2025", name: "Marzo 2025", img: "/img/truck2.jpg" },
  { id: "mayo_2025", name: "Mayo 2025", img: "/img/truck3.jpg" },
  { id: "julio_2025", name: "Julio 2025", img: "/img/truck4.jpg" },
  { id: "septiembre_2025", name: "Septiembre 2025", img: "/img/truck1.jpg" },
  { id: "noviembre_2025", name: "Noviembre 2025", img: "/img/truck2.jpg" },
  { id: "enero_2026", name: "Enero 2026", img: "/img/truck3.jpg" },
  { id: "marzo_2026", name: "Marzo 2026", img: "/img/truck4.jpg" },
  { id: "mayo_2026", name: "Mayo 2026", img: "/img/truck1.jpg" },
];

const catalunaTests: TestMeta[] = [
  { id: "cataluna_marzo_2023", name: "Marzo 2023", img: "/img/truck1.jpg" },
  { id: "cataluna_septiembre_2023", name: "Septiembre 2023", img: "/img/truck2.jpg" },
  { id: "cataluna_noviembre_2023", name: "Noviembre 2023", img: "/img/truck3.jpg" },
  { id: "cataluna_enero_2024", name: "Enero 2024", img: "/img/truck4.jpg" },
  { id: "cataluna_marzo_2024", name: "Marzo 2024", img: "/img/truck1.jpg" },
  { id: "cataluna_mayo_2024", name: "Mayo 2024", img: "/img/truck2.jpg" },
  { id: "cataluna_julio_2024", name: "Julio 2024", img: "/img/truck3.jpg" },
  { id: "cataluna_septiembre_2024", name: "Septiembre 2024", img: "/img/truck4.jpg" },
  { id: "cataluna_noviembre_2024", name: "Noviembre 2024 (6ª)", img: "/img/truck1.jpg" },
  { id: "cataluna_noviembre_2024_29", name: "Noviembre 2024 (7ª)", img: "/img/truck2.jpg" },
  { id: "cataluna_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "cataluna_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "cataluna_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "cataluna_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "cataluna_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "cataluna_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "cataluna_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "cataluna_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "cataluna_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "cataluna_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const valenciaTests: TestMeta[] = [
  { id: "valencia_enero_2023", name: "Enero 2023", img: "/img/truck1.jpg" },
  { id: "valencia_julio_2023", name: "Julio 2023", img: "/img/truck2.jpg" },
  { id: "valencia_septiembre_2023", name: "Septiembre 2023", img: "/img/truck3.jpg" },
  { id: "valencia_noviembre_2023", name: "Noviembre 2023", img: "/img/truck4.jpg" },
  { id: "valencia_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "valencia_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "valencia_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "valencia_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "valencia_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "valencia_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "valencia_febrero_2025", name: "Febrero 2025", img: "/img/truck3.jpg" },
  { id: "valencia_abril_2025", name: "Abril 2025", img: "/img/truck4.jpg" },
  { id: "valencia_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "valencia_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "valencia_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "valencia_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "valencia_febrero_2026", name: "Febrero 2026", img: "/img/truck1.jpg" },
  { id: "valencia_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "valencia_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "valencia_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

/** Comunidades autónomas disponibles en el portal del alumno. */
export const communityRegions: CommunityRegion[] = [
  { id: "andalucia", name: "Andalucía", tests: andaluciaTests },
  { id: "cataluna", name: "Cataluña", tests: catalunaTests },
  { id: "valencia", name: "Valencia", tests: valenciaTests },
  { id: "galicia", name: "Galicia", tests: [] },
  { id: "extremadura", name: "Extremadura", tests: [] },
];

/** Flat list of all tests (compat for loaders / stats / getTestMeta). */
export const availableTests: TestMeta[] = communityRegions.flatMap(
  (r) => r.tests
);

export const testPdfUrls: Record<string, string> = {
  febrero_2023:
    "https://web.araba.eus/documents/1247685/1249405/PLANTILLA+MERCANCIAS.pdf/2b3142dd-2c5d-73f1-358d-a72acdefeaab?t=1675426465593",
  marzo_2023:
    "https://web.araba.eus/documents/1247685/1248559/PlantillaMercancias.pdf/baf75bf5-c8c3-073f-6431-eed78886082c?t=1680260555891",
  junio_2023:
    "https://web.araba.eus/documents/1247685/1249489/PLANTILLA+MERCANCIAS.pdf/a191e2d8-87f9-2d85-3fae-74125e9d2fb9?t=1685704851002",
  julio_2023:
    "https://web.araba.eus/documents/1247685/1249509/Plantilla+Mercancias.pdf/a59274b8-68a2-6ec4-2919-57163c2a1d58?t=1689335365851",
  septiembre_2023:
    "https://web.araba.eus/documents/1247685/1249519/20230929+Plantilla+Examen+Mercanc%C3%ADas.pdf/1a4394c5-7a90-674a-a53f-2cf599c22af0?t=1695992158931",
  noviembre_2023:
    "https://web.araba.eus/documents/1247685/1249536/20231124+Plantilla+Respuestas+Examen+Mercanc%C3%ADas.pdf/49f865b0-09c3-d3f5-1d86-640f2cec32e9?t=1701076611807",
  enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/examen_merc_se_cap1_2024.pdf",
  marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_se_cap2_2024.pdf",
  mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen-a_mer_se_cap3_2024.pdf",
  julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_se_cap4_2024_modelo%20A.pdf",
  septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_merc-modeloA_se_cap5_2024.pdf",
  noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer-A_se_cap6_2024.pdf",
  enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_merc-modeloA_se_cap5_2025_0.pdf",
  marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_cr_mer_se_mod-a_cap2_2025.pdf",
  mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_A_se_cap3_2025.pdf",
  julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_se_cap4_modeloA.pdf",
  septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_se_cap5_2025_opci%C3%B3n%20A.pdf",
  noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
  enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
  marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/Examen%20con%20respuestas%20mercanc%C3%ADas%20A_0.pdf",
  mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/Examen%20con%20respuestas%20mercanc%C3%ADas%20b.pdf",
};

/**
 * Lazy loaders — one code-split chunk per exam. All chunks are precached by
 * the service worker at install time, so every test also works offline.
 */
const examLoaders: Record<string, () => Promise<{ default: Question[] }>> = {
  febrero_2023: () => import("@/data/exams/febrero_2023.json"),
  marzo_2023: () => import("@/data/exams/marzo_2023.json"),
  junio_2023: () => import("@/data/exams/junio_2023.json"),
  julio_2023: () => import("@/data/exams/julio_2023.json"),
  septiembre_2023: () => import("@/data/exams/septiembre_2023.json"),
  noviembre_2023: () => import("@/data/exams/noviembre_2023.json"),
  enero_2024: () => import("@/data/exams/enero_2024.json"),
  marzo_2024: () => import("@/data/exams/marzo_2024.json"),
  mayo_2024: () => import("@/data/exams/mayo_2024.json"),
  julio_2024: () => import("@/data/exams/julio_2024.json"),
  septiembre_2024: () => import("@/data/exams/septiembre_2024.json"),
  noviembre_2024: () => import("@/data/exams/noviembre_2024.json"),
  enero_2025: () => import("@/data/exams/enero_2025.json"),
  marzo_2025: () => import("@/data/exams/marzo_2025.json"),
  mayo_2025: () => import("@/data/exams/mayo_2025.json"),
  julio_2025: () => import("@/data/exams/julio_2025.json"),
  septiembre_2025: () => import("@/data/exams/septiembre_2025.json"),
  noviembre_2025: () => import("@/data/exams/noviembre_2025.json"),
  enero_2026: () => import("@/data/exams/enero_2026.json"),
  marzo_2026: () => import("@/data/exams/marzo_2026.json"),
  mayo_2026: () => import("@/data/exams/mayo_2026.json"),
  // Cataluña — mercancías modelo A (castellano)
  cataluna_marzo_2023: () => import("@/data/exams/cataluna_marzo_2023.json"),
  cataluna_septiembre_2023: () => import("@/data/exams/cataluna_septiembre_2023.json"),
  cataluna_noviembre_2023: () => import("@/data/exams/cataluna_noviembre_2023.json"),
  cataluna_enero_2024: () => import("@/data/exams/cataluna_enero_2024.json"),
  cataluna_marzo_2024: () => import("@/data/exams/cataluna_marzo_2024.json"),
  cataluna_mayo_2024: () => import("@/data/exams/cataluna_mayo_2024.json"),
  cataluna_julio_2024: () => import("@/data/exams/cataluna_julio_2024.json"),
  cataluna_septiembre_2024: () => import("@/data/exams/cataluna_septiembre_2024.json"),
  cataluna_noviembre_2024: () => import("@/data/exams/cataluna_noviembre_2024.json"),
  cataluna_noviembre_2024_29: () => import("@/data/exams/cataluna_noviembre_2024_29.json"),
  cataluna_enero_2025: () => import("@/data/exams/cataluna_enero_2025.json"),
  cataluna_marzo_2025: () => import("@/data/exams/cataluna_marzo_2025.json"),
  cataluna_mayo_2025: () => import("@/data/exams/cataluna_mayo_2025.json"),
  cataluna_julio_2025: () => import("@/data/exams/cataluna_julio_2025.json"),
  cataluna_septiembre_2025: () => import("@/data/exams/cataluna_septiembre_2025.json"),
  cataluna_noviembre_2025: () => import("@/data/exams/cataluna_noviembre_2025.json"),
  cataluna_enero_2026: () => import("@/data/exams/cataluna_enero_2026.json"),
  cataluna_marzo_2026: () => import("@/data/exams/cataluna_marzo_2026.json"),
  cataluna_mayo_2026: () => import("@/data/exams/cataluna_mayo_2026.json"),
  cataluna_julio_2026: () => import("@/data/exams/cataluna_julio_2026.json"),
  // Valencia — mercancías (plantilla casillas negras)
  valencia_enero_2023: () => import("@/data/exams/valencia_enero_2023.json"),
  valencia_julio_2023: () => import("@/data/exams/valencia_julio_2023.json"),
  valencia_septiembre_2023: () => import("@/data/exams/valencia_septiembre_2023.json"),
  valencia_noviembre_2023: () => import("@/data/exams/valencia_noviembre_2023.json"),
  valencia_enero_2024: () => import("@/data/exams/valencia_enero_2024.json"),
  valencia_marzo_2024: () => import("@/data/exams/valencia_marzo_2024.json"),
  valencia_mayo_2024: () => import("@/data/exams/valencia_mayo_2024.json"),
  valencia_julio_2024: () => import("@/data/exams/valencia_julio_2024.json"),
  valencia_septiembre_2024: () => import("@/data/exams/valencia_septiembre_2024.json"),
  valencia_noviembre_2024: () => import("@/data/exams/valencia_noviembre_2024.json"),
  valencia_febrero_2025: () => import("@/data/exams/valencia_febrero_2025.json"),
  valencia_abril_2025: () => import("@/data/exams/valencia_abril_2025.json"),
  valencia_mayo_2025: () => import("@/data/exams/valencia_mayo_2025.json"),
  valencia_julio_2025: () => import("@/data/exams/valencia_julio_2025.json"),
  valencia_septiembre_2025: () => import("@/data/exams/valencia_septiembre_2025.json"),
  valencia_noviembre_2025: () => import("@/data/exams/valencia_noviembre_2025.json"),
  valencia_febrero_2026: () => import("@/data/exams/valencia_febrero_2026.json"),
  valencia_marzo_2026: () => import("@/data/exams/valencia_marzo_2026.json"),
  valencia_mayo_2026: () => import("@/data/exams/valencia_mayo_2026.json"),
  valencia_julio_2026: () => import("@/data/exams/valencia_julio_2026.json"),
};

export async function loadExam(id: string): Promise<Question[]> {
  const loader = examLoaders[id];
  if (!loader) throw new Error(`Test desconocido: ${id}`);
  const mod = await loader();
  return mod.default;
}

export function getTestMeta(id: string): TestMeta | undefined {
  return availableTests.find((t) => t.id === id);
}
