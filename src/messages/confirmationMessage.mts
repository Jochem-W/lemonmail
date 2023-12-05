import { Drizzle } from "../clients.mjs"
import { component } from "../models/component.mjs"
import { Config } from "../models/config.mjs"
import { blockedTable, threadsTable } from "../schema.mjs"
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
import { and, eq } from "drizzle-orm"
import postgres from "postgres"

const createThreadButton = component({
  type: ComponentType.Button,
  name: "create-thread",
  async handle(interaction, type, channelId, messageId) {
    const rows = interaction.message.components.map(
      (row) =>
        new ActionRowBuilder<MessageActionRowComponentBuilder>(row.toJSON()),
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

    const [dbUser] = await Drizzle.select()
      .from(blockedTable)
      .where(eq(blockedTable.id, interaction.user.id))
    if (dbUser) {
      await interaction.reply(blockedMessage())
      return
    }

    const [thread] = await Drizzle.select()
      .from(threadsTable)
      .where(
        and(
          eq(threadsTable.userId, interaction.user.id),
          eq(threadsTable.active, true),
        ),
      )

    if (thread) {
      await interaction.reply(dmThreadExistsMessage())
      return
    }

    await interaction.update({ components: rows })

    const channel = await fetchChannel(
      interaction.client,
      channelId,
      ChannelType.DM,
    )
    const message = await channel.messages.fetch(messageId) // TODO

    try {
      await processDmMessage(message)
    } catch (e) {
      if (!(e instanceof postgres.PostgresError) || e.code !== "23505") {
        throw e
      }

      await interaction.followUp(dmThreadExistsMessage())
    }
  },
})

export async function confirmationMessage(message: Message) {
  const guild = await message.client.guilds.fetch(Config.guild)

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
          "You currently don't have an active thread. Would you like to create a new thread using this message?",
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
            createThreadButton("yes", message.channelId, message.id),
          ),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel("No")
          .setCustomId(createThreadButton("no", message.channelId, message.id)),
      ),
    ],
  }
}
