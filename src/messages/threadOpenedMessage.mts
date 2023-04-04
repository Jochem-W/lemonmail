import { DefaultConfig } from "../models/config.mjs"
import type { Thread } from "@prisma/client"
import { channelMention, EmbedBuilder } from "discord.js"

export function threadOpenedMessage(thread: Thread) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: "Thread opened",
          iconURL: DefaultConfig.icons.success.toString(),
        })
        .setDescription(channelMention(thread.id)),
    ],
    ephemeral: true,
  }
}
