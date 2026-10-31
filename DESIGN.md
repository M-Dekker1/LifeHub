# LifeHub design system (v2.0)

Industrial, modern, restrained. About 85% neutral, 15% aspect colour.
Paste this file into any new conversation about LifeHub so the palette and rules stay strict.

## Neutrals
| Role | Dark mode | Light mode |
|---|---|---|
| Primary background | Obsidian `#171B1E` | Chalk `#F4F3EF` |
| Secondary background (sidebar) | Carbon `#20272B` | Concrete `#E8E7E1` |
| Card surfaces | Iron `#2C363B` | Porcelain `#FFFFFF` |
| Borders and dividers | Steel `#455158` | Stone `#D5D6CF` |
| Primary text | Chalk `#F4F3EF` | Ink `#20272B` |
| Muted primary text | Silver `#C0C8C7` | Ink `#20272B` |
| Secondary text | Ash `#899397` | Graphite `#687277` |

## Aspect palettes (one per area of LifeHub)
| Aspect | Name | Tint | Primary | Accent | Deep |
|---|---|---|---|---|---|
| Health | Mineral Teal | `#DCECE7` | `#168F83` | `#42C4B2` | `#0C625C` |
| Finances | Industrial Yellow | `#F5EBCB` | `#B88B24` | `#F0C84B` | `#806019` |
| Travel (not built) | Oxide Orange | `#F2E2D9` | `#C66D43` | `#F09A70` | `#87442D` |
| Goals (not built) | Electric Violet | `#E8E4F5` | `#7869C9` | `#A99BF4` | `#50438D` |

Usage: Primary = buttons, active nav item, key chart lines, progress fills. Accent = highlights, hover/focus, secondary lines, coloured text in dark mode.
Deep = coloured text on light backgrounds, gradient ends. Tint = selected states in light mode (dark mode uses Primary at 20%).
Contrast rules: never put small text in Primary on light backgrounds; use Deep. Finance buttons use Ink text; Health buttons use white.
Functional colours (health score scale green to red, macro bars, workout pills, bank brand colours, account-type dots) sit outside the 85/15 count.

## Type
Inter for everything. IBM Plex Mono (tabular numerals) for values, KPI numbers, dates, times, measurements, table numbers and technical labels.
Page titles: Inter 600, sentence case. Section headings and field labels: uppercase, slight tracking (0.06 to 0.08em).

## Elements
Cards 10px. Main panels (hero, summary block, popups, bank card) 14px. Buttons, inputs, menu items 8px. Tags and pills 4px.
Borders 1px, subtle. Shadows only on floating things (tooltips, calendar, bank card image). Slight gradients only (never dramatic).
Icons: Lucide outline, 1.75px stroke (loaded from CDN, inline fallback offline). Animations: 120 to 180ms, subtle, respect reduced motion.

## Layout
Desktop: 72px rail (avatar and icons) that expands to 264px on hover or keyboard focus and shifts the content.
Mobile (820px and below): slide-out drawer from a top bar, 44px touch targets.
