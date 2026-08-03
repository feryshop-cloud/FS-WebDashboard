---
name: Feryshop Dashboard
description: Calm, fully-audited back-office ERP for game-account trading operations
colors:
  primary: "#2563EB"
  primary-deep: "#1D4ED8"
  primary-halo: "#EFF6FF"
  canvas: "#F8FAFC"
  surface: "#FFFFFF"
  ink: "#0F172A"
  ink-secondary: "#64748B"
  ink-faint: "#94A3B8"
  line: "#E2E8F0"
  line-soft: "#F1F5F9"
  success: "#059669"
  success-bg: "#ECFDF5"
  warning: "#D97706"
  warning-bg: "#FFFBEB"
  danger: "#DC2626"
  danger-bg: "#FEF2F2"
  violet: "#9333EA"
  violet-bg: "#FAF5FF"
  orange: "#EA580C"
  orange-bg: "#FFF7ED"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.05em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "14px"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "42px"
    padding: "10px 16px"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge-status:
    rounded: "{rounded.md}"
    padding: "4px 10px"
  nav-item-active:
    backgroundColor: "{colors.primary-halo}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  nav-item-idle:
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Feryshop Dashboard

## Overview

**Creative North Star: "The Ledger Room"**

Feryshop's dashboard is designed to feel like a calm, well-run back office where every number sits in its place — quiet, orderly, and always traceable. Admins live in this interface for hours across a shift, so the system trades spectacle for stillness: an airy slate canvas (`#F8FAFC`) carries pure-white surfaces, a single restrained blue accent carries interaction, and status is spoken in muted, soft-tinted chips rather than loud fills. The aesthetic philosophy in the project's own design brief is a "Human-Made Modern B2B SaaS" look: breathable, premium, and calm, explicitly built to reduce eye strain for staff who stare at tables and dashboards all day.

Density is comfortable, never cramped. Cards breathe with `p-6`/`p-8` padding, tables leave generous cell spacing, and grids gap at 16–24px. Depth is a whisper at rest — white cards sit on hairline slate borders with a barely-there shadow — and elevation only appears when it earns attention: a card rises on hover, and modals or slide-over drawers lift hard above the page. Typography leans on the system UI sans stack with tight-tracked bold display headings and 14px body copy; sensitive values (prices, account codes, OTPs) are set in monospace so columns line up and codes scan — a visual nod to the product's audit-first discipline.

**Key Characteristics:**

- Single calm blue accent (`blue-600`) on a slate-50 / white two-layer canvas; no neon, fluorescent, or cyan tones, ever.
- Soft but never pill-shaped corners: 10px controls, 12px cards, 16px imagery; `rounded-full` reserved for avatars, dots, and circular icon buttons.
- Muted status system: 50-level tinted backgrounds with 600-level text and hairline rings.
- Layered elevation: flat at rest, gentle rise on hover, hard `shadow-2xl` lift for overlays.
- Comfortable, breathable density with generous whitespace throughout.
- Thin-line lucide icons (`strokeWidth` 1.5) at 20px in navigation; duotone Phosphor icons for dashboard stats.
- Monospace for numeric and sensitive values, reinforcing the ledger/audit identity.

## Colors

The palette is a restrained cool-neutral system: one blue accent, a slate neutral ramp, and a family of muted status tints. Nothing hot, nothing saturated enough to compete with the data.

### Primary

