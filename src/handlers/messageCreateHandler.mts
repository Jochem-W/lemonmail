import { Prisma } from "../clients.mjs"
import { confirmationMessage } from "../messages/confirmationMessage.mjs"
import type { Handler } from "../types/handler.mjs"
import {
  checkMessageAuthor,
  checkMessageContent,
  checkMessagePrefix,
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"
import type { Message } from "discord.js"

export class MessageCreateHandler implements Handler<"messageCreate"> {
  public readonly event = "messageCreate"
  public readonly once = false

  public async handle(message: Message) {
    if (!checkMessageAuthor(message) || !checkMessageContent(message)) {
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

    if (!thread) {
      return
    }

    if (!checkMessagePrefix(message)) {
      return
    }

    await processGuildMessage(thread, message)
  }
}
