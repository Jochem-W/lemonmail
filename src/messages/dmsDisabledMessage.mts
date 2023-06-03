import type { GuildMember, Message } from "discord.js"
import { EmbedBuilder, userMention } from "discord.js"

export function dmsDisabledMessage(member: GuildMember, message?: Message) {
  const embed = new EmbedBuilder()
    .setTitle("DMs disabled")
    .setDescription(`${userMention(member.id)} doesn't have their DMs enabled`)
    .setColor(0xff0000)

  if (!message) {
    return { embeds: [embed], ephemeral: true }
  }

  return {
    embeds: [embed],
    ephemeral: true,
    reply: { messageReference: message.id },
  }
}
