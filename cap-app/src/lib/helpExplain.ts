import type { Question } from "./types";

function correctOptionText(q: Question): string {
  const letter = (q.correct || "").toLowerCase();
  return q.options.find((o) => o.id.toLowerCase() === letter)?.text ?? "";
}

type Tip = {
  /** All of these must match question + correct option. */
  all?: RegExp[];
  /** At least one must match. */
  any?: RegExp[];
  /** Must match the correct option. */
  answer?: RegExp[];
  text: string;
};

function blobOf(question: string, correct: string): string {
  return `${question}\n${correct}`;
}

function matches(text: string, all?: RegExp[], any?: RegExp[]): boolean {
  if (all && !all.every((r) => r.test(text))) return false;
  if (any && !any.some((r) => r.test(text))) return false;
  return true;
}

/**
 * Explicaciones del temario CAP (mercancías) para cuando no hay cita
 * concreta en el banco. No inventan un artículo: describen el concepto.
 */
const TIPS: Tip[] = [
  {
    any: [/agencias? de transporte/i, /almacenistas?-distribuidores/i, /transitari/i],
    answer: [/nombre propio/i],
    text:
      "Las agencias de transporte, los transitarios y los almacenistas-distribuidores no son meros representantes del cliente: cuando contratan con el cargador o con el transportista lo hacen siempre en nombre propio, es decir, se obligan ellos mismos. Por eso no vale decir que contratan «en nombre de quien haya pedido el servicio» ni limitar el nombre propio a cuando usan camiones propios, de leasing o renting.",
  },
  {
    any: [/transitari/i],
    answer: [/internacionales/i, /aduaneros/i],
    text:
      "El transitario organiza por cuenta ajena transportes internacionales: contrata en nombre propio, hace trámites aduaneros y coordina transbordos. No es un aduanero ni un simple transportista.",
  },
  {
    all: [/visado/i],
    text:
      "El visado es la comprobación periódica de la Administración de que el titular de la autorización de transporte sigue cumpliendo los requisitos. No es una ITV del vehículo ni un título nuevo.",
  },
  {
    any: [/\bMDPE\b/i],
    text:
      "MDPE identifica las autorizaciones de transporte público de mercancías con vehículos de MMA superior a 3,5 t. MPCE es privado complementario; MDLE es el de ligeros.",
  },
  {
    any: [/\bMPCE\b/i],
    text:
      "MPCE es la clave registral del transporte privado complementario de mercancías (cuenta propia de una empresa cuya actividad principal no es transportar).",
  },
  {
    all: [/cuenta propia/i, /actividad principal/i],
    answer: [/privado complementario/i],
    text:
      "Si una empresa transporta su propia mercancía y su actividad principal no es el transporte, ese transporte se llama privado complementario, no público.",
  },
  {
    all: [/cuenta ajena/i],
    answer: [/terceros/i, /p[uú]blico/i],
    text:
      "Por cuenta ajena (transporte público) es prestar el servicio a terceros a cambio de un precio. Por cuenta propia es mover mercancía de la propia empresa.",
  },
  {
    all: [/convenio CMR/i],
    text:
      "El CMR regula el contrato de transporte internacional de mercancías por carretera (carta de porte, responsabilidad del porteador). No regula viajeros ni el control policial.",
  },
  {
    any: [/\bTEU\b/i],
    answer: [/20 pies/i],
    text:
      "TEU (Twenty-foot Equivalent Unit) es el contenedor de 20 pies. Uno de 40 pies son 2 TEU. No es «cualquier contenedor».",
  },
  {
    all: [/pausa/i, /45/i],
    text:
      "Tras 4 h 30 min de conducción hay que hacer 45 minutos de pausa (o 15 + 30 intercalados). No se sustituye por 35 ni por 40 minutos sueltos.",
  },
  {
    any: [/descanso diari/i],
    text:
      "El descanso diario normal es de 11 horas consecutivas; se puede reducir a 9 horas (como máximo tres veces entre dos descansos semanales).",
  },
  {
    any: [/descanso semanal/i],
    text:
      "En dos semanas consecutivas: dos descansos semanales normales (45 h) o uno normal y uno reducido de al menos 24 h, compensando la reducción.",
  },
  {
    any: [/conducci[oó]n diari/i],
    text:
      "La conducción diaria máxima es 9 horas, ampliables a 10 horas como máximo dos veces por semana.",
  },
  {
    any: [/tac[oó]grafo/i],
    answer: [/no, nunca/i, /no sustituye/i],
    text:
      "La tarjeta de tacógrafo identifica al conductor ante el aparato. Nunca sustituye al permiso de conducir.",
  },
  {
    all: [/energ[ií]a cin[eé]tica/i],
    text:
      "La energía cinética es ½·m·v²: depende de la masa y, al cuadrado, de la velocidad. A más velocidad o más masa, más energía que hay que disipar al frenar.",
  },
  {
    any: [/centro de gravedad/i],
    text:
      "Cuanto más alto está el centro de gravedad, menos estable es el camión y más fácil es el vuelco. Subir la carga o cargarla mal lo empeora.",
  },
  {
    all: [/fading/i],
    text:
      "El fading es la pérdida de frenada por sobrecalentamiento de discos/tambores. No hace que el vehículo frene solo ni aumenta la capacidad de frenado.",
  },
  {
    any: [/ralentizador/i, /freno el[eé]ctrico/i],
    text:
      "El ralentizador (eléctrico, hidráulico, de motor…) retiene el vehículo actuando sobre la transmisión o el motor y ahorra el freno de servicio, sobre todo en bajadas largas.",
  },
  {
    any: [/sobrevir/i],
    text:
      "Si la trayectoria es más cerrada que la que marca el volante, el camión sobrevira: se va de tren trasero. Si es más abierta, subvira (se va de morro).",
  },
  {
    any: [/subvir/i],
    text:
      "Subvirar es que la trayectoria sea más abierta de lo deseado: el eje delantero pierde adherencia y el camión «no entra» en la curva.",
  },
  {
    all: [/balanceo/i],
    text:
      "El balanceo es el giro de la carrocería sobre el eje longitudinal (se inclina a los lados). El cabeceo es sobre el eje transversal (morro arriba/abajo).",
  },
  {
    any: [/cuentarrevoluciones/i, /zona.*verd/i],
    answer: [/menor consumo/i, /eficiencia/i],
    text:
      "La zona verde del cuentarrevoluciones es el régimen de menor consumo específico. Conviene circular ahí con la marcha más larga posible.",
  },
  {
    any: [/consumo de carburante/i, /ahorrar carburante/i, /ahorro de combustible/i],
    text:
      "El consumo sube con las rpm altas, los acelerones, la baja presión de neumáticos, el mal mantenimiento, la mala aerodinámica y la velocidad media alta. Anticipar, marchas largas y zona verde ahorran carburante.",
  },
  {
    any: [/alcoholemia/i],
    text:
      "Alcoholemia es la cantidad de alcohol en sangre (g/l) o en aire espirado. No es la graduación de la bebida ni lo que hayas bebido en una hora.",
  },
  {
    any: [/reposacabezas/i],
    text:
      "El reposacabezas reduce el latigazo cervical en un alcance. Hay que regularlo a la altura de la cabeza; no es un adorno ni solo confort.",
  },
  {
    any: [/enfermedad profesional/i],
    text:
      "Enfermedad profesional es la causada por las condiciones del trabajo y reconocida como tal. No es cualquier dolor ni un accidente puntual.",
  },
  {
    any: [/in itinere/i],
    text:
      "Accidente in itinere es el de ida o vuelta entre casa y el trabajo, en el trayecto habitual.",
  },
  {
    any: [/\bATP\b/i, /isoterm/i],
    text:
      "El ATP clasifica vehículos de temperatura controlada. Isotermo = paredes aislantes; refrigerante = fuente de frío no mecánica; frigorífico = grupo de frío. IN = isotermo normal.",
  },
  {
    any: [/\bADR\b/i, /mercanc[ií]as peligrosas/i],
    text:
      "El ADR fija cómo se transportan las mercancías peligrosas (documentos, bultos, vehículo, formación). Un vertido en la carga lo limpia, en principio, el cargador.",
  },
  {
    any: [/cabotaje/i],
    text:
      "Cabotaje es un transporte interior en un país distinto del de establecimiento del transportista (por ejemplo un español que carga y descarga dentro de Francia), con los límites de la normativa UE.",
  },
  {
    any: [/ferroutage/i, /ferroutaje/i, /camiones sobre un tren/i],
    text:
      "Ferroutage (ferroutaje) es cargar el camión o el semirremolque sobre un tren: transporte combinado carretera-ferrocarril.",
  },
  {
    any: [/rompeolas/i, /cisterna/i],
    answer: [/estabilidad/i, /movimiento de la carga/i],
    text:
      "Los rompeolas de una cisterna cortan el oleaje interno del líquido para que no desestabilice el vehículo al frenar o en curva.",
  },
  {
    any: [/veh[ií]culo bater[ií]a/i, /peque[nñ]as cisternas/i],
    text:
      "Un vehículo batería es un conjunto de botellas o cisternas pequeñas unidas por un colector, no un portacontenedores ni una tolva.",
  },
  {
    any: [/portacontenedores/i],
    text:
      "Los contenedores (cajas reutilizables con enganches) van sobre un portacontenedores. El contenedor es la caja; el vehículo es el portacontenedores.",
  },
  {
    any: [/deriva del neum[aá]tico/i],
    text:
      "La deriva es el desvío de trayectoria porque el flanco del neumático se deforma. Depende de la carga, la velocidad, la presión y la geometría, no de «fuerzas termotécnicas».",
  },
  {
    any: [/caja de (velocidades|cambios)/i],
    text:
      "La caja de cambios varía la relación de transmisión entre motor y ruedas para adaptar par y velocidad a la pendiente y a la carga. No es el embrague (conectar/desconectar).",
  },
  {
    any: [/par motor/i],
    text:
      "El par máximo suele darse a un régimen medio de rpm. La potencia máxima, a un régimen más alto. No coinciden en el mismo punto de la curva.",
  },
  {
    any: [/incorrecta distribuci[oó]n de la carga/i, /estiba/i],
    text:
      "Cargar mal desplaza el centro de gravedad y las masas por eje: peor frenada, más vuelco y más riesgo de accidente. Lo pesado abajo y bien repartido; lo ligero arriba.",
  },
  {
    any: [/pendiente ascendente/i, /cambio de marcha/i],
    answer: [/pierde potencia/i, /reducci[oó]n de velocidad/i],
    text:
      "Al embragar para cambiar en una rampa se corta el par a las ruedas un instante: el camión pierde empuje y reduce velocidad. Por eso se cambian lo justo.",
  },
  {
    any: [/resistencia a la rodadura/i, /resistencias intervienen/i],
    text:
      "Al avance se oponen, sobre todo, la rodadura (neumático-calzada), el aire y la pendiente. La rodadura crece con masa, baja presión y firme blando.",
  },
  {
    any: [/luxaci[oó]n/i],
    text:
      "Luxación es que el hueso sale de la articulación. En carretera no se «mete» el hueso: se inmoviliza y se espera a sanitarios.",
  },
  {
    any: [/auxilio/i, /heridos/i, /\bPAS\b/],
    text:
      "En un accidente rige el PAS: proteger, avisar, socorrer. Lo crítico son los primeros minutos, no «a partir del segundo día». No se saca al herido del vehículo salvo peligro inminente (fuego, nuevo choque).",
  },
  {
    any: [/declaraci[oó]n amistosa/i],
    text:
      "La declaración amistosa (parte europeo) sirve para tramitar el siniestro entre aseguradoras. Debe ir firmada por ambos conductores. No reduce el número de accidentes: solo agiliza el parte.",
  },
  {
    any: [/seguro obligatorio/i, /responsabilidad civil/i],
    text:
      "El seguro obligatorio cubre daños a terceros, no los del propio vehículo ni los bienes del causante. Eso va, si acaso, en el seguro voluntario.",
  },
  {
    any: [/\bCAP\b/i, /cualificaci[oó]n inicial/i],
    answer: [/no es necesario/i, /fuerzas armadas/i, /5 por/i],
    text:
      "El CAP es la cualificación profesional del conductor. No hace falta tener ya el permiso para hacer la inicial. Hay exclusiones (FF.AA., bomberos, etc.) y se excluye del curso quien falte a un 5 % o más de las horas.",
  },
  {
    any: [/extintor/i, /fuego de clase/i, /incendio/i],
    text:
      "Hay que usar el agente adecuado al tipo de fuego (A sólidos, B líquidos, C gases, D metales). El agua no se usa en fuegos de metales. La luz de emergencia no previene un incendio: solo señaliza.",
  },
  {
    any: [/jefe de tr[aá]fico/i],
    text:
      "El jefe de tráfico organiza rutas, turnos y vehículos y vigila que se cumpla la normativa de transporte. No es el comercial ni quien hace las nóminas.",
  },
  {
    any: [/funciones propias de un comercial/i],
    text:
      "El comercial capta clientes y lleva las estadísticas comerciales. El tráfico planifica viajes; administración hace nóminas y facturas.",
  },
];

