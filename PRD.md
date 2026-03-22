# Product Requirements Document (PRD)
## Figma-to-Webflow Converter — Lumos Framework Compliant

**Version:** 1.0 (MVP)  
**Date:** 2026-03-22  
**Status:** Draft — for implementation via Claude Code  

---

## 1. Executive Summary

Build a CLI tool that takes a **Figma auto-layout JSON export** as input and produces **production-ready HTML + CSS** that can be **pasted directly into a Webflow project running the Lumos Framework**. The output must strictly follow every Lumos convention: class naming, section/container structure, responsive variables (no `@media`), typography utilities, spacing tokens, theming, buttons, trigger/state system, and anti-pattern avoidance.

### What Exists Today (Current State)

The project has a working skeleton that:
- Parses Figma JSON via Zod schemas (`FigmaDocumentSchema`)
- Normalizes Figma nodes to an intermediate representation
- Detects reusable components via cosine similarity
- Maps to "Lumos-like" utility classes (`u-padding-*`, `u-gap-*`, `u-text-style-*`, `u-flex-inline-*`, etc.)
- Generates flat `<div>`-only HTML with inline styles and Lumos utility classes
- Copies output to clipboard

### What's Wrong / Missing (Gap Analysis)

| # | Gap | Severity |
|---|-----|----------|
| G1 | **Output is divs-only** — no `<section>`, `<h1>`–`<h6>`, `<p>`, `<a>`, `<img>`, `<button>`, `<span>`, `<nav>`, `<footer>` semantic tags | Critical |
| G2 | **No `<style>` block** — Lumos forbids inline `style=""`. All component-specific CSS must be in a `<style>` block. Current code emits inline styles | Critical |
| G3 | **Missing section/container structure** — Lumos requires `section > u-container > _layout` nesting. Current output is a flat tree of divs | Critical |
| G4 | **Wrong spacing model** — uses invented `u-padding-inline-*`, `u-padding-block-*` classes. Lumos uses CSS variables (`--_spacing---space--1` through `--8`) applied on component classes, not utility classes for padding | High |
| G5 | **No responsive variables** — output has zero responsive behavior. Lumos uses `var(--flex-medium, grid)`, `var(--column-medium, row)` etc. instead of `@media` | High |
| G6 | **No component class naming** — Lumos requires every element to have a component class first (`hero_title`), then utility (`u-text-style-h2`). Current output often has only utility classes or empty strings | Critical |
| G7 | **Typography is wrong** — maps font sizes to `u-text-style-*` which is correct, but doesn't output proper heading/paragraph tags, doesn't add `margin-bottom: var(--_text-style---margin-bottom)` in CSS, doesn't add `u-margin-trim` on content wrappers | High |
| G8 | **No button handling** — Lumos buttons require specific CSS patterns with `color-mix()`, trigger variables, padding. Current code has zero button logic | High |
| G9 | **No theming** — Lumos uses `u-theme-light`, `u-theme-dark`, `u-theme-brand` on sections. Current code maps background colors to made-up `u-background-color-*` classes | High |
| G10 | **No grid layout** — Lumos uses 12-column grid with `minmax(0, 1fr)`. Current code maps everything to flex utilities only | High |
| G11 | **Color handling is primitive** — nearest-named-color matching. Needs to map to Lumos theme variables (`--_theme---*`) and swatches (`--swatch--*`) | Medium |
| G12 | **No image handling** — images from Figma are completely ignored. Need to output `<img>` tags with proper classes | Medium |
| G13 | **No SVG/icon handling** — Figma vectors/icons need to be recognized and output with proper aria attributes | Medium |
| G14 | **No `rem` conversion** — Lumos forbids `px`. All values in current output are px | High |
| G15 | **Empty nodes are skipped** — Lumos needs empty decorative divs with `padding: 0` | Low |
| G16 | **No container query support** — for cases where responsive variables aren't sufficient | Medium |
| G17 | **No Webflow-specific attributes** — `data-trigger`, `data-state` for interactive elements | Medium |
| G18 | **No layout analysis for grid vs flex** — needs intelligence to decide when a layout is a 12-col grid vs simple flex | High |

---

## 2. Product Vision

**Input:** Figma REST API JSON export (auto-layout web design)  
**Output:** A single HTML string containing:
1. A `<style>` block with all component-specific CSS (no utility CSS, no resets)
2. Semantic HTML using proper tags with Lumos class conventions
3. Ready to paste into a Webflow canvas (Custom Code Embed or HTML Embed element)

**Non-Goals (MVP):**
- No Figma API direct integration (user downloads JSON manually)
- No Webflow API push (manual paste)
- No CMS collection generation
- No complex JS interactions (tabs, sliders, accordions) — structure only
- No image asset downloading (placeholder `<img>` tags with Figma URLs)

---

## 3. Architecture

### 3.1 Pipeline Overview

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Figma JSON  │───>│   Parser &   │───>│  Semantic    │───>│   Lumos      │───>│   HTML+CSS   │
│   (input)    │    │  Normalizer  │    │  Analyzer    │    │  Generator   │    │  (output)    │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                         │                    │                    │
                    Zod validation     Role detection       Class naming
                    Node flattening    Section/card/nav     CSS generation
                    Style extraction   Text/button/image    HTML assembly
                    Tree normalization Layout analysis      Responsive vars
