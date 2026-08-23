"""Temario CAP viajeros: explicaciones didácticas (autobús/autocar).

No cita artículos. El catálogo BOE/EUR-Lex está en help_catalog_viajeros.py.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from help_key import correct_text_of, help_key
from help_temario import GLOSSARY as M_GLOSS
from help_temario import TIPS as M_TIPS
from help_temario import _compile, match_tip, tip

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "cap-app" / "src" / "data" / "exams"
OUT_PATH = ROOT / "cap-app" / "src" / "data" / "help-tips-viajeros.json"
BANK_PATH = ROOT / "cap-app" / "src" / "data" / "help-bank-viajeros.json"

_SKIP_MERCANCIAS = re.compile(
    r"cisterna|MDPE|MPCE|ADR|ATP\b|CMR|granel|TEU|rompeolas|"
    r"portacontenedor|veh[ií]culo bater[ií]a|jaula|animales vivos|"
    r"mercanc[ií]as peligrosas|estiba de la mercanc|contenedor se caracteriza",
    re.I,
)


def _adapt_text(text: str) -> str:
    text = re.sub(r"\b[Cc]amiones\b", "autobuses", text)
    text = re.sub(r"\bcami[oó]n\b", "autobús", text, flags=re.I)
    text = text.replace("el camión", "el autobús").replace("un camión", "un autobús")
    text = text.replace("El camión", "El autobús")
    return text


def _adapt_item(item: dict) -> dict | None:
    blob = item["text"] + " " + " ".join(item.get("any", []) + item.get("all", []))
    if _SKIP_MERCANCIAS.search(blob):
        return None
    out = dict(item)
    out["text"] = _adapt_text(item["text"])
    return out


VIAJEROS_TIPS: list[dict] = [
    tip(
        "Autobús de piso bajo: al menos el 35 % de la superficie para viajeros de pie es llana, sin escalones, para facilitar el acceso.",
        any=[r"piso bajo"],
        answer=[r"35"],
    ),
    tip(
        "Clase I (urbano): accesibilidad a personas con movilidad reducida, incluidas sillas de ruedas, es obligatoria. Clase III (autocar) solo si monta dispositivos PMR.",
        any=[r"clase I", r"clase III", r"movilidad reducida"],
        answer=[r"clase I", r"silla de ruedas", r"solo deber[aá]n"],
    ),
    tip(
        "En autobús adaptado a PMR con sistema de inclinación (kneeling), el descenso tiene que poder pararse e invertirse al momento.",
        any=[r"sistema de inclinaci[oó]n", r"kneeling"],
    ),
    tip(
        "Autobús adaptado a silla de ruedas: al menos una puerta accesible para esos usuarios.",
        any=[r"puertas accesibles", r"silla de ruedas"],
        answer=[r"una"],
    ),
    tip(
        "El conductor de autobús dirige la carga y descarga de equipajes y se ocupa de que viajen en la bodega o lugar destinado a ello. No deja que el viajero entre en la bodega en un trasbordo.",
        any=[r"carga y descarga de equipajes", r"el equipaje", r"bodega"],
    ),
    tip(
        "Equipaje: objetos que acompañan al viajero (bodega, a petición suya o en remolque). El transportista responde de su pérdida, con límite legal (salvo pacto). Los bultos de mano, si hay accidente, suelen ser a riesgo del viajero.",
        any=[r"equipaje", r"bultos de mano"],
    ),
    tip(
        "Tope habitual del temario si la pérdida de equipaje no es por accidente: 450 euros por pieza (900 por dos). En accidente, 1.200 euros por pieza según la normativa europea de viajeros.",
        any=[r"450 euros", r"900", r"1.?200 euros", r"l[ií]mite m[aá]ximo de responsabilidad"],
    ),
    tip(
        "En discrecional de viajeros, el comercial contrata con el cliente, busca operaciones, hace seguimiento y responde de incidencias.",
        any=[r"comercial en una empresa de transporte discrecional"],
    ),
    tip(
        "Conductas prohibidas a los viajeros en autobús (molestar, no usar cinturón si es obligatorio, obstaculizar, etc.): el temario suele dar por válidas todas las que cita el enunciado.",
        any=[r"conducta de los viajeros"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "Evacuación: recorrer el interior para comprobar que no queda nadie, sacar a los viajeros y no dejarles entrar en la bodega si hay que trasbordar.",
        any=[r"evacuaci[oó]n de un autob[uú]s", r"trasbordo"],
    ),
    tip(
        "El conductor de autobús tiene deber de atención e información a los viajeros, no solo a PMR o menores.",
        any=[r"atenci[oó]n e informaci[oó]n a los viajeros"],
    ),
    tip(
        "Regular de menos de 50 km: exento de tacógrafo. El regular de viajeros «en general» (sin ese límite) no está exento.",
        any=[r"regular de viajeros"],
        answer=[r"exent", r"no est[aá] exento"],
    ),
    tip(
        "Licencia comunitaria de viajeros: al transportista, para internacional UE; hasta 10 años; tantas copias auténticas como vehículos en internacional. La otorga el Estado de residencia/establecimiento. Hace falta ser titular de autorización de transporte público de viajeros.",
        any=[r"licencia comunitaria"],
    ),
    tip(
        "Hoja de ruta del discrecional internacional: no exige la lista de nombres de viajeros. Sí datos del servicio, vehículo y empresa.",
        any=[r"hoja de ruta"],
    ),
    tip(
        "Carril BUS: reservado al transporte colectivo. El resto, prohibido con carácter general. Si la marca es discontinua, solo para una maniobra puntual (no parar ni estacionar).",
        any=[r"carril reservado", r"marca blanca", r"inscripci[oó]n.?BUS"],
    ),
    tip(
        "VAO: se puede permitir a autobuses de MMA superior a 3.500 kg aunque no lleven el número mínimo de ocupantes del resto de vehículos.",
        any=[r"\bVAO\b", r"alta ocupaci[oó]n"],
    ),
    tip(
        "Transporte escolar/menores en discrecional: normas especiales si los menores de 16 años son tres cuartas partes o más. Entonces hace falta acompañante.",
        any=[r"transporte escolar", r"transporte de menores", r"menores en autob[uú]s", r"tres cuartas partes"],
        answer=[r"16", r"tres cuartas", r"acompa[nñ]ante", r"3/4"],
    ),
    tip(
        "Municipio de 25.000 habitantes: el ayuntamiento no está obligado por esa sola cifra a implantar un urbano regular.",
        any=[r"25\.000 habitantes", r"25.000 habitantes"],
    ),
    tip(
        "Vehículos de un regular de uso general pueden hacer discrecional si queda asegurada la prestación del regular.",
        any=[r"veh[ií]culos adscritos a un servicio p[uú]blico de transporte regular"],
    ),
    tip(
        "La relación de marchas de un autobús se elige sobre todo según el perfil de la ruta (y la carga de viajeros).",
        any=[r"relaci[oó]n de marchas", r"perfil de la ruta"],
        answer=[r"perfil"],
    ),
    tip(
        "Zona verde del cuentarrevoluciones: menor consumo. Por encima de esa zona, el consumo sube.",
        any=[r"zona marcada.*verde", r"cuentarrevoluciones"],
    ),
    tip(
        "Freno eléctrico (ralentizador): actúa sobre el árbol de transmisión y evita el fading en bajadas.",
        any=[r"freno el[eé]ctrico", r"rbol de transmisi[oó]n"],
    ),
    tip(
        "Tiempo de presencia: en conducción en equipo, quien no conduce mientras el vehículo se mueve está en presencia, no en descanso.",
        any=[r"conduce en equipo", r"tiempo de presencia"],
    ),
    tip(
        "Descanso semanal que empieza en una semana y acaba en la siguiente: se imputa a una de las dos, no a las dos.",
        any=[r"empiezan en una semana y terminan"],
    ),
    tip(
        "Sin tacógrafo obligatorio cuando toca: infracción muy grave.",
        any=[r"carencia del aparato de control", r"falta muy grave"],
        answer=[r"muy grave"],
    ),
    tip(
        "Sanciones muy graves de tiempos de conducción: prescriben a los tres años.",
        any=[r"plazo de prescripci[oó]n", r"infracciones muy graves"],
        answer=[r"tres a[nñ]os"],
    ),
    tip(
        "Agentes de tráfico: datos al Registro Nacional de Víctimas en los diez días siguientes al accidente.",
        any=[r"registro nacional de v[ií]ctimas"],
    ),
    tip(
        "TCS: compara el giro de las ruedas motrices con las que no lo son (control de tracción).",
        any=[r"\bTCS\b"],
    ),
    tip(
        "EDS: trabaja con los frenos (diferencial electrónico / antipatinaje).",
        any=[r"\bEDS\b"],
    ),
    tip(
        "Aproximación a un accidentado: por el arcén, no por el centro del carril.",
        any=[r"aproximaci[oó]n a un veh[ií]culo accidentado"],
    ),
    tip(
        "Quemadura: refrigerar con agua fría, no aplicar pomadas ni reventar ampollas.",
        any=[r"quemado"],
    ),
    tip(
        "Mediana: franja no destinada a la circulación que separa calzadas de distinto sentido.",
        any=[r"mediana"],
    ),
    tip(
        "Glorieta: un tipo de intersección.",
        any=[r"glorietas"],
        answer=[r"intersecciones"],
    ),
    tip(
        "Resistencia aerodinámica pesa más en el consumo a partir de unos 60–70 km/h.",
        any=[r"resistencia aerodin[aá]mica"],
        answer=[r"60", r"70"],
    ),
    tip(
        "Par y potencia de catálogo del fabricante son valores máximos.",
        any=[r"especificaciones t[eé]cnicas"],
        answer=[r"m[aá]ximos"],
    ),
    tip(
        "ABS: regula la presión a los frenos para que la rueda no se bloquee. Seguridad activa: evitar el accidente.",
        any=[r"\bABS\b", r"seguridad activa"],
    ),
    tip(
        "Cinturón: los reguladores de presión (pinzas, holgura) restan eficacia. La altura del anclaje también influye en la seguridad de los viajeros.",
        any=[r"cintur[oó]n de seguridad", r"reguladores de presi[oó]n"],
    ),
    tip(
        "Director/gerente de una empresa de viajeros: dirección general, organización y representación; el test suele dar por buenas todas las funciones del enunciado.",
        any=[r"director general o gerente"],
    ),
    tip(
        "Si el domicilio registral no coincide con el de la administración o la explotación principal, los terceros pueden tomar como domicilio cualquiera de los dos.",
        any=[r"domicilio de una sociedad", r"domicilio registral", r"cu[aá]l ser[aá] el domicilio"],
        answer=[r"terceros", r"discrepancia", r"cualquiera de ellos"],
    ),
    tip(
        "Sociedad anónima: puede constituirse con un solo socio (sociedad unipersonal).",
        all=[r"n[uú]mero m[ií]nimo de socios", r"sociedad(es)? an[oó]nimas?"],
        answer=[r"^uno", r"un socio", r"^1\b"],
    ),
    tip(
        "Sociedad anónima: puede constituirse con un socio; el capital se desembolsa al menos en un 25 % al constituirla (mínimo 60.000 €).",
        all=[r"sociedad(es)? an[oó]nimas?"],
        any=[r"desembolsado en un 25", r"capital", r"60\.000"],
    ),
    tip(
        "Renovación del permiso: el temario agrupa requisitos médicos y administrativos; si el enunciado los cita todos, se marcan todas.",
        any=[r"renovaci[oó]n del permiso"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "DAI (SIT): información variable al conductor (niebla, congestion, obras). El test suele dar por válidas todas las funciones que lista.",
        any=[r"\bDAI\b"],
    ),
    tip(
        "Triángulo del fuego: el freno sobrecalentado en un descenso es la fuente de calor.",
        any=[r"tri[aá]ngulo del fuego"],
    ),
    tip(
        "Mantenimiento: según el fabricante. Un buen mantenimiento ahorra carburante (distribución, lubricación, presión de neumáticos).",
        any=[r"mantenimiento del veh[ií]culo", r"sistema de lubricaci[oó]n", r"sistema de distribuci[oó]n"],
    ),
    tip(
        "Inmovilización en inspección: no se lleva al conductor al juez por el mero hecho de inmovilizar. La falta de uniforme no es motivo típico de inmovilización.",
        any=[r"inmovilizaci[oó]n de un veh[ií]culo"],
    ),
    tip(
        "Retardador hidráulico: potencia según la energía del aceite; lleva estátor fijo; se usa de forma progresiva.",
        any=[r"retardador hidr[aá]ulico", r"est[aá]tor"],
    ),
    tip(
        "Deriva del neumático del autobús: depende de la velocidad (y de carga, presión y geometría).",
        any=[r"deriva del neum[aá]tico"],
    ),
    tip(
        "Medicamentos categoría 0: en principio seguros y rara vez afectan a conducir.",
        any=[r"categor[ií]a 0"],
    ),
    tip(
        "Atención a todos los estímulos a la vez dispersa y aumenta el riesgo: hay que priorizar.",
        any=[r"todos los est[ií]mulos"],
    ),
    tip(
        "Taller del tacógrafo: si hay indicios de manipulación, el vehículo va a un taller autorizado, no a uno cualquiera.",
        any=[r"manipulaci[oó]n del t"],
    ),
    tip(
        "Schengen: el transportista debe asegurarse de que el extranjero tiene los documentos de viaje exigidos.",
        any=[r"extranjero est[aá] en posesi[oó]n", r"documentos de viaje exigidos"],
    ),
    tip(
        "Impresión sin tarjeta de conductor: el conductor se identifica y firma en el ticket.",
        any=[r"impresiones que debe realizar", r"no poder utilizar.*tarjeta"],
    ),
    tip(
        "No devolver el vehículo/conductor al Estado de establecimiento cuando toca puede llegar a 100.000 € de sanción en el temario de internacionales.",
        any=[r"100.000 euros", r"devolver al lugar"],
    ),
    tip(
        "Marcha más alta posible a esa velocidad: menos consumo y menos desgaste.",
        any=[r"relaci[oó]n de marchas m[aá]s alta"],
    ),
    tip(
        "Circular a la derecha y cerca del borde: sobre todo en curvas y cambios de rasante con mala visibilidad (autobuses y vehículos pesados).",
        any=[r"cerca posible del borde"],
    ),
    tip(
        "Cadenas: no superar 50 km/h.",
        any=[r"cadenas"],
        answer=[r"50"],
    ),
    tip(
        "Ejército que mueve soldados en autocar propio: exento de tacógrafo (exención de fuerzas armadas).",
        any=[r"ej[eé]rcito", r"soldados"],
        answer=[r"exent"],
    ),
    tip(
        "Fiabilidad: cumplir lo prometido (horario, plaza, equipaje). Un sector potente retiene actividad económica.",
        any=[r"fiabilidad"],
    ),
    tip(
        "Nunca quitarle los bastones o muletas a un viajero PMR una vez sentado: los necesita para moverse.",
        any=[r"bastones o muletas"],
    ),
    tip(
        "La obligación de seguridad en viajeros abarca a las personas y a sus equipajes.",
        any=[r"garantizar la seguridad"],
        answer=[r"pasajeros y sus equipajes"],
    ),
    tip(
        "Declaración amistosa: en el modelo se anotan datos de los vehículos, conductores, croquis y circunstancias; el temario suele marcar que todas esas menciones valen.",
        any=[r"declaraci[oó]n amistosa"],
    ),
    tip(
        "Energía cinética se expresa en julios: depende de masa y velocidad al cuadrado.",
        any=[r"julios", r"energ[ií]a cin[eé]tica"],
    ),
    tip(
        "Precauciones antiatropello (pasos, puertas, arcén, visibilidad): el temario las da por válidas en conjunto cuando el enunciado las lista.",
        any=[r"evitar atropellos"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "Hojas de registro: discos del tacógrafo analógico donde quedan los tiempos de conducción y descanso.",
        any=[r"hojas de registro"],
    ),
    tip(
        "Requisitos para autorización pública de viajeros (honorabilidad, capacidad, competencia…): si el enunciado los cita todos, se marcan todas.",
        any=[r"otorgamiento de autorizaci[oó]n de transporte p[uú]blico de viajeros"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "Regular interurbano de uso general: hace falta un contrato de gestión de servicio público con la Administración. El regular de uso especial suele exigir que los viajeros compartan centro (colegio, empresa…).",
        any=[r"regular interurbano", r"regular de uso especial"],
    ),
    tip(
        "El CAP de viajeros se exige, en general, para autobuses/autocares de más de 45 km/h de velocidad máxima autorizada.",
        any=[r"45 kil[oó]metros por hor", r"m[aá]s de 45 km"],
    ),
    tip(
        "ESP: control electrónico de estabilidad; corrige la trayectoria y ayuda a no perder la dirección.",
        any=[r"\bESP\b"],
    ),
    tip(
        "Las empresas de autocar deben informar a los viajeros de derechos, asistencia PMR, billetes y reclamaciones. El Reglamento europeo de viajeros lo trata como obligación.",
        any=[r"proporcionar a los viajeros informaci[oó]n", r"informaci[oó]n a los viajeros"],
    ),
    tip(
        "Junta Arbitral: laudo en 6 meses; no hace falta abogado; controversias mercantiles del contrato de transporte.",
        any=[r"juntas? arbitral"],
    ),
]

VIAJEROS_GLOSSARY: list[dict] = [
    tip(
        "VDE: autorización de transporte público de viajeros en autobús (discrecional), válida en todo el territorio nacional.",
        any=[r"\bVDE\b"],
    ),
    tip(
        "VPCE: transporte privado complementario de viajeros en autobús.",
        any=[r"\bVPCE\b"],
    ),
    tip(
        "Discrecional: sin reiteración de itinerario, calendario y horario. Regular: itinerario y horarios prefijados, uso general.",
        any=[r"discrecional", r"transporte regular de viajeros"],
    ),
    tip(
        "Licencia comunitaria: título UE para transporte internacional de viajeros en autobús/autocar.",
        any=[r"licencia comunitaria"],
    ),
    tip(
        "Piso bajo: gran parte del pasillo (35 %) sin escalones, para subir y bajar mejor.",
        any=[r"piso bajo"],
    ),
    tip(
        "Clase I: autobús urbano, accesible a PMR. Clase II: interurbano. Clase III: autocar, plazas sentadas.",
        any=[r"clase I", r"clase III", r"clase II"],
    ),
    tip(
        "PMR: persona con discapacidad o movilidad reducida. En regulares largos hay deberes de asistencia (aviso 36 h, acompañante gratis si se exige).",
        any=[r"movilidad reducida", r"\bPMR\b"],
    ),
    tip(
        "Carril BUS: solo transporte colectivo de viajeros, salvo lo que permita la señalización.",
        any=[r"carril.*autob[uú]s", r"\bBUS\b"],
    ),
    tip(
        "Equipaje: lo que viaja con el pasajero en bodega o remolque, a su petición. El de mano va con el viajero.",
        any=[r"equipaje"],
    ),
    tip(
        "Tacógrafo: registra conducción y descanso. Exención típica: regular de viajeros ≤ 50 km.",
        any=[r"qu[eé] es el tac[oó]grafo", r"para qu[eé] sirve el tac[oó]grafo", r"regular.*50 km"],
    ),
    tip(
        "12 días: en un discrecional ocasional de viajeros se puede aplazar el semanal si se parte de 45 h de descanso normal y luego se compensan dos normales.",
        any=[r"12 d[ií]as", r"12 per[ií]odos"],
    ),
]

TIPS: list[dict] = VIAJEROS_TIPS + [a for a in (_adapt_item(t) for t in M_TIPS) if a]
GLOSSARY: list[dict] = VIAJEROS_GLOSSARY + [a for a in (_adapt_item(t) for t in M_GLOSS) if a]

COMPILED_TIPS = [_compile(t) for t in TIPS]
COMPILED_GLOSS = [_compile(t) for t in GLOSSARY]


def explanation_for(question: str, answer: str) -> str | None:
    return match_tip(question, answer, COMPILED_TIPS) or match_tip(
        question, answer, COMPILED_GLOSS
    )


def write_json() -> None:
    payload = {"tips": TIPS, "glossary": GLOSSARY}
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")


def coverage() -> None:
    bank_keys: set[str] = set()
    if BANK_PATH.exists():
        bank_keys = set(json.loads(BANK_PATH.read_text(encoding="utf-8")))

    pairs: dict[str, dict] = {}
    for path in sorted(EXAM_DIR.glob("viajeros_*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list) or not data or "question" not in data[0]:
            continue
        for q in data:
            question = q.get("question") or ""
            answer = correct_text_of(q)
            key = help_key(question, answer)
            rec = pairs.setdefault(key, {"q": question, "a": answer, "n": 0})
            rec["n"] += 1

    inst = {"bank": 0, "tip": 0, "gloss": 0, "none": 0}
    uniq = {"bank": 0, "tip": 0, "gloss": 0, "none": 0}
    leftovers = []
    for key, rec in pairs.items():
        n = rec["n"]
        if key in bank_keys:
            inst["bank"] += n
            uniq["bank"] += 1
            continue
        t = match_tip(rec["q"], rec["a"], COMPILED_TIPS)
        if t:
            inst["tip"] += n
            uniq["tip"] += 1
            continue
        g = match_tip(rec["q"], rec["a"], COMPILED_GLOSS)
        if g:
            inst["gloss"] += n
            uniq["gloss"] += 1
            continue
        inst["none"] += n
        uniq["none"] += 1
        leftovers.append(rec)

    total_i = sum(inst.values())
    covered_i = total_i - inst["none"]
    print(
        json.dumps(
            {
                "track": "viajeros",
                "unique_pairs": len(pairs),
                "unique": uniq,
                "instances": inst,
                "instance_coverage_pct": round(100 * covered_i / max(total_i, 1), 1),
                "tips": len(TIPS),
                "glossary": len(GLOSSARY),
            },
            indent=2,
        )
    )
    leftovers.sort(key=lambda x: -x["n"])
    print("top leftovers:")
    for rec in leftovers[:20]:
        q = re.sub(r"\s+", " ", rec["q"])[:110]
        a = re.sub(r"\s+", " ", rec["a"])[:70]
        print(f"  {rec['n']:4} | {q} || {a}")


def self_check() -> None:
    cases = [
        (
            "La autorización de transporte público de viajeros en autobús se identifica registralmente con la clave:",
            "VDE.",
            "VDE",
        ),
        (
            "Un autobús de piso bajo:",
            "tiene, al menos, el 35 % de la superficie disponible para viajeros de pie sin escalones.",
            "35",
        ),
        (
            "Los transportes efectuados mediante vehículos destinados al transporte regular de viajeros en trayectos que no superen 50 km:",
            "están exentos del uso del tacógrafo.",
            "50",
        ),
        (
            "¿Puede un conductor, que realiza un único viaje de transporte discrecional de viajeros, posponer el descanso semanal hasta 12 días, desde el final del descanso anterior, si efectúa después dos descansos semanales normales consecutivos?",
            "Sí, pero solo si parte de un descaso semanal previo de 45 horas.",
            "45",
        ),
        (
            "¿Cuál será el domicilio de una sociedad anónima española?",
            "En caso de discrepancia entre el domicilio registral y el lugar donde radique su principal explotación, los terceros podrán considerar como domicilio cualquiera de ellos.",
            "terceros",
        ),
        (
            "La formación continua del CAP de viajeros tiene una duración de:",
            "35 horas.",
            "35",
        ),
    ]
    failed = 0
    for q, a, needle in cases:
        text = explanation_for(q, a) or ""
        if needle.lower() not in text.lower():
            print(f"FAIL {needle!r}\n  Q={q[:80]}\n  got={text[:160]!r}", file=sys.stderr)
            failed += 1
        if re.search(r"cami[oó]n", text, re.I):
            print(f"FAIL camión in viajeros text: {text[:120]!r}", file=sys.stderr)
            failed += 1
        if "35 horas" in a and re.search(r"45 km", text, re.I):
            print(f"FAIL CAP 35h <- 45 km/h: {text[:120]!r}", file=sys.stderr)
            failed += 1
    if failed:
        raise SystemExit(f"self-check failed: {failed}")
    print("viajeros temario self-check: ok")


def main() -> None:
    self_check()
    write_json()
    coverage()


if __name__ == "__main__":
    main()
