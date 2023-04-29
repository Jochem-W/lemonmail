import { Prisma } from "../clients.mjs"
import { blockedMessage } from "../messages/blockedMessage.mjs"
import { dmThreadExistsMessage } from "../messages/dmThreadExistsMessage.mjs"
import { registerButtonHandler } from "../utilities/button.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import { processDmMessage } from "../utilities/threadUtilities.mjs"
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
} from "discord.js"
import type { MessageActionRowComponentBuilder } from "discord.js"

async function disable(interaction: ButtonInteraction) {
  await interaction.update({
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().setComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel("Yes")
          .setDisabled(true)
          .setCustomId("yes-disabled"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel("No")
          .setDisabled(true)
          .setCustomId("no-disabled")
      ),
    ],
  })
}

export const createThreadButton = registerButtonHandler(
  "create-thread",
  async (interaction, [type, channelId, messageId]) => {
    if (!type || !channelId || !messageId || type === "no") {
      await disable(interaction)
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

    await disable(interaction)

    const channel = await fetchChannel(channelId, ChannelType.DM)
    const message = await channel.messages.fetch(messageId) // TODO
    await processDmMessage(message)
  }
)