```

### 3.2 Module Structure (Refactored)

```
src/
├── index.ts                     # CLI entry point
├── pipeline.ts                  # Orchestrates full conversion pipeline
├── schemas/
│   ├── figma.ts                 # Figma JSON Zod schemas (KEEP, enhance)
│   └── lumos.ts                 # Lumos IR schemas (REWRITE)
├── parser/
│   ├── figmaParser.ts           # Load & validate Figma JSON (KEEP figmaService.ts, rename)
│   └── figmaNormalizer.ts       # Normalize Figma nodes to IR (REWRITE normalizer.ts)
├── analyzer/
│   ├── semanticAnalyzer.ts      # NEW: Detect sections, cards, nav, footer, hero, CTA, etc.
│   ├── layoutAnalyzer.ts        # NEW: Decide grid vs flex, column count, responsive behavior
│   ├── typographyAnalyzer.ts    # NEW: Map Figma text styles to Lumos text-style tiers
│   ├── colorAnalyzer.ts         # NEW: Map Figma fills/colors to Lumos theme/swatch variables
│   └── componentDetector.ts     # REFACTOR similarity.ts: smarter reusable component detection
├── generator/
│   ├── classNamer.ts            # NEW: Generate Lumos-compliant class names
│   ├── cssGenerator.ts          # NEW: Generate <style> block for component classes
│   ├── htmlGenerator.ts         # NEW: Generate semantic HTML with proper tags
│   └── responsiveGenerator.ts   # NEW: Apply responsive variables and container queries
├── lumos/
│   ├── constants.ts             # NEW: All Lumos variable names, utility class names, scales
│   ├── spacingScale.ts          # REFACTOR lumosMapper.ts spacing logic
│   ├── typographyScale.ts       # REFACTOR lumosMapper.ts typography logic
│   └── themeMap.ts              # NEW: Theme variable mappings
└── utils/
    ├── units.ts                 # NEW: px-to-rem conversion, value normalization
    └── helpers.ts               # General utilities
```

### 3.3 Intermediate Representation (IR)

The normalized IR is the central data structure that all analyzers enrich and the generators consume.

```typescript
interface LumosIR {
  projectName: string;
  pages: LumosPage[];
  globalCSS: string[];            // Component CSS rules
  tokens: LumosToken[];           // Custom/unmapped design tokens
  report: TransformReport[];      // Warnings + decisions log
}

interface LumosPage {
  name: string;
  sections: LumosSection[];
}

interface LumosSection {
  sectionName: string;            // e.g., "hero", "footer", "cta"
  theme: "light" | "dark" | "brand";
  sectionClass: string;           // e.g., "hero_wrap"
  containerClass: string;         // e.g., "hero_contain"
  layoutClass: string;            // e.g., "hero_layout"
  layoutCSS: LayoutCSS;           // Grid/flex CSS for the _layout div
  children: LumosNode[];
}

interface LumosNode {
  id: string;
  figmaName: string;              // Original Figma layer name
  componentClass: string;         // e.g., "hero_title" — ALWAYS present
  utilityClasses: string[];       // e.g., ["u-text-style-h1"]
  comboClasses: string[];         // e.g., ["is-reversed"]
  tag: string;                    // "section" | "div" | "h1"–"h6" | "p" | "a" | "img" | "button" | "span" | "nav" | "footer"
  content?: string;               // Text content for text nodes
  attributes: Record<string, string>; // data-trigger, aria-*, src, alt, etc.
  cssRules: CSSRule[];            // Component-specific CSS rules
  children: LumosNode[];
  role: NodeRole;                 // Semantic role detected by analyzer
}

type NodeRole =
  | "section-wrap"
  | "container"
  | "layout"
  | "content-wrap"
  | "title"
  | "subtitle"
  | "text"
  | "button-primary"
  | "button-secondary"
  | "button-wrapper"
  | "image"
  | "icon"
  | "card"
  | "card-wrap"
  | "nav"
  | "footer"
  | "visual"
  | "decorative"
  | "link"
  | "divider"
  | "list"
  | "list-item"
  | "generic";

interface LayoutCSS {
  display: string;                // "var(--flex-medium, grid)" or "flex"
  flexDirection?: string;         // "column" or "var(--column-medium, row)"
  gridTemplateColumns?: string;   // "repeat(12, minmax(0, 1fr))"
  gap?: string;                   // "var(--_spacing---space--4)"
  gridRowGap?: string;
  alignItems?: string;
}

interface CSSRule {
  property: string;
  value: string;
}

