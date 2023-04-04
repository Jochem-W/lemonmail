import { Prisma } from "../clients.mjs"
import { confirmationMessage } from "../messages/confirmationMessage.mjs"
import { DefaultConfig } from "../models/config.mjs"
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
      const thread = await Prisma.thread.findFirst({
        where: { userId: message.author.id, active: true },
      })

      if (!thread) {
        await message.reply(confirmationMessage(message))
        return
      }

      await processDmMessage(message)
      return
    }

    const thread = await Prisma.thread.findFirst({
      where: { id: message.channelId, active: true },
    })

    if (!message.content.startsWith(DefaultConfig.sendPrefix)) {
      return
    }

    if (!thread) {
      return
    }

    await processGuildMessage(thread, message)
  }
}
