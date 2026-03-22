// CSS Generator: produces the <style> block with component-specific CSS
// RULES:
// - Class-only selectors
// - No px (rem only)
// - No utility redefinitions
// - background-color not background
// - overflow: clip not overflow: hidden
// - minmax(0, 1fr) never bare 1fr
// - var(--border-width--main) for borders

import { LumosNode, LumosSection } from "../types.js";
import { pxToRem, pxToSpaceVar, MISC_VARS, THEME_VARS } from "../lumos/constants.js";

interface CSSBlock {
  selector: string;
  rules: Map<string, string>;
}

export function generateCSS(sections: LumosSection[]): string {
  const blocks: CSSBlock[] = [];

  for (const section of sections) {
    generateSectionCSS(section, blocks);
    for (const child of section.children) {
      generateNodeCSS(child, section, blocks);
    }
  }

  // Deduplicate and format
  const lines: string[] = [];
  for (const block of blocks) {
    if (block.rules.size === 0) continue;
    lines.push(`.${block.selector} {`);
    for (const [prop, val] of block.rules) {
      lines.push(`  ${prop}: ${val};`);
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

function generateSectionCSS(section: LumosSection, blocks: CSSBlock[]): void {
  // Generate layout CSS for the _layout div based on section children arrangement
  const layoutSelector = `${section.sectionName}_layout`;
  const rules = new Map<string, string>();

  const contentChildren = section.children.filter(
    c => c.role !== "decorative" && c.role !== "divider" && c.visible !== false
  );

  if (contentChildren.length >= 2) {
    // Check if children are arranged side-by-side (cards, columns)
    const hasSideBySide = contentChildren.some(c => c.layoutMode === "HORIZONTAL")
      || areSideBySide(contentChildren);

    if (hasSideBySide) {
      // Check for equal-width children → grid
      const childWidths = contentChildren.filter(c => c.figmaWidth && c.figmaWidth > 0).map(c => c.figmaWidth!);
      const nonTextChildren = contentChildren.filter(c => !isTextNode(c));
      const gridCandidates = nonTextChildren.filter(c => c.figmaWidth && c.figmaWidth > 0);
      const gridWidths = gridCandidates.map(c => c.figmaWidth!);
      
      if (gridWidths.length >= 2) {
        const maxW = Math.max(...gridWidths);
        const minW = Math.min(...gridWidths);
        const isEqual = maxW / Math.max(minW, 1) < 1.5;

        if (isEqual && gridCandidates.length >= 2 && gridCandidates.length <=6) {
          rules.set("display", "var(--flex-medium, grid)");
          rules.set("flex-direction", "column");
          rules.set("grid-template-columns", `repeat(${gridCandidates.length}, minmax(0, 1fr))`);
          // Estimate gap from spacing
          const spacing = estimateSpacing(gridCandidates);
          if (spacing > 0) {
            rules.set("gap", `var(${pxToSpaceVar(spacing)})`);
          }
        } else {
          rules.set("display", "var(--flex-medium, flex)");
          rules.set("flex-direction", "var(--column-medium, row)");
          rules.set("align-items", "center");
          const spacing = estimateSpacing(contentChildren);
          if (spacing > 0) {
            rules.set("gap", `var(${pxToSpaceVar(spacing)})`);
          }
        }
      }
    } else {
      // Vertical layout — use flex column for section layout
      rules.set("display", "flex");
      rules.set("flex-direction", "column");
    }
  }

  if (rules.size > 0) {
    blocks.push({ selector: layoutSelector, rules });
  }
}

function areSideBySide(children: LumosNode[]): boolean {
  // Check if any significant children share similar Y positions
  const positioned = children.filter(c => c.figmaWidth && c.figmaWidth > 0);
  if (positioned.length < 2) return false;
  
  // Look for children with large width relative to section
  const maxWidth = Math.max(...positioned.map(c => c.figmaWidth!));
  const wideChildren = positioned.filter(c => c.figmaWidth! > maxWidth * 0.15);
  
  // If we have multiple wide children, they might be side-by-side
  // Check by role: multiple cards or content-wraps suggest columns
  const cardLike = wideChildren.filter(c =>
    c.role === "card-wrap" || c.role === "card" || c.role === "content-wrap" || c.role === "generic"
  );
  return cardLike.length >= 2;
}

function estimateSpacing(children: LumosNode[]): number {
  // Default spacing estimate based on typical Figma designs
  if (children.length >= 2) return 24;
  return 0;
}

function findLayoutNode(children: LumosNode[]): LumosNode | null {
  // The layout node is typically the first significant container
  for (const child of children) {
    if (child.children.length > 0 && child.role !== "decorative" && child.role !== "divider") {
      return child;
    }
  }
  return children[0] || null;
}

function generateNodeCSS(node: LumosNode, section: LumosSection, blocks: CSSBlock[]): void {
  if (!node.componentClass) return;

  const rules = new Map<string, string>();

  // Layout CSS for containers
  if (node.children.length > 0 && isContainerNode(node)) {
    generateContainerRules(node, rules);
  }

  // Text elements: margin-bottom for vertical rhythm
  if (isTextNode(node)) {
    rules.set("margin-bottom", `var(${MISC_VARS.textMarginBottom})`);
  }

  // Button CSS
  if (node.role === "button-primary") {
    generateButtonCSS(node, rules, "primary");
  } else if (node.role === "button-secondary") {
    generateButtonCSS(node, rules, "secondary");
  }

  // Decorative / empty divs: padding: 0
  if (node.role === "decorative" || node.role === "divider") {
    rules.set("padding", "0");
  }

  // Divider styling
  if (node.role === "divider") {
    rules.set("background-color", `var(${THEME_VARS.border})`);
    if (node.figmaHeight !== undefined && node.figmaHeight <= 3) {
      rules.set("height", "0.0625rem");
      rules.set("width", "100%");
    } else if (node.figmaWidth !== undefined && node.figmaWidth <= 3) {
      rules.set("width", "0.0625rem");
    }
  }

  // Images
  if (node.role === "image" && node.tag === "img") {
    rules.set("background-color", `var(${THEME_VARS.backgroundSkeleton})`);
    if (node.cornerRadius && node.cornerRadius > 0) {
      rules.set("border-radius", `var(${MISC_VARS.radiusMain})`);
    }
  }

  // Card backgrounds
  if (node.role === "card-wrap" || node.role === "card") {
    rules.set("background-color", `var(${THEME_VARS.background2})`);
    if (node.cornerRadius && node.cornerRadius > 0) {
      rules.set("border-radius", `var(${MISC_VARS.radiusMain})`);
    }
    if (node.padding) {
      const padTop = node.padding.top || 0;
      const padRight = node.padding.right || 0;
      const padBottom = node.padding.bottom || 0;
      const padLeft = node.padding.left || 0;
      if (padTop || padRight || padBottom || padLeft) {
        rules.set("padding", `var(${pxToSpaceVar(padTop)}) var(${pxToSpaceVar(padRight)}) var(${pxToSpaceVar(padBottom)}) var(${pxToSpaceVar(padLeft)})`);
      }
    }
  }

  // Logo
  if (node.role === "logo" && node.tag === "img") {
    rules.set("object-fit", "contain");
  }

  if (rules.size > 0) {
    blocks.push({ selector: node.componentClass, rules });
  }

  // Recurse
  for (const child of node.children) {
    generateNodeCSS(child, section, blocks);
  }
}

function isContainerNode(node: LumosNode): boolean {
  return node.role === "generic" || node.role === "content-wrap" || node.role === "card-wrap"
    || node.role === "layout" || node.role === "button-wrapper" || node.role === "form"
    || node.role === "list";
}

function isTextNode(node: LumosNode): boolean {
  return node.role === "title" || node.role === "subtitle" || node.role === "text" || node.role === "eyebrow";
}

function generateContainerRules(node: LumosNode, rules: Map<string, string>): void {
  const childCount = node.children.length;
  if (childCount === 0) return;

  const mode = node.layoutMode;

  // Check if children are arranged side by side (multi-column)
  const hasSideBySide = mode === "HORIZONTAL" && childCount >= 2;
  const isVerticalStack = mode === "VERTICAL" || mode === "NONE";

  if (hasSideBySide) {
    // Check if it's a grid-worthy layout (children roughly equal width)
    const childWidths = node.children.map(c => c.figmaWidth ?? 0);
    const maxW = Math.max(...childWidths);
    const minW = Math.min(...childWidths.filter(w => w > 0));
    const isEqualColumns = minW > 0 && maxW / minW < 2;

    if (isEqualColumns && childCount >= 2 && childCount <= 4) {
      // Use grid with responsive fallback
      rules.set("display", "var(--flex-medium, grid)");
      rules.set("flex-direction", "column");
      rules.set("grid-template-columns", `repeat(${childCount}, minmax(0, 1fr))`);
      if (node.itemSpacing) {
        rules.set("gap", `var(${pxToSpaceVar(node.itemSpacing)})`);
      }

      // Mark children as needing width: 100%
      for (const child of node.children) {
        child.cssRules.push({ property: "width", value: "100%" });
      }
    } else {
      // Flex row with responsive column switch
      rules.set("display", "var(--flex-medium, flex)");
      rules.set("flex-direction", "var(--column-medium, row)");
      if (node.itemSpacing) {
        rules.set("gap", `var(${pxToSpaceVar(node.itemSpacing)})`);
      }
    }
  } else if (isVerticalStack) {
    // Check if this is a text content block (should be block, not flex)
    const allText = node.children.every(c => isTextNode(c) || c.role === "button-wrapper" || c.role === "button-primary" || c.role === "button-secondary");
    if (!allText && childCount > 1) {
      rules.set("display", "flex");
      rules.set("flex-direction", "column");
      if (node.itemSpacing) {
        rules.set("gap", `var(${pxToSpaceVar(node.itemSpacing)})`);
      }
    }
    // For text-only blocks, let them be display:block (default) for margin collapsing
  }
}

function generateButtonCSS(node: LumosNode, rules: Map<string, string>, variant: "primary" | "secondary"): void {
  const prefix = variant === "primary" ? "button-primary" : "button-secondary";
  const vars = variant === "primary" ? {
    bg: THEME_VARS.buttonPrimaryBg,
    bgHover: THEME_VARS.buttonPrimaryBgHover,
    text: THEME_VARS.buttonPrimaryText,
    textHover: THEME_VARS.buttonPrimaryTextHover,
    border: THEME_VARS.buttonPrimaryBorder,
    borderHover: THEME_VARS.buttonPrimaryBorderHover,
  } : {
    bg: THEME_VARS.buttonSecondaryBg,
    bgHover: THEME_VARS.buttonSecondaryBgHover,
    text: THEME_VARS.buttonSecondaryText,
    textHover: THEME_VARS.buttonSecondaryTextHover,
    border: THEME_VARS.buttonSecondaryBorder,
    borderHover: THEME_VARS.buttonSecondaryBorderHover,
  };

  // Padding from Figma or default
  const padV = node.padding?.top || 12;
  const padH = node.padding?.left || 20;
  rules.set("padding", `var(${pxToSpaceVar(padV)}) var(${pxToSpaceVar(padH)})`);

  rules.set("background-color",
    `color-mix(in hsl, var(${vars.bg}) calc(100% * var(${MISC_VARS.triggerOn})), var(${vars.bgHover}) calc(100% * var(${MISC_VARS.triggerOff})))`);

  rules.set("color",
    `color-mix(in hsl, var(${vars.text}) calc(100% * var(${MISC_VARS.triggerOn})), var(${vars.textHover}) calc(100% * var(${MISC_VARS.triggerOff})))`);

  rules.set("border-color",
    `color-mix(in hsl, var(${vars.border}) calc(100% * var(${MISC_VARS.triggerOn})), var(${vars.borderHover}) calc(100% * var(${MISC_VARS.triggerOff})))`);

  rules.set("border-width", `var(${MISC_VARS.borderWidth})`);

  if (node.cornerRadius && node.cornerRadius > 0) {
    rules.set("border-radius", `var(${MISC_VARS.radiusMain})`);
  }

  rules.set("transition", "all 300ms");
  rules.set("text-decoration", "none");
  rules.set("display", "inline-flex");
  rules.set("align-items", "center");
  rules.set("justify-content", "center");
}
