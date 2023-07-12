import { Prisma } from "../clients.mjs"
import { confirmationMessage } from "../messages/confirmationMessage.mjs"
import { handler } from "../models/handler.mjs"
import {
  messageIsFromUser,
  messageIsNotEmpty,
  messageHasSendPrefix,
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"

export const MessageCreateHandler = handler({
  event: "messageCreate",
  once: false,
  async handle(message) {
    if (!messageIsFromUser(message) || !messageIsNotEmpty(message)) {
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

    const prefix = messageHasSendPrefix(message)
    if (prefix === false) {
      return
    }

    await processGuildMessage(thread, message, prefix)
  },
})
