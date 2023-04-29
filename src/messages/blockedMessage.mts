import { EmbedBuilder } from "discord.js"

export function blockedMessage() {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Unable to create thread")
        .setDescription(
          "You're currently blocked from creating new modmail threads"
        ),
    ],
  }
}
