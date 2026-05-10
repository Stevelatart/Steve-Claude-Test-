# CLAUDE.md — Trika Rod Comparison App

## Project Overview

A static, single-page marketing site for **Trika Fishing** that lets shoppers compare four rod series (10X, 6X, 3X, X) side-by-side. No build step, no framework, no dependencies — three plain files served directly from the repository root.

## File Structure

```
/
├── index.html   # All markup and page structure
├── styles.css   # All styling (CSS custom properties + media queries)
└── app.js       # All interactive behaviour (vanilla JS, 'use strict')
```

## Architecture

**Stack:** Plain HTML5 / CSS3 / vanilla JS — no bundler, no package manager, no transpiler.

**Sections in `index.html`:**
1. Sticky header with Trika branding and nav
2. Hero with tagline
3. Comparison table (feature matrix across 4 rod series)
4. Sensitivity bar chart
5. "At a Glance" product cards
6. Footer

**Key CSS patterns:**
- Design tokens live in `:root` CSS custom properties (`--orange`, `--gray-dark`, etc.). Always use these variables; never hardcode colour hex values.
- Responsive breakpoints: `≤ 768px` (tablet/mobile) and `≤ 480px` (small mobile).
- On mobile, the comparison table hides all series columns by default and shows only the `.visible` column (toggled by JS tab selection). Desktop shows all columns simultaneously.

**Key JS behaviours (`app.js`):**
- **Mobile tab switching** — `showSeries(series)` toggles the `visible` class on `[data-series]` elements and updates `aria-selected` on tab buttons.
- **Resize handler** — `handleResize()` re-applies mobile/desktop logic on window resize. Mobile threshold is `window.innerWidth <= 768`.
- **Bar animation** — `IntersectionObserver` triggers the `growBar` CSS animation when `.bar-fill` elements scroll into view (plays once then unobserves).
- **"Add to Cart" feedback** — Temporarily changes button text and background for 1500 ms on click.

## Development Conventions

### HTML
- Accessibility attributes (`aria-label`, `role`, `scope`) are required on all interactive and table elements — maintain them when editing.
- `data-series` attributes (`"10X"`, `"6X"`, `"3X"`, `"X"`) are the coupling point between markup and JS. Keep them consistent.
- The `best-value` class on the 10X `series-header` and the `best` class on the 10X `rod-card` are responsible for orange highlighting; replicate the pattern if new series are added.

### CSS
- Extend the `:root` block for any new design token rather than introducing inline styles or one-off magic numbers.
- The `!important` uses on `.category-row td` and `.btn-nav` are intentional overrides for specificity conflicts — do not add new `!important` declarations unless unavoidable.
- Bar widths are driven by the `--pct` CSS custom property set inline on `.bar-fill`; the `@keyframes growBar` animation references the same property.

### JavaScript
- `'use strict'` is at the top of `app.js` — do not remove it.
- All DOM queries run at script-load time (after `</body>` via `<script src="app.js">`); no `DOMContentLoaded` listener is needed.
- Keep the IntersectionObserver guard (`'IntersectionObserver' in window`) so the page still works in older browsers without throwing.

## Updating Product Data

All rod feature data lives directly in `index.html`. To add, remove, or change a feature row:
1. Add/edit the `<tr>` in the appropriate `<tbody>` category section.
2. Use `<span class="dot">` for included features and `<span class="dash">` for absent ones.
3. Update the "At a Glance" card feature counts (`card-features`) to stay accurate.
4. Update the bar chart `data-pct` and `style="--pct: ..."` values if sensitivity percentages change.

## Git Workflow

- Active feature branches: `claude/add-claude-documentation-cEXfz`, `claude/fishing-rod-comparison-app-BCSpQ`
- Remote: `origin` → `stevelatart/Steve-Claude-Test-` on GitHub
- Push with `git push -u origin <branch-name>`
- There is no CI pipeline configured; linting and testing are manual.

## Testing

There is no automated test suite. Manual verification steps:
1. Open `index.html` directly in a browser (no server required for basic checks).
2. Resize to `≤ 768px` to confirm mobile tabs appear and column switching works.
3. Scroll through the page to confirm bar animations trigger once on entry.
4. Click "Add to Cart" buttons to confirm the 1.5 s feedback cycle works.
5. Check that all four series columns display correctly on desktop (all visible simultaneously).
