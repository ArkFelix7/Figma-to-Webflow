// Semantic Analyzer: assigns roles to normalized Figma nodes

import { NormalizedNode } from "../parser/figmaNormalizer.js";
import { LumosNode, LumosSection, NodeRole } from "../types.js";
import {
  SECTION_KEYWORDS, BUTTON_KEYWORDS, DIVIDER_KEYWORDS,
  NAV_KEYWORDS, FOOTER_KEYWORDS, LOGO_KEYWORDS,
  detectTheme, pxToTextStyle,
} from "../lumos/constants.js";

/**
 * Converts the flat list of top-level Figma page children into LumosSections,
 * each with its content tree analyzed for semantic roles.
 */
export function analyzePageSections(pageChildren: NormalizedNode[]): LumosSection[] {
  const sections: LumosSection[] = [];
  const usedNames = new Map<string, number>();

  // Figma lists children bottom-to-top in the layer panel, but visually top-to-bottom.
  // The JSON `children` array order is visual (top child first in Figma canvas = first in array)
  // However many Figma files have footer at index 0 (bottom of layer panel = top of array).
  // Reverse so the page reads top-down (nav/hero first, footer last).
  const ordered = [...pageChildren].reverse();

  for (const child of ordered) {
    if (!child.visible) continue;

    let baseName = deriveSectionName(child);
    // Deduplicate section names
    const count = usedNames.get(baseName) || 0;
    usedNames.set(baseName, count + 1);
    const sectionName = count > 0 ? `${baseName}_${count + 1}` : baseName;

    const theme = detectSectionTheme(child);
    const analyzed = analyzeNode(child, sectionName, 0);

    sections.push({
      sectionName,
      theme,
      children: analyzed.children.length > 0 ? analyzed.children : [analyzed],
    });
  }

  return sections;
}

function deriveSectionName(node: NormalizedNode): string {
  const nameLower = node.name.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();

  // Check for known section keywords
  for (const kw of SECTION_KEYWORDS) {
    if (nameLower.includes(kw)) {
      // Use just the keyword as simplified section name
      return kw.replace(/[^a-z]/g, "");
    }
  }

  // Fallback: sanitize the figma name
  const sanitized = nameLower.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return sanitized || "section";
}

function detectSectionTheme(node: NormalizedNode): "light" | "dark" | "brand" {
  // Check the node's own background
  if (node.fillColor) {
    return detectTheme(node.fillColor.r, node.fillColor.g, node.fillColor.b);
  }
  // Check first-level children for background rectangles
  for (const child of node.children) {
    if (isBackgroundRect(child, node) && child.fillColor) {
      return detectTheme(child.fillColor.r, child.fillColor.g, child.fillColor.b);
    }
  }
  // Check second-level children (some Figma structures nest bg rects deeper)
  for (const child of node.children) {
    for (const grandchild of child.children) {
      if (isBackgroundRect(grandchild, child) && grandchild.fillColor) {
        return detectTheme(grandchild.fillColor.r, grandchild.fillColor.g, grandchild.fillColor.b);
      }
    }
  }
  return "light";
}

function isBackgroundRect(child: NormalizedNode, parent: NormalizedNode): boolean {
  if (child.type !== "rectangle") return false;
  // A background rect is roughly the same size as its parent
  const widthRatio = child.width / Math.max(parent.width, 1);
  const heightRatio = child.height / Math.max(parent.height, 1);
  // Width should match closely, height can be looser (partial backgrounds are common)
  return widthRatio > 0.9 && heightRatio > 0.6;
}

