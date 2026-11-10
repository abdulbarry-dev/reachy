# Reachy — Design System & Typography Specification

> [!CRITICAL]
> ### STRICT AGENT GOVERNANCE RULE — ZERO DRIFT TOLERANCE
> **ALL AI agents, assistants, and contributors MUST strictly comply with this specification (`DESIGN.md`).**
> - **NEVER** introduce colors, hex codes, or gradients outside the tokens specified in Section 3.
> - **NEVER** introduce alternative font families or unapproved font weights outside `Plus Jakarta Sans` and the monospace stack defined in Section 2.
> - **NEVER** invent arbitrary corner radii, margins, or padding scales outside the tokens in Section 4.
> - **NEVER** create off-brand button styles, input appearances, or card elevations outside the patterns in Section 5.
> - **NEVER** bypass motion and accessibility requirements defined in Section 6.
> 
> **Any code change that deviates from or extends outside this specification without explicit, direct user instructions to modify `DESIGN.md` is strictly forbidden.**

---

This document defines the visual language, typography scales, color tokens, component patterns, and motion guidelines for the **Reachy** application.

---

## 1. Brand Identity & Visual Philosophy

Reachy is a modern, high-deliverability cold email automation platform. The aesthetic is:
- **Clean & High-Contrast**: Crisp white card surfaces on an ultra-soft mint-tinted canvas.
- **Trustworthy & Technical**: Deep Slate accents paired with a vibrant, modern Emerald-to-Teal primary palette.
- **Polished & Tactile**: Smooth border radii (16px–20px), subtle ambient elevation shadows without harsh outlines, and responsive micro-interactions.

---

## 2. Typography System

