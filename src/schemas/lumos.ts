import { z } from "zod";

export const LumosTokenSchema = z.object({
  token: z.string(),
  value: z.number().or(z.string()),
  category: z.enum(["spacing", "typography", "color"]),
});

export const LumosElementSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    semanticName: z.string(),
    type: z.string(),
    classes: z.array(z.string()),
    style: z.record(z.string(), z.any()).optional(),
    content: z.string().optional(),
    children: z.array(LumosElementSchema).optional(),
  })
);

export const LumosComponentSchema = z.object({
  name: z.string(),
  id: z.string(),
  variants: z.array(z.string()),
  root: LumosElementSchema,
});

export const LumosNodeReportSchema = z.object({
  nodeId: z.string(),
  semanticName: z.string(),
  classes: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const LumosOutputSchema = z.object({
  projectName: z.string(),
  tokens: z.array(LumosTokenSchema),
  components: z.array(LumosComponentSchema),
  pageTree: LumosElementSchema,
  metadata: z.object({
    generatedAt: z.string(),
    source: z.string().optional(),
  }).optional(),
  report: z.array(LumosNodeReportSchema).optional(),
});

export type LumosOutput = z.infer<typeof LumosOutputSchema>;
