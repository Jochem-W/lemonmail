import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import { attachmentsToEmbeds } from "../utilities/threadUtilities.mjs"
import type { Message } from "discord.js"
import { EmbedBuilder } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function sentMessage(message: Message) {
  const colour = message.inGuild() ? 0xff8000 : 0x40ff40

  const images = attachmentsToEmbeds(message, colour)

  const footer: EmbedFooterOptions = { text: guild.name }
  const iconURL = guild.iconURL()
  if (iconURL) {
    footer.iconURL = iconURL
  }

  const embed = new EmbedBuilder()
    .setTitle("Message sent")
    .setDescription(
      message.content.replace(DefaultConfig.sendPrefix, "") || null
    )
    .setFooter(footer)
    .setTimestamp(message.createdTimestamp)
    .setColor(colour)

  if (message.inGuild()) {
    const member = await guild.members.fetch(message.author.id)
    embed.setAuthor({
      name: formatName(member),
      iconURL: member.displayAvatarURL(),
    })
  }

  return {
    embeds: [embed, ...images],
    files: [...message.attachments.values()],
  }
}
