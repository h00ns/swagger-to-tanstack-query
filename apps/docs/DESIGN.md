# DESIGN.md — swagger-to-tanstack-query docs site

Single source of truth for the documentation + interactive playground website.
Tech target: **Astro + React islands · Tailwind CSS v4 (CSS-first `@theme`) · Framer Motion (`motion/react`) · Shiki · lucide-react**.

Two engineers building independently from this document should produce nearly the same UI. Every value here is literal and load-bearing. When a number is given, use that number.

---

## 0. The product in one breath (so design decisions stay anchored)

`swagger-to-tanstack-query` is a CLI/codegen: point it at a Swagger/OpenAPI spec → run one command → get fully-typed TanStack Query code (api functions, `queryOptions`, `useMutation` hooks, TS types), one folder per controller, calling **your** axios instance. The audience is React/TypeScript front-end engineers who live in an editor. **Code is the product**, so code is the hero content of the site.

Three design consequences, referenced throughout:
1. The **transformation** (spec in → typed code out) is the core narrative. Every surface dramatizes it.
2. The **generated code must look gorgeous** — editor/terminal surfaces are first-class components, not afterthoughts.
3. The audience has high taste and low patience: flashy, but fast and legible. No animation may block reading or input.

---

## 1. Design direction

**Mood:** a late-night editor with the syntax theme turned up — deep near-black graphite, a single confident electric-cyan signal color, and a violet secondary used sparingly for "generated / magic" moments. The feeling to evoke in one word: **effortless** — you watch messy spec collapse into clean, typed code and think "oh, that's it?"

**References (for calibration, not imitation):** the restraint and editorial type of Linear; the code-as-hero treatment of the Astro and Bun landing pages; the terminal-glow neon of Vercel/Turborepo dark marketing; Shiki's `github-dark`/`tokyo-night` syntax balance.

**Discipline:** one primary (cyan), one accent (violet), neon used as *light* (glow) not as fill. Surfaces are nearly monochrome graphite so syntax color carries all the energy. If a screen has more than two saturated hues outside a code block, it is wrong.

---

## 2. Design tokens

Drop-in for a Tailwind v4 `@theme` block. Dark is the **primary and default** mode (`:root` is dark). Light mode is a documented secondary (§2.9) — ship dark first.

All color pairs are listed as **oklch (authoring source of truth) + hex (fallback / reference)**. Contrast ratios against their intended background are noted; all body/UI text meets **WCAG AA** (≥ 4.5:1 normal, ≥ 3:1 large/UI).

### 2.1 Color — semantic roles

```css
@theme {
  /* ---- Backgrounds & surfaces (graphite ramp, cool-neutral hue 250) ---- */
  --color-bg:            oklch(0.17 0.012 255);   /* #0B0E14  page background        */
  --color-bg-subtle:     oklch(0.20 0.014 255);   /* #11151D  alt section band       */
  --color-surface:       oklch(0.23 0.016 255);   /* #161B26  cards, code chrome      */
  --color-surface-raised:oklch(0.27 0.018 255);   /* #1E2530  popovers, raised, hover */
  --color-surface-inset: oklch(0.15 0.012 255);   /* #080B11  code block well, inputs */

  /* ---- Borders / hairlines ---- */
  --color-border:        oklch(0.32 0.018 255);   /* #2A3140  default 1px hairline     */
  --color-border-strong: oklch(0.40 0.020 255);   /* #3A4254  hover/active separators  */
  --color-border-muted:  oklch(0.26 0.015 255);   /* #1C222D  faint internal dividers  */

  /* ---- Text ---- */
  --color-text:          oklch(0.96 0.004 255);   /* #EDF0F5  primary  ~14.8:1 on bg   */
  --color-text-muted:    oklch(0.74 0.012 255);   /* #A3ACBD  secondary ~6.7:1 on bg   */
  --color-text-faint:    oklch(0.58 0.012 255);   /* #6B7488  captions/meta ~3.9:1 LG  */
  --color-text-on-primary: oklch(0.17 0.012 255); /* #0B0E14  text on cyan fills       */

  /* ---- Brand ---- */
  --color-primary:       oklch(0.82 0.15 200);    /* #36D7E3  electric cyan (signal)   */
  --color-primary-hover: oklch(0.87 0.14 200);    /* #5FE6EF                           */
  --color-primary-press: oklch(0.75 0.15 200);    /* #1FC3D0                           */
  --color-primary-soft:  oklch(0.82 0.15 200 / 0.12); /* tint fills / selected bg      */
  --color-accent:        oklch(0.68 0.20 295);    /* #9B6BFF  violet (generated/magic) */
  --color-accent-soft:   oklch(0.68 0.20 295 / 0.14);

  /* ---- Status ---- */
  --color-success:       oklch(0.80 0.17 155);    /* #38E59B                           */
  --color-warn:          oklch(0.83 0.15 85);     /* #F2C14E                           */
  --color-danger:        oklch(0.68 0.20 25);     /* #FF6B5E                           */
  --color-success-soft:  oklch(0.80 0.17 155 / 0.13);
  --color-warn-soft:     oklch(0.83 0.15 85 / 0.13);
  --color-danger-soft:   oklch(0.68 0.20 25 / 0.14);
}
```

> Contrast notes (verify in build): primary cyan `#36D7E3` on `--color-bg` = **8.9:1** (AA/AAA text); text-on-primary `#0B0E14` on cyan = **8.9:1**. `text-muted` on `surface` = **5.4:1**. `text-faint` is for **non-essential** large/meta text only (≥ 3:1) — never body copy.

### 2.2 Color — neon / glow

Neon is delivered as **box-shadow / drop-shadow glow**, never as a flat saturated fill behind text. Glow tokens pair a color with a blur radius and opacity so usage is consistent.

```css
@theme {
  --glow-primary:  0 0 24px oklch(0.82 0.15 200 / 0.45),  0 0 2px oklch(0.82 0.15 200 / 0.70);
  --glow-primary-sm: 0 0 12px oklch(0.82 0.15 200 / 0.40);
  --glow-primary-lg: 0 0 48px oklch(0.82 0.15 200 / 0.35), 0 0 4px oklch(0.82 0.15 200 / 0.60);
  --glow-accent:   0 0 24px oklch(0.68 0.20 295 / 0.45),  0 0 2px oklch(0.68 0.20 295 / 0.70);
  --glow-success:  0 0 16px oklch(0.80 0.17 155 / 0.40);
  --glow-danger:   0 0 16px oklch(0.68 0.20 25 / 0.45);
  /* Ambient hero wash — used on a blurred radial blob behind the hero, not on text */
  --glow-ambient-cyan:   radial-gradient(closest-side, oklch(0.82 0.15 200 / 0.28), transparent);
  --glow-ambient-violet: radial-gradient(closest-side, oklch(0.68 0.20 295 / 0.22), transparent);
}
```