### Primary Typeface
- **Family**: [`Plus Jakarta Sans`](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- **Fallback Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Monospace Stack** (for merge tags `{{name}}`, variables, code): `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### Font Weights
| Token | Numeric Weight | Usage |
|---|---|---|
| `font-light` | `300` | De-emphasized metadata, subtle subtitles |
| `font-normal` | `400` | Long-form body copy, descriptive paragraphs |
| `font-medium` | `500` | Form labels, navigation links, secondary table cells |
| `font-semibold` | `600` | Subheadings, card titles, button copy, metrics |
| `font-bold` | `700` | Page headings (`h1`–`h4`), section banners |
| `font-extrabold`| `800` | Brand logo mark, hero display numbers, stat callouts |

### Hierarchy & Type Scale
| Level | Font Size | Line Height | Tracking | Weight | Recommended Element / Class |
|---|---|---|---|---|---|
| **Display / Hero** | `3rem` (48px) – `3.5rem` (56px) | `1.15` | `-0.03em` | `800` | Hero titles, landing page value props |
| **H1 (Page Title)** | `2rem` (32px) | `1.25` | `-0.025em` | `700` | Page titles (`Dashboard`, `Campaigns`, `Settings`) |
| **H2 (Section Header)** | `1.5rem` (24px) | `1.3` | `-0.02em` | `700` | Card group titles, major modal headers |
| **H3 (Card / Block Title)**| `1.25rem` (20px) | `1.35` | `-0.015em` | `600` | Metric card titles, step wizard headers |
| **H4 / Subtitle** | `1.125rem` (18px) | `1.4` | `-0.01em` | `600` | Table column groups, secondary headers |
| **Body (Default)** | `0.9375rem` (15px) – `1rem` (16px) | `1.55` | `normal` | `400` / `500` | General UI copy, table rows, form input text |
| **Small / Meta** | `0.875rem` (14px) | `1.45` | `normal` | `500` | Helper text, secondary timestamps, hints |
| **Caption / Badge** | `0.75rem` (12px) | `1.3` | `+0.04em` | `600` / `700` | Status badges, category pills (often UPPERCASE) |

---

## 3. Color Palette & Design Tokens

### Core Colors (CSS Variables)
Defined in `src/index.css`:

```css
:root {
  /* Brand Primary (Emerald) */
  --reachy-primary: #3AB397;
  --reachy-primary-hover: #2e9b81;
  --reachy-primary-rgb: 58, 179, 151;

  /* Brand Secondary (Teal) */
  --reachy-secondary: #3AA8AD;
  --reachy-secondary-hover: #2f8e92;
  --reachy-secondary-rgb: 58, 168, 173;

  /* Surfaces & Backgrounds */
  --reachy-bg-soft: #f4fbf9;           /* App canvas background */
  --reachy-bg-soft-rgb: 244, 251, 249;
  --reachy-bg-card: #ffffff;           /* Elevated cards, sheets */
  --reachy-bg-input: #ffffff;          /* Text inputs, select boxes */
  --reachy-surface-subtle: #f8fafc;    /* Nested containers, table hover */
  --reachy-gray-soft: #f8fafc;

  /* Typography & Slate Colors */
  --reachy-dark: #0f172a;              /* Slate 900 — primary text */
  --reachy-muted: #64748b;             /* Slate 500 — secondary text */

  /* Borders & Dividers */
  --reachy-border-color: #e2e8f0;      /* Slate 200 — standard border */
  --reachy-border: rgba(58, 179, 151, 0.1); /* Mint-tinted subtle border */

  /* Radii & Shadows */
  --reachy-radius: 1rem;               /* 16px */
  --reachy-shadow: 0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);
}
```

### Dark Surface (Sidebar)
The collapsible sidebar uses a deep navy-slate gradient:
- **Gradient**: `linear-gradient(180deg, #1e2332 0%, #282e44 100%)`
- **Border**: `rgba(255, 255, 255, 0.05)`
- **Active Navigation Item**: Background `rgba(58, 179, 151, 0.15)`, text `#3AB397`, left accent bar

### Semantic & Status Palette
| Status | Background | Text / Border | Purpose |
|---|---|---|---|
| **Sent / Active** | `#ecfdf5` (emerald-50) | `#059669` (emerald-600) | Successfully sent emails, active accounts |
| **Sending** | `#eff6ff` (blue-50) | `#2563eb` (blue-600) | In-flight dispatch, cron queue active |
| **Queued / Pending**| `#fffbeb` (amber-50) | `#d97706` (amber-600) | Pending recipients, paused campaigns |
| **Failed / Danger** | `#fef2f2` (rose-50) | `#dc2626` (rose-600) | SMTP errors, bounced recipients, deletions |
| **Draft** | `#f1f5f9` (slate-100) | `#475569` (slate-600) | Unsent drafts, inactive states |

---

## 4. Spacing, Elevation & Corner Radii

### Corner Radii Scale
- **Small (`0.375rem` / 6px)**: Dropdown items, tooltips, inline tags.
- **Medium (`0.75rem` / 12px)**: Form fields, action buttons, tab pills.
- **Large (`1rem` / 16px)**: Standard UI containers, table wrappers, cards.
- **Extra Large (`1.25rem` / 20px)**: Primary hero cards (`.card-reachy`), feature overview modals.
- **Pill (`9999px`)**: Status chips, badge counters, avatar placeholders, rounded primary CTA buttons.

### Elevation & Shadows
- **Card Base**: `box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02);`
- **Card Hover / Active**: `box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04);`
- **Floating / Modal**: `box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.16);`
- **Primary Brand Glow**: `box-shadow: 0 4px 16px rgba(58, 179, 151, 0.35);`

---

## 5. Component Patterns

### Buttons
- **Primary Button (`.btn-reachy`)**:
  - Background: `linear-gradient(135deg, #3AB397 0%, #3AA8AD 100%)`
  - Color: `#ffffff`, `font-weight: 600`
  - Hover: subtle translateY(-1px), glow shadow `0 6px 20px rgba(58, 179, 151, 0.35)`
- **Outline Button (`.btn-reachy-outline`)**:
  - Border: `1.5px solid var(--reachy-border-color)`
  - Background: `#ffffff`, Color: `var(--reachy-dark)`
  - Hover: border `#3AB397`, text `#3AB397`, background `#f4fbf9`
- **Destructive Button (`.btn-reachy-danger`)**:
  - Color: `#dc2626`, background `#fee2e2`, border `transparent`

### Form Inputs
- **Base Style**:
  - Height: `44px` (touch-friendly)
  - Border: `1.5px solid var(--reachy-border-color)`
  - Background: `var(--reachy-bg-input)`
  - Font: `Plus Jakarta Sans`, `15px`
- **Focus State**:
  - Border color: `var(--reachy-primary)`
  - Box shadow: `0 0 0 3px rgba(58, 179, 151, 0.15)`
  - Outline: none

### Cards (`.card-reachy`)
- Background: `#ffffff`
- Border: `1px solid var(--reachy-border)`
- Border radius: `1.25rem` (20px)
- Padding: `1.5rem` (24px)

---

## 6. Motion & Animation Standards (GSAP & Framer Motion)

1. **Easing**:
   - Out-quad / smooth decel: `cubic-bezier(0.16, 1, 0.3, 1)` or GSAP `power2.out`.
   - Snappy micro-interactions: GSAP `power3.out`.
2. **Timing**:
   - Micro-interactions (hover, tooltips): `150ms` – `200ms`
   - UI expand / accordion / modal enter: `250ms` – `350ms`
   - Page transitions: `300ms` – `450ms`
3. **Accessibility**:
   - All animations must respect `prefers-reduced-motion: reduce`.
   - Framer Motion: wrapped in `<MotionConfig reducedMotion="user">`.
   - GSAP: utilize `gsap.matchMedia()` with `"(prefers-reduced-motion: reduce)"` to disable non-essential motion.
