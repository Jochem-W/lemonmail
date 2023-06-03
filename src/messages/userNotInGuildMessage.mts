import { EmbedBuilder, User, userMention } from "discord.js"

export function userNotInGuildMessage(user: User) {
  const embed = new EmbedBuilder()
    .setTitle("User not in server")
    .setDescription(`${userMention(user.id)} is not in the server`)
    .setColor(0xff0000)

  return {
    embeds: [embed],
    ephemeral: true,
  }
}
