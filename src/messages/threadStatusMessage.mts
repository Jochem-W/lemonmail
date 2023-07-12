import { Config } from "../models/config.mjs"
import { displayName } from "../utilities/discordUtilities.mjs"
import { CommandInteraction, EmbedBuilder, Message } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

export async function threadStatusMessage(
  data: CommandInteraction | Message,
  type: "closed" | "opened",
  reason?: string
) {
  const guild = await data.client.guilds.fetch(Config.guild)

  const footer: EmbedFooterOptions = { text: guild.name }
  const iconURL = guild.iconURL()
  if (iconURL) {
    footer.iconURL = iconURL
  }

  const embed = new EmbedBuilder()
    .setTitle(`Thread ${type}`)
    .setFooter(footer)
    .setTimestamp(data.createdTimestamp)
    .setColor(type === "opened" ? 0x0040ff : 0xff0000)

  if (reason) {
    embed.setDescription(reason)
  }

  if (data instanceof CommandInteraction) {
    const member = await guild.members.fetch(data.user.id)
    embed.setAuthor({
      name: displayName(member),
      iconURL: member.displayAvatarURL(),
    })
  }

  return {
    embeds: [embed],
  }
}
