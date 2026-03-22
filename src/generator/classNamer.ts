// Class Namer: generates Lumos-compliant class names for every node
// Rules: [section]_[element], max 3 underscores, _wrap for component roots

import { LumosNode, LumosSection, NodeRole } from "../types.js";
import { pxToTextStyle } from "../lumos/constants.js";

const ROLE_TO_ELEMENT: Record<NodeRole, string> = {
  "section-wrap": "wrap",
  "container": "contain",
  "layout": "layout",
  "content-wrap": "content",
  "title": "title",
  "subtitle": "subtitle",
  "eyebrow": "eyebrow",
  "text": "text",
  "button-primary": "button",
  "button-secondary": "button_secondary",
  "button-wrapper": "actions",
  "image": "img",
  "icon": "icon",
  "card-wrap": "card_wrap",
  "card": "card",
  "nav": "nav",
  "footer": "footer",
  "visual": "visual",
  "decorative": "deco",
  "link": "link",
  "divider": "divider",
  "list": "list",
  "list-item": "item_wrap",
  "form": "form",
  "input": "input",
  "logo": "logo",
  "generic": "block",
};

export function assignClassNames(sections: LumosSection[]): void {
  for (const section of sections) {
    const prefix = section.sectionName;
    const usedNames = new Set<string>();

    for (const child of section.children) {
      assignNodeClasses(child, prefix, usedNames);
    }
  }
}

function assignNodeClasses(node: LumosNode, prefix: string, usedNames: Set<string>): void {
  const elementName = ROLE_TO_ELEMENT[node.role] || "block";

  // Build class name
  let className: string;

  // Special handling for specific roles
  if (node.role === "section-wrap") {
    className = `${prefix}_wrap`;
  } else if (node.role === "container") {
    className = `${prefix}_contain`;
  } else if (node.role === "layout") {
    className = `${prefix}_layout`;
  } else {
    className = `${prefix}_${elementName}`;
  }

  // Ensure max 3 underscores
  const parts = className.split("_");
  if (parts.length > 4) {
    // Truncate to last 4 parts
    className = parts.slice(parts.length - 4).join("_");
  }

  // Resolve collisions by appending a number
  let finalName = className;
  if (usedNames.has(className)) {
    let counter = 2;
    while (usedNames.has(`${className}_${counter}`) || (className.split("_").length >= 3 && usedNames.has(`${className}${counter}`))) {
      counter++;
    }
    // If adding _N would exceed max underscores, just append number
    if (className.split("_").length >= 4) {
      finalName = `${className}${counter}`;
    } else {
      finalName = `${className}_${counter}`;
    }
  }
  usedNames.add(finalName);
  node.componentClass = finalName;

  // Assign utility classes based on role/properties
  assignUtilityClasses(node);

  // Recurse into children
  // For card children, use the card prefix
  let childPrefix = prefix;
  if (node.role === "card-wrap") {
    childPrefix = finalName.replace(/_wrap$/, "");
  }

  for (const child of node.children) {
    assignNodeClasses(child, childPrefix, usedNames);
  }
}

function assignUtilityClasses(node: LumosNode): void {
  const utils: string[] = [];

  // Typography utilities for text nodes
  if (node.fontSize && (node.role === "title" || node.role === "subtitle" || node.role === "text" || node.role === "eyebrow")) {
    const mapping = pxToTextStyle(node.fontSize);
    if (mapping.utility) {
      utils.push(mapping.utility);
    }
  }

  // Content wrappers get margin-trim
  if (node.role === "content-wrap") {
    utils.push("u-margin-trim");
  }

  // Button wrappers (parent of buttons)
  if (node.children.some(c => c.role === "button-primary" || c.role === "button-secondary")) {
    utils.push("u-button-wrapper");
    node.role = "button-wrapper";
  }

  node.utilityClasses = utils;
}
