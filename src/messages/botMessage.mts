import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder } from "discord.js"

export function botMessage(title: string) {
  return {
    embeds: [
      new EmbedBuilder().setAuthor({
        name: title,
        iconURL: DefaultConfig.icons.success.toString(),
      }),
    ],
  }
}