**Rules:** glow opacity never exceeds 0.5 on interactive elements (legibility). Text is never the glowing element — its *container* glows. Glow appears on: primary CTA (hover/focus), active nav item indicator, the code-morph "commit" frame, focus rings (secondary). At most **one** glowing element should be animating at a time per viewport.

### 2.3 Syntax-highlight palette (Shiki)

Custom Shiki theme `s2tq-night`. Tuned on `--color-surface-inset` (`#080B11`) code wells. Cyan reserved for the brand stays out of code so brand and code don't compete; code uses a warmer cyan-green + violet + amber set. All token colors verified ≥ 4.5:1 on the code background.

| Token            | Hex       | Role / notes                                  |
| ---------------- | --------- | --------------------------------------------- |
| `background`     | `#080B11` | matches `--color-surface-inset`               |
| `foreground`/plain | `#C9D1E0` | default text, identifiers (7.9:1)           |
| `comment`        | `#5C6679` | JSDoc/comments, italic (3.6:1 — large-only OK in code, decorative) |
| `keyword`        | `#FF7AB6` | `import`, `export`, `const`, `type`, `=>` kw  |
| `string`         | `#8DE98D` | string + template literals                    |
| `function`       | `#5FE6EF` | function/method names (`getContact`)          |
| `type`           | `#C8A2FF` | TS types, interfaces, generics (`Detail`)     |
| `number`         | `#F2C14E` | numeric + boolean literals                    |
| `punctuation`    | `#7E8AA3` | braces, brackets, semicolons                  |
| `operator`       | `#9FB0CC` | `.`, `:`, `<`, `>`, `&`, `|`                  |
| `property`       | `#A9D4FF` | object keys / property access                 |
| `variable`       | `#C9D1E0` | locals (inherit plain)                        |
| `regexp`/`escape`| `#7CE0D0` | escapes inside strings                        |
| `tag`/`attr` (YAML/JSX) | `#5FE6EF` / `#C8A2FF` | for spec YAML + JSX examples |
| `addition`       | `#38E59B` | diff/highlight add line bg `#0F2A1E`          |
| `deletion`       | `#FF6B5E` | diff/highlight del line bg `#2A1010`          |

Shiki line-highlight: `--code-line-highlight-bg: oklch(0.82 0.15 200 / 0.08)`; active morph line gets a 2px left border `--color-primary`.

Define the theme object once (`src/lib/shiki-theme.ts`) and pass to both build-time `<Code>` and the runtime playground highlighter (use `shiki` `createHighlighter` with this theme + langs `ts,tsx,json,yaml,bash`).

### 2.4 Typography

```css
@theme {
  --font-display: "Clash Display", "Satoshi", ui-sans-serif, system-ui, sans-serif;
  --font-sans:    "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
}
```

- **Display** (`Clash Display`, variable, self-hosted woff2, weight 500–600): hero + section headings only. Tight, characterful. Fallback to Satoshi/Inter so layout doesn't shift > tune fallback metrics with `size-adjust`.
- **Sans** (`Inter` variable): all body, UI, nav. Enable `cv05, cv08, ss01` and `"tnum"` in tables.
- **Mono** (`JetBrains Mono` variable): all code, the logo wordmark `s2tq`, inline `code`, kbd, filenames, query keys. Ligatures **on** in code blocks, **off** in editable inputs (`font-variant-ligatures: none` on textareas).

Self-host all three as woff2 with `font-display: swap`. Preload the display + mono regular weights.

**Type scale** — base 16px, modular ratio ~1.2 (major third softened). `rem` values assume `:root { font-size: 16px }`.

| Token / role | size (rem / px)      | line-height | weight | letter-spacing | font     | use                       |
| ------------ | -------------------- | ----------- | ------ | -------------- | -------- | ------------------------- |
| `display-xl` | 4.5 / 72             | 1.02        | 600    | -0.03em        | display  | landing hero H1 (desktop) |
| `display-l`  | 3.25 / 52            | 1.05        | 600    | -0.025em       | display  | hero H1 (tablet), big sec |
| `h1`         | 2.5 / 40             | 1.1         | 600    | -0.02em        | display  | page title                |
| `h2`         | 1.875 / 30           | 1.2         | 600    | -0.015em       | display  | section                   |
| `h3`         | 1.375 / 22           | 1.3         | 600    | -0.01em        | sans     | subsection                |
| `h4`         | 1.125 / 18           | 1.4         | 600    | 0              | sans     | card title / minor head   |
| `h5`         | 1.0 / 16             | 1.4         | 600    | 0.01em         | sans     | label heading             |
| `h6`         | 0.8125 / 13          | 1.4         | 700    | 0.08em UPPER   | sans     | eyebrow / kicker (caps)   |
| `body-l`     | 1.125 / 18           | 1.7         | 400    | 0              | sans     | docs intro / lead         |
| `body`       | 1.0 / 16             | 1.7         | 400    | 0              | sans     | default prose             |
| `body-s`     | 0.875 / 14           | 1.6         | 400    | 0              | sans     | secondary UI text         |
| `caption`    | 0.75 / 12            | 1.5         | 500    | 0.01em         | sans     | meta, TOC, footnotes      |
| `code`       | 0.875 / 14           | 1.65        | 400    | 0              | mono     | code blocks (14px desktop)|
| `code-inline`| 0.875em (relative)   | inherit     | 500    | 0              | mono     | inline `code`             |
| `code-sm`    | 0.8125 / 13          | 1.6         | 400    | 0              | mono     | file tree, line numbers   |
| `kbd`        | 0.75 / 12            | 1           | 600    | 0              | mono     | keyboard hints            |

Prose measure: max `68ch` for docs body. Headings get `text-wrap: balance`; lead paragraphs `text-wrap: pretty`.

### 2.5 Spacing scale

4px base. Use only these steps (Tailwind-compatible names).

