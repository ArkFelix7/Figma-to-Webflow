import { z } from "zod";

export const FigmaStyleSchema = z.object({
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  lineHeightPx: z.number().optional(),
  letterSpacing: z.number().optional(),
  fills: z.array(z.any()).optional(),
  strokeWeight: z.number().optional(),
  effects: z.array(z.any()).optional(),
});

export const FigmaNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    children: z.array(FigmaNodeSchema).optional(),
    styles: z.record(z.string(), z.string()).optional(),
  absoluteBoundingBox: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  fills: z.any().optional(),
  strokes: z.any().optional(),
  style: FigmaStyleSchema.optional(),
  layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional(),
  itemSpacing: z.number().optional(),
  paddingTop: z.number().optional(),
  paddingBottom: z.number().optional(),
  paddingLeft: z.number().optional(),
  paddingRight: z.number().optional(),
  visible: z.boolean().optional(),
  componentId: z.string().optional(),
  isMask: z.boolean().optional(),
}));

export const FigmaDocumentSchema = z.object({
  document: FigmaNodeSchema,
  schemaVersion: z.number().optional(),
  styles: z.record(z.string(), z.any()).optional(),
  components: z.record(z.string(), z.any()).optional(),
});

export type FigmaNode = z.infer<typeof FigmaNodeSchema>;
export type FigmaDocument = z.infer<typeof FigmaDocumentSchema>;
