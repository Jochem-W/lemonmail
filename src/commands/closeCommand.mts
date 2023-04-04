import { Discord, Prisma } from "../clients.mjs"
import { invalidThreadMessage } from "../messages/invalidThreadMessage.mjs"
import { threadStatusMessage } from "../messages/threadStatusMessage.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import {
  ChannelType,
  ChatInputCommandInteraction,
  DiscordAPIError,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
} from "discord.js"

export class CloseCommand extends ChatInputCommand {
  public constructor() {
    super(
      "close",
      "Close the current thread",
      PermissionFlagsBits.ModerateMembers
    )
    this.builder.addStringOption((builder) =>
      builder
        .setName("reason")
        .setDescription(
          "The reason for closing the thread, not sent to the user"
        )
        .setRequired(false)
    )
  }

  public async handle(interaction: ChatInputCommandInteraction) {
    const reason = interaction.options.getString("reason")

    const thread = await Prisma.thread.findFirst({
      where: { id: interaction.channelId, active: true },
    })
    if (!thread) {
      await interaction.reply(invalidThreadMessage())
      return
    }

    await interaction.deferReply()
    await Prisma.thread.update({
      where: { id: thread.id },
      data: { active: false, closedReason: reason },
    })

    const message = await threadStatusMessage(interaction, "closed")
    await interaction.editReply(message)

    try {
      await Discord.users.send(thread.userId, message)
    } catch (e) {
      if (
        !(e instanceof DiscordAPIError) ||
        e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
      ) {
        throw e
      }
    }

    const channel = await fetchChannel(thread.id, ChannelType.PublicThread)
    await channel.setName(`${channel.name} (${reason ?? "closed"})`)
    await channel.setLocked(true)
    await channel.setArchived(true)
  }
}