```css
@theme {
  --spacing-0:  0;      --spacing-px: 1px;
  --spacing-1:  0.25rem; /* 4  */   --spacing-2:  0.5rem;  /* 8  */
  --spacing-3:  0.75rem; /* 12 */   --spacing-4:  1rem;    /* 16 */
  --spacing-5:  1.25rem; /* 20 */   --spacing-6:  1.5rem;  /* 24 */
  --spacing-8:  2rem;    /* 32 */   --spacing-10: 2.5rem;  /* 40 */
  --spacing-12: 3rem;    /* 48 */   --spacing-16: 4rem;    /* 64 */
  --spacing-20: 5rem;    /* 80 */   --spacing-24: 6rem;    /* 96 */
  --spacing-32: 8rem;    /* 128 */  --spacing-40: 10rem;   /* 160 */
}
```

Rhythm rules: component internal padding from {2,3,4,6}; gaps between components {4,6,8}; section vertical padding desktop `--spacing-32` (mobile `--spacing-20`); prose paragraph spacing `--spacing-4`.

### 2.6 Radii, borders, layout widths

```css
@theme {
  --radius-xs: 4px;   --radius-sm: 6px;   --radius-md: 10px;
  --radius-lg: 14px;  --radius-xl: 20px;  --radius-2xl: 28px;
  --radius-full: 9999px;

  --border-thin: 1px; --border-med: 1.5px; --border-thick: 2px;

  /* layout */
  --container-max: 1280px;     /* marketing sections                  */
  --container-prose: 768px;    /* docs content column                 */
  --sidebar-w: 268px;          /* docs left nav                       */
  --toc-w: 240px;              /* docs right TOC                      */
  --header-h: 60px;
}
```

Radius usage: inputs/buttons `--radius-md`; cards `--radius-lg`; code blocks / editor surfaces `--radius-xl`; pills/badges `--radius-full`; the hero device frame `--radius-2xl`.

### 2.7 Elevation (shadow + glow)

Dark UI: elevation is conveyed by **surface lightness step + hairline border + soft shadow**, plus optional neon glow for "active/magic". Never rely on shadow alone.

```css
@theme {
  --shadow-0: none;
  --shadow-1: 0 1px 2px oklch(0 0 0 / 0.40);                                   /* hairline rest   */
  --shadow-2: 0 4px 12px oklch(0 0 0 / 0.45);                                  /* cards           */
  --shadow-3: 0 12px 32px oklch(0 0 0 / 0.50);                                 /* popover/menu    */
  --shadow-4: 0 24px 64px oklch(0 0 0 / 0.55);                                 /* modal/hero frame*/
  /* elevation + glow combos (use sparingly) */
  --elev-cta:    var(--shadow-2), var(--glow-primary-sm);
  --elev-active: var(--shadow-2), var(--glow-primary);
}
```

Mapping: rest cards `--shadow-2` + `--color-border`; hover cards lift to `--shadow-3` + `--color-border-strong`; primary CTA rest `--shadow-2`, hover adds `--glow-primary-sm`; code editor frame `--shadow-4`.

### 2.8 Z-index layers

```css
@theme {
  --z-base: 0; --z-raised: 10; --z-sticky: 20; --z-header: 30;
  --z-drawer: 40; --z-overlay: 50; --z-modal: 60; --z-popover: 70;
  --z-toast: 80; --z-tooltip: 90;
}
```

### 2.9 Light mode (secondary; ship after dark)

Override under `:root[data-theme="light"]` only — same hue families, inverted lightness. bg `oklch(0.99 0.004 255)` `#FBFCFE`; surface `#FFFFFF`; border `oklch(0.90 0.01 255)`; text `oklch(0.25 0.015 255)`; primary darkens to `oklch(0.62 0.16 215)` `#0E9DAD` for AA on white (cyan must darken or it fails contrast). Glow opacity halved in light mode; ambient washes removed. Shiki swaps to a `s2tq-day` variant (not specified here — derive by inverting lightness, keep hues).

### 2.10 Motion tokens

```css
@theme {
  /* durations */
  --dur-1: 80ms;   --dur-2: 140ms;  --dur-3: 220ms;  --dur-4: 360ms;
  --dur-5: 560ms;  --dur-6: 840ms;  --dur-morph: 1100ms;

  /* easings */
  --ease-out-quad:  cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);     /* primary entrance ease   */
  --ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);    /* transforms both ways    */
  --ease-spring:    linear(0,0.16,0.43,0.74,0.93,1.04,1.07,1.04,1,0.99,1); /* CSS spring-ish */
  --ease-glow:      cubic-bezier(0.4, 0, 0.6, 1);      /* pulse                   */
}
```

Framer Motion spring presets (use these objects verbatim):
```ts
export const springSoft  = { type: "spring", stiffness: 220, damping: 30, mass: 0.9 };
export const springSnappy= { type: "spring", stiffness: 420, damping: 34 };
export const easeOutExpo = { duration: 0.36, ease: [0.16, 1, 0.3, 1] };
```

**Named motion primitives** (define once, reuse everywhere):

| Primitive    | Params (literal)                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `fade-up`    | from `{opacity:0, y:16}` → `{opacity:1, y:0}`, `easeOutExpo` (0.36s). Entrance default.           |
| `fade-in`    | `{opacity:0}`→`{opacity:1}`, `--dur-3`. For text swaps where motion would distract.               |
| `scale-pop`  | `{opacity:0, scale:0.96}`→`{opacity:1, scale:1}`, `springSnappy`. Badges, popovers, copied toast. |
| `stagger`    | parent `staggerChildren: 0.06`, `delayChildren: 0.04`; children use `fade-up`. Lists/feature grid.|
| `glow-pulse` | box-shadow `--glow-primary-sm` ↔ `--glow-primary`, 2200ms, `--ease-glow`, infinite alternate.     |
| `code-morph` | spec→code transition, `--dur-morph`, see §4.1.4. The signature animation.                          |
| `underline-grow` | nav/link underline `scaleX:0`→`1`, transform-origin left, `--dur-2` `--ease-out-quad`.        |
| `caret-blink`| opacity 1↔0 step, 1060ms, terminal caret only.                                                    |

**Global motion rules:** entrance animations fire **once** on first scroll-into-view (`whileInView`, `viewport={{ once: true, margin: "-12% 0px" }}`), never on re-scroll. Distance budgets: translate ≤ 24px, scale ≤ 0.06 delta. Stagger total never exceeds 480ms for a group. Hover transitions `--dur-2`; press `--dur-1`.

