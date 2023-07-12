import { InteractionHandler } from "./handlers/interactionHandler.mjs"
import { MessageCreateHandler } from "./handlers/messageCreateHandler.mjs"
import { ReadyHandler } from "./handlers/readyHandler.mjs"
import { RestartHandler } from "./handlers/restartHandler.mjs"
import { TypingHandler } from "./handlers/typingHandler.mjs"
import type { Handler } from "./models/handler.mjs"
import type { ClientEvents } from "discord.js"

export const Handlers: Handler<keyof ClientEvents>[] = [
  InteractionHandler,
  MessageCreateHandler,
  ReadyHandler,
  RestartHandler,
  TypingHandler,
]
