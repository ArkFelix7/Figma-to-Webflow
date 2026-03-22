import fs from "fs";
import path from "path";
import { FigmaDocument, FigmaDocumentSchema } from "../schemas/figma.js";

export function loadFigmaFile(filePath: string): FigmaDocument {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const text = fs.readFileSync(absolute, "utf-8");
  const json = JSON.parse(text);
  return FigmaDocumentSchema.parse(json);
}