interface LumosToken {
  name: string;
  value: string | number;
  category: "spacing" | "typography" | "color";
  note: string;                   // Why this needed a custom token
}
```

---

## 4. Detailed Feature Specifications

### 4.1 Figma Parser & Normalizer (`parser/`)

**Keep:** Existing `loadFigmaFile()` with Zod validation.

**Enhance Figma schema** to capture ALL Figma properties needed:
- `primaryAxisAlignItems`, `counterAxisAlignItems` — flex alignment
- `primaryAxisSizingMode`, `counterAxisSizingMode` — sizing behavior (FIXED, HUG, FILL)
- `layoutAlign` — child alignment within auto-layout
- `layoutGrow` — flex-grow equivalent
- `characters` — actual text content (not just layer name)
- `componentProperties` — variant info
- `exportSettings` — image export hints
- `strokeWeight`, `strokes` — border detection
- `cornerRadius`, `rectangleCornerRadii` — border radius
- `effects` — shadows, blurs
- `constraints` — positioning constraints
- `opacity`
- `clipsContent` — overflow behavior

**Normalizer output:** A clean tree with all styles, content, and layout info flattened into a consistent shape. Every text node must include its `characters` field (the actual visible text), not just the layer name.

### 4.2 Semantic Analyzer (`analyzer/semanticAnalyzer.ts`)

Analyzes the normalized tree and assigns **roles** and **section boundaries**.

**Section Detection Heuristics:**
1. **By name:** Layer names containing "hero", "header", "nav", "footer", "cta", "section", "features", "testimonials", "pricing", "faq", "contact" etc.
2. **By position:** Top-level children of the page frame are sections
3. **By size:** Full-width elements (width ≥ 90% of parent) at the page root level

**Element Role Detection:**
1. **Text nodes** (`type: "TEXT"`) → detect heading vs paragraph:
   - fontSize ≥ 28 → `title` (map to `<h1>`–`<h3>` based on hierarchy depth)
   - fontSize 20–27 → `subtitle` (map to `<h4>`–`<h6>`)
   - fontSize ≤ 19 → `text` (map to `<p>`)
   - ALL CAPS or short text above content → `eyebrow` (map to `<p>`)
2. **Button-like nodes:** detect by name ("button", "btn", "cta") or by shape (small rounded rectangle with centered text child, fills + padding)
3. **Image nodes** (`type: "RECTANGLE"` with image fill, or `type: "INSTANCE"` of image component) → `image`
4. **Vector/boolean nodes** → `icon`
5. **Card patterns:** repeated sibling groups with similar structure → `card`
6. **Navigation:** top-positioned frame with horizontal links → `nav`
7. **Dividers:** thin rectangles (height ≤ 2px or width ≤ 2px) → `divider`

### 4.3 Layout Analyzer (`analyzer/layoutAnalyzer.ts`)

Determines how each container should be laid out in Lumos terms.

**Decision Tree:**
```
Is it a section root?
  → section > u-container > _layout  (always)

Is _layout a multi-column design?
  Count direct children visual columns:
    ≥ 2 columns AND roughly equal width?
      → display: var(--flex-medium, grid)
      → grid-template-columns: repeat(N, minmax(0, 1fr))
      → flex-direction: column
    1 column?
      → display: flex (or block for text-only)
      → flex-direction: column

Is it a card grid?
  N sibling cards with similar structure?
    → display: var(--flex-medium, grid)
    → grid-template-columns based on card count:
        2 cards → repeat(2, minmax(0, 1fr))
        3 cards → repeat(3, minmax(0, 1fr))
        4+ cards → repeat(auto-fill, minmax(Xrem, 1fr))

Is it a flex row (horizontal auto-layout)?
  → display: flex
  → gap: var(--_spacing---space--N)
  → flex-direction: var(--column-medium, row) if should stack on mobile

Is it a text content block?
  → display: block (NOT flex — flex prevents margin collapsing)
  → children get margin-bottom: var(--_text-style---margin-bottom)
  → parent gets u-margin-trim
```

**Grid Column Span Calculation:**
When a section uses a 12-column grid, calculate how many columns each child should span based on its width relative to the total:
```
childSpan = Math.round((childWidth / totalWidth) * 12)
→ grid-column: 1 / span N
```

**Responsive Variables Application:**
- Multi-column layouts → `display: var(--flex-medium, grid)` + `flex-direction: column`
- Side-by-side elements → `flex-direction: var(--column-medium, row)`
- Alignment shifts → `align-items: var(--start-medium, center)`

### 4.4 Typography Analyzer (`analyzer/typographyAnalyzer.ts`)

Maps Figma text properties to Lumos typography utilities.

**Lumos Text Style Mapping:**

| Figma Font Size  | Lumos Utility             | HTML Tag |
|-----------------|---------------------------|----------|
| ≥ 64px          | `u-text-style-display`    | `<h1>`   |
| 48–63px         | `u-text-style-h1`        | `<h1>`   |
| 36–47px         | `u-text-style-h2`        | `<h2>`   |
| 28–35px         | `u-text-style-h3`        | `<h3>`   |
| 24–27px         | `u-text-style-h4`        | `<h4>`   |
| 20–23px         | `u-text-style-h5`        | `<h5>`   |
| 18–19px         | `u-text-style-large`     | `<p>`    |
| 16–17px         | `u-text-style-main`      | `<p>`    |
| 14–15px         | `u-text-style-small`     | `<p>`    |
| ≤ 13px          | `u-text-style-small`     | `<p>`    |

**CSS rules for text elements (in `<style>` block):**
```css
.hero_title { margin-bottom: var(--_text-style---margin-bottom); }
.hero_text { margin-bottom: var(--_text-style---margin-bottom); }
```

**Font weight** — detected from Figma `fontWeight`:
- Not mapped to utility classes (Lumos doesn't have `u-weight-*`)
- Instead, applied via CSS variable: `font-weight: var(--_typography---font--primary-bold)`

### 4.5 Color Analyzer (`analyzer/colorAnalyzer.ts`)

Maps Figma colors to Lumos theme variables.

**Theme Detection:**
- Dark backgrounds (luminance < 0.3) → `u-theme-dark`
- Light backgrounds (luminance > 0.7) → `u-theme-light`  
- Brand-colored backgrounds → `u-theme-brand`

**Color Variable Mapping:**
Instead of hardcoded colors, emit Lumos theme variables:
- Background → `var(--_theme---background)` or `var(--_theme---background-2)`
- Text → `var(--_theme---text)` (automatic via theme)
- Borders → `var(--_theme---border)`
- Accent text → `var(--_theme---heading-accent)`

**When a color doesn't match a theme variable,** output it as a swatch reference:
`var(--swatch--brand-500)` or as a token in the report.

### 4.6 Component Detector (`analyzer/componentDetector.ts`)

**Refactor** the existing `similarity.ts`. Keep cosine similarity but improve:

1. **Feature vector** should include:
   - Child count
   - Child type sequence hash
   - Layout mode
   - Approximate aspect ratio
   - Text content length pattern (short/medium/long)
   - Has image child (boolean)

2. **Variant detection:** Siblings with same structure but different content/colors → same component, different combo class:
   ```html
   <div class="pricing_card_wrap">          <!-- base -->
   <div class="pricing_card_wrap is-featured">  <!-- variant -->
   ```

3. **Output Webflow component hints** in comments:
   ```html
   <!-- Component: Card Testimonial (3 instances detected) -->
   ```

### 4.7 Class Namer (`generator/classNamer.ts`)

Generates Lumos-compliant class names following the `[component]_[type]_[element]` convention.

**Rules:**
1. Max 3 underscores
2. Broadest type first → specific → element
3. `_wrap` marks component/subcomponent start
4. Preferred names: `_title` not `_heading`, `_text` not `_paragraph`, `_img` not `_image`
5. Every element MUST have a component class (no bare utility-only elements)
6. Interactive elements (`<a>`, `<button>`) that are component roots → end in `_wrap`

**Naming Algorithm:**
```
1. Get section name (e.g., "hero", "footer", "features")
2. For each child, determine role and position:
   - Direct layout child → [section]_layout
   - Content wrapper → [section]_content
   - Title text → [section]_title
   - Body text → [section]_text
   - Eyebrow → [section]_eyebrow
   - Image → [section]_img or [section]_visual
   - Button → [section]_button (needs _wrap if component root)
   - Button group → [section]_actions
   - Card wrapper → [section]_card_wrap
   - Card title → [section]_card_title
   - Card text → [section]_card_text
   - List → [section]_list
   - List item → [section]_item_wrap