function analyzeNode(node: NormalizedNode, sectionPrefix: string, depth: number): LumosNode {
  const role = detectRole(node, depth);
  const tag = roleToTag(role, node);

  const result: LumosNode = {
    id: node.id,
    figmaName: node.name,
    componentClass: "", // will be assigned by classNamer
    utilityClasses: [],
    comboClasses: [],
    tag,
    attributes: {},
    cssRules: [],
    children: [],
    role,
    // Carry forward metadata
    figmaWidth: node.width,
    figmaHeight: node.height,
    layoutMode: node.layoutMode,
    itemSpacing: node.itemSpacing,
    padding: node.padding,
    fontSize: node.fontSize,
    fontWeight: node.fontWeight,
    fontFamily: node.fontFamily,
    textContent: node.textContent,
    fillColor: node.fillColor,
    cornerRadius: node.cornerRadius,
    opacity: node.opacity,
    visible: node.visible,
  };

  // Text content
  if (node.type === "text") {
    result.content = node.textContent || node.name;
  }

  // Image attributes
  if (role === "image") {
    result.attributes["src"] = "https://placehold.co/600x400";
    result.attributes["alt"] = node.name || "Image";
    result.attributes["loading"] = "lazy";
  }

  // Button attributes
  if (role === "button-primary" || role === "button-secondary") {
    result.attributes["data-trigger"] = "hover focus";
  }

  // Decorative / icons
  if (role === "icon" || role === "decorative") {
    result.attributes["aria-hidden"] = "true";
  }

  // Recursively analyze children, skipping background rects and invisible nodes
  const parentNode = node;
  for (const child of node.children) {
    if (!child.visible) continue;
    if (isBackgroundRect(child, parentNode) && child.type === "rectangle") continue;
    // Skip mask nodes
    if ((child as any).isMask) continue;

    const analyzed = analyzeNode(child, sectionPrefix, depth + 1);
    result.children.push(analyzed);
  }

  return result;
}

function detectRole(node: NormalizedNode, depth: number): NodeRole {
  const nameLower = node.name.toLowerCase();
  const type = node.type;

  // Navigation — only at section level (depth 0)
  if (NAV_KEYWORDS.some(kw => nameLower.includes(kw)) && depth === 0) return "nav";

  // Footer — only at section level (depth 0)
  if (FOOTER_KEYWORDS.some(kw => nameLower === kw || nameLower.startsWith(kw)) && depth === 0) return "footer";

  // Logo
  if (LOGO_KEYWORDS.some(kw => nameLower.includes(kw))) return "logo";

  // Dividers and lines
  if (type === "line") return "divider";
  if (DIVIDER_KEYWORDS.some(kw => nameLower.includes(kw))) return "divider";
  if (type === "rectangle" && (node.height <= 3 || node.width <= 3)) return "divider";

  // Text nodes
  if (type === "text") {
    const fs = node.fontSize ?? 16;
    // Check for potential eyebrow (small text, uppercase, or short text before bigger text)
    if (node.textCase === "UPPER" || (fs <= 14 && (node.textContent?.length ?? 0) < 50)) {
      return "eyebrow";
    }
    if (fs >= 28) return "title";
    if (fs >= 20) return "subtitle";
    return "text";
  }

  // Buttons
  if (BUTTON_KEYWORDS.some(kw => nameLower.includes(kw))) {
    // Check for secondary indicators
    if (nameLower.includes("secondary") || nameLower.includes("outline")) {
      return "button-secondary";
    }
    // If it's a frame/instance with text children, it's a button
    if (node.children.some(c => c.type === "text")) {
      return "button-primary";
    }
  }

  // Ellipses as potential avatars / decorative
  if (type === "ellipse") {
    if (node.width < 100 && node.height < 100) return "image"; // avatar
    return "decorative";
  }

  // Rectangles with image fills
  if (node.hasImageFill) return "image";

  // Vectors / boolean operations → icons
  if (type === "vector" || type === "boolean_operation") return "icon";

  // Frames/groups with "item" or "card" in name → card
  if (nameLower.includes("card") || nameLower.includes("item")) {
    if (node.children.length > 0) return "card-wrap";
  }

  // Forms
  if (nameLower.includes("form")) return "form";
  if (nameLower.includes("input") || nameLower.includes("field")) return "input";

  // Containers that hold content (depth > 0 with text children)
  if (node.children.length > 0) {
    const hasTextChild = node.children.some(c => c.type === "text");
    const hasMultipleText = node.children.filter(c => c.type === "text").length >= 2;
    if (hasMultipleText) return "content-wrap";
  }

  return "generic";
}

function roleToTag(role: NodeRole, node: NormalizedNode): string {
  switch (role) {
    case "section-wrap": return "section";
    case "nav": return "nav";
    case "footer": return "footer";
    case "title": {
      const mapping = pxToTextStyle(node.fontSize ?? 32);
      return mapping.tag;
    }
    case "subtitle": {
      const mapping = pxToTextStyle(node.fontSize ?? 20);
      return mapping.tag;
    }
    case "eyebrow":
    case "text":
      return "p";
    case "button-primary":
    case "button-secondary":
    case "link":
      return "a";
    case "image":
      return node.type === "ellipse" || node.hasImageFill ? "img" : "img";
    default:
      return "div";
  }
}
