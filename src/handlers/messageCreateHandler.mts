import { Prisma } from "../clients.mjs"
import type { Handler } from "../types/handler.mjs"
import {
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"
import type { Message } from "discord.js"

export class MessageCreateHandler implements Handler<"messageCreate"> {
  public readonly event = "messageCreate"
  public readonly once = false

  public async handle(message: Message) {
    if (message.author.bot || message.system) {
      return
    }

    if (!message.content && message.attachments.size === 0) {
      return
    }

    if (!message.inGuild()) {
      await processDmMessage(message)
      return
    }

    if (message.content.startsWith("=") || message.content.startsWith("/")) {
      return
    }

    const thread = await Prisma.thread.findFirst({
      where: { id: message.channelId, active: true },
    })

    if (!thread) {
      return
    }

    await processGuildMessage(thread, message)
  }
}
