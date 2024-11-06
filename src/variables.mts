import camelcaseKeys from "camelcase-keys"
import { z } from "zod"

const model = z
  .object({
    DISCORD_BOT_TOKEN: z.string(),
    NODE_ENV: z.string().optional().default("development"),
    DATABASE_URL: z.string(),
  })
  .transform((arg) => camelcaseKeys(arg))

export const Variables = await model.parseAsync(process.env)
