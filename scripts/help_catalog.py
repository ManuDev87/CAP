"""High-precision CAP help rules.

A rule only attaches if EVERY `q_all` regex matches the question (and options
are NOT used for q_all — that would over-match). `a_all`/`a_any` constrain the
official correct option so shuffled or variant exams do not get the wrong
article.

Never invent article numbers: every `source` / `source_url` is an official
BOE, EUR-Lex, DGT or MITMA/MITMA-successor text, or a named official manual.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Official consolidated texts (Spanish)
URL_LOTT = "https://www.boe.es/buscar/act.php?id=BOE-A-1987-8807"
URL_ROTT = "https://www.boe.es/buscar/act.php?id=BOE-A-1990-20151"
URL_CAP = "https://www.boe.es/buscar/act.php?id=BOE-A-2021-6712"
URL_LSV = "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11722"
URL_RGC = "https://www.boe.es/buscar/act.php?id=BOE-A-2003-23514"
URL_SEGURO = "https://www.boe.es/buscar/act.php?id=BOE-A-2004-18911"
URL_PRL = "https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292"
URL_LSC = "https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544"
URL_PERMISO = "https://www.boe.es/buscar/act.php?id=BOE-A-2009-9481"
URL_TACOGRAFO_EX = "https://www.boe.es/buscar/act.php?id=BOE-A-2007-10456"
URL_MP = "https://www.boe.es/buscar/act.php?id=BOE-A-2014-1628"
URL_561 = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:02006R0561-20200820"
URL_165 = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014R0165"
URL_ANIMALES = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32005R0001"
URL_CAU = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32013R0952"
URL_CMR = "https://www.boe.es/buscar/act.php?id=BOE-A-1974-824"
URL_MITMA_CAP = (
    "https://www.transportes.gob.es/transporte-terrestre/formacion/"
    "certificado-de-aptitud-profesional-cap"
)
URL_IDAE = "https://www.idae.es/ahorro-y-eficiencia-energetica/movilidad-y-transporte"
URL_DGT = "https://www.dgt.es/muevete-con-seguridad/evita-conductas-de-riesgo/"


@dataclass(frozen=True)
class Rule:
    id: str
    explanation: str
    source: str
    source_url: str
    q_all: list[str] = field(default_factory=list)
    q_any: list[str] = field(default_factory=list)
    a_all: list[str] = field(default_factory=list)
    a_any: list[str] = field(default_factory=list)
    exclude_q: list[str] = field(default_factory=list)
    priority: int = 0


RULES: list[Rule] = [
    # ----- Reglamento (CE) 561/2006: tiempos de conducción y descanso -----
    Rule(
        id="r561_pausa_45",
        q_all=[r"pausa", r"45 minut"],
        a_any=[r"15", r"30"],
        explanation=(
            "Tras 4 horas y media de conducción el conductor debe hacer una pausa "
            "ininterrumpida de al menos 45 minutos, salvo que tome un descanso. "
            "Esa pausa puede sustituirse por una de al menos 15 minutos seguida de "
            "otra de al menos 30 minutos, intercaladas en el periodo de conducción."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 7 (texto consolidado)",
        source_url=URL_561,
        priority=20,
    ),
    Rule(
        id="r561_descanso_diario",
        q_all=[r"descanso diari"],
        a_any=[r"11 hora", r"9 hora"],
        explanation=(
            "El descanso diario normal es de al menos 11 horas consecutivas. "
            "Puede reducirse a un mínimo de 9 horas (descanso diario reducido) "
            "como máximo tres veces entre dos descansos semanales."
        ),
        source="Reglamento (CE) n.º 561/2006, artículos 4 y 8",
        source_url=URL_561,
        priority=18,
    ),
    Rule(
        id="r561_descanso_semanal",
        q_all=[r"descanso semanal"],
        a_any=[r"45 hora", r"24 hora", r"dos per[ií]odos", r"respuestas a y b"],
        explanation=(
            "En dos semanas consecutivas el conductor debe tomar al menos dos "
            "periodos de descanso semanal normal (45 h) o uno normal y uno reducido "
            "de al menos 24 horas. El descanso reducido se compensa."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 8.6",
        source_url=URL_561,
        priority=18,
    ),
    Rule(
        id="r561_definicion_descanso",
        q_all=[r"descanso es el per[ií]odo", r"conductor"],
        a_all=[r"libremente"],
        explanation=(
            "A efectos de la reglamentación social europea, descanso es cualquier "
            "periodo ininterrumpido durante el cual el conductor puede disponer "
            "libremente de su tiempo."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 4, letra f)",
        source_url=URL_561,
        priority=16,
    ),
    Rule(
        id="r561_conduccion_diaria",
        q_all=[r"conducci[oó]n diari"],
        a_any=[r"9 hora", r"10 hora"],
        explanation=(
            "El tiempo de conducción diario no debe superar las 9 horas, aunque "
            "puede extenderse a 10 horas no más de dos veces por semana."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 6.1",
        source_url=URL_561,
        priority=18,
    ),
    Rule(
        id="r561_conduccion_semanal",
        q_all=[r"conducci[oó]n semanal"],
        exclude_q=[r"bisemanal", r"dos semanas", r"quince"],
        a_any=[r"56 hora"],
        explanation=(
            "El tiempo de conducción semanal no debe superar las 56 horas ni el "
            "tiempo de trabajo máximo semanal establecido en la Directiva 2002/15/CE."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 6.2",
        source_url=URL_561,
        priority=18,
    ),
    Rule(
        id="r561_conduccion_bisemanal",
        q_any=[r"dos semanas consecutivas", r"conducci[oó]n bisemanal", r"90 horas"],
        a_any=[r"90 hora"],
        explanation=(
            "El tiempo de conducción acumulado durante dos semanas consecutivas "
            "no debe superar las 90 horas."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 6.3",
        source_url=URL_561,
        priority=18,
    ),
    Rule(
        id="r561_sancion_pruebas",
        q_all=[r"sanci[oó]n", r"tiempos de conducci[oó]n"],
        a_any=[r"justificaci[oó]n escrita", r"pruebas de la infracci[oó]n"],
        explanation=(
            "Cuando se aplique una sanción por tiempos de conducción, debe "
            "entregarse al conductor una justificación escrita de las pruebas "
            "de la infracción."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 19.3",
        source_url=URL_561,
        priority=14,
    ),
    # ----- Tacógrafo: Reglamento (UE) 165/2014 -----
    Rule(
        id="r165_disco_capacidad",
        q_all=[r"capacidad m[ií]nima de registro", r"disco"],
        a_all=[r"24 hora"],
        explanation=(
            "La hoja de registro (disco-diagrama) del tacógrafo analógico debe "
            "tener una capacidad mínima de registro de 24 horas."
        ),
        source="Reglamento (UE) n.º 165/2014, anexo I",
        source_url=URL_165,
        priority=16,
    ),
    Rule(
        id="r165_impresion",
        q_all=[r"impresi[oó]n de datos", r"tac[oó]grafo"],
        a_any=[r"tanto", r"tac[oó]grafo como de la tarjeta"],
        explanation=(
            "El tacógrafo digital permite imprimir tanto los datos almacenados en "
            "el aparato como los de la tarjeta del conductor."
        ),
        source="Reglamento (UE) n.º 165/2014",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="r165_tarjeta_no_sustituye_permiso",
        q_all=[r"tarjeta", r"tac[oó]grafo", r"permiso"],
        a_any=[r"no, nunca", r"no sustituye"],
        explanation=(
            "La tarjeta de tacógrafo del conductor identifica al conductor ante el "
            "aparato de control. No sustituye en ningún caso al permiso de conducir."
        ),
        source="Reglamento (UE) n.º 165/2014, artículo 26",
        source_url=URL_165,
        priority=16,
    ),
    Rule(
        id="r165_acceso_autoridades",
        q_all=[r"acceso a los datos", r"tac[oó]grafo"],
        a_any=[r"autoridades de control"],
        explanation=(
            "Las autoridades de control competentes pueden acceder en cualquier "
            "momento a los datos almacenados en el tacógrafo."
        ),
        source="Reglamento (UE) n.º 165/2014, artículo 4",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="r165_datos_automaticos",
        q_all=[r"registra autom[aá]ticamente el tac[oó]grafo"],
        explanation=(
            "El tacógrafo registra de forma automática datos sobre la marcha del "
            "vehículo (velocidad, distancia, etc.) y determinados tiempos de "
            "actividad del conductor."
        ),
        source="Reglamento (UE) n.º 165/2014, artículos 4 y 32 y anexo I",
        source_url=URL_165,
        priority=12,
    ),
    Rule(
        id="r165_disco_nombre",
        q_all=[r"disco-diagrama|hoja de registro", r"nombre y apellidos"],
        explanation=(
            "Antes de insertar una nueva hoja de registro, el conductor debe hacer "
            "constar, entre otros datos, su nombre y apellidos."
        ),
        source="Reglamento (UE) n.º 165/2014, anexo I",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="r165_disco_homologacion",
        q_all=[r"hoja de registro|disco-diagrama", r"impresas"],
        a_any=[r"homologaci[oó]n"],
        explanation=(
            "Cada hoja de registro debe llevar impresos, entre otros, la marca de "
            "homologación de los modelos de aparato en los que puede utilizarse."
        ),
        source="Reglamento (UE) n.º 165/2014, anexo I",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="r165_indicadores_analogico",
        q_all=[r"tac[oó]grafo anal[oó]gico", r"indicadores"],
        a_any=[r"velocidad", r"totalizador", r"reloj"],
        explanation=(
            "En el frontal de un tacógrafo analógico son visibles el indicador de "
            "velocidad, el totalizador de kilómetros y el tiempo (reloj)."
        ),
        source="Reglamento (UE) n.º 165/2014, anexo I",
        source_url=URL_165,
        priority=12,
    ),
    Rule(
        id="r165_velocidad_zona_anverso",
        q_all=[r"d[oó]nde se registra la velocidad", r"disco"],
        a_any=[r"exterior del anverso", r"m[aá]s exterior"],
        explanation=(
            "En el disco-diagrama, la velocidad se registra en la zona más exterior "
            "del anverso."
        ),
        source="Reglamento (UE) n.º 165/2014, anexo I",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="exencion_tacografo_correos",
        q_all=[r"correos", r"tac[oó]grafo"],
        a_any=[r"100 km"],
        explanation=(
            "Determinados vehículos de Correos de MMA no superior a 7.500 kg "
            "utilizados por personal de reparto están exentos de tacógrafo cuando "
            "no superan un radio de 100 km desde la base de la empresa."
        ),
        source="Real Decreto 640/2007, artículo 2 (exenciones nacionales al 561/2006)",
        source_url=URL_TACOGRAFO_EX,
        priority=14,
    ),
    Rule(
        id="exencion_tacografo_material",
        q_all=[r"exento", r"tac[oó]grafo", r"privado complementario"],
        a_any=[r"todas las condiciones", r"7,?5", r"100 km"],
        explanation=(
            "El transporte privado complementario de material puede estar exento de "
            "tacógrafo si se cumplen a la vez: MMA no superior a 7,5 t, radio de "
            "100 km y que la conducción no sea la actividad principal del conductor."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 3, y RD 640/2007",
        source_url=URL_561,
        priority=14,
    ),
    # ----- CAP: RD 284/2021 -----
    Rule(
        id="cap_no_permiso_inicial",
        q_all=[r"permiso de conducci[oó]n", r"cualificaci[oó]n inicial"],
        a_any=[r"no es necesario", r"no, no es"],
        explanation=(
            "Para seguir los cursos de cualificación inicial (ordinaria o acelerada) "
            "no es necesario estar ya en posesión del permiso de conducción "
            "correspondiente."
        ),
        source="Real Decreto 284/2021, artículo 6",
        source_url=URL_CAP,
        priority=16,
    ),
    Rule(
        id="cap_privado_particular",
        q_all=[r"transporte privado particular", r"\bCAP\b"],
        a_any=[r"^no\.?$", r"no es necesario", r"^no$"],
        explanation=(
            "El CAP no es exigible a quien conduzca vehículos destinados al "
            "transporte privado particular de mercancías (uso personal, no "
            "profesional)."
        ),
        source="Real Decreto 284/2021, artículo 2 (ámbito de aplicación y exclusiones)",
        source_url=URL_CAP,
        priority=16,
    ),
    Rule(
        id="cap_exenciones_ffaa",
        q_all=[r"no es necesario el certificado de aptitud profesional", r"CAP"],
        a_any=[r"fuerzas armadas", r"protecci[oó]n civil", r"bomberos"],
        explanation=(
            "Quedan excluidos del CAP, entre otros, los conductores de vehículos de "
            "las Fuerzas Armadas, protección civil, bomberos y fuerzas y cuerpos "
            "de seguridad cuando el transporte se realice como consecuencia de "
            "las funciones asignadas a dichos servicios."
        ),
        source="Real Decreto 284/2021, artículo 2",
        source_url=URL_CAP,
        priority=16,
    ),
    Rule(
        id="cap_asistencia_5",
        q_all=[r"alumno", r"curso CAP|curso de", r"excluido"],
        a_any=[r"5 por", r"5 %"],
        explanation=(
            "Un alumno de un curso CAP será excluido cuando deje de asistir a un "
            "5 % o más de las horas del curso."
        ),
        source="Real Decreto 284/2021, anexo IV",
        source_url=URL_CAP,
        priority=16,
    ),
    # ----- LOTT / ROTT: autorizaciones -----
    Rule(
        id="visado",
        q_all=[r"comprobaci[oó]n peri[oó]dica", r"autorizaci[oó]n de transporte"],
        a_all=[r"visado"],
        explanation=(
            "El visado es la comprobación periódica que realiza la Administración "
            "de que el titular de la autorización de transporte sigue cumpliendo "
            "los requisitos exigidos."
        ),
        source="Ley 16/1987 (LOTT) y Reglamento de la LOTT (RD 1211/1990), visado de autorizaciones",
        source_url=URL_ROTT,
        priority=16,
    ),
    Rule(
        id="mdpe",
        q_all=[r"autorizaciones de transporte p[uú]blico de mercanc[ií]as", r"3,?5"],
        a_all=[r"MDPE"],
        explanation=(
            "Las autorizaciones de transporte público de mercancías con vehículos "
            "de MMA superior a 3,5 toneladas se identifican con la clave MDPE."
        ),
        source="Reglamento de la LOTT (RD 1211/1990) y práctica registral de autorizaciones",
        source_url=URL_ROTT,
        priority=16,
    ),
    Rule(
        id="mpce",
        q_all=[r"privado complementario de mercanc[ií]as", r"clave"],
        a_all=[r"MPCE"],
        explanation=(
            "Las autorizaciones de transporte privado complementario de mercancías "
            "se identifican registralmente con la clave MPCE."
        ),
        source="Reglamento de la LOTT (RD 1211/1990)",
        source_url=URL_ROTT,
        priority=16,
    ),
    Rule(
        id="clasificacion_objeto",
        q_all=[r"viajeros y mercanc[ií]as", r"clasificaci[oó]n"],
        a_all=[r"objeto"],
        explanation=(
            "La distinción entre transporte de viajeros y de mercancías es una "
            "clasificación en función del objeto del transporte."
        ),
        source="Ley 16/1987, de Ordenación de los Transportes Terrestres, artículo 63",
        source_url=URL_LOTT,
        priority=14,
    ),
    Rule(
        id="responsabilidad_administrativa_empresa",
        q_all=[r"responsabilidad administrativa", r"infracciones", r"transportes"],
        a_any=[r"^la empresa", r"la empresa\."],
        explanation=(
            "La responsabilidad administrativa por infracciones a la normativa de "
            "transportes recae, como regla general, sobre la empresa titular de "
            "la autorización, no sobre el conductor."
        ),
        source="Ley 16/1987 (LOTT), artículo 138.1",
        source_url=URL_LOTT,
        priority=16,
    ),
    Rule(
        id="inspeccion_carga",
        q_all=[r"inspecci[oó]n de transporte", r"conductor"],
        a_any=[r"permitir la inspecci[oó]n de la carga"],
        explanation=(
            "En una inspección en carretera el conductor debe permitir la "
            "inspección de la mercancía y, en su caso, el control de pasajeros, "
            "y facilitar la documentación exigida."
        ),
        source="Ley 16/1987 (LOTT), artículo 33",
        source_url=URL_LOTT,
        priority=14,
    ),
    Rule(
        id="transitarios",
        q_any=[r"transitari"],
        a_any=[r"internacionales", r"tr[aá]mites aduaneros"],
        exclude_q=[r"cu[aá]l de estas afirmaciones es falsa"],
        explanation=(
            "Los transitarios son empresas especializadas en organizar, por cuenta "
            "ajena, transportes internacionales y en realizar los trámites aduaneros "
            "y la coordinación intermodal. Contratan en nombre propio con cargador "
            "y transportista."
        ),
        source="Ley 16/1987 (LOTT), artículos 121 y siguientes (actividades auxiliares)",
        source_url=URL_LOTT,
        priority=12,
    ),
    Rule(
        id="exento_menos_3_ruedas",
        q_all=[r"menos de tres ruedas"],
        a_all=[r"exentos de autorizaci[oó]n"],
        explanation=(
            "Los transportes de mercancías realizados en vehículos de menos de "
            "tres ruedas están exentos de autorización de transporte."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), artículo 33 y concordantes",
        source_url=URL_ROTT,
        priority=14,
    ),
    Rule(
        id="exento_funerario",
        q_all=[r"funerari"],
        a_all=[r"exento"],
        explanation=(
            "El transporte funerario realizado por prestadores de servicios "
            "funerarios está exento de autorización de transporte de mercancías."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), exenciones del artículo 33 y ss.",
        source_url=URL_ROTT,
        priority=14,
    ),
    Rule(
        id="exento_mma_15",
        q_all=[r"1,?5 toneladas", r"autorizaci[oó]n"],
        a_any=[r"^no\.?$"],
        explanation=(
            "El transporte público de mercancías con vehículos de MMA de 1,5 "
            "toneladas no requiere autorización de transporte (el umbral general "
            "de autorización está en más de 2 t de MMA, con el régimen específico "
            "de 3,5 t para MDPE)."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), artículo 33",
        source_url=URL_ROTT,
        priority=12,
    ),
    Rule(
        id="recintos_cerrados_exentos",
        q_all=[r"recintos cerrados"],
        a_all=[r"exentos de autorizaci[oó]n"],
        explanation=(
            "Los transportes de mercancías que se realicen en recintos cerrados "
            "dedicados a actividades distintas del transporte terrestre están "
            "exentos de autorización."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), artículo 33",
        source_url=URL_ROTT,
        priority=14,
    ),
    Rule(
        id="centros_transporte_lott",
        q_all=[r"centros de transporte y log[ií]stica"],
        a_any=[r"ley de ordenaci[oó]n", r"LOTT", r"contemplados"],
        explanation=(
            "Los centros de transporte y logística de mercancías están contemplados "
            "en la Ley de Ordenación de los Transportes Terrestres como "
            "infraestructuras al servicio del transporte."
        ),
        source="Ley 16/1987 (LOTT), título relativo a actividades auxiliares e infraestructuras",
        source_url=URL_LOTT,
        priority=12,
    ),
    Rule(
        id="cuenta_propia_privado_comp",
        q_all=[r"cuenta propia", r"actividad principal"],
        a_all=[r"privado complementario"],
        explanation=(
            "El transporte de mercancías por cuenta propia que realiza una empresa "
            "cuya actividad principal no es el transporte se denomina transporte "
            "privado complementario."
        ),
        source="Ley 16/1987 (LOTT), artículos 62 y 102 y ss.",
        source_url=URL_LOTT,
        priority=14,
    ),
    # ----- CMR -----
    Rule(
        id="cmr_que_establece",
        q_all=[r"qu[eé] establece el convenio CMR"],
        a_any=[r"contrato de transporte internacional de mercanc[ií]as"],
        explanation=(
            "El Convenio CMR establece las condiciones que rigen el contrato de "
            "transporte internacional de mercancías por carretera (no el de viajeros)."
        ),
        source="Convenio CMR de 19 de mayo de 1956 (BOE)",
        source_url=URL_CMR,
        priority=18,
    ),
    Rule(
        id="cmr_carta_porte",
        q_all=[r"CMR", r"carta de porte"],
        explanation=(
            "En un transporte sujeto al CMR, la carta de porte acredita el contrato "
            "y debe contener las indicaciones previstas en el convenio (partes, "
            "mercancía, lugares de carga y descarga, etc.)."
        ),
        source="Convenio CMR, artículos 4 a 6",
        source_url=URL_CMR,
        priority=12,
    ),
    Rule(
        id="cmr_responsabilidad_marcas",
        q_all=[r"CMR", r"libre de responsabilidad"],
        a_any=[r"inexactitud de las marcas"],
        explanation=(
            "El transportista puede quedar exento de responsabilidad si prueba que "
            "el daño deriva de la inexactitud o insuficiencia de las marcas o "
            "números de los bultos, entre otras causas del artículo 17."
        ),
        source="Convenio CMR, artículos 17 y 18",
        source_url=URL_CMR,
        priority=14,
    ),
    # ----- ATP -----
    Rule(
        id="atp_in",
        q_all=[r"acuerdo ATP", r"\bIN\b"],
        a_all=[r"isotermo normal"],
        explanation=(
            "Según el ATP, las letras IN identifican un vehículo isotermo normal "
            "(paredes aislantes que limitan el intercambio de calor)."
        ),
        source="Acuerdo ATP, anejo 1, apéndice 4 (marcas de identificación)",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-1976-24916",
        priority=16,
    ),
    Rule(
        id="atp_isoterma",
        q_all=[r"paredes aislantes", r"intercambios de calor"],
        a_all=[r"isoterm"],
        explanation=(
            "Una cisterna o caja con paredes aislantes que limitan los intercambios "
            "de calor con el exterior es un vehículo isotermo."
        ),
        source="Acuerdo ATP, anejo 1 (definiciones de isotermo, refrigerante y frigorífico)",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-1976-24916",
        priority=14,
    ),
    Rule(
        id="atp_frigorifico_letras",
        q_all=[r"acuerdo ATP", r"FRF|FNA|FRC"],
        explanation=(
            "El ATP identifica las clases de vehículos frigoríficos e isotermos "
            "mediante siglas (F = frigorífico, I = isotermo, R = refrigerante; "
            "N/R = normal/reforzado; la tercera letra indica la clase de temperatura)."
        ),
        source="Acuerdo ATP, anejo 1, apéndice 4",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-1976-24916",
        priority=12,
    ),
    # ----- ADR / mercancías peligrosas -----
    Rule(
        id="adr_documentos_foto",
        q_all=[r"mercanc[ií]as peligrosas", r"fotograf[ií]a"],
        a_any=[r"s[ií], debe llevarse a bordo"],
        explanation=(
            "Durante el transporte de mercancías peligrosas debe llevarse a bordo "
            "un documento de identificación con fotografía de cada miembro de la "
            "tripulación."
        ),
        source="ADR, 1.10.1.4 (disposiciones de seguridad)",
        source_url="https://www.mitma.gob.es/transporte-terrestre/mercancías-peligrosas",
        priority=14,
    ),
    Rule(
        id="adr_vertido_cargador",
        q_all=[r"vertido", r"mercanc[ií]a peligrosa"],
        a_all=[r"cargador"],
        explanation=(
            "Si se produce un vertido durante la carga de mercancía peligrosa, "
            "corresponde al cargador la limpieza, salvo pacto o norma específica "
            "en contrario."
        ),
        source="Real Decreto 97/2014, artículo 40 (operaciones de carga)",
        source_url=URL_MP,
        priority=14,
    ),
    # ----- Animales vivos -----
    Rule(
        id="animales_docs",
        q_all=[r"animales", r"documentaci[oó]n"],
        a_any=[r"origen y el propietario"],
        explanation=(
            "A bordo de un vehículo que transporta animales debe constar la "
            "documentación que acredite, entre otros datos, el origen y el "
            "propietario de los animales."
        ),
        source="Reglamento (CE) n.º 1/2005, artículo 4",
        source_url=URL_ANIMALES,
        priority=16,
    ),
    Rule(
        id="animales_autorizacion_sanidad",
        q_all=[r"transporte de animales vivos"],
        a_any=[r"autorizaci[oó]n espec[ií]fica de sanidad"],
        explanation=(
            "El transporte de animales vivos requiere, además de la autorización "
            "genérica de transporte cuando proceda, la autorización específica "
            "de sanidad animal."
        ),
        source="Reglamento (CE) n.º 1/2005 y normativa española de sanidad animal (RD 990/2022 y concordantes)",
        source_url=URL_ANIMALES,
        priority=14,
    ),
    # ----- Aduanas -----
    Rule(
        id="ata_importacion_temporal",
        q_all=[r"r[eé]gimen ATA"],
        a_any=[r"importaci[oó]n temporal"],
        explanation=(
            "El régimen ATA (cuaderno ATA) se utiliza para la importación temporal "
            "de mercancías (exposiciones, ferias, material profesional) entre los "
            "países firmantes del Convenio ATA."
        ),
        source="Convenio ATA relativo a la importación temporal",
        source_url="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=LEGISSUM:l11017",
        priority=14,
    ),
    Rule(
        id="cau_garantia_global",
        q_all=[r"garant[ií]a", r"car[aá]cter global"],
        a_any=[r"varias operaciones"],
        explanation=(
            "En el tránsito de la Unión, una garantía de carácter global puede "
            "cubrir varias operaciones de transporte (no un único envío)."
        ),
        source="Reglamento (UE) n.º 952/2013 (código aduanero de la Unión), artículo 89",
        source_url=URL_CAU,
        priority=14,
    ),
    Rule(
        id="cau_destruccion",
        q_all=[r"autoridades aduaneras", r"destrucci[oó]n"],
        a_any=[r"titular de las mercanc[ií]as"],
        explanation=(
            "Las autoridades aduaneras pueden disponer la destrucción de las "
            "mercancías; los costes corren a cargo del titular."
        ),
        source="Reglamento (UE) n.º 952/2013, artículo 197",
        source_url=URL_CAU,
        priority=14,
    ),
    Rule(
        id="cau_notificacion_transito",
        q_all=[r"tr[aá]nsito de la uni[oó]n", r"notificaci"],
        a_any=[r"cruce de frontera"],
        explanation=(
            "Las aduanas de tránsito deben emitir una notificación de cruce de "
            "frontera para la aduana de partida."
        ),
        source="Reglamento de ejecución (UE) 2015/2447, artículo 304",
        source_url="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32015R2447",
        priority=12,
    ),
    # ----- Seguro / CIDE -----
    Rule(
        id="cide_firmada",
        q_all=[r"declaraci[oó]n amistosa"],
        a_any=[r"firmada por ambos"],
        explanation=(
            "La declaración amistosa de accidente (parte europeo) debe estar "
            "firmada por ambos conductores para desplegar sus efectos habituales "
            "entre aseguradoras."
        ),
        source="Convenio CIDE entre entidades aseguradoras y RDL 8/2004",
        source_url=URL_SEGURO,
        priority=12,
    ),
    Rule(
        id="cide_incorrecta_disminuye",
        q_all=[r"declaraci[oó]n amistosa"],
        a_any=[r"disminuya el n[uú]mero de siniestros"],
        explanation=(
            "Es incorrecto afirmar que la declaración amistosa hace disminuir el "
            "número de siniestros: es un documento para agilizar la tramitación "
            "del parte, no una medida de prevención de accidentes."
        ),
        source="Convenio CIDE y RDL 8/2004 (seguro obligatorio)",
        source_url=URL_SEGURO,
        priority=10,
    ),
    Rule(
        id="seguro_cobertura_propia",
        q_all=[r"cobertura obligatoria no alcanzar"],
        a_any=[r"todas las respuestas son correctas"],
        explanation=(
            "El seguro obligatorio de responsabilidad civil no cubre los daños "
            "materiales causados al propio vehículo ni a los bienes del "
            "propietario o del conductor del vehículo causante."
        ),
        source="Real Decreto Legislativo 8/2004, artículo 5.2",
        source_url=URL_SEGURO,
        priority=16,
    ),
    Rule(
        id="cide_todas_correctas",
        q_all=[r"declaraci[oó]n amistosa"],
        a_all=[r"todas las respuestas anteriores son correctas"],
        explanation=(
            "En la declaración amistosa hay que hacer constar fecha y hora, "
            "verificar los datos de los asegurados y, con conductor extranjero, "
            "solicitar la Carta Verde cuando proceda."
        ),
        source="Convenio CIDE, artículo 4, y RDL 8/2004",
        source_url=URL_SEGURO,
        priority=8,
    ),
    Rule(
        id="cide_no_valida_sin_seguro",
        q_all=[r"declaraci[oó]n amistosa"],
        a_any=[r"no se tenga suscrito el seguro obligatorio"],
        explanation=(
            "La declaración amistosa no es el instrumento adecuado si no existe "
            "seguro obligatorio: ese supuesto se tramita por otros cauces "
            "(consorcio, vía penal o civil)."
        ),
        source="Convenio CIDE, artículo 2, y RDL 8/2004",
        source_url=URL_SEGURO,
        priority=12,
    ),
    # ----- Documentación del vehículo -----
    Rule(
        id="tarjeta_itv_obligatoria",
        q_all=[r"tarjeta de inspecci[oó]n t[eé]cnica"],
        a_any=[r"s[ií], siempre"],
        explanation=(
            "Es obligatorio llevar en el vehículo la tarjeta de inspección técnica "
            "(permiso de circulación e ITV en vigor forman parte de la "
            "documentación a bordo)."
        ),
        source="Real Decreto Legislativo 6/2015, artículo 59 (documentación del vehículo)",
        source_url=URL_LSV,
        priority=14,
    ),
    # ----- Sociedades -----
    Rule(
        id="sa_irregular",
        q_all=[r"escritura de constituci[oó]n", r"sociedad an[oó]nima"],
        a_all=[r"irregular"],
        explanation=(
            "Si no se solicita la inscripción de la escritura de constitución de "
            "una sociedad anónima antes de que transcurra un año desde su "
            "otorgamiento, la sociedad deviene irregular."
        ),
        source="Real Decreto Legislativo 1/2010 (Ley de Sociedades de Capital), artículo 39",
        source_url=URL_LSC,
        priority=16,
    ),
    Rule(
        id="sl_capital",
        q_all=[r"sociedad de responsabilidad limitada", r"capital"],
        explanation=(
            "La sociedad de responsabilidad limitada tiene un capital social "
            "mínimo legal (tras la reforma, puede constituirse con 1 euro, con "
            "reglas especiales de reserva; el régimen clásico del temario CAP "
            "sigue preguntando el mínimo de 3.000 euros en convocatorias antiguas)."
        ),
        source="Real Decreto Legislativo 1/2010, artículos 4 y 23 (vigente) — comprobar la convocatoria del examen",
        source_url=URL_LSC,
        priority=8,
    ),
    Rule(
        id="junta_cuentas",
        q_all=[r"junta general", r"6 meses", r"cuentas"],
        a_any=[r"ordinaria"],
        explanation=(
            "La junta general de socios que se convoca en los primeros seis meses "
            "del ejercicio para aprobar las cuentas es la junta general ordinaria."
        ),
        source="Real Decreto Legislativo 1/2010, artículo 164",
        source_url=URL_LSC,
        priority=14,
    ),
    # ----- PRL / laboral -----
    Rule(
        id="prl_empresario_conductor",
        q_all=[r"prevenci[oó]n de riesgos"],
        a_any=[r"empresario y al conductor"],
        explanation=(
            "La normativa de prevención de riesgos laborales impone obligaciones "
            "tanto al empresario como a los trabajadores (el conductor)."
        ),
        source="Ley 31/1995, de prevención de riesgos laborales, artículos 2 y 29",
        source_url=URL_PRL,
        priority=14,
    ),
    Rule(
        id="enfermedad_profesional",
        q_all=[r"enfermedades producidas por las condiciones", r"trabajo"],
        a_all=[r"enfermedades profesionales"],
        explanation=(
            "Las enfermedades producidas por las condiciones en que se desarrolla "
            "el trabajo se denominan enfermedades profesionales."
        ),
        source="Real Decreto Legislativo 8/2015 (Ley General de la Seguridad Social) y Ley 31/1995",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724",
        priority=12,
    ),
    Rule(
        id="enfermedad_profesional_reconocida",
        q_all=[r"enfermedad profesional"],
        a_any=[r"expresamente reconocida"],
        explanation=(
            "Para que una dolencia se considere enfermedad profesional debe estar "
            "expresamente reconocida como tal por las autoridades sanitarias "
            "(cuadro oficial de enfermedades profesionales)."
        ),
        source="RD 1299/2006 (cuadro de enfermedades profesionales) y LGSS",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-2006-22169",
        priority=14,
    ),
    Rule(
        id="somnolencia_permiso",
        q_all=[r"somnolencia diurna"],
        a_any=[r"per[ií]odo de vigencia"],
        explanation=(
            "Una somnolencia diurna excesiva puede impedir obtener o prorrogar el "
            "permiso de conducción, o reducir su periodo de vigencia, según el "
            "anexo IV del Reglamento General de Conductores."
        ),
        source="Real Decreto 818/2009, anexo IV",
        source_url=URL_PERMISO,
        priority=14,
    ),
    # ----- Dinámica / mecánica (temario CAP, no un artículo concreto) -----
    Rule(
        id="resistencia_rodadura",
        q_all=[r"resistencias intervienen en el movimiento"],
        a_any=[r"rodadura"],
        explanation=(
            "En el movimiento del vehículo intervienen, entre otras, la resistencia "
            "a la rodadura (contacto neumático-calzada), la resistencia del aire y "
            "la resistencia a la pendiente. La opción correcta de esta pregunta es "
            "la resistencia a la rodadura."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (mecánica y dinámica del vehículo)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="rozamiento_clima",
        q_all=[r"grado de rozamiento"],
        a_any=[r"climatol"],
        explanation=(
            "El grado de rozamiento entre neumático y calzada depende de las "
            "condiciones de la superficie y de la climatología (agua, hielo, nieve), "
            "además del tipo de neumático y del estado del asfalto."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (adherencia y seguridad)",
        source_url=URL_CAP,
        priority=8,
    ),
    Rule(
        id="cg_altura_inestabilidad",
        q_all=[r"altura del centro de gravedad"],
        a_any=[r"inestabilidad", r"disminuye"],
        explanation=(
            "A mayor altura del centro de gravedad, menor estabilidad: aumenta el "
            "riesgo de vuelco porque el momento de vuelco es mayor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (estabilidad del vehículo)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="energia_cinetica",
        q_all=[r"energ[ií]a cin[eé]tica"],
        a_any=[r"velocidad y su masa", r"menor sea su masa"],
        explanation=(
            "La energía cinética de un vehículo en movimiento es ½·m·v²: depende "
            "de la masa y, de forma cuadrática, de la velocidad. A menor masa "
            "(o menor velocidad), menor energía cinética."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (fuerzas que actúan sobre el vehículo)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="cambio_pendiente_pierde_potencia",
        q_all=[r"cambio", r"pendiente ascendente"],
        a_any=[r"pierde potencia", r"reducci[oó]n de velocidad"],
        explanation=(
            "Cada vez que se pisa el embrague para cambiar de marcha en una subida "
            "se interrumpe la transmisión de par a las ruedas: el vehículo pierde "
            "potencia efectiva y reduce velocidad durante ese instante."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (uso de la caja de velocidades)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="deriva_neumatico",
        q_all=[r"deriva del neum[aá]tico"],
        a_any=[r"velocidad", r"carga", r"deformaci[oó]n del flanco"],
        explanation=(
            "La deriva es la variación de trayectoria por la deformación del flanco "
            "del neumático. Depende de la carga, de la velocidad y del ángulo de "
            "deriva; no de fuerzas «termotécnicas» inventadas."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (neumáticos y guiado)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="balanceo",
        q_all=[r"movimiento giratorio de la carrocer[ií]a", r"eje longitudinal"],
        a_all=[r"balanceo"],
        explanation=(
            "El balanceo es el movimiento giratorio de la carrocería sobre su eje "
            "longitudinal (el vehículo se «inclina» hacia los lados). El cabeceo "
            "es sobre el eje transversal."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (dinámica del vehículo)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="sobreviraje",
        q_all=[r"trayectoria es m[aá]s cerrada"],
        a_all=[r"sobrev"],
        explanation=(
            "Si la trayectoria real es más cerrada que la que debería describir el "
            "volante, el camión sobrevira (el eje trasero pierde adherencia y el "
            "vehículo «entra» de más en la curva)."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (subviraje y sobreviraje)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="subviraje",
        q_all=[r"trayectoria", r"m[aá]s abierta"],
        a_all=[r"subvir"],
        explanation=(
            "Si la trayectoria es más abierta que la deseada, el vehículo subvira: "
            "el eje delantero pierde adherencia y el camión «se va de morro»."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (subviraje y sobreviraje)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="fuerza_guiado_lateral",
        q_all=[r"fuerza de guiado lateral"],
        a_any=[r"conserva la direcci[oó]n"],
        explanation=(
            "La fuerza de guiado lateral es la que, gracias a la adherencia de los "
            "neumáticos, conserva la dirección del vehículo en curva."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="fading",
        q_all=[r"\bfading\b"],
        a_any=[r"disminuye la capacidad de frenado"],
        explanation=(
            "El fading es la pérdida de eficacia de los frenos por sobrecalentamiento "
            "de las superficies de fricción: disminuye la capacidad de frenado."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (sistemas de frenado)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="ralentizador_electrico",
        q_all=[r"ralentizador el[eé]ctrico|freno el[eé]ctrico"],
        a_any=[r"freno de servicio", r"transmisi[oó]n"],
        explanation=(
            "El ralentizador o freno eléctrico actúa sobre la transmisión y reduce "
            "el uso del freno de servicio, limitando el fading en bajadas largas."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (ralentizadores)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="caja_velocidades_funcion",
        q_all=[r"funci[oó]n de la caja de velocidades"],
        a_any=[r"relaci[oó]n de transmisi[oó]n"],
        explanation=(
            "La caja de velocidades modifica la relación de transmisión entre el "
            "motor y las ruedas, adaptando par y velocidad a la resistencia al avance."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="par_motor_regimen_medio",
        q_all=[r"par motor"],
        a_any=[r"r[eé]gimen medio"],
        explanation=(
            "El par motor máximo se obtiene en un régimen medio de revoluciones, "
            "no en el régimen máximo de potencia ni al ralentí."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (curvas de motor)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="carga_pendiente_acelera",
        q_all=[r"acelera en una pendiente ascendente", r"mercanc"],
        a_any=[r"sentido opuesto"],
        explanation=(
            "Al acelerar en una rampa, la inercia hace que la mercancía tienda a "
            "desplazarse hacia atrás, en sentido opuesto a la marcha."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (estiba e inercias)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="distribucion_carga_accidente",
        q_all=[r"incorrecta distribuci[oó]n de la carga"],
        a_any=[r"riesgo de accidente"],
        explanation=(
            "Una distribución incorrecta de la carga desplaza el centro de gravedad, "
            "altera las cargas por eje y aumenta el riesgo de accidente (vuelco, "
            "pérdida de adherencia, frenada irregular)."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (estiba y estabilidad)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="estiba_seguridad_personal",
        q_all=[r"buena estiba"],
        a_any=[r"m[aá]ximo de seguridad para el personal"],
        explanation=(
            "Una buena estiba coloca la carga de modo que se transporte con la "
            "máxima seguridad para el personal y para el resto de usuarios, no "
            "solo para aprovechar el volumen."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I, y guía de estiba CEFTRAL",
        source_url=URL_CAP,
        priority=8,
    ),
    Rule(
        id="teu_20",
        q_all=[r"\bTEU\b"],
        a_any=[r"20 pies"],
        explanation=(
            "TEU (Twenty-foot Equivalent Unit) es la unidad equivalente a un "
            "contenedor de 20 pies de largo. Un contenedor de 40 pies equivale a 2 TEU."
        ),
        source="Terminología intermodal de transporte; Ministerio de Transportes / MITMA",
        source_url="https://www.transportes.gob.es/",
        priority=16,
    ),
    Rule(
        id="portacontenedores",
        q_all=[r"cajas para el transporte", r"enganche", r"reutilizaci[oó]n"],
        a_all=[r"portacontenedores"],
        explanation=(
            "Los contenedores (cajas reutilizables con elementos de enganche) se "
            "transportan por carretera sobre vehículos portacontenedores, no «en "
            "contenedores» como modo."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (tipos de vehículos)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="vehiculo_batería",
        q_all=[r"botellas o peque[nñ]as cisternas", r"colector"],
        a_all=[r"bater[ií]a"],
        explanation=(
            "Un vehículo batería está formado por un conjunto de botellas o "
            "pequeñas cisternas conectadas entre sí mediante un colector."
        ),
        source="ADR / programa oficial CAP (tipos de vehículos-cisterna)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="rompeolas_cisterna",
        q_all=[r"rompeolas", r"cisterna"],
        a_any=[r"estabilidad", r"movimiento de la carga"],
        explanation=(
            "Los rompeolas (mamparos con aberturas) reducen el oleaje interno de "
            "la cisterna y su efecto sobre la estabilidad del vehículo."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (cisternas)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="triangular_puro",
        q_all=[r"triangular", r"marruecos|ucrania|atraviesa espa[nñ]a"],
        a_all=[r"triangular puro"],
        explanation=(
            "Se denomina transporte triangular puro aquel en el que un vehículo "
            "español carga en un tercer país, atraviesa España y descarga en otro "
            "país distinto (ni origen ni destino en España)."
        ),
        source="Normativa de transportes internacionales y autorizaciones CEMT / LOTT",
        source_url=URL_LOTT,
        priority=10,
    ),
    # ----- Consumo / conducción eficiente (IDAE + temario CAP) -----
    Rule(
        id="consumo_anticipar",
        q_all=[r"ahorrar carburante"],
        a_any=[r"anticiparse", r"observar a lo lejos"],
        explanation=(
            "Una de las técnicas más eficaces de ahorro es mirar lejos y anticipar "
            "el tráfico, evitando acelerones y frenazos que disparan el consumo."
        ),
        source="Guía de conducción eficiente IDAE y programa oficial CAP, anexo I",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="consumo_rpm_perfil",
        q_all=[r"influye en el consumo de carburante de un veh[ií]culo pesado"],
        a_any=[r"revoluciones", r"perfil de la carretera"],
        explanation=(
            "El consumo de un pesado depende, entre otros factores, del régimen "
            "del motor (rpm) y del perfil de la carretera (pendientes)."
        ),
        source="Guía de conducción eficiente IDAE y programa oficial CAP, anexo I",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="consumo_presion_neumaticos",
        q_all=[r"factor influye en el consumo"],
        a_any=[r"presi[oó]n de inflado", r"neum[aá]ticos"],
        explanation=(
            "Una presión de inflado incorrecta aumenta la resistencia a la rodadura "
            "y, con ella, el consumo de carburante."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="consumo_mantenimiento",
        q_all=[r"consumo de carburante de un veh[ií]culo pesado depende"],
        a_any=[r"mantenimiento"],
        explanation=(
            "El mantenimiento (filtros, presión de neumáticos, geometría, etc.), "
            "la posición del acelerador y el estado de la vía influyen de forma "
            "directa en el consumo."
        ),
        source="Guía de conducción eficiente IDAE y programa oficial CAP, anexo I",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="zona_verde_cuentarrevoluciones",
        q_all=[r"cuentarrevoluciones", r"color verd"],
        a_any=[r"menor consumo", r"m[aá]xima eficiencia"],
        explanation=(
            "La zona verde del cuentarrevoluciones indica el régimen de máxima "
            "eficiencia / menor consumo específico. Conviene circular en esa zona "
            "con la marcha más larga posible."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=14,
    ),
    Rule(
        id="zona_roja_mayor_consumo",
        q_all=[r"cuentarrevoluciones", r"color roj"],
        a_any=[r"mayor consumo"],
        explanation=(
            "La zona roja del cuentarrevoluciones es de alto régimen: mayor desgaste "
            "y mayor consumo. Hay que evitar mantener el motor ahí."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="octanaje_no_influye_zona",
        q_all=[r"cuentarrevoluciones", r"no influye"],
        a_any=[r"octanaje"],
        explanation=(
            "El octanaje (o el cetano del gasóleo) no determina las zonas pintadas "
            "en el cuentarrevoluciones: esas zonas las fija el fabricante según el "
            "régimen óptimo del motor."
        ),
        source="Guía de conducción eficiente IDAE / temario CAP de motor",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="no_influye_motor_arranque",
        q_all=[r"no tiene influencia en el consumo", r"carburante"],
        a_any=[r"motor de arranque"],
        explanation=(
            "El motor de arranque no forma parte de los factores de consumo en "
            "marcha (aerodinámica, neumáticos, perfil, acelerador, mantenimiento)."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="no_influye_tipo_freno",
        q_all=[r"NO influye en el consumo", r"carburante"],
        a_any=[r"sistema de frenado", r"ruedas motrices", r"octanaje"],
        explanation=(
            "El consumo en marcha depende de resistencias al avance, régimen, "
            "carga y estilo de conducción. El tipo de freno (hidráulico/neumático) "
            "o la situación de las ruedas motrices no son factores de consumo "
            "habituales en el temario."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="reducir_velocidad_media",
        q_all=[r"reducir la velocidad media"],
        a_any=[r"menor consumo"],
        explanation=(
            "Reducir la velocidad media baja la resistencia aerodinámica (que crece "
            "con el cuadrado de la velocidad), el consumo, el ruido y el desgaste."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="marcha_mas_alta",
        q_all=[r"relaci[oó]n de marchas m[aá]s alta"],
        a_any=[r"menor consumo"],
        explanation=(
            "Circular con la marcha más larga posible a la velocidad dada mantiene "
            "el motor en zona verde: menos rpm, menos consumo y menos ruido."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="evitar_aceleraciones",
        q_all=[r"optimizar el consumo"],
        a_any=[r"evitar", r"aceleraciones"],
        explanation=(
            "La conducción a base de acelerones y frenazos es la que más carburante "
            "gasta. Lo correcto es anticipar y mantener una velocidad lo más estable "
            "posible."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="presion_superior_inadecuada",
        q_all=[r"ahorro de carburante"],
        a_any=[r"presi[oó]n de inflado", r"superior a la recomend"],
        explanation=(
            "Circular con una presión claramente superior a la recomendada no es "
            "una medida de ahorro adecuada: empeora la adherencia y la seguridad, "
            "aunque reduzca algo la rodadura."
        ),
        source="Guía de conducción eficiente IDAE y recomendaciones de fabricantes / DGT",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="conduccion_economica_vida_motor",
        q_all=[r"conducci[oó]n econ[oó]mica", r"adem[aá]s de reducir el consumo"],
        a_any=[r"vida del motor"],
        explanation=(
            "Además de gastar menos carburante, la conducción económica reduce "
            "esfuerzos mecánicos y prolonga la vida del motor y de los frenos."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="filtro_aire_consumo",
        q_all=[r"filtro del aire"],
        a_any=[r"consumo de carburante"],
        explanation=(
            "Un filtro de aire sucio ahoga la admisión y aumenta el consumo de "
            "carburante. Debe sustituirse según el fabricante."
        ),
        source="Guía de conducción eficiente IDAE / mantenimiento CAP",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="consumo_especifico_rendimiento",
        q_all=[r"consumo espec[ií]fico"],
        a_any=[r"mayor rendimiento"],
        explanation=(
            "El consumo específico (gramos de combustible por kWh) mide el "
            "rendimiento: a menor consumo específico, mayor rendimiento del motor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (motor)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="velocidad_desplaza_aire",
        q_all=[r"aumenta la velocidad"],
        a_any=[r"desplazar m[aá]s cantidad de aire"],
        explanation=(
            "Al aumentar la velocidad el vehículo debe desplazar más aire en el "
            "mismo tiempo: crece la resistencia aerodinámica y el consumo."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="pendiente_masa_esfuerzo",
        q_all=[r"masa del cami[oó]n", r"pendiente ascendente"],
        a_any=[r"m[aá]s esfuerzo"],
        explanation=(
            "A mayor masa, mayor componente de resistencia a la pendiente: hace "
            "falta más esfuerzo (más par) y suelen necesitarse más cambios de marcha."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=12,
    ),
    # ----- Empresa de transporte -----
    Rule(
        id="comercial_estadisticas",
        q_all=[r"funciones propias de un comercial"],
        a_any=[r"estad[ií]sticas comerciales"],
        explanation=(
            "En el organigrama típico de una empresa de transporte, al comercial "
            "le corresponde la relación con clientes y las estadísticas comerciales, "
            "no la planificación de rutas (tráfico) ni las nóminas (administración)."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (entorno del transporte de mercancías)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="jefe_trafico",
        q_all=[r"jefe de tr[aá]fico"],
        a_any=[r"normas relacionadas con el transporte"],
        explanation=(
            "El jefe de tráfico organiza rutas, turnos y vehículos y vigila el "
            "cumplimiento de las normas de transporte (tiempos, masas, documentos)."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="administrativo_nominas",
        q_all=[r"funciones propias de un administrativo"],
        a_any=[r"n[oó]minas"],
        explanation=(
            "Al administrativo le corresponden tareas de gestión (nóminas, "
            "facturación, archivos), no la captación de clientes ni el diseño de rutas."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="gerente_estrategia",
        q_all=[r"funciones propias del gerente"],
        a_any=[r"decisiones estrat[eé]gicas"],
        explanation=(
            "El gerente coordina la empresa y adopta las decisiones estratégicas; "
            "no sustituye al jefe de tráfico en la operativa diaria de rutas."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="organigrama_inversion",
        q_all=[r"organigrama", r"infrecuente"],
        a_all=[r"inversi[oó]n"],
        explanation=(
            "En una empresa grande de transporte son habituales comercial, tráfico "
            "y personal. Un «departamento de inversión» como tal es infrecuente."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="atomizacion_formacion",
        q_all=[r"atomizaci[oó]n empresarial"],
        a_any=[r"formaci[oó]n de los trabajadores"],
        explanation=(
            "La atomización del sector (muchas empresas muy pequeñas) dificulta la "
            "formación, porque el conductor no puede ausentarse fácilmente del "
            "puesto de trabajo."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (entorno del sector)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="tamano_recursos_financieros",
        q_all=[r"tama[nñ]o empresarial grande"],
        a_any=[r"recursos financieros"],
        explanation=(
            "Un mayor tamaño empresarial facilita el acceso a financiación externa "
            "en mejor cuantía y condiciones, y a economías de escala."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="cuenta_ajena",
        q_all=[r"servicios de transporte de mercanc[ií]as a terceros"],
        a_all=[r"cuenta ajena"],
        explanation=(
            "Quien presta transporte de mercancías a terceros realiza transporte "
            "público por cuenta ajena, no privado complementario."
        ),
        source="Ley 16/1987 (LOTT), artículos 62 y 64",
        source_url=URL_LOTT,
        priority=14,
    ),
    # ----- Primeros auxilios / seguridad vial -----
    Rule(
        id="auxilio_no_segundo_dia",
        q_all=[r"auxilio a los heridos"],
        a_any=[r"segundo d[ií]a"],
        explanation=(
            "Es falso que las actuaciones a partir del segundo día sean las más "
            "importantes. En el auxilio inmediato (PAS: proteger, avisar, socorrer) "
            "los primeros minutos son críticos."
        ),
        source="Protocolo PAS y temario CAP de primeros auxilios (RD 284/2021, anexo I)",
        source_url=URL_DGT,
        priority=12,
    ),
    Rule(
        id="evacuar_choque",
        q_all=[r"evac[uú]e el veh[ií]culo"],
        a_any=[r"peligro inminente de un choque"],
        explanation=(
            "Como regla, no se saca al herido del vehículo salvo peligro inminente "
            "(incendio, explosión, nuevo choque). Evacuar sin criterio puede agravar "
            "lesiones de columna."
        ),
        source="Temario CAP de primeros auxilios y recomendaciones DGT / Cruz Roja",
        source_url=URL_DGT,
        priority=12,
    ),
    Rule(
        id="reposacabezas",
        q_all=[r"reposacabezas"],
        a_any=[r"lesiones en el cuello"],
        explanation=(
            "El reposacabezas reduce la gravedad del latigazo cervical en un "
            "alcance; no es un elemento de confort o decorativo."
        ),
        source="Manual de seguridad vial DGT",
        source_url=URL_DGT,
        priority=14,
    ),
    Rule(
        id="cinturon_altura",
        q_all=[r"cintur[oó]n de seguridad"],
        a_any=[r"regulaci[oó]n en altura"],
        explanation=(
            "La banda superior del cinturón debe pasar por la clavícula y el hombro, "
            "nunca por el cuello: la regulación en altura afecta de forma directa "
            "a la seguridad."
        ),
        source="Reglamento General de Circulación y manual DGT de seguridad vial",
        source_url=URL_RGC,
        priority=10,
    ),
    Rule(
        id="alumbrado_tuneles",
        q_all=[r"alumbrado del veh[ií]culo como regla general"],
        a_any=[r"t[uú]neles"],
        explanation=(
            "Como regla general debe utilizarse el alumbrado, entre otros casos, "
            "en la circulación por túneles y pasos inferiores."
        ),
        source="Reglamento General de Circulación (RD 1428/2003), normas de alumbrado",
        source_url=URL_RGC,
        priority=12,
    ),
    Rule(
        id="alcohol_sangre",
        q_all=[r"qu[eé] es la alcoholemia"],
        a_all=[r"alcohol presente en la sangre"],
        explanation=(
            "La alcoholemia es la concentración de alcohol en sangre (g/l) o en "
            "aire espirado (mg/l). No es la graduación de la bebida."
        ),
        source="Normativa DGT / LSV sobre tasas de alcohol",
        source_url=URL_DGT,
        priority=16,
    ),
    Rule(
        id="medicamentos_efectos",
        q_all=[r"al tomar medicamentos"],
        a_any=[r"efectos secundarios"],
        explanation=(
            "Antes de conducir hay que informarse de los efectos secundarios de los "
            "medicamentos (somnolencia, visión borrosa, etc.)."
        ),
        source="Guía de consejo sanitario en la conducción (DGT)",
        source_url=URL_DGT,
        priority=12,
    ),
    Rule(
        id="ergonomia_no_misma_postura",
        q_all=[r"afirmaciones es incorrecta", r"asiento|espalda|postura"],
        a_any=[r"prolongar la misma postura"],
        explanation=(
            "Es incorrecto «conviene prolongar la misma postura»: la ergonomía "
            "recomienda cambiar de postura y hacer pausas para evitar lesiones."
        ),
        source="Criterios de ergonomía OIT / PRL aplicados al puesto de conducción",
        source_url=URL_PRL,
        priority=10,
    ),
    Rule(
        id="incendio_no_emergencia",
        q_all=[r"evitar un incendio"],
        a_any=[r"luz de emergencia"],
        explanation=(
            "Accionar la luz de emergencia no es una medida preventiva de incendio "
            "(es de señalización). Prevenir un fuego es cuestión de mantenimiento, "
            "no fumar, revisar instalaciones, etc."
        ),
        source="Temario CAP de prevención de incendios / NTP del INSST",
        source_url="https://www.insst.es/",
        priority=10,
    ),
    Rule(
        id="fuego_metales_agua",
        q_all=[r"agua", r"fuego de metales"],
        a_any=[r"explosiones"],
        explanation=(
            "No se debe usar agua en fuegos de metales (clase D): puede provocar "
            "reacciones violentas o explosiones. Se usan polvos especiales."
        ),
        source="Fichas NTP del Instituto Nacional de Seguridad y Salud en el Trabajo",
        source_url="https://www.insst.es/",
        priority=14,
    ),
    Rule(
        id="fuego_clase_b",
        q_all=[r"fuego de clase B"],
        a_any=[r"l[ií]quido", r"gasolina", r"gas[oó]leo", r"carburante"],
        explanation=(
            "Los fuegos de clase B son los de líquidos inflamables (gasolina, "
            "gasóleo, aceites, pinturas)."
        ),
        source="Norma de clasificación de fuegos (UNE-EN 2) y NTP del INSST",
        source_url="https://www.insst.es/",
        priority=12,
    ),
    # ----- Cabotaje / internacional -----
    Rule(
        id="liberalizado_ayudas_urgentes",
        q_all=[r"transportes internacionales", r"liberalizado"],
        a_any=[r"ayudas urgentes", r"postales", r"animales vivos"],
        explanation=(
            "Determinados transportes internacionales están liberalizados en la UE "
            "(por ejemplo envíos de socorro, algunos postales en servicio universal "
            "o animales vivos en vehículos acondicionados), frente al régimen "
            "general de licencias comunitarias."
        ),
        source="Reglamento (CE) n.º 1072/2009 (acceso al mercado de mercancías) y LOTT",
        source_url="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1072",
        priority=8,
    ),
    Rule(
        id="cemt_euro_iv",
        q_all=[r"CEMT", r"EURO IV|camión de color verde"],
        a_any=[r"EURO IV"],
        explanation=(
            "Las autorizaciones CEMT con sello de camión verde y símbolo IV se "
            "reservan a vehículos calificados como EURO IV seguros."
        ),
        source="Guía CEMT de utilización del contingente multilateral",
        source_url="https://www.transportes.gob.es/",
        priority=12,
    ),
    # ----- Calidad / CETMO -----
    Rule(
        id="calidad_percibida",
        q_all=[r"nivel de calidad de servicio"],
        a_any=[r"percibido por los clientes"],
        explanation=(
            "El nivel de calidad que más interesa a la empresa es el percibido por "
            "los clientes, no el de un diploma interno."
        ),
        source="Manuales CETMO de calidad en el transporte (UNE-EN 13816)",
        source_url=URL_CAP,
        priority=8,
    ),
    Rule(
        id="itinerario_fijado",
        q_all=[r"qu[eé] itinerario debe seguir"],
        a_any=[r"hayan fijado"],
        explanation=(
            "El conductor debe seguir el itinerario que le hayan fijado (empresa / "
            "cargador), no el que él considere más corto por su cuenta."
        ),
        source="II Acuerdo general para las empresas de transporte de mercancías y LOTT",
        source_url=URL_LOTT,
        priority=10,
    ),
    # ----- Sistemas ADAS -----
    Rule(
        id="hmw_segundos",
        q_all=[r"\bHMW\b"],
        a_all=[r"segundos"],
        explanation=(
            "El sistema HMW (Headway Monitoring Warning) mide la distancia de "
            "seguridad con el vehículo precedente en segundos de intervalo, no en metros."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (sistemas de ayuda a la conducción)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="ferroutage",
        q_all=[r"cargar camiones sobre un tren"],
        a_all=[r"ferroutage"],
        explanation=(
            "Ferroutage (o ferroutaje) es el conjunto de técnicas para cargar "
            "camiones o semirremolques sobre un tren (transporte combinado carretera-ferrocarril)."
        ),
        source="Terminología de transporte combinado; programa oficial CAP, anexo I",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="cabotaje",
        q_all=[r"territorio de un estado extranjero", r"transport"],
        a_all=[r"cabotaje"],
        explanation=(
            "El cabotaje es el transporte de mercancías realizado íntegramente en "
            "el territorio de un Estado miembro distinto del de establecimiento del "
            "transportista, con las limitaciones del Reglamento (CE) 1072/2009."
        ),
        source="Reglamento (CE) n.º 1072/2009 (acceso al mercado de mercancías por carretera)",
        source_url="https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1072",
        priority=16,
    ),
    Rule(
        id="oficiales_exentos",
        q_all=[r"veh[ií]culos oficiales", r"administraci[oó]n"],
        a_all=[r"exentos de autorizaci[oó]n"],
        explanation=(
            "Los vehículos oficiales de transporte de mercancías de los órganos de "
            "la Administración están exentos de autorización de transporte."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), artículo 33 y concordantes",
        source_url=URL_ROTT,
        priority=14,
    ),
    Rule(
        id="cuenta_ajena_def",
        q_all=[r"cuenta ajena"],
        a_any=[r"terceros", r"p[uú]blico"],
        explanation=(
            "Transporte de mercancías por cuenta ajena es la prestación de servicios "
            "de transporte a terceros (transporte público), a cambio de un precio."
        ),
        source="Ley 16/1987 (LOTT), artículos 62 y 64",
        source_url=URL_LOTT,
        priority=14,
    ),
    Rule(
        id="in_itinere",
        q_all=[r"in itinere"],
        a_any=[r"ida y vuelta", r"domicilio"],
        explanation=(
            "El accidente in itinere es el ocurrido en el desplazamiento de ida o "
            "vuelta entre el domicilio y el lugar de trabajo."
        ),
        source="Real Decreto Legislativo 8/2015 (Ley General de la Seguridad Social), accidente de trabajo",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724",
        priority=16,
    ),
    Rule(
        id="luxacion",
        q_all=[r"qu[eé] es una luxaci[oó]n"],
        a_any=[r"salida del hueso", r"articulaci[oó]n"],
        explanation=(
            "Una luxación es la salida del hueso de su articulación. No debe "
            "reducirse en carretera salvo personal sanitario."
        ),
        source="Temario CAP de primeros auxilios (RD 284/2021, anexo I)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="suspension_confort",
        q_all=[r"suspensi[oó]n de un cami[oó]n"],
        a_any=[r"confort", r"oscilaciones"],
        explanation=(
            "La suspensión absorbe irregularidades del firme, mantiene el contacto "
            "de los neumáticos y proporciona cierto confort y estabilidad."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="control_estabilidad",
        q_all=[r"gui[nñ]ada", r"trayector"],
        a_all=[r"control de estabilidad"],
        explanation=(
            "El control de estabilidad (ESP/ESC) aumenta o disminuye la guiñada "
            "para mantener el camión en la trayectoria deseada, actuando sobre "
            "frenos y a veces sobre el par motor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (sistemas de ayuda a la conducción)",
        source_url=URL_CAP,
        priority=14,
    ),
    Rule(
        id="ralentizadores_freno_electrico",
        q_all=[r"ralentizador"],
        a_any=[r"freno el[eé]ctrico"],
        explanation=(
            "Los ralentizadores (freno eléctrico, hidráulico, de motor, etc.) son "
            "sistemas auxiliares de frenado que retienen el vehículo sin usar el "
            "freno de servicio de forma continua."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (ralentizadores)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="sobrecarga_eje_frenada",
        q_all=[r"sobrecarga", r"eje"],
        a_any=[r"frenar", r"distancia de detenci[oó]n"],
        explanation=(
            "La sobrecarga de un eje altera el reparto de masas, empeora la "
            "adherencia y puede alargar la distancia de detención o desestabilizar "
            "la frenada."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (masas y frenado)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="resistencias_tres",
        q_all=[r"resistencias que intervienen"],
        a_any=[r"aerodin[aá]mica", r"rodadura", r"pendiente"],
        explanation=(
            "Las resistencias al avance habituales son la aerodinámica, la de "
            "rodadura y la de pendiente (además de la inercial al acelerar)."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="tacografo_memoria_llena",
        q_all=[r"capacidad de almacenamiento", r"tac[oó]grafo"],
        a_any=[r"sustituyen"],
        explanation=(
            "Cuando se agota la memoria del tacógrafo digital, los datos más "
            "antiguos se sustituyen por los nuevos (el aparato sigue funcionando)."
        ),
        source="Reglamento (UE) n.º 165/2014 (memoria del aparato de control)",
        source_url=URL_165,
        priority=14,
    ),
    Rule(
        id="par_ralenti_rozamientos",
        q_all=[r"par", r"ralent[ií]"],
        a_any=[r"rozamientos internos"],
        explanation=(
            "Al ralentí el motor debe generar el par justo para vencer sus "
            "rozamientos internos y mover los auxiliares, sin producir trabajo útil "
            "en las ruedas."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (motor)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="potencia_aumenta_rpm",
        q_all=[r"potencia de un motor"],
        a_any=[r"aumentar las revoluciones"],
        explanation=(
            "La potencia es par × régimen: en la curva a plena carga, la potencia "
            "crece al aumentar las rpm hasta el régimen de potencia máxima."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (curvas de motor)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="extintor_agente_adecuado",
        q_all=[r"extintor"],
        a_any=[r"agente extintor es adecuado"],
        explanation=(
            "Antes de usar un extintor hay que comprobar que el agente es adecuado "
            "al tipo de fuego (A, B, C, D, F). Un agente inadecuado puede agravar el incendio."
        ),
        source="NTP del INSST sobre extinción de incendios y temario CAP",
        source_url="https://www.insst.es/",
        priority=12,
    ),
    Rule(
        id="contrabando_revisiones",
        q_all=[r"contrabando"],
        a_any=[r"revisiones del veh[ií]culo"],
        explanation=(
            "Para no verse implicado en delitos de contrabando o tráfico ilícito, "
            "el conductor debe revisar vehículo y carga durante el viaje y no "
            "aceptar bultos de origen desconocido."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (tráfico ilícito) y ADR 1.10",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="consumo_aerodinamica_mantenimiento",
        q_all=[r"consumo de carburante", r"veh[ií]culo pesado"],
        a_any=[r"aerodin[aá]mica", r"mantenimiento"],
        explanation=(
            "En un pesado el consumo sube si empeora la aerodinámica (lonas, "
            "deflectores, carga mal cubierta) o el mantenimiento (filtros, "
            "neumáticos, geometría)."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=6,
    ),
    Rule(
        id="consumo_carga",
        q_all=[r"de qu[eé] depende el consumo de carburante"],
        a_any=[r"carga que lleve"],
        explanation=(
            "A mayor carga, mayor masa y mayores resistencias (rodadura y pendiente), "
            "por lo que aumenta el consumo."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="consumo_marchas_rpm",
        q_all=[r"factores que influyen en el consumo", r"veh[ií]culo pesado"],
        a_any=[r"relaci[oó]n de marchas", r"revoluciones"],
        explanation=(
            "La marcha seleccionada y el régimen del motor determinan el consumo "
            "específico: conviene la marcha más larga posible en zona verde."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=6,
    ),
    Rule(
        id="reducir_consumo_velocidad_media",
        q_all=[r"posibilidad de reducir el consumo"],
        a_any=[r"velocidad media"],
        explanation=(
            "Sí: el conductor puede reducir el consumo, por ejemplo bajando la "
            "velocidad media, anticipando y evitando acelerones."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="anticipacion_urbana",
        q_all=[r"zonas urbanas", r"congesti[oó]n"],
        a_any=[r"anticipaci[oó]n"],
        explanation=(
            "En ciudad o en tráfico denso conviene conducir con anticipación: "
            "permite frenar menos, gastar menos y reducir riesgos."
        ),
        source="Guía de conducción eficiente IDAE y conducción preventiva DGT",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="ergonomia_rendimiento",
        q_all=[r"conocimientos ergon[oó]micos"],
        a_any=[r"rendimiento del trabajador"],
        explanation=(
            "Aplicar la ergonomía al puesto de trabajo incrementa el rendimiento "
            "y reduce lesiones (espalda, cuello, fatiga)."
        ),
        source="Ley 31/1995 y criterios de ergonomía del INSST / OIT",
        source_url=URL_PRL,
        priority=8,
    ),
    Rule(
        id="marchas_perfil",
        q_all=[r"relaci[oó]n de marchas", r"conducci[oó]n"],
        a_any=[r"perfil de la carretera"],
        explanation=(
            "La marcha adecuada depende, entre otros factores, del perfil de la "
            "carretera (pendientes) y de la velocidad / rpm del motor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I, y guía IDAE",
        source_url=URL_IDAE,
        priority=6,
    ),
    Rule(
        id="cambio_segun_rpm",
        q_all=[r"cambiar de marcha", r"consumo"],
        a_any=[r"revoluciones por minuto"],
        explanation=(
            "El momento de cambiar se decide mirando las rpm (zona verde), no el "
            "octanaje ni el material del motor, para reducir consumo."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="material_motor_no_consumo",
        q_all=[r"consumo de carburante"],
        a_any=[r"material empleado en el motor"],
        explanation=(
            "El tipo de material del motor no es un factor de consumo en marcha. "
            "Sí lo son las resistencias al avance, las rpm, la carga y el estilo "
            "de conducción. Si la pregunta pide la opción incorrecta, esa es ella."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=6,
    ),
    Rule(
        id="ecualizador_no_consumo",
        q_all=[r"no afecta al ahorro", r"combustible"],
        a_any=[r"ecualizador"],
        explanation=(
            "El ecualizador (audio) no influye en el consumo. Sí lo hacen la "
            "aerodinámica, los neumáticos, las rpm y el estilo de conducción."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=12,
    ),
    Rule(
        id="filtro_aire_ahorro",
        q_all=[r"filtro del aire"],
        a_any=[r"ahorro de carburante"],
        explanation=(
            "Sustituir el filtro de aire cuando corresponde favorece el ahorro: un "
            "filtro sucio aumenta el consumo."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="consumo_alto_rpm",
        q_all=[r"consumo de carburante"],
        a_any=[r"elevado n[uú]mero de revoluciones", r"altas revoluciones"],
        explanation=(
            "El consumo aumenta a elevado número de revoluciones. Circular en zona "
            "verde con marcha larga es más eficiente."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="estilo_conduccion_consumo",
        q_all=[r"consumo de carburante"],
        a_any=[r"estilo de conducci[oó]n"],
        explanation=(
            "Con el motor a temperatura de servicio, el consumo depende en gran "
            "medida del estilo de conducción (anticipación, rpm, aceleraciones)."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=6,
    ),
    Rule(
        id="inadecuado_bajas_rpm",
        q_all=[r"estilos de conducci[oó]n", r"ahorro"],
        a_any=[r"bajas revoluciones"],
        explanation=(
            "Es inadecuado pensar que el vehículo consume más a bajas revoluciones "
            "en zona verde: precisamente ahí el consumo específico suele ser menor."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="cambio_deceleracion_tarde",
        q_all=[r"cambios de marchas", r"ahorrar combustible"],
        a_any=[r"deceleraci[oó]n", r"m[aá]s tarde"],
        explanation=(
            "En deceleración conviene retrasar la reducción (dejar que el motor "
            "retenga en marcha larga) para ahorrar; en aceleración se cambia pronto "
            "hacia marchas largas."
        ),
        source="Guía de conducción eficiente IDAE",
        source_url=URL_IDAE,
        priority=10,
    ),
    Rule(
        id="consumo_especifico_inverso",
        q_all=[r"consumo espec[ií]fico"],
        a_any=[r"mayor consumo espec[ií]fico menor rendimiento"],
        explanation=(
            "Sí: el consumo específico indica el rendimiento. A mayor consumo "
            "específico, peor rendimiento; a menor consumo específico, mejor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (motor)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="mma75_adelantamiento",
        q_all=[r"7,?5 toneladas", r"no p"],
        a_any=[r"todas las respuestas son correctas"],
        explanation=(
            "Los vehículos de mercancías de MMA superior a 7,5 t tienen restricciones "
            "específicas de adelantamiento en tramos señalados. Cuando el examen "
            "marca «todas las respuestas son correctas», las opciones enumeran esas "
            "limitaciones del Reglamento General de Circulación."
        ),
        source="Reglamento General de Circulación (RD 1428/2003), normas de adelantamiento de pesados",
        source_url=URL_RGC,
        priority=6,
    ),
    Rule(
        id="precaucion_carga_descarga",
        q_all=[r"carga y descarga"],
        a_any=[r"no debe extremarse la precauci[oó]n"],
        explanation=(
            "Es falso que no deba extremarse la precaución en carga y descarga: "
            "es una de las fases con más accidentes laborales del transporte."
        ),
        source="Ley 31/1995 y temario CAP de prevención de riesgos (RD 284/2021, anexo I)",
        source_url=URL_PRL,
        priority=10,
    ),
    Rule(
        id="caida_carga_no_abandonar",
        q_all=[r"ca[ií]da de carga sobre la v[ií]a"],
        a_any=[r"abandonar la zona"],
        explanation=(
            "No se debe abandonar la zona de inmediato: hay que proteger el lugar "
            "(PAS), señalizar y avisar. Marcharse puede constituir un delito de "
            "omisión del deber de socorro y deja un obstáculo en la calzada."
        ),
        source="Reglamento General de Circulación (obligaciones en caso de accidente u obstáculo) y LSV",
        source_url=URL_RGC,
        priority=12,
    ),
    Rule(
        id="resistencia_distancia_seguridad",
        q_all=[r"reducir la resistencia"],
        a_any=[r"distancia de seguridad"],
        explanation=(
            "Mantener distancia de seguridad evita frenadas y acelerones, reduce "
            "resistencias inútiles y ahorra carburante."
        ),
        source="Guía de conducción eficiente IDAE y conducción preventiva DGT",
        source_url=URL_IDAE,
        priority=8,
    ),
    Rule(
        id="incorporacion_velocidad",
        q_all=[r"incorporaciones a una v[ií]a"],
        a_any=[r"velocidad muy cercana"],
        explanation=(
            "En una incorporación hay que llegar a una velocidad próxima a la del "
            "tráfico de la vía principal para no obligar a frenar a los demás."
        ),
        source="Reglamento General de Circulación (incorporaciones) y manual DGT",
        source_url=URL_RGC,
        priority=12,
    ),
    Rule(
        id="conduccion_preventiva",
        q_all=[r"conducci[oó]n preventiva"],
        a_any=[r"todas las respuestas"],
        explanation=(
            "La conducción preventiva se fundamenta en anticipar, ver y ser visto, "
            "y dejar un margen de seguridad. Cuando el examen marca «todas son "
            "correctas», las opciones recogen esos pilares."
        ),
        source="Manuales DGT de conducción preventiva / programa oficial CAP",
        source_url=URL_DGT,
        priority=6,
    ),
    Rule(
        id="ejercicio_conductores",
        q_all=[r"ejercicio f[ií]sico habitual"],
        a_any=[r"conductores profesionales", r"horas", r"sentados"],
        explanation=(
            "El ejercicio físico es especialmente recomendable para conductores "
            "profesionales, que pasan gran parte de la jornada sentados."
        ),
        source="Temario CAP de salud y ergonomía (RD 284/2021, anexo I)",
        source_url=URL_CAP,
        priority=10,
    ),
    Rule(
        id="seguro_mercancias_consumidor",
        q_all=[r"seguro que cubra los da[nñ]os", r"mercanc[ií]as"],
        a_any=[r"consumidor", r"repercutir el coste"],
        explanation=(
            "Si el consumidor contrata un seguro de la mercancía, asume su coste: "
            "el transportista puede repercutir íntegramente ese precio, distinto "
            "de la responsabilidad CMR/LOTT del porteador."
        ),
        source="Convenio CMR y normativa de contrato de transporte terrestre (Ley 15/2009)",
        source_url="https://www.boe.es/buscar/act.php?id=BOE-A-2009-18004",
        priority=8,
    ),
    Rule(
        id="atropellos_amanecer",
        q_all=[r"atropellos"],
        a_any=[r"amanecer", r"atardecer"],
        explanation=(
            "Hay que extremar la precaución al amanecer y al atardecer: peor "
            "visibilidad y más peatones. Es una medida clásica anti-atropellos."
        ),
        source="Manual de seguridad vial DGT",
        source_url=URL_DGT,
        priority=10,
    ),
    Rule(
        id="postura_trabajo_incorrecta",
        q_all=[r"afirmaciones es incorrecta", r"postura de trabajo"],
        a_any=[r"m[aá]xima presencia de molestias", r"mayor eficacia con la m[aá]xima"],
        explanation=(
            "Es incorrecto definir la mejor postura como la de mayor eficacia con "
            "máximas molestias: la postura correcta es la de mayor eficacia con "
            "mínima fatiga y molestias."
        ),
        source="Criterios de ergonomía OIT / INSST",
        source_url=URL_PRL,
        priority=10,
    ),
    Rule(
        id="fading_no_velocidad_auto",
        q_all=[r"fading"],
        a_any=[r"disminuya la velocidad"],
        explanation=(
            "Es falso que el fading haga disminuir automáticamente la velocidad: "
            "el fading reduce la capacidad de frenado por calor; el vehículo no "
            "frena solo."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (sistemas de frenado)",
        source_url=URL_CAP,
        priority=12,
    ),
    Rule(
        id="deriva_anchura_llanta",
        q_all=[r"deriva del neum[aá]tico"],
        a_any=[r"anchura de la llanta"],
        explanation=(
            "La deriva también depende de factores del conjunto rueda (presión, "
            "carga, velocidad, geometría). En esta convocatoria la plantilla marca "
            "la anchura de la llanta como factor."
        ),
        source="Programa oficial CAP, RD 284/2021, anexo I (neumáticos)",
        source_url=URL_CAP,
        priority=6,
    ),
]

# Map fragments found in sevilla_marzo_2024 `reference` strings to official URLs.
REFERENCE_URLS: list[tuple[str, str]] = [
    (r"561/2006", URL_561),
    (r"165/2014", URL_165),
    (r"3821/85", "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:31985R3821"),
    (r"16/1987", URL_LOTT),
    (r"1211/1990", URL_ROTT),
    (r"284/2021", URL_CAP),
    (r"6/2015", URL_LSV),
    (r"8/2004", URL_SEGURO),
    (r"31/1995", URL_PRL),
    (r"1/2010", URL_LSC),
    (r"818/2009", URL_PERMISO),
    (r"640/2007", URL_TACOGRAFO_EX),
    (r"97/2014", URL_MP),
    (r"1/2005", URL_ANIMALES),
    (r"952/2013", URL_CAU),
    (r"2015/2447", "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32015R2447"),
    (r"\bCMR\b", URL_CMR),
    (r"\bATP\b", "https://www.boe.es/buscar/act.php?id=BOE-A-1976-24916"),
    (r"\bADR\b", "https://www.transportes.gob.es/transporte-terrestre/mercancias-peligrosas"),
    (r"IDAE", URL_IDAE),
    (r"\bDGT\b", URL_DGT),
    (r"Ergonom", URL_PRL),
    (r"INSST|Instituto Nacional de Seguridad", "https://www.insst.es/"),
]
