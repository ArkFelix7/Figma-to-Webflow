# Auto Generate Webflow Site (Figma -> Lumos)

## Overview

This project converts Figma auto-layout JSON into a Lumos-compatible Webflow schema with:

- Semantic naming (e.g., section_hero, card_feature, button_primary)
- Reusable component detection
- Variant inference (highlighted, secondary, featured)
- Tokenized spacing and typography
- OpenAI prompt-ready JSON for naming/reasoning

## Folder structure

- src/
  - services/
  - schemas/
  - utils/
  - figma-to-lumos.ts

## Run

1. Install dependencies:

```bash
npm install zod
npm install --save-dev @types/node
```

2. Run converter with sample Figma JSON:

```bash
npx ts-node src/figma-to-lumos.ts path/to/figma-response.json
```

## Validation

- `LumosOutputSchema` is used to validate output from `convertFigmaToLumos`.
- `FigmaDocumentSchema` validates the input tree.

## OpenAI prompt function

- `buildOpenAIPrompt(normalizedTree)` returns a system/user prompt pair.
