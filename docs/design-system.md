# sbaby design system → code

Source: `sbaby_design_system.pdf` (one page: four development-area tokens on a cream background).
All tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css) as Tailwind v4 `@theme` variables.

## From the design system

| Token | Solid | Tint (card background) | Ink (text on tint) | Tailwind |
|---|---|---|---|---|
| `--area-motor` | `#EC7A61` | `#FDF3F0` | `#A33B27` | `bg-motor`, `bg-motor-tint`, `text-motor-ink` |
| `--area-cognitive` | `#6FA8DC` | `#EEF3FB` | `#2A5A8A` | `bg-cognitive`, … |
| `--area-language` | `#F6BF55` | `#FEF8E7` | `#7A5710` | `bg-language`, … |
| `--area-social` | `#6FB28C` | `#EEF6EE` | `#2E6446` | `bg-social`, … |
| Background | `#FFFBF6` | | | `bg-cream` |

Hex values were sampled from the PDF render, because the PDF has no embedded color values. Swap in exact codes in `tokens.css` if you have them.

Also from the PDF: Poppins SemiBold headings, card radius ~24px (`rounded-card`), swatch radius ~12px (`rounded-swatch`).

## Derived (not in the PDF, so change them freely)

- **Neutrals**: `ink #2B2622`, `ink-soft #6B625A`, `line #EFE6DC`, `surface #FFFFFF`
- **Primary action**: `#B84A33`, a darker motor coral. White on the original coral `#EC7A61` is only 2.8:1, which fails WCAG AA. This one is 5.2:1.
- **Body font**: Nunito (rounded, pairs with Poppins). Both fonts are self-hosted via `@fontsource`, so the app works offline.
- **Components** (`src/ui/`): Button, AreaChip, AreaSwatch, Card, TriStateCheck (Did it / Not yet / Skip), ProgressBar, Stepper, Sheet, EmptyState, bottom tab bar.
- **Light theme only.** The design system defines no dark palette.

## Usage rules

1. **Text never sits on a solid area color.** Always use the `-ink` shade on the `-tint`. Every ink/tint pair measures about 6:1.
2. A game card or milestone is tinted by its **first** area. All of its areas show as chips.
3. Solid colors are for swatches, dots, progress bars and icons only.
4. Screens use tokens only, never raw hex values.
