// HTML Generator: produces semantic HTML following Lumos section structure
// RULES:
// - No inline style=""
// - Every element has a component class first, then utilities
// - section > u-container > _layout structure
// - Proper semantic tags

import { LumosNode, LumosSection } from "../types.js";
import { UTILITY_CLASSES, THEME_CLASSES } from "../lumos/constants.js";

export function generateHTML(sections: LumosSection[], css: string): string {
  const parts: string[] = [];

  // Style block
  if (css.trim()) {
    parts.push("<style>");
    parts.push(css.trim());
    parts.push("</style>");
    parts.push("");
  }

  // Each section
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    parts.push(renderSection(section, i === 0));
    parts.push("");
  }

  return parts.join("\n");
}

function renderSection(section: LumosSection, isFirstSection: boolean): string {
  const sectionName = section.sectionName;
  const themeClass = THEME_CLASSES[section.theme] || "";

  // Build section wrapper classes
  const sectionClasses = [`${sectionName}_wrap`, UTILITY_CLASSES.section];
  if (themeClass) sectionClasses.push(themeClass);

  const containerClass = `${sectionName}_contain ${UTILITY_CLASSES.container}`;

  // Determine the section tag
  let sectionTag = "section";
  // Check section name for nav/footer
  const nameLower = sectionName.toLowerCase();
  if (nameLower === "nav" || nameLower === "navbar" || nameLower === "navigation") sectionTag = "nav";
  if (nameLower === "footer") sectionTag = "footer";
  // Override from child roles
  if (section.children.length === 1) {
    const onlyChild = section.children[0];
    if (onlyChild.role === "nav") sectionTag = "nav";
    if (onlyChild.role === "footer") sectionTag = "footer";
  }
  for (const child of section.children) {
    if (child.role === "footer") sectionTag = "footer";
    if (child.role === "nav") sectionTag = "nav";
  }

  const lines: string[] = [];
  lines.push(`<${sectionTag} class="${sectionClasses.join(" ")}">`);
  lines.push(`  <div class="${containerClass}">`);
  lines.push(`    <div class="${sectionName}_layout">`);

  // Render children
  for (const child of section.children) {
    const childHtml = renderNode(child, 3);
    if (childHtml) lines.push(childHtml);
  }

  lines.push("    </div>");
  lines.push("  </div>");
  lines.push(`</${sectionTag}>`);

  return lines.join("\n");
}

function renderNode(node: LumosNode, indentLevel: number): string {
  const indent = "  ".repeat(indentLevel);

  // Skip invisible nodes
  if (node.visible === false) return "";

  // Skip decorative background elements that have no content
  if (node.role === "decorative" && node.children.length === 0 && !node.content) {
    return "";
  }

  // Build class string: component class first, then utilities, then combo
  const classes: string[] = [];
  if (node.componentClass) classes.push(node.componentClass);
  if (node.utilityClasses.length) classes.push(...node.utilityClasses);
  if (node.comboClasses.length) classes.push(...node.comboClasses);
  const classStr = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";

  // Build attributes string
  let attrStr = "";
  for (const [key, val] of Object.entries(node.attributes)) {
    attrStr += ` ${key}="${escapeHtml(val)}"`;
  }

  const tag = node.tag;

  // Self-closing tags
  if (tag === "img") {
    return `${indent}<img${classStr}${attrStr}>`;
  }

  // For text nodes, render inline content
  if (node.content && node.children.length === 0) {
    return `${indent}<${tag}${classStr}${attrStr}>${escapeHtml(node.content)}</${tag}>`;
  }

  // Buttons with text children
  if ((node.role === "button-primary" || node.role === "button-secondary") && node.children.length > 0) {
    // Extract button text from text children
    const buttonText = extractTextContent(node);
    return `${indent}<${tag}${classStr}${attrStr}>${escapeHtml(buttonText)}</${tag}>`;
  }

  // Container nodes
  if (node.children.length === 0 && !node.content) {
    // Empty div (decorative) — only render if it has a meaningful role
    if (node.role === "divider") {
      return `${indent}<${tag}${classStr}${attrStr}></${tag}>`;
    }
    return ""; // Skip truly empty nodes
  }

  const lines: string[] = [];
  lines.push(`${indent}<${tag}${classStr}${attrStr}>`);

  if (node.content) {
    lines.push(`${indent}  ${escapeHtml(node.content)}`);
  }

  for (const child of node.children) {
    const childHtml = renderNode(child, indentLevel + 1);
    if (childHtml) lines.push(childHtml);
  }

  lines.push(`${indent}</${tag}>`);

  return lines.join("\n");
}

function extractTextContent(node: LumosNode): string {
  if (node.content) return node.content;
  for (const child of node.children) {
    if (child.content) return child.content;
    const nested = extractTextContent(child);
    if (nested) return nested;
  }
  return node.figmaName || "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
