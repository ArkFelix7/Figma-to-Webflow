export const COSINE_SIMILARITY_THRESHOLD = 0.85;

export function featureVector(node: any): number[] {
  const typeHash = typeof node.type === "string" && node.type.length ? node.type.charCodeAt(0) : 0;
  const childrenCount = (node.children?.length || 0);
  const spacing = node.layout?.itemSpacing || 0;
  const paddingSum = (node.layout?.padding?.top || 0) + (node.layout?.padding?.bottom || 0) + (node.layout?.padding?.left || 0) + (node.layout?.padding?.right || 0);
  const textWeight = node.style?.fontWeight || 0;

  return [typeHash, childrenCount, spacing, paddingSum, textWeight];
}

export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, v, i) => sum + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));

  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export interface ComponentGroup {
  baseName: string;
  members: any[];
  variantKeys: Set<string>;
}

export function detectReusableComponents(nodes: any[]): ComponentGroup[] {
  const groups: ComponentGroup[] = [];

  for (const node of nodes) {
    if (node.type === "text" || !node.visible) continue;

    const vec = featureVector(node);
    let group = groups.find((g) => {
      const rootVec = featureVector(g.members[0]);
      return cosineSimilarity(vec, rootVec) >= COSINE_SIMILARITY_THRESHOLD;
    });

    if (!group) {
      group = { baseName: node.name.toLowerCase().replace(/\s+/g, "_"), members: [], variantKeys: new Set() };
      groups.push(group);
    }

    group.members.push(node);
    const variantTag = [node.style?.fontWeight || "normal", node.layout?.itemSpacing || 0, node.layout?.mode || "none"].join("_");
    group.variantKeys.add(variantTag);
  }

  return groups;
}

export function detectVariants(groups: ComponentGroup[]) {
  return groups.map((g) => ({
    name: g.baseName,
    variants: Array.from(g.variantKeys).slice(0, 10).map((key, idx) => `variant_${idx}_${key}`),
    memberCount: g.members.length,
  }));
}