export function knowledgeTip(question: string, correct: string): string | null {
  const blob = blobOf(question, correct);
  for (const tip of TIPS) {
    if (!matches(blob, tip.all, tip.any)) continue;
    if (tip.answer && !tip.answer.some((r) => r.test(correct))) continue;
    return tip.text;
  }
  return null;
}

function isFalseQuestion(question: string): boolean {
  return /incorrecta|no es correcta|falsa|no es acorde|equivocada|inadecuada/i.test(
    question
  );
}

export function discardedOptionsText(q: Question): string {
  const wrongs = q.options
    .filter((o) => o.id.toLowerCase() !== (q.correct || "").toLowerCase())
    .map((o) => o.text.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!wrongs.length) return "";
  const lines = wrongs.map((w) => `• ${w}`).join("\n");
  return `Las otras opciones se descartan porque no responden a lo que pide el enunciado:\n${lines}`;
}

function becauseLead(question: string, correct: string): string {
  const q = question;
  const c = correct.trim().replace(/\.$/, "");

  if (/todas las respuestas/i.test(correct)) {
    return `Es correcta porque, en este caso, las afirmaciones anteriores del test son ciertas a la vez. El temario no te pide elegir solo una de ellas.`;
  }
  if (/ninguna de las respuestas/i.test(correct)) {
    return `Es correcta porque ninguna de las otras afirmaciones encaja con el enunciado: hay que marcar que no vale ninguna.`;
  }
  if (isFalseQuestion(q)) {
    return `El enunciado pide la opción que NO es cierta. La correcta es «${c}» precisamente porque esa afirmación es la que falla o no se sostiene.`;
  }
  if (/^c[oó]mo se denomin|^c[oó]mo se llama|^qu[eé] nombre/i.test(q)) {
    return `Se llama así: «${c}». Es el término del temario para lo que describe la pregunta; las demás son nombres parecidos o de otra figura.`;
  }
  if (/^qu[eé] establece|^qu[eé] regula|^qu[eé] es /i.test(q)) {
    return `Porque esa es la definición que usa el temario: «${c}».`;
  }
  return `Es correcta «${c}» porque es la que encaja con lo que pregunta el test, no una excepción ni un caso particular.`;
}

/** Explicación para el alumno cuando no hay ficha del catálogo. */
export function composeStudentExplanation(q: Question): string {
  const correct = correctOptionText(q);
  const tip = knowledgeTip(q.question, correct);
  const lead = becauseLead(q.question, correct);
  const discarded = discardedOptionsText(q);
  const parts = [tip || lead];
  if (tip) {
    parts.push(`En el test eso corresponde a: «${correct.trim()}».`);
  }
  if (discarded) parts.push(discarded);
  return parts.join("\n\n");
}
