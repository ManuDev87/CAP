"""Catálogo normativo CAP viajeros (BOE / EUR-Lex).

Solo reglas con cita oficial segura. El temario didáctico va en
help_temario_viajeros.py. Nunca se inventa un número de artículo.
"""

from __future__ import annotations

import re

from help_catalog import (
    URL_561,
    URL_165,
    URL_CAP,
    URL_LOTT,
    URL_LSV,
    URL_RGC,
    URL_ROTT,
    URL_TACOGRAFO_EX,
    RULES as MERCANCIAS_RULES,
    Rule,
)

URL_1073 = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1073"
URL_181 = "https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011R0181"

_CAMION = re.compile(
    r"cami[oó]n|cisterna|portacontenedor|MDPE|MPCE|ATP\b|animales vivos|"
    r"rompeolas|veh[ií]culo bater[ií]a|granel",
    re.I,
)


def _shared_from_mercancias() -> list[Rule]:
    """Tiempos, tacógrafo, CAP, sociedades, PRL… iguales en viajeros, sin hablar de camión."""
    out: list[Rule] = []
    for rule in MERCANCIAS_RULES:
        blob = " ".join(
            [
                rule.explanation,
                *rule.q_all,
                *rule.q_any,
                *rule.a_all,
                *rule.a_any,
            ]
        )
        if _CAMION.search(blob):
            continue
        out.append(rule)
    return out


