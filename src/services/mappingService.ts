import path from "path";
import { FigmaDocument } from "../schemas/figma.js";
import { LumosOutput, LumosOutputSchema } from "../schemas/lumos.js";
import { loadFigmaFile } from "./figmaService.js";
import { normalizeFigmaNode, flattenNodes, normalizeToLumos, tokenizedStyle, resetLumosTransformReport, getLumosTransformReport } from "../utils/normalizer.js";
import { detectReusableComponents } from "../utils/similarity.js";

export function convertFigmaToLumos(fd: FigmaDocument, projectName = "figma-to-lumos"): LumosOutput {
  resetLumosTransformReport();

  const normalized = normalizeFigmaNode(fd.document);
  const flat = flattenNodes(normalized);
  const componentGroups = detectReusableComponents(flat);

  const lumosPageTree = normalizeToLumos(normalized);
  const componentOutputs = componentGroups.map((g) => ({
    id: `cmp_${g.baseName}_${g.members.length}`,
    name: g.baseName,
    variants: Array.from(g.variantKeys),
    root: normalizeToLumos(g.members[0]),
  }));

  const tokenSet = new Map<string, any>();
  flat.forEach((node) => {
    tokenizedStyle(node).forEach((token) => tokenSet.set(token.token, token));
  });

  const output = {
    projectName,
    tokens: Array.from(tokenSet.values()),
    components: componentOutputs,
    pageTree: lumosPageTree,
    metadata: { generatedAt: new Date().toISOString(), source: "figma-api" },
    report: getLumosTransformReport(),
  };

  return LumosOutputSchema.parse(output);
}

function lumosElementToHtml(node: any): string {
  const classes = Array.isArray(node.classes) ? node.classes.filter((c: string) => c.trim()).join(" ") : "";
  const styleAttrs = [];

  // Only add inline styles for properties not covered by Lumos utilities
  if (node.style?.layout?.box) {
    const { width } = node.style.layout.box;
    if (width != null && !classes.includes('u-container-')) {
      styleAttrs.push(`width: ${width}px`);
    }
    // Removed height inline style as requested
  }

  // Typography styles that aren't covered by u-text-style utilities
  if (node.style?.typography) {
    const { fontFamily, letterSpacing, lineHeightPx } = node.style.typography;
    if (fontFamily && !classes.includes('u-text-style-')) {
      styleAttrs.push(`font-family: ${fontFamily}`);
    }
    if (letterSpacing != null && !classes.includes('u-text-style-')) {
      styleAttrs.push(`letter-spacing: ${letterSpacing}px`);
    }
    if (lineHeightPx != null && !classes.includes('u-text-style-')) {
      styleAttrs.push(`line-height: ${lineHeightPx}px`);
    }
  }

  const style = styleAttrs.length ? ` style="${styleAttrs.join(";")}"` : "";
  const content = node.content ? `${node.content}` : "";

  const childrenHtml = Array.isArray(node.children) ? node.children.map(lumosElementToHtml).join("") : "";

  // If no content and no children, skip this node
  if (!content && !childrenHtml) {
    return "";
  }

  const classAttr = classes ? ` class="${classes}"` : "";
  return `<div${classAttr}${style}>${content}${childrenHtml}</div>`;
}

export function lumosOutputToHtml(output: LumosOutput): string {
  return lumosElementToHtml(output.pageTree);
}

export async function runConversionFromFile(filePath: string) {
  const figmaDoc = loadFigmaFile(filePath);
  const result = convertFigmaToLumos(figmaDoc, path.basename(filePath, path.extname(filePath)));
  return result;
}
