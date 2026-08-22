# AGENTS.md

Mapa para agentes. Léelo al empezar. El código manda en el detalle; esto son las reglas que el código no grita. Actualiza este archivo **solo** si cambia una invariante (nueva modalidad, otro deploy, otro origen de datos). No lo uses como changelog.

## Alcance

- Un cambio = una pieza: `landing/` **o** `cap-app/` **o** `scripts/`, salvo que pidan cruzarlas.
- No reescribas arquitectura, Firestore ni el motor de ayuda por un texto o un bug local.
- No mezcles mercancías y viajeros en catálogos, fallos, ayuda ni copys.

## Invariantes

- **Dos tracks:** `mercancias` (default) y `viajeros`. IDs de examen viajeros: `viajeros_*`. Cuentas sin `capTrack` = mercancías.
- **Temario de fallos:** viajeros no usa temas de mercancías (estiba, ADR, ATP, animales, CMR). Tablas en `cap-app/src/lib/questionTopics.ts`.
- **Puntuación CAP:** solo cuentan las primeras 100 preguntas; +1 / −0,5 / 0; reserva 101–103; aprobado ≥ 50. No “inventar” otro baremo.
- **Firestore legado:** `users`, `paused_tests`, `test_results`, `score_records`, `wrong_questions`. Contraseñas van en el doc de usuario (no es Auth de Firebase). No migres el modelo sin pedirlo.
- **Exámenes:** JSON en `cap-app/src/data/exams/`. Tras ingestar, hay que registrar el test en `tests.ts` (mercancías) o `viajerosCatalog.ts` (viajeros).

## Ayuda al alumno

Prioridad: catálogo verificado (BOE / EUR-Lex / referencia oficial) → temario de esa modalidad → frase a partir del enunciado.

- Nunca inventes números de artículo.
- Nunca «es correcta porque encaja» ni «en el test eso corresponde a…».
- Viajeros: autobús/autocar y `help_temario_viajeros.py` / `help-bank-viajeros.json`. No cuelas estiba ni mercancías peligrosas.

## Generado vs fuente

No parchees a mano `help-bank.json`, `help-bank-viajeros.json`, `help-tips.json` ni `help-tips-viajeros.json`.

Fuente: `scripts/help_catalog.py`, `help_catalog_viajeros.py`, `help_temario.py`, `help_temario_viajeros.py`. Regenerar:

```bash
cd cap-app && npm run build-help
```

La clave pregunta+respuesta debe coincidir con `scripts/help_key.py` y `cap-app/src/lib/help.ts`.

## PWA y dominios

- La **app** registra SW en producción (`cap-app`, host `testexamencap.info`).
- La **landing** (`.com`) debe **desinstalar** el SW y borrar caches. No conviertas `landing/sw.js` otra vez en un precache de la PWA: `.com` acabaría mostrando la app vieja.
- `output: "export"` en Next: no uses APIs de servidor.

## Marca (landing)

Identidad Grupo CAP, no el default del design-system genérico:

| Token | Hex |
|---|---|
| Primary | `#0A8442` |
| Navy | `#00375A` |
| Accent | `#DB8C34` |
| Fondo | `#EEF3F0` |

Lexend + Source Sans 3. Detalle en `design-system/grupo-cap-landing/MASTER.md`.

## Dónde mirar

| Tema | Ruta |
|---|---|
| Firestore | `cap-app/src/lib/db.ts` |
| Ayuda | `cap-app/src/lib/help.ts`, `helpExplain.ts` |
| Modalidad | `cap-app/src/lib/capTrack.ts`, `types.ts` |
| Catálogo tests | `cap-app/src/lib/tests.ts`, `viajerosCatalog.ts` |
| Temas de fallos | `cap-app/src/lib/questionTopics.ts` |
| Portales | `cap-app/src/lib/portal.ts` |
| Ingesta | `scripts/ingest_*.py` |
| Landing | `landing/index.html`, `landing/sw.js` |
