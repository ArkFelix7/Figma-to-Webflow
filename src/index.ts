#!/usr/bin/env node
import { runConversionFromFile, lumosOutputToHtml } from "./services/mappingService.js";
import { execSync } from "child_process";

async function main() {
  const filePath = process.argv[2] || "./src/asset/figma.json";
  console.log("Starting conversion for file:", filePath);
  try {
    console.log("Calling runConversionFromFile...");
    const output = await runConversionFromFile(filePath);
    console.log("Conversion completed successfully");
    console.log(`Project: ${output.projectName}`);
    console.log(`Total components: ${output.components.length}`);
    if (output.report) {
      console.log(`Lumos transformation report entries: ${output.report.length}`);
      const warnings = output.report.flatMap((r) => r.warnings);
      console.log(`Total warnings: ${warnings.length}`);
      if (warnings.length > 0) {
        console.log("Warnings summary:", warnings.slice(0, 20));
      }
    }

    const html = lumosOutputToHtml(output);
    execSync(`echo "${html.replace(/"/g, '\\"')}" | pbcopy`);
    console.log("HTML copied to clipboard.");
    //console.log("Output length:", JSON.stringify(output).length, "characters");
    console.log("HTML length:", html.length, "characters");
    //console.log(JSON.stringify(output, null, 2));
  } catch (error: any) {
    console.error("Conversion failed:", error?.message || error);
    process.exit(1);
  }
}

main();