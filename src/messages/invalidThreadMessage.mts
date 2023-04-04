import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder } from "discord.js"

export function invalidThreadMessage() {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: "Invalid thread",
          iconURL: DefaultConfig.icons.fail.toString(),
        })
        .setDescription("This channel doesn't appear to be a thread")
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
