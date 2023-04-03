import type { Handler } from "./types/handler.mjs"
import type { ClientEvents } from "discord.js"
import { CommandHandler } from "./handlers/commandHandler.mjs"
import { InteractionHandler } from "./handlers/interactionHandler.mjs"
import { ReadyHandler } from "./handlers/readyHandler.mjs"

export const Handlers: Handler<keyof ClientEvents>[] = [
  new CommandHandler(),
  new InteractionHandler(),
  new ReadyHandler()
]