**`prefers-reduced-motion: reduce`** (mandatory): all `y`/`scale`/`x` transforms → identity; keep only `opacity` fades capped at `--dur-2`; disable `glow-pulse`, `caret-blink`, `code-morph` looping and parallax; `code-morph` becomes an instant crossfade (`fade-in`). Implement once via a `useReducedMotion()` guard in a shared `motionConfig` + a CSS `@media (prefers-reduced-motion: reduce)` block that zeroes `--dur-*` driven animations and sets `animation: none; scroll-behavior: auto`.

---

## 3. Component anatomy

Conventions: every interactive element has the 5 states **default / hover / focus-visible / active(pressed) / disabled**, plus loading where relevant. **Focus-visible** is global and consistent (§5): `outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: inherit;` plus `box-shadow: var(--glow-primary-sm)` on dark, suppressed under reduced-motion only for the *animated* part (ring stays). Hit target ≥ 40×40px for primary controls, ≥ 32px for dense toolbar icons.

### 3.1 Buttons

Sizes: `sm` h32 px12 text body-s · `md` h40 px16 body · `lg` h48 px24 body-l. Radius `--radius-md`. Icon gap `--spacing-2`. Mono is *not* used in buttons except `kbd` hints.

**Variants**

- **Primary** (CTA): bg `--color-primary`, text `--color-text-on-primary`, weight 600, `--shadow-2`. Hover: bg `--color-primary-hover` + `--glow-primary-sm`, `translateY(-1px)`. Active: bg `--color-primary-press`, `translateY(0)`, glow removed. Focus-visible: ring + `--glow-primary`. Disabled: bg `--color-surface-raised`, text `--color-text-faint`, no shadow, `cursor: not-allowed`.
- **Secondary** (outline): transparent bg, `1px --color-border-strong`, text `--color-text`. Hover: bg `--color-surface-raised`, border `--color-primary`, text `--color-primary`. Active: bg `--color-surface`. Same focus.
- **Ghost**: transparent, text `--color-text-muted`. Hover: bg `--color-surface-raised`, text `--color-text`. For toolbar/secondary nav.
- **Danger**: derive from Primary with `--color-danger` / `--glow-danger` (used only in destructive playground actions like "Clear spec").

Transitions: `background, box-shadow, transform, border-color` `--dur-2 --ease-out-quad`. Loading: swap label for a 16px spinner (rotate, 700ms linear) + keep width (min-width lock); disable pointer.

```
┌─────────────────────────┐      ┌───────────────────────┐
│  ▸ Open Playground   →   │      │  Read the docs         │   ← Primary (filled, glows on hover) + Secondary (outline)
└─────────────────────────┘      └───────────────────────┘
```

### 3.2 Cards

Container: bg `--color-surface`, `1px --color-border`, `--radius-lg`, padding `--spacing-6`, `--shadow-2`. Title `h4`, body `body-s` `--color-text-muted`, optional lucide icon 20px in a 40px rounded tile (`--color-primary-soft` bg, `--color-primary` icon).

States: hover (interactive cards only) → border `--color-border-strong`, `--shadow-3`, `translateY(-2px)`, icon tile gains `--glow-primary-sm`; transition `--dur-2`. Focus-visible (if link/button card): standard ring on the card. Feature cards on landing animate in via `stagger`.

### 3.3 Header (global)

Height `--header-h` (60px), sticky, `--z-header`. Background `oklch(0.17 0.012 255 / 0.72)` + `backdrop-filter: blur(12px)` + bottom `1px --color-border-muted`. On scroll > 8px, border becomes `--color-border` and adds `--shadow-1` (transition `--dur-3`).

Left: logo `s2tq` (mono, 600, text) with a 2px cyan underline accent + full name on ≥md. Center/left-of-actions: nav links `Docs · Playground · GitHub`. Right: theme toggle (sun/moon lucide, 20px, ghost button) + GitHub star pill + primary "Playground" CTA (sm) on ≥md. Mobile (<md): logo + hamburger → full-screen drawer (`--z-drawer`, `fade-in` + panel `fade-up`, focus-trapped).

Link states: rest `--color-text-muted`; hover/active `--color-text` with `underline-grow` in `--color-primary`. Current page link: `--color-text`, persistent 2px cyan underline + `--glow-primary-sm` on the underline only.

### 3.4 Docs left sidebar (nav)

Width `--sidebar-w` (268px), sticky below header, own scroll (`overflow-y:auto; overscroll-behavior:contain`), `1px --color-border-muted` right divider, padding `--spacing-6 --spacing-4`.

Structure: section group label (`h6` caps, `--color-text-faint`, mb `--spacing-2`) → item list. Item: `body-s`, h32, px `--spacing-3`, radius `--radius-sm`.

States:
- rest: text `--color-text-muted`.
- hover: bg `--color-surface`, text `--color-text`.
- active (current section): text `--color-primary`, bg `--color-primary-soft`, a 2px left bar (`--color-primary`, full item height, `--radius-full`, with `--glow-primary-sm`). Active bar slides between items with `layoutId="nav-active"` (Framer shared layout, `springSoft`); reduced-motion → instant.
- focus-visible: standard ring inset.

Collapsible groups optional (chevron lucide 16px, rotate 90° on expand `--dur-2`). On mobile the sidebar is the drawer content.

```
SECTION                       ┐
│ Introduction                │
│▎Installation       ← active │  (▎ = glowing 2px cyan bar + soft tint)
│ Quick Start                 │
│ Configuration               │
└─────────────────────────────┘
```

### 3.5 Right-hand TOC ("On this page")

Width `--toc-w` (240px), sticky, hidden < lg. Heading `h6` caps `--color-text-faint`. Items `caption`, indented by heading depth (h2 flush, h3 +`--spacing-3`). 1px left rail (`--color-border-muted`); the active item's segment of the rail is `--color-primary` (2px), driven by an IntersectionObserver scroll-spy (root margin `-64px 0px -70% 0px`, pick top-most intersecting). Active text `--color-text`. Hover `--color-text`. Smooth-scroll to anchor (`--ease-out-expo` if motion allowed). A thin top-of-page reading-progress line (2px, `--color-primary`, `--glow-primary-sm`) sits under the header on docs pages.

### 3.6 Code block (the centerpiece surface)

This is the most important component. Build one `<CodeSurface>` React/Astro component used for all code (docs + landing demo + playground viewer).

