import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import { attachmentsToEmbeds } from "../utilities/threadUtilities.mjs"
import { EmbedBuilder, Message } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function receivedMessage(message: Message, prefix?: string) {
  const colour = message.inGuild() ? 0xff4000 : 0x20ff20

  const images = attachmentsToEmbeds(message, colour)

  const member = await guild.members.fetch(message.author.id)

  const footer: EmbedFooterOptions = { text: guild.name }
  const iconURL = guild.iconURL()
  if (iconURL) {
    footer.iconURL = iconURL
  }

  let embed
  if (images.length === 10) {
    embed = images.shift() as EmbedBuilder
  } else {
    embed = new EmbedBuilder()
  }

  embed
    .setAuthor({
      name: formatName(member),
      iconURL: member.displayAvatarURL(),
    })
    .setTitle("Message received")
    .setDescription(
      (prefix ? message.content.replace(prefix, "").trim() : message.content) ||
        null
    )
    .setTimestamp(message.createdTimestamp)
    .setColor(colour)

  if (message.inGuild()) {
    embed.setFooter(footer)
  }

  return {
    embeds: [embed, ...images],
    files: [...message.attachments.values()],
  }
}
