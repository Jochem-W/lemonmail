import { Prisma } from "../clients.mjs"
import { component } from "../models/component.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import { processDmMessage } from "../utilities/threadUtilities.mjs"
import { blockedMessage } from "./blockedMessage.mjs"
import { dmThreadExistsMessage } from "./dmThreadExistsMessage.mjs"
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  Message,
} from "discord.js"
import type {
  MessageActionRowComponentBuilder,
  EmbedFooterOptions,
} from "discord.js"

const createThreadButton = component({
  type: ComponentType.Button,
  name: "create-thread",
  async handle(interaction, type, channelId, messageId) {
    const rows = interaction.message.components.map(
      (row) =>
        new ActionRowBuilder<MessageActionRowComponentBuilder>(row.toJSON())
    )

    for (const row of rows) {
      for (const component of row.components) {
        component.setDisabled(true)
      }
    }

    if (type === "no") {
      await interaction.update({ components: rows })
      return
    }

    const prismaUser = await Prisma.user.findFirst({
      where: { id: interaction.user.id },
    })
    if (prismaUser?.blocked) {
      await interaction.reply(blockedMessage())
      return
    }

    const thread = await Prisma.thread.findFirst({
      where: { userId: interaction.user.id, active: true },
    })

    if (thread) {
      await interaction.reply(dmThreadExistsMessage())
      return
    }

    await interaction.update({ components: rows })

    const channel = await fetchChannel(
      interaction.client,
      channelId,
      ChannelType.DM
    )
    const message = await channel.messages.fetch(messageId) // TODO
    await processDmMessage(message)
  },
})

export async function confirmationMessage(message: Message) {
  const guild = await message.client.guilds.fetch(DefaultConfig.guild.id)

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
            createThreadButton("yes", message.channelId, message.id)
          ),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel("No")
          .setCustomId(createThreadButton("no", message.channelId, message.id))
      ),
    ],
  }
}
