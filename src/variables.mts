import camelcaseKeys from "camelcase-keys"
import { z } from "zod"

const model = z
  .object({
    DATABASE_URL: z.string(),
    DISCORD_BOT_TOKEN: z.string(),
  })
  .transform((arg) => camelcaseKeys(arg))

export const Variables = await model.parseAsync(process.env)
