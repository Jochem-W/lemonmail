import { Prisma } from "../clients.mjs"
import type { Handler } from "../types/handler.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import {
  processDmMessage,
  processGuildMessage,
} from "../utilities/threadUtilities.mjs"
import type { Client } from "discord.js"
import { ChannelType } from "discord.js"

export class RestartHandler implements Handler<"ready"> {
  public readonly event = "ready"
  public readonly once = true

  public async handle(client: Client) {
    const threads = await Prisma.thread.findMany({ where: { active: true } })
    for (const thread of threads) {
      const user = await client.users.fetch(thread.userId)
      const dmChannel = user.dmChannel ?? (await user.createDM())

      const threadChannel = await fetchChannel(
        thread.id,
        ChannelType.PublicThread
      )

      const messages = []
      for (const [, message] of await dmChannel.messages.fetch({
        limit: 100,
        after: thread.lastMessage,
      })) {
        if (message.author.bot || message.system) {
          continue
        }

        messages.push(message)
      }

      for (const [, message] of await threadChannel.messages.fetch({
        limit: 100,
        after: thread.lastMessage,
      })) {
        if (message.author.bot || message.system) {
          continue
        }

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
        if (message.inGuild()) {
          await processGuildMessage(message)
          continue
        }

        await processDmMessage(message)
      }
    }
  }
}