import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import { attachmentsToEmbeds } from "../utilities/threadUtilities.mjs"
import type { Message } from "discord.js"
import { EmbedBuilder } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function sentMessage(message: Message, prefix?: string) {
  const colour = message.inGuild() ? 0xff4000 : 0x20ff20

  const images = attachmentsToEmbeds(message, colour)

  let embed
  if (images.length === 10 || images.length === 1) {
    embed = images.shift() as EmbedBuilder
  } else {
    embed = new EmbedBuilder()
  }

  embed
    .setTitle("Message sent")
    .setDescription(
      (prefix ? message.content.replace(prefix, "").trim() : message.content) ||
        null
    )
    .setTimestamp(message.createdTimestamp)
    .setColor(colour)

  if (message.inGuild()) {
    const member = await guild.members.fetch(message.author.id)
    embed.setAuthor({
      name: formatName(member),
      iconURL: member.displayAvatarURL(),
    })
  } else {
    const footer: EmbedFooterOptions = { text: guild.name }
    const iconURL = guild.iconURL()
    if (iconURL) {
      footer.iconURL = iconURL
    }

    embed.setFooter(footer)
  }

  return {
    embeds: [embed, ...images],
    files: [...message.attachments.values()],
  }
}
