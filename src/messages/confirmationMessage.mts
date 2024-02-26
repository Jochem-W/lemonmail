import { Drizzle } from "../clients.mjs"
import { component } from "../models/component.mjs"
import { Config } from "../models/config.mjs"
import { blockedTable, threadsTable } from "../schema.mjs"
import { processDmMessage } from "../utilities/threadUtilities.mjs"
import { blockedMessage } from "./blockedMessage.mjs"
import { dmThreadExistsMessage } from "./dmThreadExistsMessage.mjs"
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from "discord.js"
import type {
  MessageActionRowComponentBuilder,
  EmbedFooterOptions,
  User,
  FetchMessagesOptions,
} from "discord.js"
import { and, desc, eq } from "drizzle-orm"
import postgres from "postgres"

const createThreadButton = component({
  type: ComponentType.Button,
  name: "create-thread",
  async handle(interaction, type, userId) {
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

    const [oldThread] = await Drizzle.select()
      .from(threadsTable)
      .where(
        and(
          eq(threadsTable.userId, interaction.user.id),
          eq(threadsTable.active, false),
        ),
      )
      .orderBy(desc(threadsTable.id))
      .limit(1)

    const fetchOptions: FetchMessagesOptions = { limit: 10 }
    if (oldThread) {
      fetchOptions.after = oldThread.lastMessage
    }

    const user = await interaction.client.users.fetch(userId)
    const channel = user.dmChannel ?? (await user.createDM())

    const messageCollection = await channel.messages.fetch(fetchOptions)
    const rest = [...messageCollection.values()].filter(
      (message) => message.author.id === user.id,
    )

    const message = rest[0]
    rest.splice(1)

    if (!message) {
      throw new Error()
    }

    try {
      await processDmMessage(message, ...rest)
    } catch (e) {
      if (!(e instanceof postgres.PostgresError) || e.code !== "23505") {
        throw e
      }

      await interaction.followUp(dmThreadExistsMessage())
    }
  },
})

export async function confirmationMessage(user: User) {
  const guild = await user.client.guilds.fetch(Config.guild)

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
          "You currently don't have an active thread. Would you like to create a new thread using the above message(s)?",
        )
        .setFooter(footer),
    ],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel("Yes")
          .setCustomId(createThreadButton("yes", user.id)),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel("No")
          .setCustomId(createThreadButton("no", user.id)),
      ),
    ],
  }
}