```

**Collision Resolution:** If a name is already used, append incremental number variants or use type prefix:
- First card → `features_card_wrap`
- If nested deeply and would exceed 3 underscores → start new subcomponent name

### 4.8 CSS Generator (`generator/cssGenerator.ts`)

Generates the `<style>` block containing ONLY component-specific CSS.

**What goes in `<style>`:**
- Layout rules for `_layout` divs (grid, flex, gap)
- `margin-bottom: var(--_text-style---margin-bottom)` for text elements
- Button styles using Lumos `color-mix()` pattern
- Grid column spans (`grid-column: 1 / span N`)
- Container queries (if needed, breakpoint in `em`)
- `width: 100%` for direct grid children
- `padding: 0` for empty decorative divs
- Background-color on cards: `var(--_theme---background-2)`
- Border radius: `var(--radius--main)` or `var(--radius--small)`
- Any component-level overrides that can't be expressed via utilities

**What does NOT go in `<style>`:**
- Any `u-*` utility class definitions
- CSS resets, `:root`, `body` styles
- Tag selectors, ID selectors, descendant selectors
- `px` values (use `rem`)
- Inline `style=""` attributes (NEVER)

**CSS Format Rules:**
- Class-only selectors: `.hero_layout { }`
- Scoped combo classes: `.hero_card_wrap.is-featured { }`
- `rem` only, `ch` for text max-width, `em` for container query breakpoints
- `background-color` not `background`
- `overflow: clip` not `overflow: hidden`
- `var(--border-width--main)` for all border widths
- `minmax(0, 1fr)` never bare `1fr`
- Grid children always get `width: 100%`

**Button CSS Pattern (from Lumos skill):**
```css
.hero_button {
  padding: var(--_spacing---space--3) var(--_spacing---space--5);
  background-color: color-mix(in hsl,
    var(--_theme---button-primary--background) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--background-hover) calc(100% * var(--_trigger---off)));
  color: color-mix(in hsl,
    var(--_theme---button-primary--text) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--text-hover) calc(100% * var(--_trigger---off)));
  border-color: color-mix(in hsl,
    var(--_theme---button-primary--border) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--border-hover) calc(100% * var(--_trigger---off)));
  border-width: var(--border-width--main);
  transition: all 300ms;
}
```

### 4.9 HTML Generator (`generator/htmlGenerator.ts`)

Assembles the final HTML output.

**Section Template:**
```html
<section class="[name]_wrap u-section u-theme-[dark|light|brand]">
  <div class="[name]_contain u-container">
    <div class="[name]_layout">
      <!-- content -->
    </div>
  </div>
