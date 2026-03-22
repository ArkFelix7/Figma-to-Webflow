import { FigmaNode } from "../schemas/figma.js";
import { getLumosPaddingClass, getLumosGapClass, getLumosTypographyClass, getLumosLayoutClass, getLumosFontWeightClass } from './lumosMapper.js';

function colorToName(r: number, g: number, b: number): string {
  const colors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [128, 128, 128],
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0],
    purple: [128, 0, 128],
    orange: [255, 165, 0],
  };
  let closest = 'unknown';
  let minDist = Infinity;
  for (const [name, [cr, cg, cb]] of Object.entries(colors)) {
    const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = name;
    }
  }
  return closest;
}

export function normalizeFigmaNode(node: FigmaNode): any {
  let backgroundColor: string | undefined;
  if (node.fills && Array.isArray(node.fills)) {
    const solidFill = node.fills.find((f: any) => f.type === 'SOLID' && f.visible !== false);
    if (solidFill && solidFill.color) {
      const { r, g, b } = solidFill.color;
      backgroundColor = colorToName(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }
  }

  const normalized = {
    id: node.id,
    name: node.name.trim(),
    type: (node.type || "UNKNOWN").toLowerCase(),
    layout: {
      mode: node.layoutMode ?? "NONE",
      itemSpacing: node.itemSpacing ?? 0,
      padding: {
        top: node.paddingTop ?? 0,
        bottom: node.paddingBottom ?? 0,
        left: node.paddingLeft ?? 0,
        right: node.paddingRight ?? 0,
      },
      box: node.absoluteBoundingBox ?? null,
    },
    visible: node.visible ?? true,
    componentId: node.componentId,
    style: node.style ?? {},
    backgroundColor,
    children: [] as any[],
  };

  if (Array.isArray(node.children)) {
    normalized.children = node.children.map(normalizeFigmaNode);
  }

  return normalized;
}

export function flattenNodes(node: any, collector: any[] = []): any[] {
  collector.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) flattenNodes(child, collector);
  }
  return collector;
}

export function semanticName(node: any): string {
  const base = node.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  if (!base) return `auto_${node.id.slice(0, 6)}`;

  const sectionHeuristics: string[] = ["hero", "header", "footer", "section", "main", "content", "layout"];
  const isSection = sectionHeuristics.some(key => base.includes(key));

  if (isSection) {
    const semantic = sectionHeuristics.find(key => base.includes(key)) || "section";
    return `section_${semantic}`;
  }

  // For non-sections, rely on Lumos utilities, no custom class
  return "";
}

export interface LumosNodeReport {
  nodeId: string;
  semanticName: string;
  classes: string[];
  warnings: string[];
}

const lumosTransformReport: LumosNodeReport[] = [];

export function resetLumosTransformReport() {
  lumosTransformReport.length = 0;
}

export function getLumosTransformReport() {
  return [...lumosTransformReport];
}

export function normalizeToLumos(node: any): any {
  const customClass = semanticName(node);
  const utilityClasses: string[] = [];
  const warnings: string[] = [];

  // For sections, add background color class
  if (customClass.startsWith("section_") && node.backgroundColor) {
    utilityClasses.push(`u-background-color-${node.backgroundColor}`);
  }

  // Add Lumos utility classes based on properties
  if (node.layout?.padding) {
    utilityClasses.push(...getLumosPaddingClass(node.layout.padding));
  }

  if (node.layout?.itemSpacing != null) {
    const gapMap = getLumosGapClass(node.layout.itemSpacing);
    // For flex containers, gap is represented by u-flex-inline-# or u-flex-block-#.
    // For non-flex containers, keep u-gap-# as utility fallback.
    if (!node.layout?.mode || (node.layout.mode !== 'HORIZONTAL' && node.layout.mode !== 'VERTICAL')) {
      if (gapMap.className) utilityClasses.push(gapMap.className);
    }
    if (gapMap.warning) warnings.push(gapMap.warning);
  }

  const typographyMap = getLumosTypographyClass(node);
  if (typographyMap.className) utilityClasses.push(typographyMap.className);
  if (typographyMap.warning) warnings.push(typographyMap.warning);

  const weightClass = getLumosFontWeightClass(node.style?.fontWeight);
  if (weightClass) utilityClasses.push(weightClass);

  const layoutMap = getLumosLayoutClass(node);
  utilityClasses.push(...layoutMap);

  // Combine custom class with utility classes
  const allClasses = customClass ? [customClass, ...utilityClasses] : utilityClasses;

  const lumosNode: any = {
    id: node.id,
    semanticName: customClass || "element",
    type: node.type,
    classes: allClasses,
    style: {
      layout: node.layout,
      typography: node.style,
    },
    content: node.type === "text" ? node.name : undefined,
    children: [] as any[],
  };

  if (Array.isArray(node.children)) {
    lumosNode.children = node.children.map(normalizeToLumos);
  }

  lumosTransformReport.push({
    nodeId: node.id,
    semanticName: customClass || "element",
    classes: allClasses,
    warnings,
  });

  return lumosNode;
}

export function tokenizedStyle(node: any): any[] {
  const tokens: any[] = [];

  const gapMap = node.layout?.itemSpacing != null ? getLumosGapClass(node.layout.itemSpacing) : null;
  if (node.layout?.itemSpacing != null && gapMap && !gapMap.matched) {
    tokens.push({ token: `gap_${node.layout.itemSpacing}`, value: node.layout.itemSpacing, category: "spacing" });
  }

  const typographyMap = node.style?.fontSize != null ? getLumosTypographyClass(node) : null;
  if (node.style?.fontSize != null && typographyMap && !typographyMap.matched) {
    tokens.push({ token: `font_size_${node.style.fontSize}`, value: node.style.fontSize, category: "typography" });
  }

  if (node.style?.fontWeight != null) {
    const weightClass = getLumosFontWeightClass(node.style.fontWeight);
    if (!weightClass) {
      tokens.push({ token: `font_weight_${node.style.fontWeight}`, value: node.style.fontWeight, category: "typography" });
    }
  }

  return tokens;
}
