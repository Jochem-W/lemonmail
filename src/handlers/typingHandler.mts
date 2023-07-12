import { Prisma } from "../clients.mjs"
import { handler } from "../models/handler.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import { ChannelType } from "discord.js"

export const TypingHandler = handler({
  event: "typingStart",
  once: false,
  async handle(typing) {
    const thread = await Prisma.thread.findFirst({
      where: { userId: typing.user.id, active: true },
    })
    if (!thread) {
      return
    }

    const threadChannel = await fetchChannel(
      typing.client,
      thread.id,
      ChannelType.PublicThread
    )
    await threadChannel.sendTyping()
  },
})