Anatomy:
```
┌───────────────────────────────────────────────────────────┐  ← frame: bg surface, 1px border, radius-xl, shadow-4
│  ●  ●  ●   contact/apis.ts                 [ts]   ⧉ Copy    │  ← title bar h40, surface-raised, bottom 1px border-muted
├───────────────────────────────────────────────────────────┤
│ 1   import { axiosInstance as client } from "@/lib/axios"; │  ← well: bg surface-inset (#080B11), code 14px/1.65
│ 2                                                          │
│ 3   export const getContact = ({ contactId }: …) =>        │
│ ▎4   client.get<CommonResponse<Detail>>(`/api/v1/…`)…      │  ← highlighted line: cyan 8% bg + 2px cyan left border
└───────────────────────────────────────────────────────────┘
```

- **Title bar** (h40, `--color-surface-raised`): three 10px traffic-light dots (`#FF6B5E / #F2C14E / #38E59B` at 0.9 alpha, purely decorative `aria-hidden`), then filename (`code-sm`, `--color-text-muted`), a language badge (§3.10) pinned right-of-center, and a **Copy** button (ghost, lucide `Copy` 16px → `Check` + `--color-success` + `scale-pop` for 1.2s on success, with `aria-live="polite"` "Copied").
- **Well:** padding `--spacing-4 --spacing-5`; `--color-surface-inset` bg; horizontal scroll with thin custom scrollbar (`--color-border-strong` thumb). Optional line numbers (`code-sm`, `--color-text-faint`, `user-select:none`, right-aligned, `--spacing-4` gutter).
- **Long blocks:** collapse > 22 lines behind a gradient fade (`linear-gradient(transparent, --color-surface-inset)`) + centered "Show all" ghost button; expand animates height `--dur-4 --ease-out-expo`.
- **Tabs** (when showing the 5 generated files): see §3.9, mounted in the title bar row beneath dots for playground.
- Build-time highlighting via Shiki + `s2tq-night`; never ship a runtime highlighter to docs pages (playground is the one island that lazy-loads the highlighter).
- Reduced-motion: copy-success uses `fade-in` not `scale-pop`; no morph.

### 3.7 File tree (playground + output-structure docs)

Vertical list, `code-sm`, row h28, indent `--spacing-4` per depth with a 1px guide line at each level (`--color-border-muted`). Folder row: lucide `ChevronRight` (rotates 90° when open, `--dur-2`) + `Folder`/`FolderOpen` 16px (`--color-primary` when open) + name. File row: type-tinted file glyph (ts → cyan dot, json → amber, yaml → green) + name; the `.ts` files use lucide `FileCode2`.

States: rest text `--color-text-muted`; hover bg `--color-surface`, text `--color-text`; **selected** (current file in viewer) bg `--color-primary-soft`, text `--color-primary`, 2px cyan left bar (mirrors sidebar active). Keyboard: roving tabindex, ↑/↓ move, →/← expand-collapse, Enter/Space select, Home/End jump (ARIA `tree`/`treeitem`/`group`). Newly generated files flash a 600ms `--color-primary-soft` highlight that fades (`fade-in` reverse) — disabled under reduced-motion.

```
▾ 📁 contact
   • types.ts
   • apis.ts        ← selected (cyan bar + tint)
   • queries.ts
   • mutations.ts
   • index.ts
▸ 📁 user
```

### 3.8 Inputs, textarea, selects, toggles, file-drop

Shared field shell: bg `--color-surface-inset`, `1px --color-border`, `--radius-md`, text `body-s`, padding `--spacing-2 --spacing-3`, h40 (textarea min-h 160; spec editor fills its panel). Placeholder `--color-text-faint`.

