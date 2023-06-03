import { EmbedBuilder } from "discord.js"

export function invalidThreadMessage() {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Invalid thread")
        .setDescription("This channel doesn't appear to be an active thread")
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
