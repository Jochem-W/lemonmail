import type { Thread } from "@prisma/client"
import { channelMention, EmbedBuilder } from "discord.js"

export function threadOpenedMessage(thread: Thread) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Thread opened")
        .setDescription(channelMention(thread.id)),
    ],
    ephemeral: true,
  }
}
