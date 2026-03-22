#!/usr/bin/env node
import { convertFromFile } from "./pipeline.js";
import { writeFileSync } from "fs";
import { execSync } from "child_process";

function main() {
  const filePath = process.argv[2] || "./src/asset/figma.json";
  const outputPath = process.argv[3]; // optional: write to file
  console.log("=== Figma → Webflow (Lumos Framework) Converter ===");
  console.log(`Input: ${filePath}`);
  console.log("");

  try {
    const result = convertFromFile(filePath);

    console.log(`Sections detected: ${result.sections.length}`);
    for (const section of result.sections) {
      console.log(`  - ${section.sectionName} (${section.theme} theme)`);
    }
    console.log(`HTML length: ${result.html.length} characters`);

    if (result.warnings.length > 0) {
      console.log(`\nWarnings (${result.warnings.length}):`);
      for (const w of result.warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }

    // Output to file if path provided
    if (outputPath) {
      writeFileSync(outputPath, result.html, "utf-8");
      console.log(`\nOutput written to: ${outputPath}`);
    }

    // Copy to clipboard (macOS)
    try {
      execSync("pbcopy", { input: result.html, encoding: "utf-8" });
      console.log("\n✓ HTML copied to clipboard — paste into Webflow HTML Embed");
    } catch {
      // pbcopy not available (non-macOS) — silently skip
    }

    // Print preview
    console.log("\n--- Output Preview ---");
    console.log(result.html.substring(0, 500));
    if (result.html.length > 500) console.log("...");

  } catch (error: any) {
    console.error("Conversion failed:", error?.message || error);
    if (error?.stack) console.error(error.stack);
    process.exit(1);
  }
}

main();