- **Calm Blue** (#2563EB): The single interaction accent — primary buttons, active nav states, primary focus rings, positive progress fills. Hovers deepen to `#1D4ED8`; pressed states to `#1E40AF`.
- **Calm Blue Halo** (#EFF6FF): The `blue-50` tint used for active sidebar items, selected rows, and subtle emphasis fills, always paired with Calm Blue text.

### Secondary

- **Violet** (#9333EA): A deliberate secondary accent owned by the deal/trade-in/purchase modules — purple primary buttons on deal creation, purchases, and trade-in flows, plus the "Akses Terbatas" status tint. Distinct from Calm Blue so module context reads instantly.
- **Indigo** (#4F46E5): Used only for the transfer-funds flow (bank-to-bank mutations), separating it from regular payments.

### Neutral

- **Slate Canvas** (#F8FAFC): The application background — the resting layer every surface sits on.
- **Pure White** (#FFFFFF): All cards, tables, inputs, sidebar, header, and modals.
- **Ink** (#0F172A): Primary text — headings and key values.
- **Secondary Ink** (#64748B): Descriptions, table metadata, secondary text.
- **Faint Ink** (#94A3B8): Placeholders, inactive icons, micro-labels.
- **Hairline** (#E2E8F0): Borders and dividers (`slate-200`).
- **Soft Hairline** (#F1F5F9): The lightest separators and card borders (`slate-100`).

### Named Rules

**The Calm Blue Rule.** Calm Blue is the one primary accent, used for primary actions and active states only. No neon, fluorescent, or cyan tones appear anywhere in the system. When a module needs emphasis, it borrows Violet or Indigo — never a new blue family.

## Typography

**Display/Body Font:** System UI sans stack (`ui-sans-serif, system-ui, sans-serif`). The global stylesheet declares Plus Jakarta Sans via a `--font-jakarta` variable as first choice, but that variable is never defined in `layout.tsx`, so rendering currently falls back to the system stack; wiring the font is a known gap.
**Label/Mono Font:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`, used for prices, account codes, OTP-style values, and any column of numbers.

**Character:** A neutral, highly legible sans pairing with tight-tracked bold headings — confident at the top of the page, invisible within tables. Monospace values reinforce the bookkeeping identity.

### Hierarchy

- **Display** (700, 24px / `text-2xl`, 1.25 line-height, `-0.025em` tracking): Page titles such as "Command Center"; tight tracking for an elegant, confident feel.
- **Title** (600, 16–18px): Card and section headers inside panels.
- **Body** (400, 14px / `text-sm`, 1.5 line-height): Default interface text; tables use 13px (`text-[13px]`) to fit more rows without losing legibility.
- **Label** (500, 12px / `text-xs`, 0.05em tracking, uppercase): Sidebar group titles, card stat labels, table column headers. Small, wide-tracked, and quiet.
- **Mono** (400–700, 14px): Numeric and sensitive values; align columns and make codes scannable.

### Named Rules

**The Ledger Line Rule.** Prices, codes, and sensitive values are set in monospace so columns align and codes scan. Numbers are data; they get a fixed-width home.

## Layout

A fixed left sidebar (64px-wide rail at 16–20px icon scale, collapsible to an 80px icon rail) plus a 16px-tall white header with a hairline bottom border. Main content scrolls on a `slate-50` canvas with `p-8` (32px) gutters; data-heavy pages center on a `max-w-6xl` container.

Cards use a 12-column fluid grid (`grid-cols-1` → `md:grid-cols-2`/`4`). The dashboard's metric row is four cards across on desktop, stacking to one column on mobile. Spacing rhythm is 16–24px between grid items (`gap-4`/`gap-6`) and 24px internal card padding (`p-6`), with `p-8` on hero or detail surfaces. Tables are full-bleed white panels with a 13px body and hover-highlighted rows; they scroll horizontally rather than compress.

## Elevation & Depth

Layered, not shadow-heavy. Depth is conveyed by white surfaces sitting on the slate canvas with hairline borders plus a whisper of ambient shadow; real elevation appears only at two moments — a gentle rise on interactive hover, and a hard lift for overlays.

The project's design docs specify a custom soft-shadow scale (`--shadow-soft-main`, `--shadow-soft-hover`, `--shadow-soft-primary`), and the current implementation converges on Tailwind's `shadow-sm` / `shadow-md` / `shadow-2xl`. Both live in the sidecar; the pattern below is the authority.

### Shadow Vocabulary

- **Card Rest** (`0 1px 2px rgba(0,0,0,0.05)`, `shadow-sm`): Every resting card, table, and panel.
- **Card Hover** (`0 4px 6px -1px rgba(0,0,0,0.10)`, `shadow-md`): Interactive cards when hovered.
- **Overlay** (`0 25px 50px -12px rgba(0,0,0,0.25)`, `shadow-2xl`): Modals, drawers, and dropdown menus.
- **Soft Ambient** (docs): `0 4px 20px -4px rgba(15,23,42,0.04)` for main cards and `0 8px 30px -6px rgba(15,23,42,0.08)` for hover — the intended premium alternative to default shadows.
- **Button Glow** (docs): `0 2px 10px -3px rgba(37,99,235,0.20)` — a faint blue halo on primary buttons; implementations tint it per accent (`shadow-blue-200`, `shadow-purple-200`, etc.).

### Named Rules

**The Hairline Rest Rule.** Surfaces are flat at rest — white card, hairline border, whisper of shadow. Depth appears only as a response to state: hover rise, or hard overlay elevation.

## Shapes

A soft-corner system. The radius scale is normalized around 10px: controls, badges, tables, and modals use 10px (`rounded-[10px]`), cards 12px (`rounded-xl`), and imagery 16px (`rounded-2xl`). Small utility controls may drop to 6–8px (`rounded-md`/`rounded-lg`). Pill shapes are banned for standard UI — `rounded-full` appears only on avatars, notification dots, and circular icon buttons (the sidebar collapse toggle). Borders are 1px hairlines in slate-100/200; status elements use a faint ring (`ring-1`) instead of heavier borders.

## Components

### Buttons

- **Shape:** Soft 10px corners, comfortable height (`py-2.5`, roughly 42px), full-width or inline.
- **Primary:** Calm Blue fill, white `font-semibold` 14px text, 10–24px padding, faint blue glow shadow; hover deepens to `#1D4ED8`, active to `#1E40AF`, disabled at 70% opacity.
- **Module Primary:** Same anatomy with the module's accent — Violet for deals/purchases/trade-in, Indigo for fund transfers, Emerald for completion actions, Red for destructive confirmation.
- **Secondary / Ghost:** White fill, slate hairline border, ink text, `hover:bg-slate-50`; used for exports, filters, and cancel actions. Quiet by default.
- **Focus:** `focus-visible` rings on the Calm Blue accent (or the button's own accent).

### Chips / Status Badges

- **Style:** 10px corners, `px-2.5 py-1`, 12px medium text, tinted 50-level background with matching 600-level text and a faint `ring-1` of the same hue.
- **Semantics:** Emerald = available/lunas, Amber = booking/warning, Blue = sold/completed, Violet = limited access, Slate = draft/unposted/on-hold, Gray = cancelled, Orange = refund, Red = problem (Rose for permanent problem).

### Cards / Containers

- **Corner Style:** 12px radius.
- **Background:** Pure White.
- **Border & Shadow:** Hairline `slate-100` border plus Card Rest shadow; rise to Card Hover on interactive cards.
- **Internal Padding:** 24px (`p-6`), metrics cards `px-6 py-5`.

### Inputs / Fields

- **Style:** White fill, `slate-300`/`gray-300` border, 10px corners, `px-4 py-2.5`, 14px text.
- **Focus:** Calm Blue border with a 2px blue ring (`focus:ring-2 focus:ring-blue-500`); module forms may focus in their accent.
- **Sensitive fields:** Monospace for prices, codes, and account numbers.
- **Disabled / Error:** Muted background with reduced opacity; error states use rose tints (`bg-rose-50`, `text-rose-600`, `ring-rose-200`).

### Navigation (Sidebar)

- **Style:** White rail, `border-r` hairline; group titles are uppercase 12px `slate-400` labels.
- **Items:** 14px medium text, 20px lucide icons at `strokeWidth` 1.5; idle is `slate-500` text with `slate-400` icons, `hover:bg-slate-50 hover:text-slate-900`.
- **Active:** Calm Blue Halo fill (`#EFF6FF`) with Calm Blue text and a 2-stroke icon.

### Tables

- **Container:** White, 12px radius, hairline border, Card Rest shadow, horizontal scroll.
- **Header:** Uppercase 12px `slate-500` labels; rows 13px ink text with `hover:bg-slate-50`.

## Do's and Don'ts

### Do:

- **Do** build every surface as white on the slate-50 canvas with a hairline border and a whisper of shadow — the two-layer system is the whole identity.
- **Do** use Calm Blue as the one primary accent, and deepen it on hover (`#1D4ED8`) and press (`#1E40AF`).
- **Do** speak status through muted 50-tint chips with 600-level text and hairline rings.
- **Do** keep corners soft: 10px controls, 12px cards, 16px imagery.
- **Do** reserve `rounded-full` for avatars, dots, and circular icon buttons only.
- **Do** set prices, codes, and sensitive values in monospace so columns align.
- **Do** use thin 20px icons at `strokeWidth` 1.5 in navigation.
- **Do** keep density comfortable: `p-6` cards, `p-8` gutters, 16–24px grid gaps.

### Don't:

- **Don't** use neon, fluorescent, or cyan tones anywhere — the Calm Blue Rule is absolute.
- **Don't** use `rounded-full` on standard buttons, cards, or inputs.
- **Don't** leave main cards resting on heavy `shadow-md`/`shadow-lg`; flat hairline + whisper is the resting state.
- **Don't** cramp tables or compress cell padding to fit more data.
- **Don't** introduce new blue families for emphasis — borrow Violet or Indigo for module-level accent instead.
