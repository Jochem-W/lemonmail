import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import { attachmentsToEmbeds } from "../utilities/threadUtilities.mjs"
import { EmbedBuilder, Message } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function receivedMessage(message: Message) {
  const colour = message.inGuild() ? 0xff8000 : 0x40ff40

  const images = attachmentsToEmbeds(message, colour)

  const member = await guild.members.fetch(message.author.id)

  const footer: EmbedFooterOptions = { text: guild.name }
  const iconURL = guild.iconURL()
  if (iconURL) {
    footer.iconURL = iconURL
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: formatName(member),
          iconURL: member.displayAvatarURL(),
        })
        .setTitle("Message received")
        .setDescription(
          message.content.replace(DefaultConfig.sendPrefix, "") || null
        )
        .setFooter(footer)
        .setTimestamp(message.createdTimestamp)
        .setColor(colour),
      ...images,
    ],
    files: [...message.attachments.values()],
  }
}
