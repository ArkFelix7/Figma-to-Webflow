export function buildOpenAIPrompt(normalizedTree: any) {
  const shortTree = JSON.stringify(normalizedTree, null, 2).slice(0, 10000);

  const system = `You are an AI assistant that maps Figma auto-layout designs into semantic Webflow/Lumos structure.`;

  const user = `Input JSON should be interpreted for naming, components, and variants.\n
1. Assign semantic names (section_hero, card_feature, button_primary) by role.\n
2. Detect reusable components and their variants (highlighted, secondary, featured).\n
3. Provide tokenized spacing and typography definitions.\n
4. Output strictly in compact JSON object with keys: pageTree, components, tokens, metadata.\n
Design hierarchy: layer names; type hints; layout properties.\n
JSON input (truncated): ${shortTree}`;

  return [{ role: "system", content: system }, { role: "user", content: user }];
}
