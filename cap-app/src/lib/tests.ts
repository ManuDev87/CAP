import type { CommunityRegion, Question, TestMeta } from "./types";

const almeriaTests: TestMeta[] = [
  { id: "almeria_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "almeria_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "almeria_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "almeria_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "almeria_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "almeria_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "almeria_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "almeria_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "almeria_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "almeria_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "almeria_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "almeria_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "almeria_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "almeria_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "almeria_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "almeria_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const cadizTests: TestMeta[] = [
  { id: "cadiz_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "cadiz_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "cadiz_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "cadiz_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "cadiz_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "cadiz_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "cadiz_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "cadiz_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "cadiz_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "cadiz_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "cadiz_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "cadiz_enero_2026", name: "Enero 2026", img: "/img/truck4.jpg" },
  { id: "cadiz_marzo_2026", name: "Marzo 2026", img: "/img/truck1.jpg" },
  { id: "cadiz_mayo_2026", name: "Mayo 2026", img: "/img/truck2.jpg" },
  { id: "cadiz_julio_2026", name: "Julio 2026", img: "/img/truck3.jpg" },
];

const cordobaTests: TestMeta[] = [
  { id: "cordoba_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "cordoba_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "cordoba_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "cordoba_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "cordoba_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "cordoba_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "cordoba_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "cordoba_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "cordoba_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "cordoba_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "cordoba_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "cordoba_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "cordoba_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "cordoba_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "cordoba_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "cordoba_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const granadaTests: TestMeta[] = [
  { id: "granada_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "granada_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "granada_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "granada_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "granada_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "granada_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "granada_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "granada_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "granada_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "granada_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "granada_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "granada_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "granada_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "granada_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "granada_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "granada_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const huelvaTests: TestMeta[] = [
  { id: "huelva_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "huelva_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "huelva_noviembre_2025", name: "Noviembre 2025", img: "/img/truck3.jpg" },
  { id: "huelva_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const jaenTests: TestMeta[] = [
  { id: "jaen_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "jaen_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "jaen_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "jaen_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "jaen_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "jaen_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "jaen_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "jaen_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "jaen_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "jaen_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "jaen_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "jaen_noviembre_2025", name: "Noviembre 2025", img: "/img/truck4.jpg" },
  { id: "jaen_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "jaen_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "jaen_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "jaen_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const malagaTests: TestMeta[] = [
  { id: "malaga_enero_2024", name: "Enero 2024", img: "/img/truck1.jpg" },
  { id: "malaga_marzo_2024", name: "Marzo 2024", img: "/img/truck2.jpg" },
  { id: "malaga_mayo_2024", name: "Mayo 2024", img: "/img/truck3.jpg" },
  { id: "malaga_julio_2024", name: "Julio 2024", img: "/img/truck4.jpg" },
  { id: "malaga_septiembre_2024", name: "Septiembre 2024", img: "/img/truck1.jpg" },
  { id: "malaga_noviembre_2024", name: "Noviembre 2024", img: "/img/truck2.jpg" },
  { id: "malaga_enero_2025", name: "Enero 2025", img: "/img/truck3.jpg" },
  { id: "malaga_marzo_2025", name: "Marzo 2025", img: "/img/truck4.jpg" },
  { id: "malaga_mayo_2025", name: "Mayo 2025", img: "/img/truck1.jpg" },
  { id: "malaga_julio_2025", name: "Julio 2025", img: "/img/truck2.jpg" },
  { id: "malaga_septiembre_2025", name: "Septiembre 2025", img: "/img/truck3.jpg" },
  { id: "malaga_enero_2026", name: "Enero 2026", img: "/img/truck4.jpg" },
  { id: "malaga_marzo_2026", name: "Marzo 2026", img: "/img/truck1.jpg" },
  { id: "malaga_mayo_2026", name: "Mayo 2026", img: "/img/truck2.jpg" },
  { id: "malaga_julio_2026", name: "Julio 2026", img: "/img/truck3.jpg" },
];

const sevillaTests: TestMeta[] = [
  { id: "sevilla_febrero_2023", name: "Febrero 2023", img: "/img/truck1.jpg" },
  { id: "sevilla_marzo_2023", name: "Marzo 2023", img: "/img/truck2.jpg" },
  { id: "sevilla_junio_2023", name: "Junio 2023", img: "/img/truck3.jpg" },
  { id: "sevilla_julio_2023", name: "Julio 2023", img: "/img/truck4.jpg" },
  { id: "sevilla_septiembre_2023", name: "Septiembre 2023", img: "/img/truck1.jpg" },
  { id: "sevilla_noviembre_2023", name: "Noviembre 2023", img: "/img/truck2.jpg" },
  { id: "sevilla_enero_2024", name: "Enero 2024", img: "/img/truck3.jpg" },
  { id: "sevilla_marzo_2024", name: "Marzo 2024", img: "/img/truck4.jpg" },
  { id: "sevilla_mayo_2024", name: "Mayo 2024", img: "/img/truck1.jpg" },
  { id: "sevilla_julio_2024", name: "Julio 2024", img: "/img/truck2.jpg" },
  { id: "sevilla_septiembre_2024", name: "Septiembre 2024", img: "/img/truck3.jpg" },
  { id: "sevilla_noviembre_2024", name: "Noviembre 2024", img: "/img/truck4.jpg" },
  { id: "sevilla_enero_2025", name: "Enero 2025", img: "/img/truck1.jpg" },
  { id: "sevilla_marzo_2025", name: "Marzo 2025", img: "/img/truck2.jpg" },
  { id: "sevilla_mayo_2025", name: "Mayo 2025", img: "/img/truck3.jpg" },
  { id: "sevilla_julio_2025", name: "Julio 2025", img: "/img/truck4.jpg" },
  { id: "sevilla_septiembre_2025", name: "Septiembre 2025", img: "/img/truck1.jpg" },
  { id: "sevilla_noviembre_2025", name: "Noviembre 2025", img: "/img/truck2.jpg" },
  { id: "sevilla_enero_2026", name: "Enero 2026", img: "/img/truck3.jpg" },
  { id: "sevilla_marzo_2026", name: "Marzo 2026", img: "/img/truck4.jpg" },
  { id: "sevilla_mayo_2026", name: "Mayo 2026", img: "/img/truck1.jpg" },
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

const extremaduraTests: TestMeta[] = [
  { id: "extremadura_febrero_2026", name: "Febrero 2026", img: "/img/truck1.jpg" },
];

const cantabriaTests: TestMeta[] = [
  { id: "cantabria_febrero_2025", name: "Febrero 2025", img: "/img/truck1.jpg" },
  { id: "cantabria_abril_2025", name: "Abril 2025", img: "/img/truck2.jpg" },
  { id: "cantabria_junio_2025", name: "Junio 2025", img: "/img/truck3.jpg" },
  { id: "cantabria_agosto_2025", name: "Agosto 2025", img: "/img/truck4.jpg" },
  { id: "cantabria_octubre_2025", name: "Octubre 2025", img: "/img/truck1.jpg" },
  { id: "cantabria_diciembre_2025", name: "Diciembre 2025", img: "/img/truck2.jpg" },
  { id: "cantabria_febrero_2026", name: "Febrero 2026", img: "/img/truck3.jpg" },
  { id: "cantabria_abril_2026", name: "Abril 2026", img: "/img/truck4.jpg" },
  { id: "cantabria_junio_2026", name: "Junio 2026", img: "/img/truck1.jpg" },
];

const alavaTests: TestMeta[] = [
  { id: "alava_febrero_2023", name: "Febrero 2023", img: "/img/truck1.jpg" },
  { id: "alava_marzo_2023", name: "Marzo 2023", img: "/img/truck2.jpg" },
  { id: "alava_junio_2023", name: "Junio 2023", img: "/img/truck3.jpg" },
  { id: "alava_julio_2023", name: "Julio 2023", img: "/img/truck4.jpg" },
  { id: "alava_septiembre_2023", name: "Septiembre 2023", img: "/img/truck1.jpg" },
  { id: "alava_noviembre_2023", name: "Noviembre 2023", img: "/img/truck2.jpg" },
  { id: "alava_febrero_2024", name: "Febrero 2024", img: "/img/truck3.jpg" },
  { id: "alava_marzo_2024", name: "Marzo 2024", img: "/img/truck4.jpg" },
  { id: "alava_mayo_2024", name: "Mayo 2024", img: "/img/truck1.jpg" },
  { id: "alava_julio_2024", name: "Julio 2024", img: "/img/truck2.jpg" },
  { id: "alava_septiembre_2024", name: "Septiembre 2024", img: "/img/truck3.jpg" },
  { id: "alava_noviembre_2024", name: "Noviembre 2024", img: "/img/truck4.jpg" },
  { id: "alava_enero_2025", name: "Enero 2025", img: "/img/truck1.jpg" },
  { id: "alava_marzo_2025", name: "Marzo 2025", img: "/img/truck2.jpg" },
  { id: "alava_mayo_2025", name: "Mayo 2025", img: "/img/truck3.jpg" },
  { id: "alava_julio_2025", name: "Julio 2025", img: "/img/truck4.jpg" },
  { id: "alava_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "alava_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "alava_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "alava_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const guipuzkoaTests: TestMeta[] = [
  { id: "guipuzkoa_enero_2025", name: "Enero 2025", img: "/img/truck1.jpg" },
  { id: "guipuzkoa_marzo_2025", name: "Marzo 2025", img: "/img/truck2.jpg" },
  { id: "guipuzkoa_mayo_2025", name: "Mayo 2025", img: "/img/truck3.jpg" },
  { id: "guipuzkoa_julio_2025", name: "Julio 2025", img: "/img/truck4.jpg" },
  { id: "guipuzkoa_septiembre_2025", name: "Septiembre 2025", img: "/img/truck1.jpg" },
  { id: "guipuzkoa_noviembre_2025", name: "Noviembre 2025", img: "/img/truck2.jpg" },
  { id: "guipuzkoa_enero_2026", name: "Enero 2026", img: "/img/truck3.jpg" },
  { id: "guipuzkoa_marzo_2026", name: "Marzo 2026", img: "/img/truck4.jpg" },
  { id: "guipuzkoa_mayo_2026", name: "Mayo 2026", img: "/img/truck1.jpg" },
  { id: "guipuzkoa_julio_2026", name: "Julio 2026", img: "/img/truck2.jpg" },
];

const murciaTests: TestMeta[] = [
  { id: "murcia_enero_2026", name: "Enero 2026", img: "/img/truck1.jpg" },
  { id: "murcia_marzo_2026", name: "Marzo 2026", img: "/img/truck2.jpg" },
  { id: "murcia_mayo_2026", name: "Mayo 2026", img: "/img/truck3.jpg" },
  { id: "murcia_julio_2026", name: "Julio 2026", img: "/img/truck4.jpg" },
];

const galiciaTests: TestMeta[] = [
  { id: "galicia_enero_2023", name: "Enero 2023", img: "/img/truck1.jpg" },
  { id: "galicia_marzo_2023", name: "Marzo 2023", img: "/img/truck2.jpg" },
  { id: "galicia_junio_2023", name: "Junio 2023", img: "/img/truck3.jpg" },
  { id: "galicia_julio_2023", name: "Julio 2023", img: "/img/truck4.jpg" },
  { id: "galicia_septiembre_2023_1000", name: "Septiembre 2023 (10:00)", img: "/img/truck1.jpg" },
  { id: "galicia_septiembre_2023_1615", name: "Septiembre 2023 (16:15)", img: "/img/truck2.jpg" },
  { id: "galicia_octubre_2023", name: "Octubre 2023", img: "/img/truck3.jpg" },
  { id: "galicia_noviembre_2023_1000", name: "Noviembre 2023 (10:00)", img: "/img/truck4.jpg" },
  { id: "galicia_noviembre_2023_1615", name: "Noviembre 2023 (16:15)", img: "/img/truck1.jpg" },
  { id: "galicia_enero_2024", name: "Enero 2024", img: "/img/truck2.jpg" },
  { id: "galicia_marzo_2024", name: "Marzo 2024", img: "/img/truck3.jpg" },
  { id: "galicia_mayo_2024", name: "Mayo 2024", img: "/img/truck4.jpg" },
  { id: "galicia_junio_2024_1000", name: "Junio 2024 (10:00)", img: "/img/truck1.jpg" },
  { id: "galicia_junio_2024_1615", name: "Junio 2024 (16:15)", img: "/img/truck2.jpg" },
  { id: "galicia_julio_2024_1000", name: "Julio 2024 (10:00)", img: "/img/truck3.jpg" },
  { id: "galicia_julio_2024_1600", name: "Julio 2024 (16:00)", img: "/img/truck4.jpg" },
  { id: "galicia_septiembre_2024_1000", name: "Septiembre 2024 (10:00)", img: "/img/truck1.jpg" },
  { id: "galicia_septiembre_2024_1600", name: "Septiembre 2024 (16:00)", img: "/img/truck2.jpg" },
  { id: "galicia_noviembre_2024_1000", name: "Noviembre 2024 (10:00)", img: "/img/truck3.jpg" },
  { id: "galicia_noviembre_2024_1615", name: "Noviembre 2024 (16:15)", img: "/img/truck4.jpg" },
  { id: "galicia_enero_2025_1000", name: "Enero 2025 (10:00)", img: "/img/truck1.jpg" },
  { id: "galicia_enero_2025_1615", name: "Enero 2025 (16:15)", img: "/img/truck2.jpg" },
  { id: "galicia_marzo_2025", name: "Marzo 2025", img: "/img/truck3.jpg" },
  { id: "galicia_mayo_2025_1000", name: "Mayo 2025 (10:00)", img: "/img/truck4.jpg" },
  { id: "galicia_mayo_2025_1615", name: "Mayo 2025 (16:15)", img: "/img/truck1.jpg" },
  { id: "galicia_julio_2025_1000", name: "Julio 2025 (10:00)", img: "/img/truck2.jpg" },
  { id: "galicia_julio_2025_1600", name: "Julio 2025 (16:00)", img: "/img/truck3.jpg" },
  { id: "galicia_septiembre_2025", name: "Septiembre 2025", img: "/img/truck4.jpg" },
  { id: "galicia_octubre_2025", name: "Octubre 2025", img: "/img/truck1.jpg" },
  { id: "galicia_noviembre_2025_1000", name: "Noviembre 2025 (10:00)", img: "/img/truck2.jpg" },
  { id: "galicia_noviembre_2025_1600", name: "Noviembre 2025 (16:00)", img: "/img/truck3.jpg" },
  { id: "galicia_enero_2026_1000", name: "Enero 2026 (10:00)", img: "/img/truck4.jpg" },
  { id: "galicia_enero_2026_1600", name: "Enero 2026 (16:00)", img: "/img/truck1.jpg" },
  { id: "galicia_marzo_2026_1000", name: "Marzo 2026 (10:00)", img: "/img/truck2.jpg" },
  { id: "galicia_marzo_2026_1600", name: "Marzo 2026 (16:00)", img: "/img/truck3.jpg" },
  { id: "galicia_mayo_2026_1000", name: "Mayo 2026 (10:00)", img: "/img/truck4.jpg" },
  { id: "galicia_mayo_2026_1600", name: "Mayo 2026 (16:00)", img: "/img/truck1.jpg" },
  { id: "galicia_junio_2026_1000", name: "Junio 2026 (10:00)", img: "/img/truck2.jpg" },
  { id: "galicia_junio_2026_1600", name: "Junio 2026 (16:00)", img: "/img/truck3.jpg" },
  { id: "galicia_julio_2026_1000", name: "Julio 2026 (10:00)", img: "/img/truck4.jpg" },
  { id: "galicia_julio_2026_1600", name: "Julio 2026 (16:00)", img: "/img/truck1.jpg" },
  { id: "galicia_septiembre_2026_1000", name: "Septiembre 2026 (10:00)", img: "/img/truck2.jpg" },
  { id: "galicia_septiembre_2026_1600", name: "Septiembre 2026 (16:00)", img: "/img/truck3.jpg" },
];

/** Comunidades autónomas disponibles en el portal del alumno. */
export const communityRegions: CommunityRegion[] = [
  {
    id: "andalucia",
    name: "Andalucía",
    tests: [],
    subregions: [
      { id: "almeria", name: "Almería", tests: almeriaTests },
      { id: "cadiz", name: "Cádiz", tests: cadizTests },
      { id: "cordoba", name: "Córdoba", tests: cordobaTests },
      { id: "granada", name: "Granada", tests: granadaTests },
      { id: "huelva", name: "Huelva", tests: huelvaTests },
      { id: "jaen", name: "Jaén", tests: jaenTests },
      { id: "malaga", name: "Málaga", tests: malagaTests },
      { id: "sevilla", name: "Sevilla", tests: sevillaTests },
    ],
  },
  { id: "cataluna", name: "Cataluña", tests: catalunaTests },
  { id: "valencia", name: "Valencia", tests: valenciaTests },
  { id: "cantabria", name: "Cantabria", tests: cantabriaTests },
  {
    id: "pais_vasco",
    name: "País Vasco",
    tests: [],
    subregions: [
      { id: "alava", name: "Álava", tests: alavaTests },
      { id: "guipuzkoa", name: "Guipúzcoa", tests: guipuzkoaTests },
      { id: "vizcaya", name: "Vizcaya", tests: [] },
    ],
  },
  { id: "galicia", name: "Galicia", tests: galiciaTests },
  { id: "extremadura", name: "Extremadura", tests: extremaduraTests },
  { id: "murcia", name: "Murcia", tests: murciaTests },
];

function regionTestsFlat(region: CommunityRegion): TestMeta[] {
  if (region.subregions?.length) {
    return region.subregions.flatMap((s) => s.tests);
  }
  return region.tests;
}

/** Flat list of all tests (compat for loaders / stats / getTestMeta). */
export const availableTests: TestMeta[] = communityRegions.flatMap(regionTestsFlat);

export function regionTestCount(region: CommunityRegion): number {
  return regionTestsFlat(region).length;
}

const viajerosSevillaTests: TestMeta[] = [
  {
    id: "viajeros_sevilla_enero_2026",
    name: "Enero 2026",
    img: "/img/bus1.jpg",
    placeholder: true,
  },
];

/** CAP viajeros — same layout as mercancías; exams will be ingested later. */
export const viajerosCommunityRegions: CommunityRegion[] = [
  {
    id: "andalucia",
    name: "Andalucía",
    tests: [],
    subregions: [
      { id: "almeria", name: "Almería", tests: [] },
      { id: "cadiz", name: "Cádiz", tests: [] },
      { id: "cordoba", name: "Córdoba", tests: [] },
      { id: "granada", name: "Granada", tests: [] },
      { id: "huelva", name: "Huelva", tests: [] },
      { id: "jaen", name: "Jaén", tests: [] },
      { id: "malaga", name: "Málaga", tests: [] },
      { id: "sevilla", name: "Sevilla", tests: viajerosSevillaTests },
    ],
  },
  { id: "cataluna", name: "Cataluña", tests: [] },
  { id: "valencia", name: "Valencia", tests: [] },
  { id: "cantabria", name: "Cantabria", tests: [] },
  {
    id: "pais_vasco",
    name: "País Vasco",
    tests: [],
    subregions: [
      { id: "alava", name: "Álava", tests: [] },
      { id: "guipuzkoa", name: "Guipúzcoa", tests: [] },
      { id: "vizcaya", name: "Vizcaya", tests: [] },
    ],
  },
  { id: "galicia", name: "Galicia", tests: [] },
  { id: "extremadura", name: "Extremadura", tests: [] },
  { id: "murcia", name: "Murcia", tests: [] },
];

export function regionsForTrack(track: "mercancias" | "viajeros"): CommunityRegion[] {
  return track === "viajeros" ? viajerosCommunityRegions : communityRegions;
}

export const testPdfUrls: Record<string, string> = {
  sevilla_febrero_2023:
    "https://web.araba.eus/documents/1247685/1249405/PLANTILLA+MERCANCIAS.pdf/2b3142dd-2c5d-73f1-358d-a72acdefeaab?t=1675426465593",
  sevilla_marzo_2023:
    "https://web.araba.eus/documents/1247685/1248559/PlantillaMercancias.pdf/baf75bf5-c8c3-073f-6431-eed78886082c?t=1680260555891",
  sevilla_junio_2023:
    "https://web.araba.eus/documents/1247685/1249489/PLANTILLA+MERCANCIAS.pdf/a191e2d8-87f9-2d85-3fae-74125e9d2fb9?t=1685704851002",
  sevilla_julio_2023:
    "https://web.araba.eus/documents/1247685/1249509/Plantilla+Mercancias.pdf/a59274b8-68a2-6ec4-2919-57163c2a1d58?t=1689335365851",
  sevilla_septiembre_2023:
    "https://web.araba.eus/documents/1247685/1249519/20230929+Plantilla+Examen+Mercanc%C3%ADas.pdf/1a4394c5-7a90-674a-a53f-2cf599c22af0?t=1695992158931",
  sevilla_noviembre_2023:
    "https://web.araba.eus/documents/1247685/1249536/20231124+Plantilla+Respuestas+Examen+Mercanc%C3%ADas.pdf/49f865b0-09c3-d3f5-1d86-640f2cec32e9?t=1701076611807",
  sevilla_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/examen_merc_se_cap1_2024.pdf",
  sevilla_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_se_cap2_2024.pdf",
  sevilla_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen-a_mer_se_cap3_2024.pdf",
  sevilla_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_se_cap4_2024_modelo%20A.pdf",
  sevilla_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_merc-modeloA_se_cap5_2024.pdf",
  sevilla_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer-A_se_cap6_2024.pdf",
  sevilla_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_merc-modeloA_se_cap5_2025_0.pdf",
  sevilla_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_cr_mer_se_mod-a_cap2_2025.pdf",
  sevilla_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_A_se_cap3_2025.pdf",
  sevilla_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_se_cap4_modeloA.pdf",
  sevilla_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_se_cap5_2025_opci%C3%B3n%20A.pdf",
  sevilla_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
  sevilla_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/Examen%20con%20respuestas%20mercanc%C3%ADas%20A.pdf",
  sevilla_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/Examen%20con%20respuestas%20mercanc%C3%ADas%20A_0.pdf",
  sevilla_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/Examen%20con%20respuestas%20mercanc%C3%ADas%20b.pdf",
  almeria_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/plantilla_mer_al_cap1_2024.pdf",
  almeria_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/plantilla_mer_al_cap1_2025%20modelo%20a.pdf.pdf",
  almeria_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/plantilla_mer_al_cap1_2026%20MODELO%20A.pdf",
  almeria_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/plantilla_mer_al_cap4_2024_mod-A.pdf",
  almeria_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/plantilla_mer_al_cap4_2025%20MODELO%20A.pdf",
  almeria_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/plantilla_mer_al_cap4_2026_m-A.pdf",
  almeria_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_al_cap2_modeloA_2024.pdf",
  almeria_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_mer_al_cap2_2025%20modeloA.pdf",
  almeria_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/plantilla_mer_al_cap2_2026%20MODELO%20A.pdf",
  almeria_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen_mer_al_cap3_2024_modelo-a.pdf",
  almeria_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/plantilla_mer_al_cap3_2025%20MODELO%20A.pdf",
  almeria_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/plantilla_mer_al_cap3_2026%20MODELO%20A.pdf",
  almeria_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer_al_cap6_2024_mA.pdf",
  almeria_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/plantilla_mer_al_cap6_2025%20MODELO%20A.pdf",
  almeria_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/plantilla_mer_al_cap5_2024_modelo-A.pdf",
  almeria_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/plantilla_mer_al_cap5_2025%20MODELO%20A.pdf",
  cadiz_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/plantilla_merc_ca_cap1_2024.pdf",
  cadiz_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/plantilla_mer_ca_cap1_2025.pdf.pdf",
  cadiz_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/Examen%20corregido%20mercanc%C3%ADas_0.pdf",
  cadiz_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_ca_cap4_2024.pdf",
  cadiz_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_ca_cap4_2025.pdf",
  cadiz_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/examen_mer_ca_cap4_2026_0.pdf",
  cadiz_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_ca_cap2_2024.pdf",
  cadiz_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/plantilla_mer_ca_cap2_2025.pdf.pdf",
  cadiz_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/RESPUESTAS%20EXAMEN%20CAP%20MERCANCIAS.pdf",
  cadiz_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen_mer_ca_cap3_2024.pdf",
  cadiz_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/plantilla_mer_ca_cap3_2025.pdf",
  cadiz_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/RESPUESTAS%20EXAMEN%20MERCANCIAS.pdf",
  cadiz_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen_mer_ca_cap6_2024.pdf",
  cadiz_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_mercanc%C3%ADas_ca_cap5_2024.pdf",
  cadiz_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/plantilla_mer_ca_cap5_2025.pdf",
  cordoba_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/plantilla_mer_co_cap1_2024.pdf",
  cordoba_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen-c_mer_co_cap1_2025.pdf",
  cordoba_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/plantilla_mer_co_cap1_2026.pdf",
  cordoba_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/plantilla_mer_co_cap4_2024.pdf",
  cordoba_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/plantilla_mer_co_capn%C2%BA4_2025.pdf",
  cordoba_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/plantilla_mer_co_cap4_2026.pdf",
  cordoba_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/plantilla_mer_co_cap2_2024_2.pdf",
  cordoba_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/plantilla_mer_co_capn%C2%BA2_2025.pdf",
  cordoba_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/plantilla_mer_co_cap2_2026.pdf",
  cordoba_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/plantilla_%20mer_co_cap3_2024.pdf",
  cordoba_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/plantilla_mer_co_capn%C2%BA3_2025.pdf",
  cordoba_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/plantilla_mer_co_capn%C2%BA3_2026.pdf",
  cordoba_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen-r_mer_co_cap6_2024.pdf",
  cordoba_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/plantilla_mer_co_capn%C2%BA6_2025-1_0.pdf",
  cordoba_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/plantilla_mer_co_cap5_2024.pdf",
  cordoba_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/plantilla_mer_co_cap5_2025_0.pdf",
  granada_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/mer_examen_gr_cap1_2024.pdf",
  granada_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_mer_gr_cap1_2025.pdf",
  granada_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/examen_mer_gr_cap1_2026.pdf",
  granada_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_mer_gr_cap4_2024.pdf",
  granada_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_gr_cap4_2025.pdf",
  granada_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/examen_A_mer_gr_cap4_2026.pdf",
  granada_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_mer_gr_cap2_2024.pdf",
  granada_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_mer_gr_cap2_2025.pdf",
  granada_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/1%20examenA_mer_gr_cap2_2026.pdf",
  granada_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/mer_examen_gr_cap3_2024.pdf",
  granada_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_gr_cap3_2025.pdf",
  granada_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/examenA_mer_gr_cap3_2026.pdf",
  granada_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen_mer_gr_cap6_2024.pdf",
  granada_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/examen_mer_gr_cap6_2025.pdf",
  granada_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/mer_examen_gr_cap5_2024.pdf",
  granada_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_gr_cap5_2025.pdf",
  huelva_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/plantilla_mer_hu_cap4_2025.pdf",
  huelva_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/hu_plantilla_mer_cap4_%202026.pdf",
  huelva_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/plantilla_mer_hu_cap3_2025.pdf",
  huelva_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/mercancias%20plantilla%2022%20noviembre%202025-2.pdf",
  jaen_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/plantilla_mer_ja_cap1_2024.pdf",
  jaen_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/plantilla_mer_ja_cap1_2025.pdf",
  jaen_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/plantilla_mer_ja_cap1_2026.pdf",
  jaen_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/plantilla_merc_ja_cap4_2024.pdf",
  jaen_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/plantilla_merc_ja_cap4_2025.pdf",
  jaen_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/plantilla_merc_ja_cap4_2026.pdf",
  jaen_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_merc_ja_cap2_2024.pdf",
  jaen_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/plantilla_mer_ja_cap2_2025.pdf",
  jaen_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/plantilla_merc_ja_cap2_2026.pdf",
  jaen_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen_merc_ja_cap3_2024.pdf",
  jaen_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/plantilla_mer_ja_cap3_2025.pdf",
  jaen_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/plantilla_merc_ja_cap3_2026-1.pdf",
  jaen_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/plantilla_merc_ja_cap6_2024.pdf",
  jaen_noviembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/11/plantilla_mer_ja_cap6_2025.pdf",
  jaen_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/plantilla_mer_ja_cap5_2024.pdf",
  jaen_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/plantilla_mer_ja_cap5_2025_0.pdf",
  malaga_enero_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/01/examen_merc_ma_cap1_2024.pdf",
  malaga_enero_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/01/examen_merc_ma_cap1_2025.pdf",
  malaga_enero_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/01/EXAMEN%20MERCANCIAS%20CON%20RESPUESTAS.pdf",
  malaga_julio_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/07/examen_merc_ma_cap4_2024.pdf",
  malaga_julio_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/07/examen_mer_ma_cap4_2025.pdf",
  malaga_julio_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/07/examen_mer_ma_cap4_2026.pdf",
  malaga_marzo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/examen_merc_ma_cap2_2024.pdf",
  malaga_marzo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/03/examen_merc_ma_cap2_2025.pdf",
  malaga_marzo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/03/examen_mercA_ma_cap2_2026.pdf",
  malaga_mayo_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/05/examen_merc_ma_cap3_2024.pdf",
  malaga_mayo_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/05/examen_mer_ma_cap3_2025.pdf",
  malaga_mayo_2026:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/examen%20MERCANC%C3%8DAS_0.pdf",
  malaga_noviembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/11/examen_merc_ma_cap6_2024.pdf",
  malaga_septiembre_2024:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/09/examen_merc_ma_cap5_2024.pdf",
  malaga_septiembre_2025:
    "https://www.juntadeandalucia.es/sites/default/files/inline-files/2025/09/examen_mer_ma_cap5_2025.pdf",
};

/**
 * Lazy loaders — one code-split chunk per exam. All chunks are precached by
 * the service worker at install time, so every test also works offline.
 */
const examLoaders: Record<string, () => Promise<{ default: Question[] }>> = {
  // Andalucía — provincias (mercancías A)
  sevilla_febrero_2023: () => import("@/data/exams/sevilla_febrero_2023.json"),
  sevilla_marzo_2023: () => import("@/data/exams/sevilla_marzo_2023.json"),
  sevilla_junio_2023: () => import("@/data/exams/sevilla_junio_2023.json"),
  sevilla_julio_2023: () => import("@/data/exams/sevilla_julio_2023.json"),
  sevilla_septiembre_2023: () => import("@/data/exams/sevilla_septiembre_2023.json"),
  sevilla_noviembre_2023: () => import("@/data/exams/sevilla_noviembre_2023.json"),
  sevilla_enero_2024: () => import("@/data/exams/sevilla_enero_2024.json"),
  sevilla_marzo_2024: () => import("@/data/exams/sevilla_marzo_2024.json"),
  sevilla_mayo_2024: () => import("@/data/exams/sevilla_mayo_2024.json"),
  sevilla_julio_2024: () => import("@/data/exams/sevilla_julio_2024.json"),
  sevilla_septiembre_2024: () => import("@/data/exams/sevilla_septiembre_2024.json"),
  sevilla_noviembre_2024: () => import("@/data/exams/sevilla_noviembre_2024.json"),
  sevilla_enero_2025: () => import("@/data/exams/sevilla_enero_2025.json"),
  sevilla_marzo_2025: () => import("@/data/exams/sevilla_marzo_2025.json"),
  sevilla_mayo_2025: () => import("@/data/exams/sevilla_mayo_2025.json"),
  sevilla_julio_2025: () => import("@/data/exams/sevilla_julio_2025.json"),
  sevilla_septiembre_2025: () => import("@/data/exams/sevilla_septiembre_2025.json"),
  sevilla_noviembre_2025: () => import("@/data/exams/sevilla_noviembre_2025.json"),
  sevilla_enero_2026: () => import("@/data/exams/sevilla_enero_2026.json"),
  sevilla_marzo_2026: () => import("@/data/exams/sevilla_marzo_2026.json"),
  sevilla_mayo_2026: () => import("@/data/exams/sevilla_mayo_2026.json"),
  almeria_enero_2024: () => import("@/data/exams/almeria_enero_2024.json"),
  almeria_enero_2025: () => import("@/data/exams/almeria_enero_2025.json"),
  almeria_enero_2026: () => import("@/data/exams/almeria_enero_2026.json"),
  almeria_julio_2024: () => import("@/data/exams/almeria_julio_2024.json"),
  almeria_julio_2025: () => import("@/data/exams/almeria_julio_2025.json"),
  almeria_julio_2026: () => import("@/data/exams/almeria_julio_2026.json"),
  almeria_marzo_2024: () => import("@/data/exams/almeria_marzo_2024.json"),
  almeria_marzo_2025: () => import("@/data/exams/almeria_marzo_2025.json"),
  almeria_marzo_2026: () => import("@/data/exams/almeria_marzo_2026.json"),
  almeria_mayo_2024: () => import("@/data/exams/almeria_mayo_2024.json"),
  almeria_mayo_2025: () => import("@/data/exams/almeria_mayo_2025.json"),
  almeria_mayo_2026: () => import("@/data/exams/almeria_mayo_2026.json"),
  almeria_noviembre_2024: () => import("@/data/exams/almeria_noviembre_2024.json"),
  almeria_noviembre_2025: () => import("@/data/exams/almeria_noviembre_2025.json"),
  almeria_septiembre_2024: () => import("@/data/exams/almeria_septiembre_2024.json"),
  almeria_septiembre_2025: () => import("@/data/exams/almeria_septiembre_2025.json"),
  cadiz_enero_2024: () => import("@/data/exams/cadiz_enero_2024.json"),
  cadiz_enero_2025: () => import("@/data/exams/cadiz_enero_2025.json"),
  cadiz_enero_2026: () => import("@/data/exams/cadiz_enero_2026.json"),
  cadiz_julio_2024: () => import("@/data/exams/cadiz_julio_2024.json"),
  cadiz_julio_2025: () => import("@/data/exams/cadiz_julio_2025.json"),
  cadiz_julio_2026: () => import("@/data/exams/cadiz_julio_2026.json"),
  cadiz_marzo_2024: () => import("@/data/exams/cadiz_marzo_2024.json"),
  cadiz_marzo_2025: () => import("@/data/exams/cadiz_marzo_2025.json"),
  cadiz_marzo_2026: () => import("@/data/exams/cadiz_marzo_2026.json"),
  cadiz_mayo_2024: () => import("@/data/exams/cadiz_mayo_2024.json"),
  cadiz_mayo_2025: () => import("@/data/exams/cadiz_mayo_2025.json"),
  cadiz_mayo_2026: () => import("@/data/exams/cadiz_mayo_2026.json"),
  cadiz_noviembre_2024: () => import("@/data/exams/cadiz_noviembre_2024.json"),
  cadiz_septiembre_2024: () => import("@/data/exams/cadiz_septiembre_2024.json"),
  cadiz_septiembre_2025: () => import("@/data/exams/cadiz_septiembre_2025.json"),
  cordoba_enero_2024: () => import("@/data/exams/cordoba_enero_2024.json"),
  cordoba_enero_2025: () => import("@/data/exams/cordoba_enero_2025.json"),
  cordoba_enero_2026: () => import("@/data/exams/cordoba_enero_2026.json"),
  cordoba_julio_2024: () => import("@/data/exams/cordoba_julio_2024.json"),
  cordoba_julio_2025: () => import("@/data/exams/cordoba_julio_2025.json"),
  cordoba_julio_2026: () => import("@/data/exams/cordoba_julio_2026.json"),
  cordoba_marzo_2024: () => import("@/data/exams/cordoba_marzo_2024.json"),
  cordoba_marzo_2025: () => import("@/data/exams/cordoba_marzo_2025.json"),
  cordoba_marzo_2026: () => import("@/data/exams/cordoba_marzo_2026.json"),
  cordoba_mayo_2024: () => import("@/data/exams/cordoba_mayo_2024.json"),
  cordoba_mayo_2025: () => import("@/data/exams/cordoba_mayo_2025.json"),
  cordoba_mayo_2026: () => import("@/data/exams/cordoba_mayo_2026.json"),
  cordoba_noviembre_2024: () => import("@/data/exams/cordoba_noviembre_2024.json"),
  cordoba_noviembre_2025: () => import("@/data/exams/cordoba_noviembre_2025.json"),
  cordoba_septiembre_2024: () => import("@/data/exams/cordoba_septiembre_2024.json"),
  cordoba_septiembre_2025: () => import("@/data/exams/cordoba_septiembre_2025.json"),
  granada_enero_2024: () => import("@/data/exams/granada_enero_2024.json"),
  granada_enero_2025: () => import("@/data/exams/granada_enero_2025.json"),
  granada_enero_2026: () => import("@/data/exams/granada_enero_2026.json"),
  granada_julio_2024: () => import("@/data/exams/granada_julio_2024.json"),
  granada_julio_2025: () => import("@/data/exams/granada_julio_2025.json"),
  granada_julio_2026: () => import("@/data/exams/granada_julio_2026.json"),
  granada_marzo_2024: () => import("@/data/exams/granada_marzo_2024.json"),
  granada_marzo_2025: () => import("@/data/exams/granada_marzo_2025.json"),
  granada_marzo_2026: () => import("@/data/exams/granada_marzo_2026.json"),
  granada_mayo_2024: () => import("@/data/exams/granada_mayo_2024.json"),
  granada_mayo_2025: () => import("@/data/exams/granada_mayo_2025.json"),
  granada_mayo_2026: () => import("@/data/exams/granada_mayo_2026.json"),
  granada_noviembre_2024: () => import("@/data/exams/granada_noviembre_2024.json"),
  granada_noviembre_2025: () => import("@/data/exams/granada_noviembre_2025.json"),
  granada_septiembre_2024: () => import("@/data/exams/granada_septiembre_2024.json"),
  granada_septiembre_2025: () => import("@/data/exams/granada_septiembre_2025.json"),
  huelva_julio_2025: () => import("@/data/exams/huelva_julio_2025.json"),
  huelva_julio_2026: () => import("@/data/exams/huelva_julio_2026.json"),
  huelva_mayo_2025: () => import("@/data/exams/huelva_mayo_2025.json"),
  huelva_noviembre_2025: () => import("@/data/exams/huelva_noviembre_2025.json"),
  jaen_enero_2024: () => import("@/data/exams/jaen_enero_2024.json"),
  jaen_enero_2025: () => import("@/data/exams/jaen_enero_2025.json"),
  jaen_enero_2026: () => import("@/data/exams/jaen_enero_2026.json"),
  jaen_julio_2024: () => import("@/data/exams/jaen_julio_2024.json"),
  jaen_julio_2025: () => import("@/data/exams/jaen_julio_2025.json"),
  jaen_julio_2026: () => import("@/data/exams/jaen_julio_2026.json"),
  jaen_marzo_2024: () => import("@/data/exams/jaen_marzo_2024.json"),
  jaen_marzo_2025: () => import("@/data/exams/jaen_marzo_2025.json"),
  jaen_marzo_2026: () => import("@/data/exams/jaen_marzo_2026.json"),
  jaen_mayo_2024: () => import("@/data/exams/jaen_mayo_2024.json"),
  jaen_mayo_2025: () => import("@/data/exams/jaen_mayo_2025.json"),
  jaen_mayo_2026: () => import("@/data/exams/jaen_mayo_2026.json"),
  jaen_noviembre_2024: () => import("@/data/exams/jaen_noviembre_2024.json"),
  jaen_noviembre_2025: () => import("@/data/exams/jaen_noviembre_2025.json"),
  jaen_septiembre_2024: () => import("@/data/exams/jaen_septiembre_2024.json"),
  jaen_septiembre_2025: () => import("@/data/exams/jaen_septiembre_2025.json"),
  malaga_enero_2024: () => import("@/data/exams/malaga_enero_2024.json"),
  malaga_enero_2025: () => import("@/data/exams/malaga_enero_2025.json"),
  malaga_enero_2026: () => import("@/data/exams/malaga_enero_2026.json"),
  malaga_julio_2024: () => import("@/data/exams/malaga_julio_2024.json"),
  malaga_julio_2025: () => import("@/data/exams/malaga_julio_2025.json"),
  malaga_julio_2026: () => import("@/data/exams/malaga_julio_2026.json"),
  malaga_marzo_2024: () => import("@/data/exams/malaga_marzo_2024.json"),
  malaga_marzo_2025: () => import("@/data/exams/malaga_marzo_2025.json"),
  malaga_marzo_2026: () => import("@/data/exams/malaga_marzo_2026.json"),
  malaga_mayo_2024: () => import("@/data/exams/malaga_mayo_2024.json"),
  malaga_mayo_2025: () => import("@/data/exams/malaga_mayo_2025.json"),
  malaga_mayo_2026: () => import("@/data/exams/malaga_mayo_2026.json"),
  malaga_noviembre_2024: () => import("@/data/exams/malaga_noviembre_2024.json"),
  malaga_septiembre_2024: () => import("@/data/exams/malaga_septiembre_2024.json"),
  malaga_septiembre_2025: () => import("@/data/exams/malaga_septiembre_2025.json"),
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
  // Extremadura — mercancías A (* marca la correcta en el mismo PDF)
  extremadura_febrero_2026: () =>
    import("@/data/exams/extremadura_febrero_2026.json"),
  // Cantabria — plantilla casillas (formato Valencia)
  cantabria_febrero_2025: () => import("@/data/exams/cantabria_febrero_2025.json"),
  cantabria_abril_2025: () => import("@/data/exams/cantabria_abril_2025.json"),
  cantabria_junio_2025: () => import("@/data/exams/cantabria_junio_2025.json"),
  cantabria_agosto_2025: () => import("@/data/exams/cantabria_agosto_2025.json"),
  cantabria_octubre_2025: () => import("@/data/exams/cantabria_octubre_2025.json"),
  cantabria_diciembre_2025: () => import("@/data/exams/cantabria_diciembre_2025.json"),
  cantabria_febrero_2026: () => import("@/data/exams/cantabria_febrero_2026.json"),
  cantabria_abril_2026: () => import("@/data/exams/cantabria_abril_2026.json"),
  cantabria_junio_2026: () => import("@/data/exams/cantabria_junio_2026.json"),
  // Álava (País Vasco) — plantilla casillas
  alava_febrero_2023: () => import("@/data/exams/alava_febrero_2023.json"),
  alava_marzo_2023: () => import("@/data/exams/alava_marzo_2023.json"),
  alava_junio_2023: () => import("@/data/exams/alava_junio_2023.json"),
  alava_julio_2023: () => import("@/data/exams/alava_julio_2023.json"),
  alava_septiembre_2023: () => import("@/data/exams/alava_septiembre_2023.json"),
  alava_noviembre_2023: () => import("@/data/exams/alava_noviembre_2023.json"),
  alava_febrero_2024: () => import("@/data/exams/alava_febrero_2024.json"),
  alava_marzo_2024: () => import("@/data/exams/alava_marzo_2024.json"),
  alava_mayo_2024: () => import("@/data/exams/alava_mayo_2024.json"),
  alava_julio_2024: () => import("@/data/exams/alava_julio_2024.json"),
  alava_septiembre_2024: () => import("@/data/exams/alava_septiembre_2024.json"),
  alava_noviembre_2024: () => import("@/data/exams/alava_noviembre_2024.json"),
  alava_enero_2025: () => import("@/data/exams/alava_enero_2025.json"),
  alava_marzo_2025: () => import("@/data/exams/alava_marzo_2025.json"),
  alava_mayo_2025: () => import("@/data/exams/alava_mayo_2025.json"),
  alava_julio_2025: () => import("@/data/exams/alava_julio_2025.json"),
  alava_enero_2026: () => import("@/data/exams/alava_enero_2026.json"),
  alava_marzo_2026: () => import("@/data/exams/alava_marzo_2026.json"),
  alava_mayo_2026: () => import("@/data/exams/alava_mayo_2026.json"),
  alava_julio_2026: () => import("@/data/exams/alava_julio_2026.json"),
  // Guipúzcoa (País Vasco) — examen bilingüe / plantilla OMR o texto
  guipuzkoa_enero_2025: () => import("@/data/exams/guipuzkoa_enero_2025.json"),
  guipuzkoa_marzo_2025: () => import("@/data/exams/guipuzkoa_marzo_2025.json"),
  guipuzkoa_mayo_2025: () => import("@/data/exams/guipuzkoa_mayo_2025.json"),
  guipuzkoa_julio_2025: () => import("@/data/exams/guipuzkoa_julio_2025.json"),
  guipuzkoa_septiembre_2025: () => import("@/data/exams/guipuzkoa_septiembre_2025.json"),
  guipuzkoa_noviembre_2025: () => import("@/data/exams/guipuzkoa_noviembre_2025.json"),
  guipuzkoa_enero_2026: () => import("@/data/exams/guipuzkoa_enero_2026.json"),
  guipuzkoa_marzo_2026: () => import("@/data/exams/guipuzkoa_marzo_2026.json"),
  guipuzkoa_mayo_2026: () => import("@/data/exams/guipuzkoa_mayo_2026.json"),
  guipuzkoa_julio_2026: () => import("@/data/exams/guipuzkoa_julio_2026.json"),
  // Murcia — plantilla OMR escaneada (sidecar)
  murcia_enero_2026: () => import("@/data/exams/murcia_enero_2026.json"),
  murcia_marzo_2026: () => import("@/data/exams/murcia_marzo_2026.json"),
  murcia_mayo_2026: () => import("@/data/exams/murcia_mayo_2026.json"),
  murcia_julio_2026: () => import("@/data/exams/murcia_julio_2026.json"),
  // Galicia — mercancías modelo A (castellano)
  galicia_enero_2023: () => import("@/data/exams/galicia_enero_2023.json"),
  galicia_marzo_2023: () => import("@/data/exams/galicia_marzo_2023.json"),
  galicia_junio_2023: () => import("@/data/exams/galicia_junio_2023.json"),
  galicia_julio_2023: () => import("@/data/exams/galicia_julio_2023.json"),
  galicia_septiembre_2023_1000: () => import("@/data/exams/galicia_septiembre_2023_1000.json"),
  galicia_septiembre_2023_1615: () => import("@/data/exams/galicia_septiembre_2023_1615.json"),
  galicia_octubre_2023: () => import("@/data/exams/galicia_octubre_2023.json"),
  galicia_noviembre_2023_1000: () => import("@/data/exams/galicia_noviembre_2023_1000.json"),
  galicia_noviembre_2023_1615: () => import("@/data/exams/galicia_noviembre_2023_1615.json"),
  galicia_enero_2024: () => import("@/data/exams/galicia_enero_2024.json"),
  galicia_marzo_2024: () => import("@/data/exams/galicia_marzo_2024.json"),
  galicia_mayo_2024: () => import("@/data/exams/galicia_mayo_2024.json"),
  galicia_junio_2024_1000: () => import("@/data/exams/galicia_junio_2024_1000.json"),
  galicia_junio_2024_1615: () => import("@/data/exams/galicia_junio_2024_1615.json"),
  galicia_julio_2024_1000: () => import("@/data/exams/galicia_julio_2024_1000.json"),
  galicia_julio_2024_1600: () => import("@/data/exams/galicia_julio_2024_1600.json"),
  galicia_septiembre_2024_1000: () => import("@/data/exams/galicia_septiembre_2024_1000.json"),
  galicia_septiembre_2024_1600: () => import("@/data/exams/galicia_septiembre_2024_1600.json"),
  galicia_noviembre_2024_1000: () => import("@/data/exams/galicia_noviembre_2024_1000.json"),
  galicia_noviembre_2024_1615: () => import("@/data/exams/galicia_noviembre_2024_1615.json"),
  galicia_enero_2025_1000: () => import("@/data/exams/galicia_enero_2025_1000.json"),
  galicia_enero_2025_1615: () => import("@/data/exams/galicia_enero_2025_1615.json"),
  galicia_marzo_2025: () => import("@/data/exams/galicia_marzo_2025.json"),
  galicia_mayo_2025_1000: () => import("@/data/exams/galicia_mayo_2025_1000.json"),
  galicia_mayo_2025_1615: () => import("@/data/exams/galicia_mayo_2025_1615.json"),
  galicia_julio_2025_1000: () => import("@/data/exams/galicia_julio_2025_1000.json"),
  galicia_julio_2025_1600: () => import("@/data/exams/galicia_julio_2025_1600.json"),
  galicia_septiembre_2025: () => import("@/data/exams/galicia_septiembre_2025.json"),
  galicia_octubre_2025: () => import("@/data/exams/galicia_octubre_2025.json"),
  galicia_noviembre_2025_1000: () => import("@/data/exams/galicia_noviembre_2025_1000.json"),
  galicia_noviembre_2025_1600: () => import("@/data/exams/galicia_noviembre_2025_1600.json"),
  galicia_enero_2026_1000: () => import("@/data/exams/galicia_enero_2026_1000.json"),
  galicia_enero_2026_1600: () => import("@/data/exams/galicia_enero_2026_1600.json"),
  galicia_marzo_2026_1000: () => import("@/data/exams/galicia_marzo_2026_1000.json"),
  galicia_marzo_2026_1600: () => import("@/data/exams/galicia_marzo_2026_1600.json"),
  galicia_mayo_2026_1000: () => import("@/data/exams/galicia_mayo_2026_1000.json"),
  galicia_mayo_2026_1600: () => import("@/data/exams/galicia_mayo_2026_1600.json"),
  galicia_junio_2026_1000: () => import("@/data/exams/galicia_junio_2026_1000.json"),
  galicia_junio_2026_1600: () => import("@/data/exams/galicia_junio_2026_1600.json"),
  galicia_julio_2026_1000: () => import("@/data/exams/galicia_julio_2026_1000.json"),
  galicia_julio_2026_1600: () => import("@/data/exams/galicia_julio_2026_1600.json"),
  galicia_septiembre_2026_1000: () => import("@/data/exams/galicia_septiembre_2026_1000.json"),
  galicia_septiembre_2026_1600: () => import("@/data/exams/galicia_septiembre_2026_1600.json"),
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
