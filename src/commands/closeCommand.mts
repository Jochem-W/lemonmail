import { Discord, Prisma } from "../clients.mjs"
import { invalidThreadMessage } from "../messages/invalidThreadMessage.mjs"
import { userInfoMessage } from "../messages/userInfoMessage.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
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
      data: {
        active: false,
        closedReason: reason,
        lastMessage: interaction.id,
      },
    })

    await interaction.editReply(await userInfoMessage(interaction, "closed"))
    const channel = await fetchChannel(thread.id, ChannelType.PublicThread)
    if (reason) {
      await channel.setName(`${channel.name} (${reason})`)
    }

    await channel.setLocked(true)
    await channel.setArchived(true)

    await Discord.users.send(
      thread.userId,
      await userInfoMessage(interaction, "closed")
    )
  }
}
