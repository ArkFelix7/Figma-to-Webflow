// Pipeline: orchestrates the full Figma → Lumos HTML+CSS conversion

import fs from "fs";
import path from "path";
import { normalizeFigmaTree, findPageSections } from "./parser/figmaNormalizer.js";
import { analyzePageSections } from "./analyzer/semanticAnalyzer.js";
import { assignClassNames } from "./generator/classNamer.js";
import { generateCSS } from "./generator/cssGenerator.js";
import { generateHTML } from "./generator/htmlGenerator.js";
import { pxToTextStyle } from "./lumos/constants.js";
import { LumosNode, LumosSection } from "./types.js";

export interface ConversionResult {
  html: string;
  css: string;
  sections: LumosSection[];
  warnings: string[];
}

export function convertFigmaJsonToWebflow(figmaJson: any): ConversionResult {
  const warnings: string[] = [];

  // Step 1: Normalize Figma JSON → clean tree
  const normalized = normalizeFigmaTree(figmaJson.document || figmaJson);

  // Step 2: Find top-level page sections
  const pageSections = findPageSections(normalized);

  if (pageSections.length === 0) {
    warnings.push("No page sections found in the Figma document");
    return { html: "<!-- No content found -->", css: "", sections: [], warnings };
  }

  // Step 3: Semantic analysis → LumosSections with roles
  const sections = analyzePageSections(pageSections);

  // Step 4: Assign Lumos-compliant class names
  assignClassNames(sections);

  // Step 5: Post-process — assign typography utilities
  for (const section of sections) {
    for (const child of section.children) {
      postProcessNode(child);
    }
  }

  // Step 6: Generate CSS
  const css = generateCSS(sections);

  // Step 7: Generate HTML
  const html = generateHTML(sections, css);

  // Step 8: Validate output
  const validationWarnings = validateOutput(html, css);
  warnings.push(...validationWarnings);

  return { html, css, sections, warnings };
}

export function convertFromFile(filePath: string): ConversionResult {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const text = fs.readFileSync(absolute, "utf-8");
  const json = JSON.parse(text);
  return convertFigmaJsonToWebflow(json);
}

/**
 * Post-process pass: apply typography utilities, fix roles, etc.
 */
function postProcessNode(node: LumosNode): void {
  // Typography utilities for text elements
  if (node.fontSize && (node.role === "title" || node.role === "subtitle" || node.role === "text" || node.role === "eyebrow")) {
    const mapping = pxToTextStyle(node.fontSize);
    if (mapping.utility && !node.utilityClasses.includes(mapping.utility)) {
      node.utilityClasses.push(mapping.utility);
    }
  }

  // Content wrappers need u-margin-trim
  if (node.role === "content-wrap" && !node.utilityClasses.includes("u-margin-trim")) {
    node.utilityClasses.push("u-margin-trim");
  }

  // Button wrapper detection: any node whose children include buttons
  if (node.children.some(c => c.role === "button-primary" || c.role === "button-secondary")) {
    if (!node.utilityClasses.includes("u-button-wrapper")) {
      node.utilityClasses.push("u-button-wrapper");
    }
  }

  for (const child of node.children) {
    postProcessNode(child);
  }
}

/**
 * Validate the generated output against Lumos anti-patterns.
 */
function validateOutput(html: string, css: string): string[] {
  const warnings: string[] = [];
  const combined = html + "\n" + css;

  // Check for inline styles
  if (/style="/.test(html)) {
    warnings.push("Anti-pattern: inline style=\"\" detected in HTML");
  }

  // Check for @media queries
  if (/@media/.test(css)) {
    warnings.push("Anti-pattern: @media query detected in CSS");
  }

  // Check for px values in CSS (excluding 0px)
  if (/[^0]\dpx|[^0]px/.test(css) && !/0px/.test(css)) {
    // More precise check
    const pxMatches = css.match(/\b\d+px\b/g);
    if (pxMatches) {
      const nonZero = pxMatches.filter(m => m !== "0px");
      if (nonZero.length > 0) {
        warnings.push(`Anti-pattern: px values in CSS: ${nonZero.slice(0, 3).join(", ")}`);
      }
    }
  }

  // Check for bare 1fr
  if (/(?<!minmax\([^)]*)\b1fr\b/.test(css) && !/minmax\(0,\s*1fr\)/.test(css)) {
    // Simpler check: if 1fr exists but not within minmax(0, 1fr)
    if (css.includes("1fr") && !css.includes("minmax(0, 1fr)")) {
      warnings.push("Anti-pattern: bare 1fr without minmax(0, 1fr)");
    }
  }

  // Check for overflow: hidden
  if (/overflow:\s*hidden/.test(css)) {
    warnings.push("Anti-pattern: overflow: hidden (should be overflow: clip)");
  }

  // Check for background shorthand
  if (/(?<!-)background:/.test(css)) {
    warnings.push("Anti-pattern: background shorthand (should be background-color)");
  }

  return warnings;
}
