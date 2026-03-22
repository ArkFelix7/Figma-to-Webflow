// Lumos Framework constants — all variable names, spacing scales, typography tiers

// ─── Spacing ─────────────────────────────────────────────
export const LUMOS_SPACE_VARS = [
  "--_spacing---space--1",
  "--_spacing---space--2",
  "--_spacing---space--3",
  "--_spacing---space--4",
  "--_spacing---space--5",
  "--_spacing---space--6",
  "--_spacing---space--7",
  "--_spacing---space--8",
] as const;

// Approximate px midpoints for each space step (fluid, so these are reference)
const SPACE_PX_MAP: [number, string][] = [
  [4, "--_spacing---space--1"],
  [8, "--_spacing---space--2"],
  [12, "--_spacing---space--3"],
  [16, "--_spacing---space--4"],
  [20, "--_spacing---space--5"],
  [24, "--_spacing---space--6"],
  [32, "--_spacing---space--7"],
  [40, "--_spacing---space--8"],
];

export function pxToSpaceVar(px: number): string {
  if (px <= 0) return "--_spacing---space--1";
  let closest = SPACE_PX_MAP[0];
  let minDiff = Infinity;
  for (const entry of SPACE_PX_MAP) {
    const diff = Math.abs(px - entry[0]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest[1];
}

export function pxToSpaceStep(px: number): number {
  if (px <= 0) return 1;
  const steps: [number, number][] = [
    [4, 1], [8, 2], [12, 3], [16, 4], [20, 5], [24, 6], [32, 7], [40, 8],
  ];
  let closest = steps[0];
  let minDiff = Infinity;
  for (const entry of steps) {
    const diff = Math.abs(px - entry[0]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest[1];
}

// ─── Section spacing ─────────────────────────────────────
export const SECTION_SPACE_VARS = {
  none: "--_spacing---section-space--none",
  small: "--_spacing---section-space--small",
  main: "--_spacing---section-space--main",
  large: "--_spacing---section-space--large",
  pageTop: "--_spacing---section-space--page-top",
} as const;

// ─── Container ───────────────────────────────────────────
export const CONTAINER_WIDTHS = {
  small: "--max-width--small",   // 50rem
  main: "--max-width--main",     // 90rem
  full: "--max-width--full",     // 100%
} as const;

// ─── Typography ──────────────────────────────────────────
export interface TextStyleMapping {
  utility: string;
  tag: string;
  minPx: number;
  maxPx: number;
}

export const TEXT_STYLE_MAP: TextStyleMapping[] = [
  { utility: "u-text-style-display", tag: "h1", minPx: 64, maxPx: Infinity },
  { utility: "u-text-style-h1", tag: "h1", minPx: 48, maxPx: 63 },
  { utility: "u-text-style-h2", tag: "h2", minPx: 36, maxPx: 47 },
  { utility: "u-text-style-h3", tag: "h3", minPx: 28, maxPx: 35 },
  { utility: "u-text-style-h4", tag: "h4", minPx: 24, maxPx: 27 },
  { utility: "u-text-style-h5", tag: "h5", minPx: 20, maxPx: 23 },
  { utility: "u-text-style-h6", tag: "h6", minPx: 18, maxPx: 19 },
  { utility: "u-text-style-large", tag: "p", minPx: 17, maxPx: 17 },
  { utility: "u-text-style-main", tag: "p", minPx: 15, maxPx: 16 },
  { utility: "u-text-style-small", tag: "p", minPx: 0, maxPx: 14 },
];

export function pxToTextStyle(px: number): TextStyleMapping {
  for (const entry of TEXT_STYLE_MAP) {
    if (px >= entry.minPx && px <= entry.maxPx) return entry;
  }
  return TEXT_STYLE_MAP[TEXT_STYLE_MAP.length - 1]; // fallback to small
}

// ─── Theme ───────────────────────────────────────────────
export const THEME_CLASSES = {
  light: "u-theme-light",
  dark: "u-theme-dark",
  brand: "u-theme-brand",
} as const;

export const THEME_VARS = {
  background: "--_theme---background",
  background2: "--_theme---background-2",
  backgroundSkeleton: "--_theme---background-skeleton",
  text: "--_theme---text",
  headingAccent: "--_theme---heading-accent",
  border: "--_theme---border",
  buttonPrimaryBg: "--_theme---button-primary--background",
  buttonPrimaryBgHover: "--_theme---button-primary--background-hover",
  buttonPrimaryText: "--_theme---button-primary--text",
  buttonPrimaryTextHover: "--_theme---button-primary--text-hover",
  buttonPrimaryBorder: "--_theme---button-primary--border",
  buttonPrimaryBorderHover: "--_theme---button-primary--border-hover",
  buttonSecondaryBg: "--_theme---button-secondary--background",
  buttonSecondaryBgHover: "--_theme---button-secondary--background-hover",
  buttonSecondaryText: "--_theme---button-secondary--text",
  buttonSecondaryTextHover: "--_theme---button-secondary--text-hover",
  buttonSecondaryBorder: "--_theme---button-secondary--border",
  buttonSecondaryBorderHover: "--_theme---button-secondary--border-hover",
} as const;

// ─── Responsive ──────────────────────────────────────────
export const RESPONSIVE_VARS = {
  large: "--_responsive---large",
  medium: "--_responsive---medium",
  small: "--_responsive---small",
  xsmall: "--_responsive---xsmall",
} as const;

// ─── Misc ────────────────────────────────────────────────
export const MISC_VARS = {
  borderWidth: "--border-width--main",
  radiusSmall: "--radius--small",
  radiusMain: "--radius--main",
  radiusRound: "--radius--round",
  siteMargin: "--site--margin",
  siteGutter: "--site--gutter",
  navHeight: "--nav--height-total",
  textMarginBottom: "--_text-style---margin-bottom",
  triggerOn: "--_trigger---on",
  triggerOff: "--_trigger---off",
  stateTrue: "--_state---true",
  stateFalse: "--_state---false",
} as const;

// ─── Utility classes ─────────────────────────────────────
export const UTILITY_CLASSES = {
  section: "u-section",
  container: "u-container",
  marginTrim: "u-margin-trim",
  buttonWrapper: "u-button-wrapper",
  displayNone: "u-display-none",
  displayContents: "u-display-contents",
} as const;

// ─── Units ───────────────────────────────────────────────
export function pxToRem(px: number): string {
  return `${(px / 16).toFixed(4).replace(/\.?0+$/, "")}rem`;
}

// ─── Color helpers ───────────────────────────────────────
export function rgbLuminance(r: number, g: number, b: number): number {
  // r, g, b are 0-1
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function detectTheme(r: number, g: number, b: number): "light" | "dark" | "brand" {
  const lum = rgbLuminance(r, g, b);
  // Check for brand (saturated/colorful backgrounds)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max > 0 ? (max - min) / max : 0;
  if (saturation > 0.3 && lum > 0.2 && lum < 0.85) return "brand";
  if (lum < 0.3) return "dark";
  return "light";
}

// Section name heuristics
export const SECTION_KEYWORDS = [
  "hero", "header", "nav", "navbar", "navigation",
  "footer", "cta", "call-to-action", "calltoaction",
  "feature", "features", "testimonial", "testimonials",
  "pricing", "faq", "contact", "about", "team",
  "section", "banner", "showcase", "stats", "partners",
  "clients", "logos", "gallery", "blog", "news",
] as const;

// Element name heuristics
export const BUTTON_KEYWORDS = ["button", "btn", "cta", "action", "submit", "get started", "learn more", "sign up", "view"];
export const IMAGE_KEYWORDS = ["image", "img", "photo", "picture", "illustration", "visual", "thumbnail", "avatar"];
export const ICON_KEYWORDS = ["icon", "svg", "arrow", "chevron", "check", "star", "social"];
export const DIVIDER_KEYWORDS = ["divider", "separator", "line", "hr", "rule"];
export const NAV_KEYWORDS = ["nav", "navbar", "navigation", "menu", "header"];
export const FOOTER_KEYWORDS = ["footer", "bottom"];
export const LOGO_KEYWORDS = ["logo", "brand", "logotype"];
