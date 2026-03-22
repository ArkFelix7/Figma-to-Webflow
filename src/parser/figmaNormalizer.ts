// Normalize raw Figma JSON into a clean intermediate format
// Extracts all properties needed for Lumos conversion

export interface NormalizedNode {
  id: string;
  name: string;
  type: string;       // lowercase figma type
  children: NormalizedNode[];
  visible: boolean;
  // Layout
  layoutMode: "NONE" | "HORIZONTAL" | "VERTICAL";
  itemSpacing: number;
  padding: { top: number; bottom: number; left: number; right: number };
  width: number;
  height: number;
  x: number;
  y: number;
  // Sizing
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  layoutGrow?: number;
  layoutAlign?: string;
  // Typography
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  lineHeightPx?: number;
  letterSpacing?: number;
  textContent?: string;    // actual characters in TEXT nodes
  textCase?: string;
  // Colors
  fillColor?: { r: number; g: number; b: number; a: number };
  hasImageFill: boolean;
  // Borders & effects
  cornerRadius: number;
  strokeWeight: number;
  opacity: number;
  clipsContent: boolean;
  // Component info
  componentId?: string;
}

export function normalizeFigmaTree(raw: any): NormalizedNode {
  return normalizeNode(raw);
}

function normalizeNode(node: any): NormalizedNode {
  // Extract solid fill color
  let fillColor: { r: number; g: number; b: number; a: number } | undefined;
  let hasImageFill = false;
  if (Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.visible === false) continue;
      if (fill.type === "IMAGE") {
        hasImageFill = true;
      }
      if (fill.type === "SOLID" && fill.color) {
        fillColor = {
          r: fill.color.r ?? 0,
          g: fill.color.g ?? 0,
          b: fill.color.b ?? 0,
          a: fill.opacity ?? fill.color.a ?? 1,
        };
      }
    }
  }

  const box = node.absoluteBoundingBox ?? {};
  const style = node.style ?? {};

  const result: NormalizedNode = {
    id: node.id ?? "",
    name: (node.name ?? "").trim(),
    type: (node.type ?? "UNKNOWN").toLowerCase(),
    children: [],
    visible: node.visible !== false,
    // Layout
    layoutMode: node.layoutMode ?? "NONE",
    itemSpacing: node.itemSpacing ?? 0,
    padding: {
      top: node.paddingTop ?? 0,
      bottom: node.paddingBottom ?? 0,
      left: node.paddingLeft ?? 0,
      right: node.paddingRight ?? 0,
    },
    width: box.width ?? 0,
    height: box.height ?? 0,
    x: box.x ?? 0,
    y: box.y ?? 0,
    // Sizing
    primaryAxisSizingMode: node.primaryAxisSizingMode,
    counterAxisSizingMode: node.counterAxisSizingMode,
    layoutGrow: node.layoutGrow,
    layoutAlign: node.layoutAlign,
    // Typography
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    lineHeightPx: style.lineHeightPx,
    letterSpacing: style.letterSpacing,
    textContent: node.characters,
    textCase: style.textCase,
    // Colors
    fillColor,
    hasImageFill,
    // Borders & effects
    cornerRadius: node.cornerRadius ?? 0,
    strokeWeight: node.strokeWeight ?? 0,
    opacity: node.opacity ?? 1,
    clipsContent: node.clipsContent ?? false,
    // Component
    componentId: node.componentId,
  };

  if (Array.isArray(node.children)) {
    result.children = node.children.map(normalizeNode);
  }

  // Infer layout mode for GROUP nodes from child positions
  if (result.layoutMode === "NONE" && result.children.length >= 2) {
    result.layoutMode = inferLayoutFromPositions(result.children);
    if (result.layoutMode === "HORIZONTAL" && result.children.length >= 2) {
      // Estimate item spacing from gaps between children
      const sorted = [...result.children].sort((a, b) => a.x - b.x);
      const gaps: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width);
        if (gap > 0) gaps.push(gap);
      }
      if (gaps.length > 0) {
        result.itemSpacing = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      }
    }
  }

  return result;
}

/**
 * Infer HORIZONTAL or VERTICAL layout from absolute positions of children.
 * If children overlap significantly in Y but spread in X → HORIZONTAL
 * If children stack vertically → VERTICAL
 */
function inferLayoutFromPositions(children: NormalizedNode[]): "NONE" | "HORIZONTAL" | "VERTICAL" {
  const visible = children.filter(c => c.visible && c.width > 0 && c.height > 0);
  if (visible.length < 2) return "NONE";

  // Check if children are arranged side-by-side (horizontal)
  const sorted = [...visible].sort((a, b) => a.x - b.x);

  // For horizontal: children should have similar Y positions and spread in X
  const yPositions = visible.map(c => c.y);
  const yMin = Math.min(...yPositions);
  const yMax = Math.max(...yPositions);
  const yRange = yMax - yMin;
  const avgHeight = visible.reduce((s, c) => s + c.height, 0) / visible.length;

  // If Y range is small relative to average height, children are on same row
  if (yRange < avgHeight * 0.5 && visible.length >= 2) {
    // Check that children don't overlap much in X
    let overlaps = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].x < sorted[i - 1].x + sorted[i - 1].width * 0.5) overlaps++;
    }
    if (overlaps === 0) return "HORIZONTAL";
  }

  return "NONE"; // Keep as NONE for stacked/mixed layouts — default flex-direction: column
}

/**
 * Traverse the document tree to find the main page frame(s).
 * Figma structure: DOCUMENT > CANVAS > FRAME (page)
 * We want the children of the top-level FRAME.
 */
export function findPageSections(root: NormalizedNode): NormalizedNode[] {
  // Walk: document > canvas > frame
  if (root.type === "document") {
    for (const canvas of root.children) {
      if (canvas.type === "canvas") {
        // Find the first FRAME child (the page)
        for (const frame of canvas.children) {
          if (frame.type === "frame" || frame.type === "component" || frame.type === "instance") {
            return frame.children;
          }
        }
        // If no frame, return canvas children directly
        return canvas.children;
      }
    }
    // If no canvas, return document children
    return root.children;
  }
  return root.children;
}
