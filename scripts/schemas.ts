import { z } from "zod";
import { policySchema, catalogSchema } from "../src/policy";
import { graphicSchema } from "../src/render";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
const dir = resolve(import.meta.dir, "../schemas");
await mkdir(dir, { recursive: true });
for (const [name, schema] of Object.entries({
  policy: policySchema,
  catalog: catalogSchema,
  graphic: graphicSchema,
}))
  await Bun.write(
    `${dir}/${name}.schema.json`,
    JSON.stringify(z.toJSONSchema(schema), null, 2) + "\n",
  );
