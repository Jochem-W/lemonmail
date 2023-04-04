import { DefaultConfig } from "../models/config.mjs"
import { EmbedBuilder, User, userMention } from "discord.js"

export function userNotInGuildMessage(user: User) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "User not in server",
      iconURL: DefaultConfig.icons.fail.toString(),
    })
    .setDescription(`${userMention(user.id)} is not in the server`)
    .setColor(0xff0000)

  return {
    embeds: [embed],
    ephemeral: true,
  }
}
