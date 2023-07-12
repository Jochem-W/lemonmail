import { readFile } from "fs/promises"
import { z } from "zod"

const model = z.object({
  applicationId: z.string(),
  guild: z.string(),
  channels: z.object({
    error: z.string(),
    mail: z.string(),
    restart: z.string(),
  }),
  tags: z.object({
    awaitingStaff: z.string(),
    awaitingUser: z.string(),
    closed: z.string(),
    open: z.string(),
  }),
  repository: z.object({ name: z.string(), owner: z.string() }).optional(),
  sendPrefixes: z.array(z.string()),
})

export const Config = await model.parseAsync(
  JSON.parse(await readFile("config.json", "utf-8"))
)