VIAJEROS_ONLY: list[Rule] = [
    Rule(
        id="vde_clave",
        q_any=[
            r"clave.*VDE",
            r"identifica registralmente con la clave",
            r"autorizaci[oó]n de transporte p[uú]blico de viajeros",
        ],
        a_any=[r"\bVDE\b"],
        exclude_q=[r"privado complementario", r"mercanc"],
        explanation=(
            "La autorización de transporte público de viajeros en autobús se "
            "identifica registralmente con la clave VDE y habilita en todo el "
            "territorio nacional (discrecional; el regular de uso general va por "
            "concesión o contrato)."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), autorizaciones de viajeros",
        source_url=URL_ROTT,
        priority=22,
    ),
    Rule(
        id="vpce_clave",
        q_all=[r"privado complementario de viajeros"],
        a_any=[r"\bVPCE\b"],
        explanation=(
            "El transporte privado complementario de viajeros en autobús se "
            "identifica registralmente con la clave VPCE."
        ),
        source="Reglamento de la LOTT (RD 1211/1990), autorizaciones de viajeros",
        source_url=URL_ROTT,
        priority=22,
    ),
    Rule(
        id="discrecional_sin_reiteracion",
        q_any=[r"transporte discrecional de viajeros", r"discrecional de viajeros es"],
        a_any=[r"sin reiteraci[oó]n", r"itinerario", r"todas las respuestas"],
        exclude_q=[r"12 d[ií]as", r"12 per[ií]odos", r"licencia comunitaria"],
        explanation=(
            "El transporte discrecional de viajeros se presta sin reiteración de "
            "itinerario, calendario ni horario (no es un regular de uso general)."
        ),
        source="Ley 16/1987 (LOTT), transporte discrecional de viajeros",
        source_url=URL_LOTT,
        priority=20,
    ),
    Rule(
        id="regular_horarios_prefijados",
        q_all=[r"transporte regular de viajeros"],
        a_any=[r"horarios est[aá]n prefijados", r"calendarios y horarios"],
        explanation=(
            "En el regular de viajeros de uso general, itinerario, calendarios y "
            "horarios están prefijados y se ofrece con carácter general."
        ),
        source="Ley 16/1987 (LOTT), transporte regular de viajeros",
        source_url=URL_LOTT,
        priority=20,
    ),
    Rule(
        id="licencia_comunitaria_viajeros",
        q_any=[r"licencia comunitaria para el transporte de viajeros", r"licencia comunitaria para transporte de viajeros"],
        a_any=[r"transportista", r"internacional", r"10 a[nñ]os", r"copias"],
        explanation=(
            "La licencia comunitaria de viajeros la otorga el Estado de "
            "establecimiento al transportista que cumple los requisitos. Habilita "
            "servicios internacionales en la UE; validez hasta 10 años. Se expide "
            "un original y copias auténticas, tantas como vehículos use en "
            "internacional."
        ),
        source="Reglamento (CE) n.º 1073/2009, artículos 4 y 5",
        source_url=URL_1073,
        priority=24,
    ),
    Rule(
        id="licencia_comunitaria_validez_10",
        q_all=[r"licencia comunitaria", r"plazo de val"],
        a_any=[r"10 a[nñ]os"],
        explanation=(
            "La licencia comunitaria de transporte de viajeros se expide por "
            "periodos renovables de hasta 10 años."
        ),
        source="Reglamento (CE) n.º 1073/2009, artículo 4",
        source_url=URL_1073,
        priority=23,
    ),
    Rule(
        id="cabotaje_viajeros_licencia",
        q_all=[r"cabotaje", r"viajeros"],
        a_any=[r"licencia comunitaria", r"uni[oó]n europea"],
        explanation=(
            "El cabotaje de viajeros en autobús en otro Estado de la UE lo pueden "
            "hacer transportistas establecidos en la Unión que dispongan de "
            "licencia comunitaria, con los límites del Reglamento 1073/2009."
        ),
        source="Reglamento (CE) n.º 1073/2009, cabotaje de viajeros",
        source_url=URL_1073,
        priority=22,
    ),
    Rule(
        id="r561_12_dias_discrecional",
        q_any=[r"12 d[ií]as", r"12 per[ií]odos"],
        a_any=[r"45 horas", r"discrecional", r"s[ií]"],
        explanation=(
            "En un único servicio discrecional de viajeros (ocasional), el "
            "descanso semanal puede aplazarse hasta 12 periodos de 24 horas si se "
            "parte de un descanso semanal normal de al menos 45 horas y después se "
            "compensan dos descansos semanales normales, según el Reglamento 561/2006."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 8.6 bis (texto consolidado)",
        source_url=URL_561,
        priority=26,
    ),
    Rule(
        id="tacografo_regular_50km",
        q_any=[
            r"regular de viajeros.*50\s*km",
            r"trayectos que no superen 50",
            r"menos de 50 km",
            r"no superen 50 km",
        ],
        a_any=[r"exent"],
        explanation=(
            "Los vehículos de transporte regular de viajeros en trayectos que no "
            "superen 50 km están exentos de tacógrafo. Si el limitador toma la "
            "señal del tacógrafo, siguen obligados a las revisiones del aparato "
            "cuando lo lleven instalado."
        ),
        source="Reglamento (CE) n.º 561/2006, artículo 3, y RD 640/2007",
        source_url=URL_TACOGRAFO_EX,
        priority=24,
    ),
    Rule(
        id="carril_bus_prohibido",
        q_any=[r"carril reservado para autobuses", r"carril.*autob[uú]s"],
        a_any=[r"prohibida", r"no, tienen prohibida", r"^no"],
        exclude_q=[r"marca.*discontinua", r"VAO", r"alta ocupaci[oó]n"],
        explanation=(
            "Con carácter general, quien no sea transporte colectivo de viajeros "
            "tiene prohibido circular por un carril reservado para autobuses "
            "debidamente señalizado."
        ),
        source="Reglamento General de Circulación (RD 1428/2003), carriles reservados",
        source_url=URL_RGC,
        priority=20,
    ),
    Rule(
        id="pmr_asistencia_36h",
        q_all=[r"movilidad reducida", r"36"],
        a_any=[r"36 horas"],
        explanation=(
            "En servicios regulares de autobús/autocar, el transportista presta "
            "asistencia a personas con discapacidad o movilidad reducida si se "
            "notifica la necesidad con una antelación mínima de 36 horas."
        ),
        source="Reglamento (UE) n.º 181/2011, derechos de los viajeros de autobús y autocar",
        source_url=URL_181,
        priority=24,
    ),
    Rule(
        id="pmr_acompanante_gratuito",
        q_any=[r"movilidad reducida", r"discapacidad"],
        a_any=[r"viaje gratuitamente", r"acompa[nñ]ada"],
        explanation=(
            "Si el transportista exige que la persona con discapacidad o movilidad "
            "reducida vaya acompañada, esa persona de asistencia viaja sin pagar."
        ),
        source="Reglamento (UE) n.º 181/2011, derechos de los viajeros de autobús y autocar",
        source_url=URL_181,
        priority=22,
    ),
    Rule(
        id="equipaje_1200_accidente",
        q_all=[r"equipaje", r"1.?200"],
        explanation=(
            "En caso de accidente, la indemnización por pérdida o daño del "
            "equipaje en autobús/autocar tiene un tope de 1.200 euros por pieza "
            "en la normativa europea de derechos de los viajeros."
        ),
        source="Reglamento (UE) n.º 181/2011, compensación por equipaje en accidente",
        source_url=URL_181,
        priority=22,
    ),
    Rule(
        id="autorizacion_discrecional_empresa",
        q_all=[r"autorizaci[oó]n administrativa", r"discrecionales en autob[uú]s"],
        a_any=[r"una por empresa"],
        explanation=(
            "La autorización de transporte discrecional de viajeros en autobús se "
            "otorga a la empresa y ampara un número determinado de vehículos, no "
            "«un permiso por autobús» suelto."
        ),
        source="Ley 16/1987 (LOTT) y Reglamento de la LOTT (RD 1211/1990)",
        source_url=URL_ROTT,
        priority=20,
    ),
    Rule(
        id="interior_viajeros_pais",
        q_all=[r"transporte interior de viajeros"],
        a_any=[r"no sobrepasa los l[ií]mites de un pa[ií]s", r"l[ií]mites de un pa[ií]s"],
        explanation=(
            "Transporte interior de viajeros es el que no sobrepasa los límites "
            "de un país (frente al internacional)."
        ),
        source="Ley 16/1987 (LOTT), ámbito de los transportes",
        source_url=URL_LOTT,
        priority=16,
    ),
    Rule(
        id="regular_urbano_ayuntamiento",
        q_all=[r"regular de viajeros", r"urbano"],
        a_any=[r"ayuntamientos"],
        explanation=(
            "La titularidad de los regulares de viajeros de uso general de "
            "carácter urbano corresponde a los ayuntamientos."
        ),
        source="Ley 16/1987 (LOTT), transportes urbanos",
        source_url=URL_LOTT,
        priority=18,
    ),
    Rule(
        id="marca_bus",
        q_any=[r"inscripci[oó]n.?BUS", r"marca blanca con la inscripci[oó]n"],
        a_any=[r"reservado", r"autobuses"],
        explanation=(
            "La marca vial con la inscripción BUS indica que ese carril o zona "
            "está reservado, temporal o permanentemente, a autobuses y, en su "
            "caso, otros vehículos que la señalización autorice."
        ),
        source="Reglamento General de Circulación (RD 1428/2003), marcas viales",
        source_url=URL_RGC,
        priority=16,
    ),
    Rule(
        id="cap_45_kmh",
        q_any=[r"certificado de aptitud profesional es necesario", r"CAP.*45"],
        a_any=[r"45 kil[oó]metros", r"45 km"],
        explanation=(
            "El CAP es exigible para conducir autobuses o autocares cuya velocidad "
            "máxima autorizada supere 45 km/h, con las exclusiones del RD 284/2021."
        ),
        source="Real Decreto 284/2021 (CAP), ámbito de aplicación",
        source_url=URL_CAP,
        priority=20,
    ),
    Rule(
        id="regular_interurbano_contrato",
        q_all=[r"regular interurbano", r"uso general"],
        a_any=[r"contrato de gesti[oó]n", r"servicio p[uú]blico"],
        explanation=(
            "Para prestar un regular interurbano de uso general hace falta un "
            "contrato de gestión de servicio público (concesión o contrato) con la "
            "Administración titular, no basta la autorización discrecional VDE."
        ),
        source="Ley 16/1987 (LOTT), transporte regular de uso general",
        source_url=URL_LOTT,
        priority=20,
    ),
    Rule(
        id="cap_viajeros_anexo",
        q_all=[r"cualificaci[oó]n inicial", r"viajeros"],
        explanation=(
            "La cualificación inicial y la formación continua CAP de viajeros las "
            "gestionan los órganos competentes para las autorizaciones de "
            "transporte de viajeros, conforme al RD 284/2021."
        ),
        source="Real Decreto 284/2021 (CAP)",
        source_url=URL_CAP,
        priority=14,
    ),
]

RULES: list[Rule] = VIAJEROS_ONLY + _shared_from_mercancias()
