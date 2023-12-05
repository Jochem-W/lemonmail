import { Drizzle } from "../clients.mjs"
import { handler } from "../models/handler.mjs"
import { threadsTable } from "../schema.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import { ChannelType } from "discord.js"
import { and, eq } from "drizzle-orm"

export const TypingHandler = handler({
  event: "typingStart",
  once: false,
  async handle(typing) {
    // TODO: check if DMs
    const [thread] = await Drizzle.select()
      .from(threadsTable)
      .where(
        and(
          eq(threadsTable.userId, typing.user.id),
          eq(threadsTable.active, true),
        ),
      )
    if (!thread) {
      return
    }

    const threadChannel = await fetchChannel(
      typing.client,
      thread.id,
      ChannelType.PublicThread,
    )
    await threadChannel.sendTyping()
  },
})
