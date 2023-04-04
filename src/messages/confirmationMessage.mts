import { createThreadButton } from "../buttons/createThreadButton.mjs"
import { Discord } from "../clients.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { button } from "../utilities/button.mjs"
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
} from "discord.js"
import type {
  MessageActionRowComponentBuilder,
  EmbedFooterOptions,
} from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export function confirmationMessage(message: Message) {
  const footer: EmbedFooterOptions = { text: guild.name }
  const iconURL = guild.iconURL()
  if (iconURL) {
    footer.iconURL = iconURL
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setTitle("Create a new thread?")
        .setDescription(
          "You currently don't have an active thread. Would you like to create a new thread using this message?"
        )
        .setFooter(footer)
        .setTimestamp(message.createdAt),
    ],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel("Yes")
          .setCustomId(
            button(createThreadButton, ["yes", message.channel.id, message.id])
          ),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel("No")
          .setCustomId(
            button(createThreadButton, ["no", message.channel.id, message.id])
          )
      ),
    ],
  }
}
