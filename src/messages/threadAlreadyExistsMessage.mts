import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder } from "discord.js"

export function threadAlreadyExistsMessage() {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: "Thread already exists",
          iconURL: DefaultConfig.icons.fail.toString(),
        })
        .setDescription("A thread for this member already exists!")
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
