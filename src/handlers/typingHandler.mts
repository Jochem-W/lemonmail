import { Prisma } from "../clients.mjs"
import type { Handler } from "../types/handler.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import type { Typing } from "discord.js"
import { ChannelType } from "discord.js"

export class TypingHandler implements Handler<"typingStart"> {
  public readonly event = "typingStart"
  public readonly once = false

  public async handle(typing: Typing) {
    const thread = await Prisma.thread.findFirst({
      where: { userId: typing.user.id, active: true },
    })
    if (!thread) {
      return
    }

    const threadChannel = await fetchChannel(
      thread.id,
      ChannelType.PublicThread
    )
    await threadChannel.sendTyping()
  }
}
