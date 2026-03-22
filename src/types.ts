// Types for the Lumos intermediate representation

export type NodeRole =
  | "section-wrap"
  | "container"
  | "layout"
  | "content-wrap"
  | "title"
  | "subtitle"
  | "eyebrow"
  | "text"
  | "button-primary"
  | "button-secondary"
  | "button-wrapper"
  | "image"
  | "icon"
  | "card-wrap"
  | "card"
  | "nav"
  | "footer"
  | "visual"
  | "decorative"
  | "link"
  | "divider"
  | "list"
  | "list-item"
  | "form"
  | "input"
  | "logo"
  | "generic";

export interface CSSRule {
  property: string;
  value: string;
}

export interface LumosNode {
  id: string;
  figmaName: string;
  componentClass: string;
  utilityClasses: string[];
  comboClasses: string[];
  tag: string;
  content?: string;
  attributes: Record<string, string>;
  cssRules: CSSRule[];
  children: LumosNode[];
  role: NodeRole;
  // Layout metadata (used by generators)
  figmaWidth?: number;
  figmaHeight?: number;
  layoutMode?: string;
  itemSpacing?: number;
  padding?: { top: number; bottom: number; left: number; right: number };
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textContent?: string;
  fillColor?: { r: number; g: number; b: number; a: number };
  cornerRadius?: number;
  opacity?: number;
  visible?: boolean;
}

export interface LumosSection {
  sectionName: string;
  theme: "light" | "dark" | "brand";
  children: LumosNode[];
}

export interface TransformWarning {
  nodeId: string;
  message: string;
}

export interface LumosIR {
  projectName: string;
  sections: LumosSection[];
  warnings: TransformWarning[];
}
