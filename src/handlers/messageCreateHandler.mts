import { Drizzle } from "../clients.mjs"
import { confirmationMessage } from "../messages/confirmationMessage.mjs"
import { handler } from "../models/handler.mjs"
import { threadsTable } from "../schema.mjs"
import {
  messageIsFromUser,
  messageIsNotEmpty,
  messageHasSendPrefix,
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"
import { Message, Snowflake } from "discord.js"
import { and, eq } from "drizzle-orm"

const confirmations = new Map<Snowflake, Message>()

export const MessageCreateHandler = handler({
  event: "messageCreate",
  once: false,
  async handle(message) {
    if (!messageIsFromUser(message) || !messageIsNotEmpty(message)) {
      return
    }

    if (!message.inGuild()) {
      const [thread] = await Drizzle.select()
        .from(threadsTable)
        .where(
          and(
            eq(threadsTable.userId, message.author.id),
            eq(threadsTable.active, true),
          ),
        )

      if (!thread) {
        const previous = confirmations.get(message.author.id)
        if (previous?.deletable) {
          await previous.delete()
        }

        confirmations.set(
          message.author.id,
          await message.channel.send(await confirmationMessage(message.author)),
        )
        return
      }

      await processDmMessage(message)
      return
    }

    const [thread] = await Drizzle.select()
      .from(threadsTable)
      .where(
        and(
          eq(threadsTable.id, message.channelId),
          eq(threadsTable.active, true),
        ),
      )

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
