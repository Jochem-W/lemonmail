import { Discord, Prisma } from "../clients.mjs"
import { invalidThreadMessage } from "../messages/invalidThreadMessage.mjs"
import { threadStatusMessage } from "../messages/threadStatusMessage.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { fetchChannel } from "../utilities/discordUtilities.mjs"
import {
  bold,
  ChannelType,
  ChatInputCommandInteraction,
  DiscordAPIError,
  EmbedBuilder,
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
        .setRequired(true)
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

    const channel = await fetchChannel(thread.id, ChannelType.PublicThread)
    const newName = `${channel.name} (${reason ?? "closed"})`
    if (newName.length > 100) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: "Reason too long",
              iconURL: DefaultConfig.icons.fail.toString(),
            })
            .setDescription(
              `The reason "${
                reason ?? ""
              }" is too long, please reduce it to be at most ${
                100 - newName.length + (reason?.length ?? 0)
              } characters long`
            )
            .setColor(0xff0000),
        ],
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply()

    await Prisma.thread.update({
      where: { id: thread.id },
      data: { active: false, closedReason: reason },
    })

    await interaction.editReply(
      await threadStatusMessage(interaction, "closed", reason ?? undefined)
    )

    try {
      await Discord.users.send(
        thread.userId,
        await threadStatusMessage(interaction, "closed")
      )
    } catch (e) {
      if (
        !(e instanceof DiscordAPIError) ||
        e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
      ) {
        throw e
      }
    }

    await channel.messages.edit(channel.id, {
      content: `${bold(interaction.user.tag)}: [thread closed]`,
    })
    await channel.setName(
      `${channel.name} (${reason ?? "closed"})`,
      "Thread was closed manually"
    )
    await channel.setLocked(true, "Thread was closed manually")
    await channel.setArchived(true, "Thread was closed manually")
  }
}
