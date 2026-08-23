"""Temario CAP (mercancías): explicaciones didácticas sin citar un artículo.

Se exporta a cap-app/src/data/help-tips.json. El matcher prueba `tips` en orden
y, si no hay match, `glossary`. Más específico primero.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from help_key import correct_text_of, help_key

ROOT = Path(__file__).resolve().parents[1]
EXAM_DIR = ROOT / "cap-app" / "src" / "data" / "exams"
OUT_PATH = ROOT / "cap-app" / "src" / "data" / "help-tips.json"
BANK_PATH = ROOT / "cap-app" / "src" / "data" / "help-bank.json"


def tip(
    text: str,
    *,
    all: list[str] | None = None,
    any: list[str] | None = None,
    answer: list[str] | None = None,
) -> dict:
    d: dict = {"text": text}
    if all:
        d["all"] = all
    if any:
        d["any"] = any
    if answer:
        d["answer"] = answer
    return d


# ----- tips (orden = prioridad) -----
TIPS: list[dict] = [
    # Tacógrafo / centro de ensayo
    tip(
        "En el tacógrafo digital hay cuatro tarjetas: conductor, empresa, centro de ensayo (taller autorizado) y control (inspectores). No existe tarjeta de descarga, de visita ni de emergencia.",
        any=[r"tipos de tarjetas", r"tipos diferentes pueden ser las tarjetas"],
        answer=[r"centro de ensayo"],
    ),
    tip(
        "Las tarjetas de conductor, empresa y control valen 5 años. La de centro de ensayo (taller) vale 1 año, porque se usa para instalar, calibrar y comprobar el aparato.",
        any=[r"per[ií]odo de validez", r"validez tienen las tarjetas"],
        answer=[r"cinco a[nñ]os", r"centro de ensayo que tiene uno"],
    ),
    tip(
        "La tarjeta de centro de ensayo es la del taller autorizado: identifica al titular y sirve para probar, activar, calibrar y transferir datos del tacógrafo. No es la del conductor ni la de la empresa.",
        any=[r"probar, activar, calibrar", r"calibrar y activar", r"permite calibrar"],
        answer=[r"centro de ensayo"],
    ),
    tip(
        "El tacógrafo digital se activa la primera vez que se inserta una tarjeta de centro de ensayo (en el taller homologado), no al darle corriente ni con la tarjeta de empresa.",
        any=[r"se activa autom[aá]ticamente"],
        answer=[r"centro de ensayo"],
    ),
    tip(
        "El fondo rojo identifica la tarjeta de centro de ensayo (taller). Conductor: clara/blanca; empresa: amarilla; control: azul.",
        all=[r"rojo", r"tarjeta"],
        answer=[r"centro de ensayo"],
    ),
    tip(
        "Da igual que trabaje para varias empresas o conduzca varios vehículos: el conductor tiene una sola tarjeta de conductor, personal e intransferible.",
        any=[r"cu[aá]ntas tarjetas de conductor"],
        answer=[r"^una\.?$"],
    ),
    tip(
        "En el tacógrafo analógico los datos van en la hoja de registro (disco-diagrama). Si hay dos conductores, cada uno usa su disco.",
        any=[r"hojas de registro", r"disco"],
        answer=[r"hojas de registro", r"su disco", r"cada conductor"],
    ),
    tip(
        "El tacógrafo analógico lleva siempre indicador de velocidad (y de km). Es un dato visible en el frontal del aparato.",
        all=[r"indicador de velocidad", r"anal[oó]gico"],
    ),
    tip(
        "Están obligados a tacógrafo, en general, los vehículos de mercancías de más de 3,5 t de MMA. Hay exenciones (reparto corto, puerto, etc.).",
        any=[r"obligados a utilizar tac[oó]grafo", r"uso de tac[oó]grafo"],
        answer=[r"3,5", r"exento"],
    ),
    tip(
        "Un vehículo que solo mueve mercancía dentro del recinto de un puerto está exento de tacógrafo.",
        all=[r"puerto"],
        answer=[r"exento"],
    ),
    tip(
        "En cursos de aprendizaje de la conducción o del CAP, el vehículo lleva tacógrafo instalado, pero no hace falta que esté calibrado.",
        all=[r"aprendizaje", r"tac[oó]grafo"],
        answer=[r"calibr"],
    ),
    tip(
        "A efectos de tiempos de conducción, la «semana» va de 00:00 del lunes a 24:00 del domingo.",
        any=[r"00:00 del lunes", r"24:00 del domingo"],
        answer=[r"semana"],
    ),
    tip(
        "Sin una pausa, el máximo de conducción seguida es 4 h 30 min. Después, 45 minutos de pausa (o 15+30).",
        any=[r"sin hacer una interrupci[oó]n", r"4 horas y 30"],
        answer=[r"4 horas y 30", r"4 h"],
    ),
    tip(
        "La conducción semanal máxima es 56 horas. Si ya lleva 50, le quedan 6 esa semana.",
        any=[r"50 horas de conducci[oó]n"],
        answer=[r"6 horas"],
    ),
    tip(
        "El tacógrafo digital registra de forma automática la actividad del conductor (conducción, descanso, disponibilidad, otros trabajos).",
        any=[r"datos registra obligatoriamente un tac[oó]grafo digital"],
        answer=[r"actividad"],
    ),
    # Consumo / zona verde
    tip(
        "La zona verde del cuentarrevoluciones es el régimen económico (menor consumo específico). Circular por encima de esa zona sube el consumo: el motor gira más alto de lo necesario.",
        any=[r"zona marcada.*verde", r"por encima de esa zona", r"revoluciones superior"],
        answer=[r"mayor consumo", r"aumenta"],
    ),
    tip(
        "Para ahorrar carburante hay que mirar el cuentarrevoluciones y cambiar en la zona verde, con la marcha más larga posible.",
        any=[r"ahorrar carburante", r"observar el cuentarrevoluciones"],
        answer=[r"cuentarrevoluciones", r"zona.*verde"],
    ),
    tip(
        "La aerodinámica influye mucho en el consumo: a más velocidad, más aire que desplazar. Deflectores bien regulados y lona/carga bien colocada bajan la resistencia.",
        any=[r"factor influye en el consumo", r"aerodin[aá]mica"],
        answer=[r"aerodin[aá]mica"],
    ),
    tip(
        "La carga transportada aumenta la masa y las resistencias (rodadura, pendiente): por eso sube el consumo.",
        any=[r"factor influye en el consumo"],
        answer=[r"carga"],
    ),
    tip(
        "El consumo a los 100 km depende del vehículo y del estilo de conducción (rpm, anticipación, velocidad), no solo del diseño del motor.",
        any=[r"recorrer 100 km", r"estilo de conducci[oó]n"],
        answer=[r"estilo de conducci[oó]n"],
    ),
    tip(
        "En llano, acelerador poco pisado (poca carga de bomba) y marcha larga: menos consumo. Pisar a fondo en marcha corta gasta más.",
        any=[r"pedal del acelerador", r"poco presionado", r"poco pisado"],
    ),
    tip(
        "Marchas cortas = más rpm para la misma velocidad = más consumo. Conviene la relación más larga que permita el par.",
        any=[r"aumenta con marchas cortas", r"relaci[oó]n de marchas m[aá]s alta"],
    ),
    tip(
        "Reducir de marchas lo más tarde posible (sin calar) mantiene rpm bajas. Reducir pronto sube el régimen y el consumo.",
        any=[r"reducir de marchas lo m[aá]s pronto"],
        answer=[r"^no"],
    ),
    tip(
        "Para gastar menos se circula en la zona de par alto (zona verde), no en la de potencia máxima: ahí el consumo se dispara.",
        any=[r"mayor par motor", r"potencia m[aá]xima"],
        answer=[r"par motor", r"consumos son muy elevados"],
    ),
    tip(
        "El béndix es del motor de arranque: no interviene en el consumo de carburante en marcha.",
        any=[r"b[eé]ndix"],
    ),
    tip(
        "El color de la carrocería no es una resistencia al avance ni un factor de consumo.",
        any=[r"color de la carrocer[ií]a"],
    ),
    tip(
        "Ventanillas bajadas a velocidad de carretera empeoran la aerodinámica y suben el consumo. Mejor climatizador o ventanillas subidas.",
        any=[r"cristales de las ventanillas"],
    ),
    tip(
        "El cambio automático suele gastar más que uno manual bien usado, porque el motor no siempre va en el régimen más económico.",
        any=[r"cajas de cambio autom[aá]tico"],
    ),
    tip(
        "Duplicar la velocidad (p. ej. 40 a 80 km/h) más que duplica el consumo: la resistencia del aire crece con el cuadrado de la velocidad.",
        any=[r"40 kil[oó]metros", r"80 kil[oó]metros"],
    ),
    tip(
        "Un aceite de calidad reduce el rozamiento entre piezas y, con ello, las pérdidas de potencia: el motor gasta menos carburante.",
        any=[r"aceite de alta calidad", r"calidad del aceite", r"aceite del sistema de lubricaci"],
        answer=[r"rozamiento", r"p[eé]rdidas de potencia", r"^s[ií]", r"consumo"],
    ),
    tip(
        "En frío, circular suave hasta que el motor coja temperatura: acelerones en frío gastan y desgastan.",
        any=[r"arrancar en fr[ií]o"],
    ),
    tip(
        "La caja de velocidades hay que usarla para que el motor gire en zona económica (verde), no al límite de potencia.",
        any=[r"utilizaci[oó]n adecuada de la caja"],
        answer=[r"zona econ[oó]mica"],
    ),
    # Pendiente / cambios
    tip(
        "Al cambiar de marcha en una rampa se pisa el embrague: un instante sin par en las ruedas. El camión pierde empuje y reduce velocidad. Esa pérdida depende de la inclinación y de la masa: a más rampa o más peso, más se nota.",
        any=[
            r"cambio durante la subida",
            r"cambio de marcha durante la subida",
            r"m[aá]s cambios realice",
            r"pierde potencia",
        ],
    ),
    tip(
        "Para reducir la resistencia a la pendiente conviene perder el menor tiempo posible sin tracción: menos cambios, marchas adecuadas, no embragar de más.",
        any=[r"reducir la resistencia a la pendiente"],
        answer=[r"n[uú]mero de cambios"],
    ),
    tip(
        "La marcha adecuada depende sobre todo del perfil de la carretera (rampa, llano, bajada) y de la carga, no de un número fijo de marchas.",
        any=[r"relaci[oó]n correcta de la caja", r"perfil de la carretera"],
    ),
    # Caja de cambios / motor
    tip(
        "La caja de cambios transmite el par del motor hacia las ruedas y permite elegir la relación de marchas. En el temario se marca que conecta el motor con el sistema de transmisión (el embrague es quien acopla/desacopla).",
        any=[r"caja de cambios o caja de velocidades", r"caja de velocidades es el elemento"],
        answer=[r"conectar el motor"],
    ),
    tip(
        "Las rpm del motor y las de las ruedas no son iguales: la caja de cambios (y el diferencial) multiplican o reducen el régimen.",
        any=[r"revoluciones del motor y de las ruedas"],
        answer=[r"^no"],
    ),
    tip(
        "Un motor es elástico cuando da un par alto en un margen amplio de rpm: permite menos cambios y más holgura en rampa.",
        any=[r"motor es el[aá]stico"],
    ),
    tip(
        "El par máximo es la mayor fuerza de giro que puede dar el motor (N·m), en un régimen medio; la potencia máxima (kW) llega a más rpm.",
        any=[r"par m[aá]ximo de un motor", r"par motor se mide"],
    ),
    tip(
        "La potencia se expresa en kilovatios (kW); el par, en newton·metro (N·m).",
        any=[r"unidades se mide la potencia"],
        answer=[r"kilovatios", r"\bkW\b"],
    ),
    tip(
        "Diésel de inyección directa: mejor rendimiento y menor consumo específico que uno de inyección indirecta.",
        any=[r"inyecci[oó]n directa"],
        answer=[r"menor consumo"],
    ),
    # Resistencias / dinámica
    tip(
        "La resistencia del aire siempre va en sentido contrario al movimiento y crece mucho con la velocidad. Deflectores y carga bien colocada la reducen.",
        any=[r"resistencia del aire", r"resistencia aerodin[aá]mica"],
    ),
    tip(
        "Rozamiento o resistencia a la rodadura: la fuerza que se opone al avance por el contacto neumático-calzada. Sube con masa, baja presión y firme blando.",
        any=[r"resistencia por rozamiento", r"resistencia al rozamiento", r"grado de rozamiento"],
    ),
    tip(
        "Si la fuerza motriz es menor que la suma de resistencias, el motor no puede mantener el movimiento y se cala.",
        any=[r"fuerza disponible.*inferior", r"el motor se calar"],
    ),
    tip(
        "La fuerza motriz es la que el motor transmite a las ruedas para vencer las resistencias y mover el camión.",
        any=[r"fuerzas intervienen en el movimiento"],
        answer=[r"fuerza motriz"],
    ),
    tip(
        "La gravedad (atracción terrestre) es la fuerza más evidente: actúa siempre y, en rampa, genera la resistencia a la pendiente.",
        any=[r"fuerza m[aá]s conocida", r"atracci[oó]n terrestre"],
    ),
    tip(
        "Energía cinética: la que tiene el vehículo por estar en movimiento (½·m·v²). Depende de la masa y, al cuadrado, de la velocidad. Al frenar hay que disiparla.",
        any=[r"energ[ií]a que tiene un veh[ií]culo", r"energ[ií]a cin[eé]tica"],
        answer=[r"cin[eé]tica"],
    ),
    tip(
        "Al frenar, parte de la masa que carga el eje trasero pasa al delantero: desplazamiento de masas. Por eso el eje de dirección se carga más al frenar.",
        any=[r"desplazamiento de masas", r"peso que soporta el eje trasero"],
    ),
    tip(
        "Hay deslizamiento cuando la velocidad de giro de la rueda no coincide con la lineal del camión (bloqueo al frenar o patinazo al acelerar).",
        any=[r"deslizamiento", r"velocidad angular o de giro"],
    ),
    tip(
        "Fuerzas son las acciones que cambian el reposo o el movimiento. Si la suma de fuerzas y pares no es cero, el camión acelera, frena o gira.",
        any=[r"modifican el estado de movimiento", r"suma de las fuerzas"],
    ),
    tip(
        "Resistencia a la aceleración (inercia): al acelerar o frenar, la masa se resiste al cambio de velocidad.",
        any=[r"resistencia a la aceleraci[oó]n"],
    ),
    tip(
        "Inercia dinámica del vehículo en movimiento: función de masa y velocidad.",
        any=[r"inercia din[aá]mica"],
    ),
    tip(
        "Cabeceo: rotación sobre el eje transversal (morro arriba/abajo) al acelerar o frenar. Balanceo: sobre el longitudinal (se inclina a un lado).",
        any=[r"cabeceo"],
    ),
    tip(
        "El ASR evita que las ruedas motrices patinen al acelerar (control de tracción). El ABS evita que se bloqueen al frenar.",
        any=[r"\bASR\b"],
    ),
    tip(
        "El ABS es seguridad activa: ayuda a no perder el control antes del accidente (no bloquea las ruedas al frenar).",
        any=[r"\bABS\b", r"antiblock", r"antibloqueo"],
        answer=[r"activa", r"ABS"],
    ),
    # Frenos / ralentizador
    tip(
        "El fading es la pérdida de frenada por sobrecalentamiento del freno de servicio. El ralentizador (eléctrico, hidráulico, de motor) retiene en bajadas y evita el fading.",
        any=[r"fading", r"ralentizador el[eé]ctrico"],
    ),
    tip(
        "En bajadas largas se usa el ralentizador (retárder) para no calentar el freno de servicio.",
        any=[r"bajar una fuerte pendiente"],
        answer=[r"ralentizador"],
    ),
    tip(
        "Retárder = ralentizador hidrodinámico (aceite). Su potencia de frenado depende de la energía del aceite. Se usa de forma progresiva y es compatible con el ABS.",
        any=[r"ret[aá]rder", r"retardador hidr[aá]ulico", r"ralentizador del tipo"],
    ),
    tip(
        "El freno-motor cierra en parte la salida de gases (válvula en el escape) y retiene. Para usarlo bien se elige una marcha más corta.",
        any=[r"v[aá]lvula que cierra parcialmente", r"freno en el motor", r"freno motor"],
    ),
    tip(
        "Si el freno no evacua el calor, pierde eficacia o deja de frenar (fading). El de estacionamiento neumático no debe accionarse con los frenos muy calientes.",
        any=[r"incapaz de evacuar el calor", r"freno de estacionamiento"],
    ),
    # Carga / estiba / ejes
    tip(
        "Estiba es colocar y sujetar la carga para que viaje segura, sin dañarse ni desestabilizar el vehículo. Lo pesado abajo y bien repartido; lo ligero arriba.",
        any=[r"qu[eé] es la estiba", r"buena estiba", r"incrementar la seguridad"],
        answer=[r"colocar la carga", r"m[aá]s pesadas", r"desperfectos"],
    ),
    tip(
        "Carga útil = MMA − tara: lo que puede transportar el camión. El volumen útil es el espacio de la caja destinado a la mercancía.",
        any=[r"carga [uú]til", r"restar la TARA", r"volumen [uú]til"],
    ),
    tip(
        "Sobrecargar un eje empeora el control de la velocidad, daña eje y neumáticos y, en el de dirección, hace la conducción pesada. También sobrecalienta neumáticos.",
        any=[r"sobrecarga del eje", r"sobrecarga del eje de direcci[oó]n", r"sobrecalentamiento de los neum[aá]ticos"],
    ),
    tip(
        "El contenedor permite transbordar la mercancía sin ruptura de carga (sin abrir ni reestibar bulto a bulto).",
        any=[r"contenedor se caracteriza"],
    ),
    tip(
        "Envase: recipiente que individualiza y protege la unidad de producto. Embalaje: medio que protege la mercancía para expedición o almacén.",
        any=[r"individualizar, dosificar", r"se puede describir el embalaje"],
    ),
    tip(
        "Para rellenar huecos en la estiba no se usan comburentes (alimentan el fuego). Se usan materiales inertes, bolsas, maderas adecuadas, etc.",
        any=[r"rellenar los huecos"],
        answer=[r"comburentes"],
    ),
    # ATP
    tip(
        "El ATP regula el transporte internacional de mercancías perecederas y los vehículos de temperatura controlada (isotermos, refrigerantes, frigoríficos, caloríficos). Una cisterna genérica no es una categoría ATP.",
        any=[r"\bATP\b", r"pereceder"],
    ),
    tip(
        "Marcas ATP: letras. CRA = calorífico reforzado clase A. RNA = refrigerante normal clase A. RRA = refrigerante reforzado clase A.",
        any=[r"\bCRA\b", r"\bRNA\b", r"\bRRA\b", r"marca de identificaci[oó]n"],
    ),
    # Autorizaciones / empresas
    tip(
        "MDLE: transporte público de mercancías con vehículos de MMA no superior a 3,5 t (ligeros). MDPE: más de 3,5 t. MPCE: privado complementario. OT: intermediación (operador/agencia).",
        any=[r"\bMDLE\b", r"\bMDPE\b", r"\bMPCE\b", r"clave OT"],
    ),
    tip(
        "El arrendamiento de vehículos sin conductor para transporte público de mercancías no necesita autorización de transporte (el que hace el transporte sí, si procede).",
        any=[r"arrendamiento de veh[ií]culos sin conductor"],
        answer=[r"no la necesitar"],
    ),
    tip(
        "Vehículos oficiales y transportes de carácter oficial suelen estar exentos de autorización de transporte.",
        any=[r"car[aá]cter oficial", r"veh[ií]culos oficiales"],
        answer=[r"exent"],
    ),
    tip(
        "El privado complementario exige que la mercancía sea de la empresa y tenga origen o destino en un centro donde desarrolla su actividad principal. La autorización depende de la MMA. No exige capacidad financiera como el público.",
        any=[r"privado complementario"],
    ),
    tip(
        "Las autorizaciones de transporte público de mercancías se otorgan a la empresa (no «al camión» suelto). Se pueden adscribir más vehículos si hay capacidad financiera bastante.",
        any=[r"autorizaci[oó]n de empresa", r"ampliar el n[uú]mero de veh[ií]culos"],
    ),
    tip(
        "El operador logístico, para intermediar, necesita autorización de operador de transporte (clave OT).",
        any=[r"operador log[ií]stico"],
    ),
    tip(
        "Transporte público hasta 2 t de MMA está exento de autorización administrativa de transporte.",
        any=[r"hasta 2 toneladas"],
    ),
    tip(
        "Interiores e internacionales: clasificación por el ámbito geográfico. Públicos y privados: por la naturaleza (cuenta ajena o propia).",
        any=[r"seg[uú]n el [aá]mbito", r"en funci[oó]n de", r"su naturaleza"],
        answer=[r"interiores e internacionales", r"naturaleza"],
    ),
    tip(
        "Es internacional el transporte cuyo itinerario pasa, aunque sea en parte, por un Estado extranjero (p. ej. Gerona–San Sebastián por Francia).",
        any=[r"transporte internacional"],
        answer=[r"estado extranjero", r"extranjero"],
    ),
    tip(
        "Licencia comunitaria: documento UE que autoriza transporte internacional de mercancías entre Estados miembros. Validez hasta 10 años.",
        any=[r"licencia comunitaria"],
    ),
    tip(
        "Autorización bilateral: acuerdo entre dos países. La de tránsito solo permite cruzar el país, no cargar/descargar en él. CEMT: multilateral entre estados CEMT.",
        any=[r"bilateral", r"\bCEMT\b"],
    ),
    tip(
        "La atomización (muchas empresas muy pequeñas) dificulta formación, inversión y negociación: en el temario se ve como un problema.",
        any=[r"atomizaci[oó]n"],
    ),
    # Sociedades
    tip(
        "Si el domicilio registral no coincide con el de la administración o la explotación principal, los terceros pueden tomar como domicilio cualquiera de los dos.",
        any=[r"domicilio de una sociedad", r"domicilio registral", r"cu[aá]l ser[aá] el domicilio"],
        answer=[r"terceros", r"discrepancia", r"cualquiera de ellos"],
    ),
    tip(
        "Sociedad anónima: al constituirla hay que desembolsar al menos el 25 % del capital (mínimo 60.000 €).",
        all=[r"sociedad(es)? an[oó]nimas?", r"desembols"],
        answer=[r"25"],
    ),
    tip(
        "Sociedad anónima: capital social mínimo 60.000 €. Junta ordinaria: en los 6 primeros meses, para aprobar cuentas.",
        any=[r"sociedad an[oó]nima", r"capital social"],
        answer=[r"60\.000", r"60.000", r"junta ordinaria"],
    ),
    tip(
        "En la SL los socios no responden personalmente de las deudas sociales (solo con lo aportado).",
        any=[r"sociedad de responsabilidad limitada", r"deudas sociales"],
    ),
    tip(
        "Cooperativas: de primer y segundo grado. Primer grado: mínimo tres socios. Las de transportistas se inscriben en el Registro de Sociedades Cooperativas.",
        any=[r"cooperativ"],
    ),
    tip(
        "Sociedades laborales: normalmente mínimo tres socios y más del 50 % del capital en manos de los trabajadores.",
        any=[r"sociedades laborales"],
    ),
    # Aduanas / Schengen
    tip(
        "Exportación: salida del territorio aduanero de la Unión de mercancías de la Unión. Ese es el régimen de exportación.",
        any=[r"(?<!re)exportaci[oó]n", r"r[eé]gimen aduanero"],
        answer=[r"salida del territorio", r"(?<!re)exportaci[oó]n"],
    ),
    tip(
        "No todos los países de la cooperación Schengen tienen que ser miembros del Espacio Schengen: el Tratado de Ámsterdam integró esa cooperación en la UE.",
        all=[r"schengen", r"[aá]msterdam"],
    ),
    tip(
        "El Espacio Schengen es un territorio europeo sin controles fronterizos internos habituales entre Estados adheridos. Distingue fronteras interiores y exteriores.",
        any=[r"espacio schengen", r"schengen"],
        answer=[r"fronter", r"controles", r"espacio schengen", r"estados adher"],
    ),
    tip(
        "El certificado de origen acredita el país de origen de la mercancía en el tráfico internacional.",
        any=[r"certificados de origen"],
    ),
    # Seguridad vial / accidente
    tip(
        "La declaración amistosa (parte europeo) sirve para tramitar el siniestro entre aseguradoras. La firman los conductores, se entrega a la compañía, puede llevar croquis y observaciones. No reduce el consumo ni garantiza más indemnización.",
        any=[r"declaraci[oó]n amistosa"],
    ),
    tip(
        "Ante un incidente (avería, pinchazo): lo primero es que el vehículo no sea un obstáculo (apartarlo, señalizar). PAS: proteger, avisar, socorrer, en ese orden. No dar de comer ni beber a heridos.",
        any=[r"convierta en un obst[aá]culo", r"\bPAS\b", r"proteger, avisar", r"proteger, 2", r"alertar", r"segundo objetivo", r"dar comida"],
    ),
    tip(
        "Niebla: atención a las marcas viales (eje y bordes). Lluvia: más peligro con las primeras gotas (película de grasa) y más distancia. Hielo: pérdida de adherencia, sobre todo en sombras y si un lado está seco y el otro no.",
        any=[r"\bniebla\b", r"primeras gotas"],
    ),
    tip(
        "Con lluvia hay que aumentar la distancia de seguridad: el asfalto está más resbaladizo y la frenada se alarga.",
        any=[r"lluvia", r"lloviendo"],
        answer=[r"distancia de seguridad", r"aumentar la distancia"],
    ),
    tip(
        "El hielo reduce la adherencia. Aparece sobre todo en zonas de sombra y a primera hora de la mañana.",
        any=[r"hielo", r"calzada nevada", r"calzada helada"],
        answer=[r"adherencia", r"sombr", r"primera hora", r"suelo seco", r"un lado"],
    ),
    tip(
        "En atasco o ciudad conviene anticipar acelerones y frenadas. No pegarse al de delante: no queda margen. En incorporaciones, cambiar en zona alta de par.",
        any=[r"congesti[oó]n", r"pegarse al veh[ií]culo", r"incorporaciones"],
    ),
    tip(
        "Circunstancias de la vía (trazado, firme, clima, tráfico, señales) condicionan la actitud del conductor: el temario las da todas por relevantes.",
        any=[r"circunstancias de la v[ií]a"],
        answer=[r"todas las respuestas"],
    ),
    # PRL / salud
    tip(
        "El ruido continuo no es «bueno»: el puesto de trabajo debe tener condiciones adecuadas de espacio, luz y ruido. El silencio no es un riesgo.",
        any=[r"siempre haya ruido"],
    ),
    tip(
        "Sin EPI (gafas, guantes, botas) el accidente más típico en taller/carga son golpes con herramientas y objetos. Riesgos fuertes: carga/descarga y mantenimiento.",
        any=[r"elementos de protecci[oó]n", r"principales riesgos asociados"],
    ),
    tip(
        "La prevención obliga al empresario y al trabajador. La manipulación manual de carga hay que evitarla en lo posible. Enfermedad profesional: la incluida en el cuadro oficial.",
        any=[r"prevenci[oó]n de riesgos", r"manipulaci[oó]n manual", r"enfermedad profesional"],
    ),
    tip(
        "Falta de sueño: nerviosismo y agresividad, peor control. Un adulto suele necesitar 7–9 h. Parar cada 2 h o 200 km; salir del vehículo. Cansancio: cambios de postura, trayectos desconocidos, nocturnos.",
        any=[r"falta de sue[nñ]o", r"sue[nñ]o diario", r"cansancio", r"cada dos horas", r"200 km"],
    ),
    tip(
        "Encender un cigarrillo, el móvil o el alcohol restan atención (factor interno). La cocaína hace minusvalorar riesgos; la morfina da somnolencia; el café en exceso, ansiedad.",
        any=[r"cigarrillo", r"coca[ií]na", r"morfina", r"caf[eé]", r"f[aá]rmacos"],
    ),
    # Fuego
    tip(
        "Enfriamiento: método de extinción que consiste en bajar la temperatura del combustible.",
        any=[r"temperatura del combustible", r"m[eé]todo de extinci[oó]n"],
        answer=[r"enfriamiento"],
    ),
    tip(
        "Arena seca sobre el fuego: sofocación (quita el oxígeno). No se confunde con enfriar (bajar la temperatura).",
        any=[r"arena seca", r"sofocaci[oó]n"],
        answer=[r"sofocaci", r"arena", r"ox[ií]geno"],
    ),
    # Seguro / jurídico
    tip(
        "El seguro obligatorio cubre daños a terceros. En bienes, el límite típico que pregunta el test es 15 millones de euros por siniestro. No cubre ciertos daños materiales propios o del causante.",
        any=[r"seguro obligatorio", r"15 millones"],
    ),
    tip(
        "Tomador: quien suscribe la póliza y paga las primas. Siniestro: el suceso que causa los daños cubiertos.",
        any=[r"tomador", r"siniestro"],
        answer=[r"tomador", r"siniestro"],
    ),
    tip(
        "Ante la Junta Arbitral del Transporte no hace falta abogado ni procurador. Resuelve controversias mercantiles de contratos de transporte.",
        any=[r"juntas? arbitral"],
    ),
    tip(
        "Si inmovilizan el vehículo, la custodia es responsabilidad del transportista. Contrabando: legislación de contrabando, no «solo» tráfico.",
        any=[r"custodia del veh[ií]culo", r"contrabando"],
    ),
    tip(
        "Infracciones de extranjería: sanción típica de multa. Medidas contra tráfico de personas/contrabando: no llevar extraños, revisar carga, denunciar; el test suele marcar que todas las cautelas valen.",
        any=[r"extranjer[ií]a", r"tr[aá]fico de personas"],
    ),
    # CAP / tiempos laborales
    tip(
        "El CAP se mantiene con formación continua de 35 horas (cursos posteriores a la inicial). Hay formación inicial y continua.",
        any=[r"35 horas", r"formaci[oó]n inicial y continua"],
    ),
    tip(
        "Tiempo de presencia: estar a disposición de la empresa sin trabajo efectivo de conducción. Tiempo diario de conducción: lo acumulado entre dos descansos diarios.",
        any=[r"tiempo de presencia", r"tiempo diario de conducci[oó]n"],
    ),
    # Roles empresa
    tip(
        "El administrativo hace contabilidad y nóminas. El conductor, además de conducir, vigila el vehículo. En empresas pequeñas el empresario a menudo conduce.",
        any=[r"elaboraci[oó]n de las n[oó]minas", r"funciones propias de un administrativo", r"funciones propias de un conductor", r"empresas peque[nñ]as"],
    ),
    tip(
        "Una buena gestión comercial no disminuye ingresos: busca lo contrario (menos vacíos, más ocupación).",
        any=[r"gesti[oó]n comercial disminuye"],
    ),
    # Varios temario
    tip(
        "SIT de túneles: gestión integral (ventilación, incendios, tráfico, comunicaciones). El test marca que pueden tener todas esas funciones.",
        any=[r"\bSIT\b"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "Transporte sucesivo: un solo contrato con el cargador y varios porteadores uno detrás de otro.",
        any=[r"transporte:\s*sucesivo", r"varios porteadores"],
        answer=[r"sucesivo"],
    ),
    tip(
        "Pinzas en el cinturón: nunca, restan eficacia. El cinturón va abrochado, regulado y sin holgura. Brazos ligeramente flexionados al volante.",
        any=[r"pinzas", r"cintur[oó]n de seguridad", r"brazos no han de estar"],
    ),
    tip(
        "Viento fuerte: marcha más corta para tener más par y control. Carga en caja abierta lo más centrada para no empeorar el aire.",
        any=[r"viento fuerte", r"caja abierta"],
    ),
    tip(
        "La carretera es el modo que más empleo genera y el más relevante para mercancías en España.",
        any=[r"genera m[aá]s empleo", r"m[aá]s relevante en Espa[nñ]a"],
    ),
    tip(
        "Ergonomía: adaptar el trabajo a la persona (postura, mandos al alcance, zona lumbar apoyada) para quitar riesgos físicos.",
        any=[r"ergon[oó]m"],
    ),
    tip(
        "Subviraje: el camión «no entra» (trayectoria más abierta); el volante pesa menos de lo normal. Sobreviraje: se va de tren trasero (más cerrada).",
        any=[r"se nota el subviraje", r"subviraje"],
    ),
    tip(
        "Presión del neumático: la que indica el fabricante. De más: desgaste al centro. Correcta: menos consumo y mejor estabilidad. La deriva también depende de la presión.",
        any=[r"presi[oó]n de inflado", r"presi[oó]n del neum[aá]tico"],
    ),
    tip(
        "Alcohol en sangre: no hay truco casero fiable para bajarlo rápido (café, ducha, chicle). El test marca que esas recetas no valen.",
        any=[r"disminuir el nivel de alcohol"],
        answer=[r"incorrectas"],
    ),
    tip(
        "Delito contra la seguridad vial: conducir bajo drogas (u otras conductas graves del Código Penal), no un simple defecto administrativo.",
        any=[r"delito contra la seguridad vial"],
    ),
    tip(
        "Animales con y sin cuernos se transportan separados (Reglamento CE 1/2005).",
        any=[r"animales se manipular[aá]n"],
    ),
    tip(
        "El CMR es el convenio del contrato de transporte internacional de mercancías por carretera. Si el porteador alega una exención, la prueba es suya.",
        any=[r"convenio CMR", r"\bCMR\b"],
    ),
    tip(
        "Aprovechar la inercia (p. ej. dejar de acelerar al ver el rojo) ahorra carburante si se anticipa. No es «ir a tope y frenar al final».",
        any=[r"sem[aá]foro que se encuentra en rojo", r"aprovecha la inercia"],
    ),
    tip(
        "En el temario, saltar marchas al reducir (p. ej. 8ª a 6ª) puede ser correcto según pendiente y rpm.",
        any=[r"saltar de marchas"],
    ),
    tip(
        "Mandos del vehículo: donde el conductor los alcance con seguridad, no «en cualquier sitio» sin más; el test admite cualquier sitio accesible.",
        any=[r"mandos del veh[ií]culo"],
        answer=[r"accesible"],
    ),
    tip(
        "El conductor profesional vive de conducir. No necesita saber el uso final de la mercancía para hacer el viaje.",
        any=[r"conductor profesional", r"uso que se va a dar"],
    ),
    tip(
        "Al caer carga a la calzada: apartar, señalizar y, si se puede, retirar o apartar lo derramado.",
        any=[r"ca[ií]da de la carga"],
    ),
    tip(
        "Instalaciones y vehículos: conservación y limpieza (calidad que percibe el cliente, también el trato del conductor).",
        any=[r"conservaci[oó]n y limpieza", r"trato que recibe"],
    ),
    tip(
        "Lo pesado abajo y lo ligero arriba baja el centro de gravedad y reduce el riesgo de vuelco.",
        any=[r"m[aá]s pesadas de la carga debajo", r"partes m[aá]s pesadas"],
        answer=[r"vuelco", r"s[ií]"],
    ),
    tip(
        "Medidas básicas de conducción segura: respetar las normas, adaptar la velocidad al tráfico y dejar margen. Sin normas no hay margen de reacción.",
        any=[r"medidas preventivas b[aá]sicas", r"maniobras con seguridad"],
        answer=[r"normas de circulaci[oó]n", r"adaptar la velocidad"],
    ),
    tip(
        "Marcha alta y pocas rpm: el motor trabaja en zona económica y baja el consumo. Sí, es una de las claves de la conducción eficiente.",
        any=[r"relaci[oó]n de marchas alta", r"reducci[oó]n de las revoluciones"],
        answer=[r"^s[ií]"],
    ),
    tip(
        "Descargas eléctricas en transporte: cables, taller, humedad, operaciones de mantenimiento. El temario las contempla todas como posibles orígenes.",
        any=[r"descargas el[eé]ctricas"],
    ),
    tip(
        "La fatiga sube con la conducción nocturna, los trayectos poco conocidos, las horas de sueño de menos y la monotonía.",
        any=[r"fatiga", r"factor puede producir fatiga"],
        answer=[r"nocturna", r"poco conocidos"],
    ),
    tip(
        "A más velocidad, más turbulencias y más resistencia del aire (crece con el cuadrado de la velocidad): el consumo se dispara.",
        any=[r"aumenta la velocidad", r"turbulencias"],
        answer=[r"turbulencias", r"m[aá]s cantidad de aire"],
    ),
    tip(
        "Cabina: visibilidad, climatización, asiento regulable, mandos al alcance. El test suele dar por válidas todas esas condiciones.",
        any=[r"cabina de conducci[oó]n"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "Un incidente es un imprevisto que altera el viaje sin ser necesariamente un accidente grave: pinchazo, reventón, avería.",
        any=[r"pinchazo o revent[oó]n", r"considerarse como un incidente"],
    ),
    tip(
        "Cargas estables, fáciles de agarrar y que no se desequilibran alivian el riesgo. Las difíciles de sujetar lo agravan.",
        any=[r"riesgos asociados a su manipulaci[oó]n"],
    ),
    tip(
        "Aprovechar la inercia: anticipar, no acelerar para frenar enseguida, usar el freno motor. El temario da por buenas esas prácticas a la vez.",
        any=[r"aprovechar mejor la inercia"],
        answer=[r"todas las respuestas"],
    ),
    tip(
        "El estilo de conducción (rpm, anticipación, velocidad, cambios) cambia el consumo tanto o más que el propio vehículo.",
        any=[r"estilo de conducci[oó]n"],
        answer=[r"^s[ií]"],
    ),
    tip(
        "En un accidente laboral de transporte casi nunca hay una sola causa: coinciden vehículo, vía, carga y persona.",
        any=[r"accidentes laborales"],
        answer=[r"varias causas"],
    ),
    tip(
        "Menor consumo específico: diésel de inyección directa, luego diésel indirecta, luego gasolina (peor rendimiento).",
        any=[r"menor a mayor consumo espec[ií]fico", r"consumo espec[ií]fico"],
        answer=[r"inyecci[oó]n directa"],
    ),
    tip(
        "Tras cruzar un charco o zona inundada hay que comprobar los frenos: el agua baja la eficacia hasta que se secan.",
        any=[r"zona inundada", r"zonas inundadas"],
    ),
    tip(
        "El EDS (diferencial electrónico) trabaja con los frenos para que no patine una rueda motriz: es seguridad activa, ligada al ABS/ASR.",
        any=[r"\bEDS\b"],
    ),
    tip(
        "Tormenta eléctrica: detenerse, motor parado, lejos de árboles y vías del tren; el vehículo cerrado aísla mejor que estar fuera.",
        any=[r"tormenta", r"aparato el[eé]ctrico"],
    ),
    tip(
        "Mercancías a temperatura regulada para consumo humano (ATP y normas sanitarias) tienen regulación especial, no van como carga seca genérica.",
        any=[r"temperatura regulada"],
    ),
    tip(
        "Según la capacidad de enfriamiento, el temario distingue cuatro clases de vehículos refrigerantes.",
        all=[r"refrigerantes", r"enfriamiento"],
        answer=[r"cuatro", r"^4"],
    ),
    tip(
        "Acuerdo multilateral: más de dos países pactan autorizaciones y condiciones (p. ej. CEMT). El bilateral es solo entre dos.",
        any=[r"acuerdo multilateral"],
    ),
    tip(
        "El alcohol resta atención y aumenta el tiempo de reacción: es un factor interno de distracción.",
        any=[r"p[eé]rdida de atenci[oó]n"],
        answer=[r"alcohol"],
    ),
    tip(
        "La gripe A no está en el cuadro de enfermedades profesionales del transporte. Sí lo están, en su caso, las ligadas a vibraciones, sordera, etc.",
        any=[r"enfermedades profesionales"],
        answer=[r"gripe"],
    ),
    tip(
        "El consumo de carburante sube con marchas cortas, rpm altas, mala aerodinámica, sobrecarga y velocidad. Bajar rpm y alargar marcha ahorra.",
        any=[r"consumo de carburante", r"consumo de combustible", r"ahorrar carburante", r"menos combustible"],
        answer=[r"marchas", r"revoluciones", r"aerodin", r"velocidad", r"sobrecarga", r"rpm", r"todas las respuestas"],
    ),
    tip(
        "La caja manual, bien usada (zona verde, marcha larga), suele gastar menos que el automático.",
        any=[r"caja de cambio"],
        answer=[r"manual"],
    ),
    tip(
        "Jaula: vehículo para animales vivos. No es para granel ni para ADR.",
        any=[r"veh[ií]culo jaula", r"jaula es el normalmente"],
    ),
    tip(
        "El transporte privado particular (no complementario) está exento de autorización de transporte.",
        any=[r"privado particular"],
        answer=[r"exent"],
    ),
    tip(
        "Pares de viraje: tienden a girar el camión alrededor del eje vertical (guiñada).",
        any=[r"pares de viraje", r"eje geom[eé]trico vertical"],
    ),
    tip(
        "Transportes liberalizados: internacionales que no exigen autorización especial (algunos de ayuda urgente, etc.).",
        any=[r"transportes liberaliz"],
    ),
    tip(
        "Tras vacaciones el conductor no tiene que llevar un documento extra de «vacaciones»; lleva la documentación habitual del vehículo y del conductor.",
        any=[r"per[ií]odo de vacaciones"],
    ),
    tip(
        "EPI de pies: calzado de seguridad (y cubrecalzado contra el frío si procede). De cabeza: casco contra impactos.",
        any=[r"protecci[oó]n individual de pies", r"protecci[oó]n individual de la cabeza"],
    ),
    tip(
        "La falta de uniforme no inmoviliza el vehículo en una inspección de transporte. Tampoco se lleva al conductor al juez por eso.",
        any=[r"inmovilizaci[oó]n de un veh[ií]culo"],
    ),
    tip(
        "Mercancía no comunitaria despachada a libre práctica adquiere el estatuto de mercancía de la Unión.",
        any=[r"estatuto aduanero", r"despachadas a"],
    ),
    tip(
        "Cualquier meteorología adversa (lluvia, nieve, hielo) baja la adherencia del neumático.",
        any=[r"meteorolog[ií]a adversa"],
    ),
    tip(
        "Sensores de ultrasonidos (y similares) avisan de otros usuarios: refuerzan la seguridad activa.",
        any=[r"sensores de ultrasonidos"],
    ),
    tip(
        "Para no invadir el espacio de detrás: frenar con tiempo y progresivo, no de golpe.",
        any=[r"espacio posterior"],
    ),
    tip(
        "Fiabilidad del transporte: cumplir lo prometido (plazo, integridad, condiciones). Un sector potente y fiable ayuda a retener actividad económica.",
        any=[r"fiabilidad de un transporte", r"sector de transporte potente"],
    ),
    tip(
        "Si no hay pulso: masaje cardíaco (RCP) junto con ventilación; no solo «esperar». El temario asocia la RCP a esas maniobras.",
        any=[r"no tiene pulso", r"masaje card"],
    ),
    tip(
        "Bajar del vehículo sin mirar es un riesgo grave para peatones/ocupantes: atropello.",
        any=[r"riesgo de los peatones", r"abandonar el veh[ií]culo"],
    ),
    tip(
        "Sentado: lumbar contra el respaldo y pies bien apoyados en el suelo (ergonomía básica).",
        any=[r"trabajar sentado"],
    ),
    tip(
        "Las agencias de transporte, los transitarios y los almacenistas-distribuidores contratan siempre en nombre propio: se obligan ellos, no como meros representantes.",
        any=[r"agencias? de transporte", r"almacenistas?-distribuidores", r"transitari"],
        answer=[r"nombre propio"],
    ),
    tip(
        "El transitario organiza por cuenta ajena transportes internacionales: contrata en nombre propio, hace trámites aduaneros y coordina transbordos. No es «interregional» ni un aduanero.",
        any=[r"transitari"],
        answer=[r"internacionales", r"aduaneros", r"interregionales"],
    ),
    tip(
        "El visado es la comprobación periódica de la Administración de que el titular sigue cumpliendo los requisitos de la autorización. No es la ITV.",
        all=[r"visado"],
    ),
    tip(
        "Por cuenta ajena (público) se presta el servicio a terceros a cambio de precio. Por cuenta propia se mueve mercancía de la propia empresa.",
        all=[r"cuenta ajena"],
        answer=[r"terceros", r"p[uú]blico"],
    ),
    tip(
        "TEU: contenedor de 20 pies. Uno de 40 pies son 2 TEU.",
        any=[r"\bTEU\b"],
        answer=[r"20 pies"],
    ),
    tip(
        "Tras 4 h 30 min de conducción, pausa de 45 min (o 15+30 intercalados).",
        all=[r"pausa", r"45"],
    ),
    tip(
        "Descanso diario normal: 11 h consecutivas (reducible a 9 h, máximo tres veces entre dos semanales).",
        any=[r"descanso diari"],
    ),
    tip(
        "En dos semanas: dos descansos semanales normales (45 h) o uno normal y uno reducido de al menos 24 h, compensando.",
        all=[r"descanso semanal", r"dos semanas"],
    ),
    tip(
        "Conducción diaria máxima: 9 h, ampliables a 10 h como máximo dos veces por semana.",
        any=[r"conducci[oó]n diari"],
    ),
    tip(
        "La tarjeta de tacógrafo identifica al conductor ante el aparato. Nunca sustituye al permiso de conducir.",
        any=[r"tac[oó]grafo"],
        answer=[r"no, nunca", r"no sustituye"],
    ),
    tip(
        "Cuanto más alto el centro de gravedad, menos estable el camión y más riesgo de vuelco.",
        any=[r"centro de gravedad"],
    ),
    tip(
        "Sobrevirar: trayectoria más cerrada que la del volante (se va de atrás). Subvirar: más abierta (se va de morro).",
        any=[r"sobrevir", r"subvir"],
    ),
    tip(
        "Alcoholemia: alcohol en sangre (g/l) o en aire espirado, no la graduación de la copa.",
        any=[r"alcoholemia"],
    ),
    tip(
        "El reposacabezas limita el latigazo cervical: a la altura de la cabeza.",
        any=[r"reposacabezas"],
    ),
    tip(
        "Accidente in itinere: de casa al trabajo o vuelta, en el trayecto habitual.",
        any=[r"in itinere"],
    ),
    tip(
        "ADR: mercancías peligrosas. Un vertido en la carga lo gestiona, en principio, el cargador.",
        any=[r"\bADR\b", r"mercanc[ií]as peligrosas"],
    ),
    tip(
        "Cabotaje: transporte interior en un país distinto del de establecimiento del transportista, con los límites UE.",
        any=[r"cabotaje"],
    ),
    tip(
        "Ferroutage: camión o semirremolque sobre un tren (carretera-ferrocarril).",
        any=[r"ferroutage", r"ferroutaje"],
    ),
    tip(
        "Rompeolas de cisterna: cortan el oleaje del líquido para no desestabilizar al frenar o en curva.",
        any=[r"rompeolas"],
    ),
    tip(
        "Vehículo batería: conjunto de botellas o pequeñas cisternas unidas por un colector.",
        any=[r"veh[ií]culo bater[ií]a"],
    ),
    tip(
        "Luxación: el hueso sale de la articulación. No se «mete» en carretera: inmovilizar y esperar sanitarios.",
        any=[r"luxaci[oó]n"],
    ),
    tip(
        "El seguro obligatorio cubre a terceros, no el propio vehículo del causante (eso iría en el voluntario).",
        any=[r"responsabilidad civil"],
    ),
    tip(
        "CAP: cualificación del conductor. No hace falta tener ya el permiso para la inicial. Exclusiones (FF.AA., etc.). Faltar a un 5 % o más de horas excluye del curso.",
        any=[r"cualificaci[oó]n inicial", r"curso CAP", r"certificado de aptitud profesional"],
        answer=[r"no es necesario.*permiso", r"no es necesario tener", r"fuerzas armadas", r"5 por"],
    ),
    tip(
        "Fuego: agente según clase (A sólidos, B líquidos, C gases, D metales). El agua no va a metales. La luz de emergencia señaliza, no apaga.",
        any=[r"fuego de clase", r"clases de fuego", r"agente extintor", r"extintor.*clase"],
    ),
    tip(
        "Jefe de tráfico: rutas, turnos, vehículos y cumplimiento normativo. El comercial capta clientes; administración, nóminas y facturas.",
        any=[r"jefe de tr[aá]fico", r"funciones propias de un comercial"],
    ),
    tip(
        "Deriva del neumático: el flanco se deforma y el camión no sigue exactamente la dirección de la rueda. Influyen carga, velocidad, presión y llanta.",
        any=[r"deriva del neum[aá]tico"],
    ),
]

GLOSSARY: list[dict] = [
    tip(
        "La tarjeta de centro de ensayo es la del taller autorizado del tacógrafo: instala, activa, calibra y comprueba el aparato. Fondo rojo y validez de 1 año; conductor, empresa y control duran 5 años.",
        any=[r"centro de ensayo"],
    ),
    tip(
        "MDPE: autorización de transporte público de mercancías con vehículos de MMA > 3,5 t. MPCE es privado complementario; MDLE, públicos ligeros (≤ 3,5 t).",
        any=[r"\bMDPE\b"],
    ),
    tip(
        "MPCE: clave del transporte privado complementario de mercancías (cuenta propia de quien no tiene el transporte como actividad principal).",
        any=[r"\bMPCE\b"],
    ),
    tip(
        "OT: autorización de intermediación (agencias, operadores de transporte, transitarios según el caso).",
        any=[r"\bOT\b", r"operador de transporte"],
    ),
    tip(
        "El visado comprueba cada cierto tiempo que se siguen cumpliendo los requisitos de la autorización de transporte.",
        any=[r"visado"],
    ),
    tip(
        "TEU: unidad equivalente a un contenedor de 20 pies.",
        any=[r"\bTEU\b"],
    ),
    tip(
        "Fading: los frenos de servicio pierden eficacia al calentarse. Se evita usando el ralentizador en bajadas largas.",
        any=[r"fading"],
    ),
    tip(
        "PAS: proteger, avisar, socorrer. Ese es el orden ante un accidente.",
        any=[r"\bPAS\b"],
    ),
    tip(
        "ATP: acuerdo de mercancías perecederas y vehículos de temperatura controlada (isotermo, refrigerante, frigorífico, calorífico).",
        any=[r"\bATP\b"],
    ),
    tip(
        "ADR: acuerdo europeo de mercancías peligrosas (bultos, vehículo, documentos, formación).",
        any=[r"\bADR\b"],
    ),
    tip(
        "CMR: contrato de transporte internacional de mercancías por carretera (carta de porte y responsabilidad del porteador).",
        any=[r"\bCMR\b"],
    ),
    tip(
        "Licencia comunitaria: título UE para transporte internacional de mercancías entre Estados miembros.",
        any=[r"licencia comunitaria"],
    ),
    tip(
        "Schengen: espacio sin controles fronterizos internos habituales entre los Estados que forman parte. Distingue fronteras interiores y exteriores.",
        any=[r"schengen"],
        answer=[r"fronter", r"controles", r"espacio schengen", r"estados adher"],
    ),
    tip(
        "Tara: masa del vehículo vacío. MMA: masa máxima autorizada. Carga útil: MMA menos tara.",
        any=[r"\btara\b", r"carga [uú]til"],
    ),
    tip(
        "Retárder: ralentizador hidráulico (aceite) que retiene el vehículo sin gastar tanto el freno de servicio.",
        any=[r"ret[aá]rder", r"retardador"],
    ),
    tip(
        "ABS: antibloqueo de frenos (seguridad activa). ASR: antipatinaje / control de tracción al acelerar.",
        any=[r"\bABS\b", r"\bASR\b"],
    ),
    tip(
        "Cabotaje: transportes interiores en un país donde el transportista no está establecido.",
        any=[r"cabotaje"],
    ),
    tip(
        "Transitario: organiza transportes internacionales por cuenta ajena, con aduana y transbordos, contratando en nombre propio.",
        any=[r"transitari"],
    ),
    tip(
        "Alcoholemia: concentración de alcohol en sangre o en aire espirado.",
        any=[r"alcoholemia"],
    ),
    tip(
        "Energía cinética: ½·m·v², la del vehículo en movimiento. Más masa o más velocidad (al cuadrado), más energía al frenar.",
        any=[r"energ[ií]a cin[eé]tica"],
    ),
    tip(
        "Estiba: colocar y trincar la carga para que no se mueva y el vehículo siga estable.",
        any=[r"estiba"],
    ),
    tip(
        "Junta Arbitral del Transporte: resuelve reclamaciones mercantiles de transporte; no exige abogado.",
        any=[r"juntas? arbitral"],
    ),
    tip(
        "Tiempo de presencia: el conductor está a disposición de la empresa pero no conduce ni hace otro trabajo efectivo.",
        any=[r"tiempo de presencia"],
    ),
    tip(
        "Formación CAP continua: 35 horas periódicas para mantener el certificado.",
        any=[r"formaci[oó]n continua", r"35 horas"],
    ),
    tip(
        "Sociedad anónima: capital mínimo 60.000 euros. Junta ordinaria: aprobación de cuentas en los seis primeros meses.",
        all=[r"sociedad(es)? an[oó]nimas?"],
        any=[r"60\.000", r"capital", r"junta ordinaria", r"desembols"],
    ),
    tip(
        "Cooperativa de primer grado: mínimo tres socios. Registro de Sociedades Cooperativas.",
        any=[r"cooperativ"],
    ),
    tip(
        "Exportación aduanera: la mercancía de la Unión sale del territorio aduanero de la UE.",
        any=[r"(?<!re)exportaci[oó]n"],
    ),
    tip(
        "Declaración amistosa: parte europeo del accidente, firmado por los conductores, para las aseguradoras. No cambia el consumo ni «aumenta» la indemnización por sí sola.",
        any=[r"declaraci[oó]n amistosa"],
    ),
    tip(
        "Zona verde del cuentarrevoluciones: régimen de menor consumo. Por encima, el motor gasta más.",
        any=[r"zona.*verde", r"cuentarrevoluciones"],
    ),
    tip(
        "Caja de cambios: elige la relación de transmisión entre motor y ruedas según pendiente y carga.",
        any=[r"caja de (cambios|velocidades)"],
    ),
    tip(
        "Ralentizador: sistema de retención (eléctrico, hidráulico o de motor) para bajadas, ahorrando el freno de servicio.",
        any=[r"ralentizador"],
    ),
    tip(
        "En curva, velocidad y carga (masa alta o centro de gravedad alto) aumentan la fuerza centrífuga y el riesgo de vuelco.",
        any=[r"riesgo de vuelco", r"puede volcar", r"volcar[aá]"],
        answer=[r"volcar", r"vuelco", r"centr[ií]fug"],
    ),
    tip(
        "Centro de gravedad alto o carga mal repartida: más vuelco y peor frenada. Pesado abajo, ligero arriba.",
        any=[r"centro de gravedad", r"distribuci[oó]n de la carga"],
    ),
    tip(
        "Tacógrafo: aparato que registra tiempos de conducción y actividad. Analógico en disco; digital en memoria y tarjeta.",
        any=[r"qu[eé] es el tac[oó]grafo", r"qu[eé] es un tac[oó]grafo", r"para qu[eé] sirve el tac[oó]grafo"],
    ),
]


def _compile(item: dict) -> dict:
    def rx(keys: str) -> list[re.Pattern[str]]:
        return [re.compile(p, re.IGNORECASE) for p in item.get(keys, [])]

    return {"all": rx("all"), "any": rx("any"), "answer": rx("answer"), "text": item["text"]}


COMPILED_TIPS = [_compile(t) for t in TIPS]
COMPILED_GLOSS = [_compile(t) for t in GLOSSARY]


def _ok(text: str, alls: list[re.Pattern[str]], anys: list[re.Pattern[str]]) -> bool:
    if alls and not all(p.search(text) for p in alls):
        return False
    if anys and not any(p.search(text) for p in anys):
        return False
    return True


_STOP = {
    "para", "como", "esta", "este", "esto", "esos", "esas",
    "todo", "toda", "todos", "todas", "sobre", "entre", "desde", "hasta",
    "cuando", "donde", "cual", "cuales", "quien", "porque", "segun",
    "hacia", "ante", "bajo", "durante", "mediante", "contra",
    "respuesta", "respuestas", "correcta", "correctas", "incorrecta",
    "afirmacion", "siguiente", "siguientes", "anterior", "anteriores",
    "debe", "deben", "puede", "pueden", "sera", "seran",
    "tiene", "tienen", "hace", "caso", "forma", "parte", "tipo", "tipos",
    "tambien", "ademas", "mismo", "misma", "otros", "otras", "solo",
    "ningun", "ninguna", "cualquier", "cualquiera", "siempre", "nunca",
    "articulo", "normativa", "temario", "oficial", "examen", "opcion",
    "enunciado", "pregunta", "conductor", "conductores",
    "vehiculo", "vehiculos", "transporte", "empresa", "empresas",
}

_ACCENT = str.maketrans("áéíóúüñàèìòù", "aeiouunaeiou")


def _fold(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower().translate(_ACCENT))


def _tok(s: str) -> set[str]:
    out: set[str] = set()
    for w in _fold(s).split():
        if len(w) < 4 or w in _STOP or w.isdigit():
            continue
        out.add(w)
    return out


def _hits(src: set[str], dst: set[str]) -> int:
    n = 0
    for x in src:
        for y in dst:
            if x == y or (len(x) >= 5 and len(y) >= 5 and (x in y or y in x)):
                n += 1
                break
    return n


def explanation_matches_item(expl: str, question: str, answer: str) -> bool:
    """Drop a generic tip if it talks about a different concept than Q+A."""
    te, tq, ta = _tok(expl), _tok(question), _tok(answer)
    tqa = tq | ta
    h_e = _hits(te, tqa)
    h_a = _hits(ta, te) if ta else 0
    if h_e >= 3 or h_a >= 2 or (h_e >= 2 and h_a >= 1):
        return True
    nums_a = set(re.findall(r"\d+(?:[.,]\d+)?", _fold(answer)))
    nums_e = set(re.findall(r"\d+(?:[.,]\d+)?", _fold(expl)))
    if nums_a and nums_a & nums_e and h_e >= 1:
        return True
    return False


def match_tip(question: str, answer: str, compiled: list[dict]) -> str | None:
    blob = f"{question}\n{answer}"
    for t in compiled:
        if not _ok(blob, t["all"], t["any"]):
            continue
        if t["answer"] and not any(p.search(answer) for p in t["answer"]):
            continue
        if not t["all"] and not t["any"]:
            continue
        if not t["answer"] and not explanation_matches_item(t["text"], question, answer):
            continue
        return t["text"]
    return None


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
    for path in sorted(EXAM_DIR.glob("*.json")):
        if path.name.startswith("viajeros_"):
            continue
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
    for rec in leftovers[:25]:
        q = re.sub(r"\s+", " ", rec["q"])[:110]
        a = re.sub(r"\s+", " ", rec["a"])[:70]
        print(f"  {rec['n']:4} | {q} || {a}")


def self_check() -> None:
    cases = [
        (
            "El rojo es el color de fondo predominante en la tarjeta de:",
            "centro de ensayo.",
            "fondo rojo",
        ),
        (
            "¿Qué tipo de tarjeta permite calibrar y activar el tacógrafo digital?",
            "La tarjeta de centro de ensayo.",
            "taller autorizado",
        ),
        (
            "En el cuentarrevoluciones de un vehículo pesado existe una zona marcada, generalmente, de color verde, ¿qué supone circular con un número de revoluciones por encima de esa zona?",
            "Un mayor consumo.",
            "zona verde",
        ),
        (
            "Según la capacidad de enfriamiento, ¿cuántas clases de vehículos refrigerantes existen?",
            "Cuatro.",
            "cuatro clases",
        ),
        (
            "La calidad del aceite del sistema de lubricación que se utilice en los motores, ¿puede influir en el consumo de carburante?",
            "Sí, ya que puede reducir el rozamiento de las piezas y, por tanto, las pérdidas de potencia.",
            "rozamiento",
        ),
        (
            "En caso de lluvia, ¿qué actuación debemos seguir con el vehículo que tenemos delante?",
            "Aumentar la distancia de seguridad.",
            "distancia de seguridad",
        ),
        (
            "El capital social de una sociedad anónima debe estar desembolsado, por lo menos, en un:",
            "25 %.",
            "25",
        ),
        (
            "¿Todos los países que participan en la cooperación Schengen deben ser miembros del Espacio Schengen?",
            "No es necesario porque el Tratado de Ámsterdam integró la cooperación de Schengen en el marco de la Unión Europea.",
            "Schengen",
        ),
        (
            "Los transportes realizados en el desarrollo de cursos de aprendizaje de la conducción o del certificado de aptitud profesional en vehículos equipados para ello:",
            "deben llevar instalado un tacógrafo, pero no es necesario que esté calibrado.",
            "calibr",
        ),
        (
            "¿Cómo se denomina el método de extinción de un incendio consistente en reducir la temperatura del combustible?",
            "Enfriamiento.",
            "temperatura del combustible",
        ),
    ]
    failed = 0
    for q, a, needle in cases:
        text = explanation_for(q, a) or ""
        if needle.lower() not in text.lower():
            print(f"FAIL {needle!r}\n  Q={q[:80]}\n  got={text[:160]!r}", file=sys.stderr)
            failed += 1
        if re.search(
            r"rampa|embrague|sofocaci[oó]n|Arena seca|clase A s[oó]lidos",
            text,
            re.I,
        ) and "Ámsterdam" not in a:
            print(f"FAIL off-topic help\n  Q={q[:80]}\n  got={text[:160]!r}", file=sys.stderr)
            failed += 1
        if "Ámsterdam" in a and re.search(r"cualificaci[oó]n del conductor", text, re.I):
            print(f"FAIL Schengen <- CAP: {text[:160]!r}", file=sys.stderr)
            failed += 1
        if "calibrado" in a and re.search(r"cualificaci[oó]n del conductor", text, re.I):
            print(f"FAIL CAP course tachograph <- CAP permit: {text[:160]!r}", file=sys.stderr)
            failed += 1
    if failed:
        raise SystemExit(f"self-check failed: {failed}")
    print("temario self-check: ok")


def main() -> None:
    self_check()
    write_json()
    coverage()


if __name__ == "__main__":
    main()
