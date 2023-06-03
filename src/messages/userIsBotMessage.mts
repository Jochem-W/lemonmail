import { EmbedBuilder, User, userMention } from "discord.js"

export function userIsBotMessage(user: User) {
  const embed = new EmbedBuilder()
    .setTitle("User is a bot")
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