</section>
```

**Tag Selection:**
| Role | Tag | Notes |
|------|-----|-------|
| section-wrap | `<section>` | With `u-section` |
| nav | `<nav>` | |
| footer | `<footer>` | |
| title | `<h1>`–`<h6>` | Based on hierarchy + font size |
| text | `<p>` | |
| button-primary | `<a>` | With `data-trigger="hover focus"` |
| button-secondary | `<a>` | With `data-trigger="hover focus"` |
| button-wrapper | `<div>` | With `u-button-wrapper` |
| image | `<img>` | With `src`, `alt`, `loading="lazy"` |
| icon (SVG) | `<svg>` | With `aria-hidden="true"` |
| divider | `<div>` | With `padding: 0` in CSS |
| everything else | `<div>` | |

**Required Attributes:**
- Buttons: `data-trigger="hover focus"`
- Icons/decorative: `aria-hidden="true"`
- Images: `src`, `alt`, `loading="lazy"`
- Images (not logo/transparent): `background-color: var(--_theme---background-skeleton)` in CSS

**Text Content:**
- Use the `characters` field from Figma (actual text), not the layer name
- If `characters` is missing, use the layer name as fallback content

**Output structure** (single string):
```html
<style>
/* Component CSS */
.hero_layout { ... }
.hero_title { ... }
...
</style>

<section class="hero_wrap u-section">
  ...
</section>

<section class="features_wrap u-section">
  ...
</section>

