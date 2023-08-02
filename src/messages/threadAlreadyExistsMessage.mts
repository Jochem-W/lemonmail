import type { Thread } from "@prisma/client"
import { channelMention, EmbedBuilder } from "discord.js"

export function threadAlreadyExistsMessage(thread: Thread) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Thread already exists")
        .setDescription(
          `A thread for this member already exists! ${channelMention(
            thread.id,
          )}`,
        )
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
