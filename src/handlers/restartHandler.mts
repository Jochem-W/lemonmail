import { Prisma } from "../clients.mjs"
import { handler } from "../models/handler.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import {
  messageIsFromUser,
  messageIsNotEmpty,
  messageHasSendPrefix,
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"
import { ChannelType } from "discord.js"

export const RestartHandler = handler({
  event: "ready",
  once: true,
  async handle(client) {
    const threads = await Prisma.thread.findMany({ where: { active: true } })
    for (const thread of threads) {
      const user = await client.users.fetch(thread.userId)
      const dmChannel = user.dmChannel ?? (await user.createDM())

      const threadChannel = await fetchChannel(
        client,
        thread.id,
        ChannelType.PublicThread
      )

      const messages = []
      for (const [, message] of await dmChannel.messages.fetch({
        limit: 100,
        after: thread.lastMessage,
      })) {
        messages.push(message)
      }

      for (const [, message] of await threadChannel.messages.fetch({
        limit: 100,
        after: thread.lastMessage,
      })) {
        messages.push(message)
      }

      messages.sort((a, b) => {
        const idA = BigInt(a.id)
        const idB = BigInt(b.id)
        if (idA > idB) {
          return 1
        }

        if (idA < idB) {
          return -1
        }

        return 0
      })

      for (const message of messages) {
        if (!messageIsFromUser(message) || !messageIsNotEmpty(message)) {
          continue
        }

        if (message.inGuild()) {
          const prefix = messageHasSendPrefix(message)
          if (prefix === false) {
            continue
          }

          await processGuildMessage(thread, message, prefix)
          continue
        }

        await processDmMessage(message)
      }
    }
  },
})
