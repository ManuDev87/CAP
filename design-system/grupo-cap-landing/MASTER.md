# Design System: Grupo CAP Landing

## Brand override (mandatory)

The skill defaults (pink / sky blue / Varela Round) are **not** used.
Keep Grupo CAP corporate identity:

| Role | Hex |
|------|-----|
| Primary (brand) | `#0A8442` |
| Brand 600 | `#087539` |
| Navy | `#00375A` |
| Accent / secondary CTA | `#DB8C34` |
| Background | `#EEF3F0` → soft green mesh |
| Surface | `#FFFFFF` |
| Text | `#142028` |
| Muted | `#4A5A63` |

## Applied system

- **Pattern:** Hero (cinematic scroll video) + stats trust + features + how-it-works + CTA
- **Style:** Soft UI Evolution (subtle depth, thick soft borders 3px, radius 16–24px, WCAG contrast)
- **Typography:** Corporate Trust — Lexend (display) + Source Sans 3 (body)
- **Effects:** Scroll-scrub video, reveal-on-scroll, counter anim, soft hover lift 200–250ms
- **Avoid:** Dark mode default, purple gradients, emoji icons, scroll-jacking without reduced-motion fallback

## Hero

- Full-bleed sticky stage; scroll drives `video.currentTime`
- Brand name is hero-level; one headline + one lead + CTA group
- Copy reveals near cabin (~80–93% scroll progress)