- Focus: border `--color-primary` + ring (`outline 2px primary, offset 2px`) + `--glow-primary-sm`; transition `--dur-2`.
- Invalid: border `--color-danger`, helper text `--color-danger` (`caption`), `aria-invalid`, `--glow-danger` on focus.
- Disabled: bg `--color-surface`, text `--color-text-faint`, `cursor:not-allowed`.
- **Label** above field (`h5`/`body-s` 600, `--color-text`), optional helper/`caption` `--color-text-muted` below.
- **Select**: native `<select>` styled as field + lucide `ChevronDown` 16px; menu uses OS native (don't custom-render unless needed). Filenames/paths fields use `--font-mono`.
- **Toggle** (format on/off, generic-envelope on/off): track 36×20 `--radius-full`, off bg `--color-surface-raised`, on bg `--color-primary` + `--glow-primary-sm`; knob 16px white, slides `--dur-2 --ease-out-quad`. Role `switch`, `aria-checked`. Reduced-motion → instant knob.
- **Spec editor textarea**: `--font-mono`, ligatures off, `tab-size: 2`, line wrapping off (horizontal scroll), spellcheck off. A read-only Shiki preview is NOT used here (keep it an editable textarea for paste); validity (valid JSON/YAML) shown by a status chip.
- **File drop zone**: dashed `1.5px --color-border-strong`, `--radius-lg`, `--color-text-muted` hint + lucide `Upload`. Dragover: border `--color-primary`, bg `--color-primary-soft`, `--glow-primary-sm`.

### 3.9 Tabs

Used for: playground config sections, the landing before/after if needed, and the file viewer's open files. Tab list: row, gap `--spacing-1`, bottom `1px --color-border-muted`. Tab: `body-s`, h36, px `--spacing-3`, text `--color-text-muted`. Hover → `--color-text`. **Active** → `--color-text`, with a 2px bottom indicator (`--color-primary`, `--glow-primary-sm`) that slides via `layoutId="tab-underline"` (`springSnappy`). Focus-visible ring. ARIA `tablist/tab/tabpanel`, ←/→ + Home/End, `aria-selected`, panel `tabindex=0`. Panel switch: `fade-in` `--dur-2` (no slide, to avoid layout jank). Reduced-motion → indicator jumps.

### 3.10 Badges, pills, chips, kbd

- **Language badge** (code titles): `caption`, mono, uppercase, px `--spacing-2`, h20, `--radius-sm`, bg per-lang soft tint + matching text — `ts` cyan, `tsx` cyan, `json` amber, `yaml` green, `bash` violet.
- **Status pill** (playground spec validity): h24, `--radius-full`, px `--spacing-3`, icon 14px + label `caption`. Valid → `--color-success-soft`/`--color-success` + `CheckCircle2`; invalid → `--color-danger-soft`/`--color-danger` + `AlertCircle`; parsing → `--color-text-muted` + spinner. `aria-live="polite"`.
- **Feature/meta badge** (landing): outline `1px --color-border-strong`, `--color-text-muted`, mono caption (e.g. `Swagger 2.0`, `OpenAPI 3.x`, `TanStack Query v5`).
- **Star pill** (header): `Star` 16px + count, ghost→secondary on hover.
- **kbd**: mono `kbd` size, bg `--color-surface-raised`, `1px --color-border`, `--radius-xs`, px `--spacing-1`, min-w 18px, baseline-shifted; used in tooltips/help (`⌘K`, `Esc`, `↑↓`).

### 3.11 Callouts / admonitions (docs prose)

Left-accent block: `1px --color-border` + 3px left border in role color, `--radius-md`, bg role-soft at 0.06, padding `--spacing-4`, lucide icon 18px top-left. Types: **Note** (cyan/`Info`), **Tip** (success/`Lightbulb`), **Warning** (warn/`TriangleAlert`), **Danger/Gotcha** (danger/`OctagonAlert`). Title `h5`, body `body-s`. Used for README's "no root barrel", "wiped every run", troubleshooting items.

### 3.12 Config field table (docs Configuration section)

Full-width, `body-s`. Header row `h6` caps `--color-text-faint`, bottom `1px --color-border`. Cells px `--spacing-3` py `--spacing-2`, top `1px --color-border-muted`. `field`/`type`/`default` columns use `--font-mono`. Required ✅ rendered as a `--color-primary` `CheckCircle2` 14px (not emoji) with `aria-label="required"`; optional dash as `--color-text-faint` `—`. Row hover bg `--color-surface`. On < md, collapse to stacked definition cards (label/value pairs) instead of horizontal scroll. `tnum` on for alignment.

### 3.13 Tooltip & toast

Tooltip: `--color-surface-raised`, `1px --color-border`, `--radius-sm`, `caption`, `--shadow-3`, `--z-tooltip`, 6px arrow; appears after 400ms hover / on focus; `scale-pop` (origin = trigger). Toast (copy/download confirmation): bottom-right, `--color-surface-raised`, `--radius-md`, `--shadow-3`, success icon, auto-dismiss 2.4s, `scale-pop` in / `fade-in` out, `--z-toast`, `role="status"`.

---

## 4. Page specs

Shared shell: global Header (§3.3) + Footer (links: Docs, Playground, GitHub, npm, License MIT; small `s2tq` mark; `--color-bg-subtle`, top `1px --color-border-muted`, py `--spacing-12`). Max marketing width `--container-max`, centered, side gutter `--spacing-6` (mobile) → `--spacing-8`.

Breakpoints (Tailwind defaults): `sm 640 · md 768 · lg 1024 · xl 1280`. Design targets: **mobile** 390, **tablet** 768, **desktop** 1280.

### 4.1 Landing (`/`)

12-col grid, `--spacing-6` gutter, `--container-max`. Section order:

1. **Hero**
2. **Live transformation demo** (centerpiece) — may be fused with hero on desktop
3. **Feature highlights** (scroll-revealed)
4. **"How it works" 3 steps**
5. **Code-is-the-output showcase** (the 5 generated files via tabs)
6. **CTA band** → Playground / Docs
7. Footer

#### 4.1.1 Hero
Full-width, min-h `min(92vh, 880px)`, centered content max `--container-max`. Background: `--color-bg` + two blurred ambient blobs (`--glow-ambient-cyan` top-left, `--glow-ambient-violet` bottom-right, each ~520px, `filter: blur(40px)`, opacity 0.6) drifting ±12px over 18s (`--ease-in-out`, paused under reduced-motion) + a faint dotted grid (`radial-gradient` dots, `--color-border-muted`, 24px pitch, masked to fade at edges).

Content (left-aligned on desktop, centered on mobile, ~7 of 12 cols):
- Eyebrow `h6` caps `--color-primary`: `SWAGGER / OPENAPI → TANSTACK QUERY`.
- H1 `display-xl`: **"Your spec in. Typed hooks out."** ("Typed hooks" rendered in `--color-primary`).
- Sub `body-l` `--color-text-muted`, max 52ch: one-sentence value prop from README ("Point it at a Swagger spec, run one command, get fully-typed TanStack Query code — one folder per controller, using your own axios instance.").
- CTA row: Primary `lg` "Open Playground" (→ `/playground`) + Secondary `lg` "Read the docs". Below: an install line in a mini one-line `<CodeSurface>` `npm i -D swagger-to-tanstack-query` with inline copy.
- Trust badges row (§3.10 outline badges): `Swagger 2.0` `OpenAPI 3.x` `TanStack Query v5` `Bring your own axios` `MIT`.

Entrance (on load, reduced-motion → all opacity-only): eyebrow→H1→sub→CTAs→badges as a `stagger` (0.06 step), `fade-up`. Ambient blobs fade in over `--dur-6`.

Responsive: desktop = hero text left (cols 1–7) + demo right (cols 7–12) sharing the fold; tablet/mobile = stacked, demo below text, demo full-width.

#### 4.1.2 Live transformation demo (the signature)
A single editor frame (`<CodeSurface>` styling, `--radius-2xl`, `--shadow-4`, faint `--glow-primary-lg` rim) split into **Input** (left/top) and **Output** (right/bottom) with a center "transform" affordance.

- **Input pane:** title `swagger.json`, a small slice of an OpenAPI operation (the README `getContact` path/operation), Shiki `json`/`yaml`.
- **Output pane:** title `contact/apis.ts`, the generated `getContact` function, Shiki `ts`.
- **Center node:** a 44px circular `--color-surface-raised` chip with lucide `Sparkles` (`--color-accent`) + a horizontal connector line that "fills" cyan during morph. On desktop the connector is horizontal (→); stacked layouts use a vertical (↓) connector.

#### 4.1.4 `code-morph` spec (exact)
The hero's reason to exist. A loop that visually converts spec → code.

Sequence (total ~`--dur-morph` ×3 phases ≈ 3.3s, then 2.5s hold, loop):
1. **Read** (0–0.3s): input lines get a sweeping cyan scan-line (a 2px `--color-primary` gradient bar translateY top→bottom, `--ease-out-quad`), each scanned line briefly brightening (`--code-line-highlight-bg`).
2. **Transmit** (0.3–0.7s): center connector fills left→right with `--color-primary` (`scaleX 0→1`, origin left), `Sparkles` does one `glow-pulse`, accent glow blooms (`--glow-accent`).
3. **Write** (0.7–1.6s): output lines type/reveal top-to-bottom — each line `fade-up` (y:8→0, opacity, `--dur-2`) staggered 0.07s, a mono caret (`caret-blink`) leads the active line; on the final line the whole output frame does ONE `--glow-primary` "commit" pulse and a `Check` badge `scale-pop`s in the output title bar.
4. **Hold + reset** (1.6–4.1s): steady state, then crossfade input to the next example operation (cycle 2–3 example endpoints: `getContact`, `createContact`, `uploadAvatar`).

Implementation: drive with a Framer Motion timeline (`useAnimate` + sequence) or a keyed state machine; precompute highlighted HTML for each phase via Shiki at build, swap with React (no runtime highlighter needed for the fixed examples). Pause when offscreen (`whileInView`/IntersectionObserver) and when tab hidden (`visibilitychange`).

**Reduced-motion:** no scan, no typing, no loop. Show input and output side by side, statically; the center node is a static filled cyan connector with a steady (non-pulsing) `Sparkles`. Provide a single "▶ Replay" ghost button that does ONE instant crossfade (`fade-in`) input→output and back, user-initiated only. Never autoplay.

`aria`: the demo is decorative narrative — wrap in `aria-hidden="true"` and provide an adjacent visually-hidden paragraph describing "An OpenAPI operation transforming into a typed getContact query function." Real, accessible code is shown in §4.1.5.

#### 4.1.3 (placement) On mobile the demo collapses to a vertical input-over-output with the ↓ connector; the morph still runs but distances shrink (y:6) and only one example is shown.

#### 4.1.5 Feature highlights
Section heading `h2` "Everything typed, nothing hand-written." Grid of feature cards (§3.2) from README's feature list — 3 cols desktop / 2 tablet / 1 mobile, gap `--spacing-6`. Cards (lucide icon): Controller-based output (`FolderTree`), TanStack Query v5 (`CircleHelp`→use `Workflow`), Bring your own axios (`Plug`), Response envelope unwrapping (`PackageOpen`), Typed errors (`ShieldAlert`), Faithful types (`Braces`), Header params & uploads (`Upload`), Docs preserved/JSDoc (`FileText`), Swagger 2.0 & OpenAPI 3.x (`GitCompare`), Safe identifiers (`ShieldCheck`). Cards enter with `stagger` on scroll-in.

#### 4.1.6 How it works (3 steps)
Horizontal 3-step row (numbered 01–03, mono, `--color-accent`), each with a tiny `<CodeSurface>`: (1) add `swagger-to-tanstack-query.config.json`, (2) `npm run codegen` (terminal styling: `$` prompt + the README's `done. 13 controllers, 65 files.` line in `--color-success`), (3) `useQuery(contactQueries.getContact(...))`. A connecting line animates fill between steps on scroll (`scaleX`, reduced-motion static). Stack vertically < md.

#### 4.1.7 Output showcase
`h2` "One folder per controller." A `<CodeSurface>` with a file tree (§3.7) on the left and a tabbed viewer (§3.9) for `types.ts / apis.ts / queries.ts / mutations.ts / index.ts` (real README output). Selecting a file fades the code (`fade-in`). This is the real, accessible, copyable code (counterpart to the decorative hero morph).

#### 4.1.8 CTA band
Full-width `--color-bg-subtle` band, centered: `h2` "Stop writing fetch wrappers." + Primary `lg` "Open Playground" + Secondary `lg` "Read the docs". A faint `--glow-ambient-cyan` wash behind.

### 4.2 Docs

Three-column on `lg+`: `[sidebar --sidebar-w] [content 1fr, max --container-prose centered] [toc --toc-w]` with `--spacing-12` column gaps, max outer `--container-max`. Header sticky on top. Reading-progress line under header (§3.5).

- **< lg:** TOC hides; content full width (max `--container-prose`), with an inline collapsible "On this page" `<details>` at top of content.
- **< md:** sidebar collapses into the header drawer; a sticky sub-bar shows current section + a "Menu" button.

Content rhythm: page title `h1` + lead `body-l` `--color-text-muted`; `h2` section gap-top `--spacing-16` with a faint top hairline; `h3` gap-top `--spacing-10`; prose `body`, measure `68ch`; paragraph gap `--spacing-4`. Anchor links: heading hover reveals a `Hash`/`Link` lucide 16px (`--color-text-faint`→`--color-primary`) to copy the deep link. Prev/Next pager at page bottom (two secondary cards with ← / → and section titles).

Section order (left nav, grouped) — mirrors README exactly:
- **Get started:** Introduction · Installation · Quick Start
- **Configure:** Configuration (field table §3.12) · Response Envelope · Error Type
- **Output:** Output Structure (file-tree component) · Generated Files (tabbed `<CodeSurface>`)
- **Use it:** Using the Generated Code · Advanced Features
- **Reference:** Naming Rules · Conventions · Programmatic API
- **Help:** Troubleshooting (callouts §3.11) · Limitations

Entrance: content blocks `fade-up` once on load (subtle, `--dur-3`, no stagger beyond first viewport — docs prioritize reading over spectacle). Code blocks do not animate on scroll (only the copy interaction animates). Reduced-motion → opacity only.

### 4.3 Playground (`/playground`)

App-like, fills viewport below header (`height: calc(100dvh - var(--header-h))`, internal panels scroll, page itself doesn't). Two/three-pane layout.

Desktop (`lg+`) — 3 columns:
```
┌ Config (340px) ─┬ Spec input (1fr) ─┬ Generated output (1.1fr) ─┐
│ Source:         │ [Paste] [Examples] │ ▾📁contact   contact/apis.ts ⧉│
│ ◉ Paste ○ Upload│ ┌───────────────┐ │  •types.ts   ┌────────────┐ │
│ ○ Example ▾     │ │ <spec editor> │ │  •apis.ts ◀  │ <code>     │ │
│ ─────────────── │ │  JSON / YAML  │ │  •queries.ts │            │ │
│ client.path     │ │               │ │  •mutations  │            │ │
│ client.name     │ └───────────────┘ │ ▸📁user      └────────────┘ │
│ dataField       │ [● valid OpenAPI] │ [Copy] [Download .zip]      │
│ ▢ envelope …    │                   │                             │
│ error.path/name │                   │                             │
│ ▢ format        │                   │                             │
│ [ Generate → ]  │                   │                             │
└─────────────────┴───────────────────┴─────────────────────────────┘
```
Resizable splitters between panes (drag handle 4px, hover `--color-primary`, `aria` separators, keyboard ←/→ to resize 32px steps). Each pane: header bar (`h6` caps label) + body. Panels bg `--color-surface`, 1px borders, the spec editor & code well inset.

- **Config pane (§3.8 fields):** Source selector (segmented control: Paste / Upload / Example-dropdown of bundled specs incl. the user's floring spec). Then config form mapping the README config 1:1: `client.path` (mono input), `client.name` (input, placeholder `default`), `response.dataField` (input), `response.envelope` (toggle → reveals `envelope.path`/`envelope.name`; disabled+helper "requires dataField" until dataField set), `error.path`/`error.name`, `format` (toggle, default on). A primary **Generate →** button (or auto-generate on change, debounced 400ms — show a `RefreshCw` spinning chip while working). Invalid config fields show inline errors (§3.8).
- **Spec input pane:** tabs Paste / Examples; the editable mono textarea (§3.8); a validity status pill (§3.10) bottom-left reflecting parse state; char/line count caption bottom-right.
- **Output pane:** file tree (§3.7) + tabbed code viewer (§3.9) of generated files, Copy (current file) + Download (.zip of all) buttons. **Empty state:** centered lucide `FileCode2` (48px, `--color-text-faint`) + "Paste a spec or pick an example to see generated code." **Loading:** skeleton lines shimmer (`--color-surface-raised` ↔ `--color-surface`, 1.2s, reduced-motion → static). **Error state:** if spec invalid, replace tree/viewer with a danger callout (§3.11) naming the parse error line.

Tablet (`md`): 2 columns — left = config+spec stacked (tabs to switch), right = output. Mobile (`<md`): single column, top **segmented tabs `Config · Spec · Output`**; Generate button sticky at bottom (`--z-sticky`); output tree becomes a horizontal-scroll chip row + viewer. The morph/flash on new generation: newly-changed files flash (§3.7), disabled under reduced-motion.

Generation runs client-side (the package's `generate` programmatic API compiled to run in-browser, or a worker); show errors gracefully, never a blank screen. Run highlighting in a Web Worker / lazy-loaded Shiki highlighter so the main thread stays responsive.

---

## 5. Accessibility

- **Contrast (verify in CI with a token-contrast test):** body text `#EDF0F5` on `#0B0E14` = 14.8:1; muted `#A3ACBD` on surface `#161B26` = 5.4:1; primary `#36D7E3` text/icon on bg = 8.9:1; CTA text `#0B0E14` on cyan = 8.9:1; success/warn/danger text tokens all ≥ 4.5:1 on their soft backgrounds. `--color-text-faint` and `comment` syntax are ≥ 3:1 and used only for non-essential/large text — never body or form labels. Light mode primary darkened to `#0E9DAD` for AA on white.
- **Focus-visible:** global `:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }` + `--glow-primary-sm` (the glow is suppressed under reduced-motion *animation* but the solid ring always stays — never remove the ring). Never `outline: none` without an equal-or-better replacement. Skip-link ("Skip to content") first in tab order, visible on focus.
- **Keyboard paths:** Header → nav → CTA. Docs: sidebar is a nav landmark; TOC links jump + move focus to the heading (`tabindex=-1` target). File tree = full ARIA `tree` (↑↓ navigate, ←→ collapse/expand, Enter select, Home/End). Tabs = ARIA `tablist` (←→, Home/End, `aria-selected`). Playground: logical order Config → Spec → Output; splitters keyboard-resizable; Generate reachable; `⌘K`/`Ctrl+K` opens docs search (if present). Drawer & any modal: focus-trapped, `Esc` closes, focus returns to trigger.
- **Semantics:** one `<h1>` per page; landmarks `header/nav/main/aside/footer`; the right TOC `<nav aria-label="On this page">`, left `<nav aria-label="Documentation">`. Decorative icons `aria-hidden`; meaningful icon-only buttons get `aria-label`. Copy/toast/validity use `aria-live="polite"`; theme toggle is a labeled `button` with `aria-pressed`.
- **Hero morph a11y:** decorative (`aria-hidden`), paired with a visually-hidden description; real code lives in an accessible showcase. Autoplay never runs under reduced-motion (replay is user-initiated).
- **Reduced-motion fallback (single global guard):**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
  plus a React `useReducedMotion()` check that: disables `code-morph` autoplay/looping (→ static side-by-side + manual replay crossfade), `glow-pulse`, `caret-blink`, ambient-blob drift, parallax, the nav/tab `layoutId` slide (→ instant), file-flash, and reduces all entrance transforms to opacity-only ≤ `--dur-2`. Hover/focus *color* changes remain (they aid usability); only motion is removed.
- **Targets & input:** primary controls ≥ 40px; toolbar icons ≥ 32px with ≥ 8px spacing. Spec textarea spellcheck off, `aria-label="OpenAPI specification"`. All form fields have associated `<label>`, errors linked via `aria-describedby`, invalid via `aria-invalid`.
- **Performance-as-a11y:** self-host fonts with `swap` + fallback `size-adjust` to prevent CLS; build-time Shiki (no runtime highlighter on docs); lazy-load the playground island + worker; respect `prefers-reduced-data` by skipping ambient washes and pausing the morph by default.

---

## 6. Build checklist (so independent engineers converge)

1. Create `src/styles/theme.css` with the full §2 `@theme` block verbatim (oklch authoring, hex comments).
2. `src/lib/shiki-theme.ts` exporting `s2tq-night` from §2.3; one `<CodeSurface>` (§3.6) consuming it.
3. `src/lib/motion.ts` exporting the §2.10 presets + a `useMotionConfig()` wrapping `useReducedMotion()`; all Framer usage imports from here.
4. Shared primitives first: Button, Card, Badge, CodeSurface, FileTree, Tabs, Field/Toggle, Callout, Tooltip/Toast, Header, Footer, Sidebar, Toc.
5. Pages in order: Docs (content-driven, lowest risk) → Landing → Playground (highest complexity, lazy island + worker).
6. Gate merges on: token-contrast test (§5), reduced-motion snapshot (no transforms animate), keyboard walkthrough of file tree + tabs + drawer, Lighthouse a11y ≥ 95 and no CLS from fonts.

This document is the contract. Where it omits a value, derive it from the nearest token and the discipline in §1 — never introduce a new hue or a third saturated color.