<!-- etc. -->
```

### 4.10 Responsive Generator (`generator/responsiveGenerator.ts`)

Applies responsive behavior to CSS rules.

**Strategy (from Lumos skill):**
1. **Default: responsive variables** — for display, flex-direction, align-items, position switches
2. **Fallback: `@container` queries** — only when variables can't express the change
3. **Never: `@media` queries**

**Automatic Responsive Rules:**
- Any multi-column `_layout` grid:
  ```css
  .hero_layout {
    display: var(--flex-medium, grid);
    flex-direction: column;
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  ```
- Side-by-side content/visual:
  ```css
  .about_layout {
    display: var(--flex-medium, grid);
    flex-direction: column;
  }
  ```
- Card grids (variable column count):
  ```css
  .features_card_layout {
    display: var(--flex-medium, grid);
    flex-direction: column;
    grid-template-columns: repeat(
      calc(var(--_responsive---large) * 3 + var(--_responsive---medium) * 2 + var(--_responsive---small) * 1),
      minmax(0, 1fr)
    );
  }
  ```

---

## 5. Lumos Constants Reference

### 5.1 Spacing Scale (CSS Variables)

```
--_spacing---space--1  (smallest, ~4px fluid)
--_spacing---space--2  (~8px fluid)
--_spacing---space--3  (~12px fluid)  ← minimum for text spacing
--_spacing---space--4  (~16px fluid)
--_spacing---space--5  (~20px fluid)
--_spacing---space--6  (~24px fluid)
--_spacing---space--7  (~32px fluid)
--_spacing---space--8  (~40px fluid, largest)
```

**Figma px → Lumos space mapping:**
| Figma px range | Lumos variable |
|---------------|----------------|
| 0–6           | `--_spacing---space--1` |
| 7–10          | `--_spacing---space--2` |
| 11–14         | `--_spacing---space--3` |
| 15–18         | `--_spacing---space--4` |
| 19–22         | `--_spacing---space--5` |
| 23–28         | `--_spacing---space--6` |
| 29–36         | `--_spacing---space--7` |
| 37+           | `--_spacing---space--8` |

### 5.2 Section Spacing Variables

```
--_spacing---section-space--none
--_spacing---section-space--small
--_spacing---section-space--main     (default)
--_spacing---section-space--large
--_spacing---section-space--page-top (first section, accounts for nav)
```

### 5.3 Container Max Widths

```
--max-width--small  (50rem)
--max-width--main   (90rem, default)
--max-width--full   (100%)
```

### 5.4 Typography Utilities

```
u-text-style-display
u-text-style-h1
u-text-style-h2
u-text-style-h3
u-text-style-h4
u-text-style-h5
u-text-style-h6
u-text-style-large
u-text-style-main
u-text-style-small
```

### 5.5 Theme Utilities

```
u-section           (section wrapper)
u-container         (max-width container with container-type: inline-size)
u-theme-light       (light theme)
u-theme-dark        (dark theme)
u-theme-brand       (brand theme)
u-margin-trim       (trim first/last child margins)
u-button-wrapper    (button group wrapper)
u-display-none      (hidden elements)
u-display-contents  (slot pass-through)
```

### 5.6 Responsive Variables

```
--_responsive---large    (1 when ≥50em)
--_responsive---medium   (1 when ~35–50em)
--_responsive---small    (1 when ~20–35em)
--_responsive---xsmall   (1 when <20em)

Keyword variables per breakpoint (medium/small/xsmall):
--flex-medium, --flex-small, --flex-xsmall
--none-medium, --none-small, --none-xsmall
--column-medium, --column-small
--row-medium, --row-small
--start-medium, --center-medium, --end-medium
--first-medium, --last-medium
--unset-medium, --relative-medium
```

### 5.7 Theme Color Variables

```
--_theme---background
--_theme---background-2        (card backgrounds)
--_theme---background-skeleton (image loading placeholder)
--_theme---text
--_theme---heading-accent
--_theme---border
--_theme---text-link--border
--_theme---text-link--text
--_theme---text-link--border-hover
--_theme---text-link--text-hover
--_theme---button-primary--background
--_theme---button-primary--background-hover
--_theme---button-primary--text
--_theme---button-primary--text-hover
--_theme---button-primary--border
--_theme---button-primary--border-hover
--_theme---button-secondary--background
--_theme---button-secondary--background-hover
--_theme---button-secondary--text
--_theme---button-secondary--text-hover
--_theme---button-secondary--border
--_theme---button-secondary--border-hover
```

### 5.8 Miscellaneous Variables

```
--border-width--main
--radius--small
--radius--main
--radius--round
--site--margin
--site--gutter
--nav--height-total
--_text-style---margin-bottom
--_typography---font--primary-regular
--_typography---font--primary-bold
--_typography---font--primary-semibold
--_trigger---on   (1 when hovered/focused)
--_trigger---off  (0 when hovered/focused)
--_state---true   (1 when active)
--_state---false  (0 when active)
```

---

## 6. Implementation Plan (MVP Phases)

### Phase 1: Core Infrastructure Refactor
**Goal:** Set up the new module structure and IR types.

**Tasks:**
1. Create the new directory structure (`parser/`, `analyzer/`, `generator/`, `lumos/`)
2. Define the `LumosIR` TypeScript interfaces (Section 3.3)
3. Create `lumos/constants.ts` with all Lumos variable names and mappings (Section 5)
4. Create `utils/units.ts` with `pxToRem()`, `pxToSpaceVar()`, `pxToTextStyle()` converters
5. Enhance `schemas/figma.ts` to capture all needed Figma properties (Section 4.1)

### Phase 2: Parser & Normalizer Rewrite
**Goal:** Extract all Figma data needed for conversion.

**Tasks:**
1. Rewrite `figmaNormalizer.ts` to produce richer normalized nodes:
   - Extract `characters` (actual text content) from TEXT nodes
   - Extract fill colors with full RGBA
   - Extract stroke/border info
   - Extract corner radius
   - Extract effects (shadows)
   - Extract sizing mode (FIXED/HUG/FILL)
   - Extract alignment properties
   - Preserve export settings for image detection
2. Handle INSTANCE nodes by resolving to their component definition
3. Handle VECTOR/BOOLEAN_OPERATION nodes for icon detection
4. Handle ELLIPSE, RECTANGLE, LINE for shapes/decorative elements

### Phase 3: Semantic & Layout Analysis
**Goal:** Understand what each Figma element represents in web terms.

**Tasks:**
1. Implement `semanticAnalyzer.ts`:
   - Section boundary detection (top-level frame children)
   - Role assignment for every node (title/text/button/image/card/etc.)
   - Heading hierarchy assignment (h1–h6 based on visual hierarchy)
   - Button detection (by name, shape, and child structure)
   - Image detection (rectangles with image fills)
   - Card pattern detection (repeated similar siblings)
   - Nav/footer detection
2. Implement `layoutAnalyzer.ts`:
   - Grid vs flex decision per container
   - Column count and span calculation
   - Responsive variable application
   - Text wrapper detection (should be block, not flex)
   - Gap calculation → Lumos space variable mapping
3. Implement `typographyAnalyzer.ts`:
   - Font size → `u-text-style-*` mapping
   - Font weight → CSS variable mapping
   - Text transform detection
4. Implement `colorAnalyzer.ts`:
   - Background luminance → theme detection
   - Color → Lumos theme/swatch variable mapping

### Phase 4: Generator Implementation
**Goal:** Produce the final HTML + CSS output.

**Tasks:**
1. Implement `classNamer.ts`:
   - Section-scoped naming (`hero_*`, `footer_*`, etc.)
   - Max 3 underscore enforcement
   - Name collision resolution
   - `_wrap` suffix rules
2. Implement `cssGenerator.ts`:
   - Collect all component CSS rules from IR
   - Format as single `<style>` block
   - Button CSS pattern generation
   - Layout CSS generation
   - Typography margin CSS
   - No px, no inline styles, no utility redefinitions
3. Implement `htmlGenerator.ts`:
   - Section wrapper template (`section > u-container > _layout`)
   - Proper tag selection per role
   - Attribute assignment (data-trigger, aria-*, src, alt)
   - Component class + utility class ordering
   - Text content insertion
   - Recursive children rendering
4. Implement `responsiveGenerator.ts`:
   - Apply `var(--flex-medium, grid)` to multi-column layouts
   - Apply `var(--column-medium, row)` to side-by-side layouts
   - Generate container queries where needed

### Phase 5: Pipeline & CLI Integration
**Goal:** Wire everything together and make it usable.

**Tasks:**
1. Implement `pipeline.ts`:
   - Parse → Normalize → Analyze → Generate pipeline
   - Error handling and graceful degradation
   - Transformation report generation
2. Update `index.ts`:
   - Accept input file path
   - Output HTML+CSS to clipboard
   - Print summary report
   - Optional: write to output file
3. Validation:
   - Validate output against Lumos anti-patterns
   - Warn on any `px` values, inline styles, utility-only elements

### Phase 6: Testing & Refinement  
**Goal:** Validate with real Figma exports.

**Tasks:**
1. Test with the included `figma.json` (Footer component)
2. Test with a full-page Figma export (hero + features + CTA + footer)
3. Manual paste into Webflow and verify classes resolve correctly
4. Fix any anti-pattern violations
5. Add more sample Figma JSONs for regression testing

---

## 7. Output Example

Given a Figma hero section with a heading, paragraph, two buttons, and an image:

### Expected Output:
```html
<style>
.hero_layout {
  display: var(--flex-medium, grid);
  flex-direction: column;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.hero_content {
  grid-column: 1 / span 6;
  width: 100%;
}

.hero_title {
  margin-bottom: var(--_text-style---margin-bottom);
}

.hero_text {
  margin-bottom: var(--_text-style---margin-bottom);
}

.hero_button_primary {
  padding: var(--_spacing---space--3) var(--_spacing---space--5);
  background-color: color-mix(in hsl,
    var(--_theme---button-primary--background) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--background-hover) calc(100% * var(--_trigger---off)));
  color: color-mix(in hsl,
    var(--_theme---button-primary--text) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--text-hover) calc(100% * var(--_trigger---off)));
  border-color: color-mix(in hsl,
    var(--_theme---button-primary--border) calc(100% * var(--_trigger---on)),
    var(--_theme---button-primary--border-hover) calc(100% * var(--_trigger---off)));
  border-width: var(--border-width--main);
  border-radius: var(--radius--main);
  transition: all 300ms;
}

