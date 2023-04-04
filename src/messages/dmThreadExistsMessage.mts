import { EmbedBuilder } from "discord.js"

export function dmThreadExistsMessage() {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Thread already exists")
        .setDescription("You already have an active thread!")
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
