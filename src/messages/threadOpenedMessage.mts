import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder } from "discord.js"

export function threadOpenedMessage() {
  return {
    embeds: [
      new EmbedBuilder().setAuthor({
        name: "Thread opened",
        iconURL: DefaultConfig.icons.success.toString(),
      }),
    ],
    ephemeral: true,
  }
}