.hero_button_secondary {
  padding: var(--_spacing---space--3) var(--_spacing---space--5);
  background-color: color-mix(in hsl,
    var(--_theme---button-secondary--background) calc(100% * var(--_trigger---on)),
    var(--_theme---button-secondary--background-hover) calc(100% * var(--_trigger---off)));
  color: color-mix(in hsl,
    var(--_theme---button-secondary--text) calc(100% * var(--_trigger---on)),
    var(--_theme---button-secondary--text-hover) calc(100% * var(--_trigger---off)));
  border-color: color-mix(in hsl,
    var(--_theme---button-secondary--border) calc(100% * var(--_trigger---on)),
    var(--_theme---button-secondary--border-hover) calc(100% * var(--_trigger---off)));
  border-width: var(--border-width--main);
  border-radius: var(--radius--main);
  transition: all 300ms;
}

.hero_visual {
  grid-column: 7 / span 6;
  width: 100%;
}

.hero_img {
  border-radius: var(--radius--main);
  background-color: var(--_theme---background-skeleton);
}
</style>

<section class="hero_wrap u-section">
  <div class="hero_contain u-container">
    <div class="hero_layout">
      <div class="hero_content u-margin-trim">
        <p class="hero_eyebrow u-text-style-small">WELCOME TO SOLIX</p>
        <h1 class="hero_title u-text-style-h1">Design That Drives Results</h1>
        <p class="hero_text u-text-style-main">We help businesses grow with stunning digital experiences that convert visitors into customers.</p>
        <div class="hero_actions u-button-wrapper">
          <a class="hero_button_primary" data-trigger="hover focus">Get Started</a>
          <a class="hero_button_secondary" data-trigger="hover focus">Learn More</a>
        </div>
      </div>
      <div class="hero_visual">
        <img class="hero_img" src="https://via.placeholder.com/600x400" alt="Hero image" loading="lazy">
      </div>
    </div>
  </div>
