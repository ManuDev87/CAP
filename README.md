# Grupo CAP

Portal de práctica del **examen CAP** (certificado de aptitud profesional): convocatorias reales de **mercancías** y **viajeros**. Hay dos productos en este repo: la web comercial y la PWA del alumno/profesor.

## Mapa

| Carpeta | Qué es |
|---|---|
| `landing/` | Web comercial (HTML estático). CTA hacia el portal. |
| `cap-app/` | PWA Next.js (export estático): alumno, profesor y admin. |
| `scripts/` | Ingesta de PDFs → JSON y generación del banco de ayuda. |
| `design-system/` | Tokens y patrón visual de la landing. |

El mapa para la IA (reglas que no se deben romper) está en [`AGENTS.md`](AGENTS.md). Actualízalo solo si cambia una invariante, no en cada parche.

## Arrancar

```bash
cd cap-app
npm install
npm run dev          # http://localhost:3000  → redirige a /alumno
```

Landing: abre `landing/index.html` o sírvela con cualquier static server.

Build de producción de la app:

```bash
cd cap-app
npm run build        # genera out/ (incluye el service worker)
npm run preview      # http://localhost:3000 sobre out/
```

## Roles y rutas

| Ruta | Quién |
|---|---|
| `/alumno` | Alumno (tests, ayuda, fallos, estadísticas). |
| `/profesor` | Profesor (alta de alumnos, seguimiento). |
| `/admin` | Root / backoffice. |

El alumno elige modalidad **mercancías** o **viajeros** si su cuenta lo permite. Las cuentas antiguas sin `capTrack` cuentan como mercancías.

## Datos

Firestore proyecto `grupo-cap`. Colecciones principales (el esquema legado no se cambia a la ligera):

- `users/{username}` — nombre, contraseña, rol, `teacherId`, `capTrack`…
- `paused_tests` — test a medias
- `test_results` / `score_records` — intentos
- `wrong_questions/{username}` — banco de fallos

Los exámenes viven en `cap-app/src/data/exams/*.json` (datos de la app, no en Firestore).

## Scripts de contenido

Desde `cap-app/`:

```bash
npm run build-help   # regenera bancos y tips de ayuda (mercancías + viajeros)
```

Ingesta de convocatorias (Python 3 + PyMuPDF), desde la raíz:

```bash
python scripts/ingest_exams.py --region cataluna     # mercancías
python scripts/ingest_viajeros.py --region cataluna  # viajeros
```

Hay scripts por comunidad (`ingest_galicia.py`, `ingest_andalucia_provincias.py`, `ingest_guipuzkoa_murcia.py`, …). Los IDs de viajeros van con prefijo `viajeros_`.

## Publicación

- **Portal (PWA):** export estático (`cap-app/out/`) en Cloudflare Pages (`cap-dtx.pages.dev`). URL pública: [testexamencap.info](https://testexamencap.info).
- **Landing:** `landing/` en el dominio comercial (`.com`). Ese dominio **no** debe volver a registrar el SW de la app; `landing/sw.js` desinstala workers viejos a propósito.

La landing enlaza al portal; no mezclar los dos deploys.
