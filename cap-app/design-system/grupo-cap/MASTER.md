# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Grupo CAP
**Generated:** 2026-08-04 22:05:41
**Category:** Educational App

### Brand override (implemented in `src/app/globals.css`)

Keep CAP corporate identity over the skill’s default teal palette:

| Role | Hex | Token |
|------|-----|-------|
| Primary / Brand | `#0A8442` | `--color-brand-500` |
| Navy | `#00375A` | `--color-navy-700` |
| Background | `#EEF3F0` | `--color-appbg` |
| Text | `#142028` | `--color-ink-900` |
| Danger | `#CC0000` | `--color-danger-500` |
| Answered | `#E67E22` | `--color-answered-500` |

Style: soft clay-lite (thick borders, soft dual shadows, `rounded-2xl`) + Lexend / Source Sans 3. Structure/UX flows unchanged.

---

## Global Rules

### Color Palette (skill default — overridden by brand above)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#0F766E` | `--color-primary` |
| Secondary | `#14B8A6` | `--color-secondary` |
| CTA/Accent | `#0369A1` | `--color-cta` |
| Background | `#F0FDFA` | `--color-background` |
| Text | `#134E4A` | `--color-text` |

**Color Notes:** Trust teal + professional blue (reference only; app uses CAP green/navy)

### Typography

- **Heading Font:** Lexend
- **Body Font:** Source Sans 3
- **Mood:** corporate, trustworthy, accessible, readable, professional, clean
- **Google Fonts:** [Lexend + Source Sans 3](https://fonts.google.com/share?selection.family=Lexend:wght@300;400;500;600;700|Source+Sans+3:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #0369A1;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0F766E;
  border: 2px solid #0F766E;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F0FDFA;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #0F766E;
  outline: none;
  box-shadow: 0 0 0 3px #0F766E20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Claymorphism

**Keywords:** Soft 3D, chunky, playful, toy-like, bubbly, thick borders (3-4px), double shadows, rounded (16-24px)

**Best For:** Educational apps, children's apps, SaaS platforms, creative tools, fun-focused, onboarding, casual games

**Key Effects:** Inner+outer shadows (subtle, no hard lines), soft press (200ms ease-out), fluffy elements, smooth transitions

### Page Pattern

**Pattern Name:** Enterprise Gateway

- **Conversion Strategy:**  logo carousel,  tab switching for industries, Path selection (I am a...). Mega menu navigation. Trust signals prominent.
- **CTA Placement:** Contact Sales (Primary) + Login (Secondary)
- **Section Order:** 1. Hero (Video/Mission), 2. Solutions by Industry, 3. Solutions by Role, 4. Client Logos, 5. Contact Sales

---

## Anti-Patterns (Do NOT Use)

- ❌ Dark modes
- ❌ Complex jargon

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
