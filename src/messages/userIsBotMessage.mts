import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder, User, userMention } from "discord.js"

export function userIsBotMessage(user: User) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "User is a bot",
      iconURL: DefaultConfig.icons.fail.toString(),
    })
    .setDescription(
      `A thread can't be created for ${userMention(
        user.id
      )} because they're a bot`
    )
    .setColor(0xff0000)

  return {
    embeds: [embed],
    ephemeral: true,
  }
}
