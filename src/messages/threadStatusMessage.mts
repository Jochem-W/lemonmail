import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import { CommandInteraction, EmbedBuilder, Message } from "discord.js"
import type { EmbedFooterOptions } from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function threadStatusMessage(
  data: CommandInteraction | Message,
  type: "closed" | "opened"
) {
  const author = data instanceof Message ? data.author : data.user
  const member = await guild.members.fetch(author)
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
        .setTitle(`Thread ${type}`)
        .setFooter(footer)
        .setTimestamp(data.createdTimestamp)
        .setColor(type === "opened" ? 0x0040ff : 0xff2020),
    ],
  }
}