</section>
```

---

## 8. Acceptance Criteria

### Must-Have (MVP):
- [ ] Output is valid HTML with a `<style>` block — no inline styles
- [ ] Every element has a component class as its first class
- [ ] Section structure follows `section.u-section > div.u-container > div._layout` pattern  
- [ ] Typography uses `u-text-style-*` utilities with proper semantic HTML tags
- [ ] Text elements have `margin-bottom: var(--_text-style---margin-bottom)` in CSS
- [ ] Content wrappers have `u-margin-trim` class
- [ ] Buttons use the Lumos `color-mix()` trigger pattern with `data-trigger="hover focus"`
- [ ] No `px` in CSS — all values in `rem`
- [ ] Grid columns use `minmax(0, 1fr)` — never bare `1fr`
- [ ] Multi-column layouts use `display: var(--flex-medium, grid)` with `flex-direction: column`
- [ ] Theme detection applies `u-theme-dark` or `u-theme-light` to sections
- [ ] Colors use Lumos theme variables, not hardcoded values
- [ ] Spacing uses Lumos `--_spacing---space--N` variables
- [ ] No `@media` queries — responsive via variables + `@container` only
- [ ] Images output as `<img>` tags with `loading="lazy"`
- [ ] Empty decorative divs have `padding: 0` in CSS
- [ ] Class names follow `[component]_[element]` underscore convention with max 3 underscores
- [ ] Output can be pasted into Webflow HTML Embed without errors

### Nice-to-Have (Post-MVP):
- [ ] SVG icon extraction with `aria-hidden="true"` and stroke CSS
- [ ] Card variant detection with combo classes (`is-featured`)
- [ ] Navigation component with link detection
- [ ] Footer component with social links
- [ ] Scalable visual composition pattern for decorative elements
- [ ] Container queries for complex responsive changes
- [ ] Webflow component comment annotations
- [ ] Design token export for unmapped values
- [ ] Multiple page support

---

## 9. Anti-Pattern Checklist (Validate Against)

The output MUST NOT contain any of these (from Lumos SKILL.md):
- [ ] `display: grid` on `u-container` element
- [ ] CSS for `u-*` utilities
- [ ] `:root`, `body`, or reset styles
- [ ] `px` units (must be `rem`)
- [ ] Tag selectors, ID selectors, descendant selectors
- [ ] `.is-active`, `[data-state]`, `[data-trigger]` in CSS selectors
- [ ] `@media` queries
- [ ] `@container` for simple display/direction switches (use responsive vars)
- [ ] `var()` with fallback values (except responsive keywords)
- [ ] `overflow: hidden` (must be `overflow: clip`)
- [ ] `background:` shorthand (must be `background-color:`)
- [ ] Bare `1fr` in grid (must be `minmax(0, 1fr)`)
- [ ] Inline `style=""` attributes
- [ ] `::before` / `::after` pseudo-elements
- [ ] Hyphens between component class parts (must be underscores)
- [ ] More than 3 underscores in a class name
- [ ] Elements with only utility classes (no component class)
- [ ] Buttons without padding
- [ ] Input font-size below 1rem
- [ ] Hardcoded colors, border widths, font sizes

---

## 10. Tech Stack

- **Language:** TypeScript (ESM)
- **Validation:** Zod v4
- **Runtime:** Node.js
- **Build:** `tsc` (TypeScript compiler)
- **CLI:** Built-in (`process.argv`)
- **Clipboard:** `clipboardy` or native `pbcopy` (macOS)
- **No external AI dependency** for MVP — all mapping is rule-based
- **Optional post-MVP:** OpenAI/Claude API for ambiguous semantic naming

---

## 11. File-by-File Implementation Guide

This section provides exact guidance for each file Claude Code should create/modify.

### New Files to Create:

| File | Purpose | Key Logic |
|------|---------|-----------|
| `src/pipeline.ts` | Main orchestrator | Calls parser → analyzers → generators in sequence |
| `src/lumos/constants.ts` | Lumos reference data | All variable names, spacing scales, typography tiers, theme vars |
| `src/lumos/spacingScale.ts` | Spacing mapper | `pxToSpaceVar(px) → "--_spacing---space--N"` |
| `src/lumos/typographyScale.ts` | Typography mapper | `pxToTextStyle(px) → "u-text-style-h2"` + tag |
| `src/lumos/themeMap.ts` | Theme detection | `rgbaToTheme(r,g,b,a) → "u-theme-dark"` |
| `src/analyzer/semanticAnalyzer.ts` | Role detection | Assigns NodeRole to each IR node |
| `src/analyzer/layoutAnalyzer.ts` | Layout decisions | Grid vs flex, column spans, responsive vars |
| `src/analyzer/typographyAnalyzer.ts` | Typography mapping | Font size → text style + HTML tag |
| `src/analyzer/colorAnalyzer.ts` | Color mapping | Fills → theme/swatch variables |
| `src/analyzer/componentDetector.ts` | Component detection | Refactored similarity with better features |
| `src/generator/classNamer.ts` | Class name generation | Section-scoped Lumos naming |
| `src/generator/cssGenerator.ts` | CSS output | `<style>` block with component CSS |
| `src/generator/htmlGenerator.ts` | HTML output | Semantic HTML with proper tags |
| `src/generator/responsiveGenerator.ts` | Responsive CSS | Responsive variables + container queries |
| `src/utils/units.ts` | Unit conversion | px→rem, px→space var, color conversion |

### Files to Modify:

| File | Changes |
|------|---------|
| `src/schemas/figma.ts` | Add missing Figma node properties (characters, constraints, cornerRadius, effects, sizing modes) |
| `src/schemas/lumos.ts` | Replace with new IR types from Section 3.3 |
| `src/index.ts` | Use new pipeline, update CLI output |

### Files to Deprecate (keep but don't use):

| File | Reason |
|------|--------|
| `src/utils/normalizer.ts` | Replaced by `parser/figmaNormalizer.ts` + analyzers |
| `src/utils/similarity.ts` | Replaced by `analyzer/componentDetector.ts` |
| `src/utils/lumosMapper.ts` | Replaced by `lumos/` modules |
| `src/services/mappingService.ts` | Replaced by `pipeline.ts` + generators |
| `src/services/aiService.ts` | Not needed for MVP (rule-based approach) |

---

## 12. Testing Strategy

### Unit Tests (per module):
1. **Parser:** Feed sample Figma JSON → verify all properties extracted
2. **Semantic Analyzer:** Feed normalized tree → verify roles assigned correctly
3. **Layout Analyzer:** Feed containers → verify grid/flex decisions
4. **Typography Analyzer:** Feed font sizes → verify correct `u-text-style-*`
5. **Color Analyzer:** Feed RGB colors → verify theme detection
6. **Class Namer:** Feed role tree → verify class names follow conventions
7. **CSS Generator:** Feed IR → verify no anti-patterns in output
8. **HTML Generator:** Feed IR → verify correct tags, attributes, nesting

### Integration Tests:
1. Full pipeline with `figma.json` → paste output into Webflow → verify rendering
2. Anti-pattern scanner: regex-based checker that fails on any Lumos violations:
   - `/style="/` → fail (inline styles)
   - `/@media/` → fail (no media queries)
   - `/\dpx/` → fail (no px values)
   - `/1fr(?!\))/` without `minmax` → fail (bare 1fr)

### Manual Validation:
1. Paste output into Webflow HTML Embed
2. Verify all Lumos utilities resolve (no missing classes)
3. Verify responsive behavior with Webflow preview

---

## Summary

This PRD covers the complete transformation of the current prototype into a production-ready Figma-to-Webflow converter that strictly follows the Lumos Framework. The key insight is that Lumos is highly opinionated — it has specific patterns for sections, containers, responsive behavior, buttons, typography, and theming that must be followed exactly. The current codebase has the right idea but mapped to incorrect/invented class names and used inline styles instead of a `<style>` block.

The MVP focuses on **rule-based conversion** without AI dependencies, producing semantic HTML + component CSS that can be directly pasted into a Webflow project with the Lumos starter cloneable installed. Post-MVP can add AI-assisted naming and more advanced component detection.
