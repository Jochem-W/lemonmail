import { threadsTable } from "../schema.mjs"
import { channelMention, EmbedBuilder } from "discord.js"

export function threadOpenedMessage(thread: typeof threadsTable.$inferSelect) {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Thread opened")
        .setDescription(channelMention(thread.id)),
    ],
    ephemeral: true,
  }
}
