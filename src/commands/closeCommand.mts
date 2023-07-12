import { Discord, Prisma } from "../clients.mjs"
import { invalidThreadMessage } from "../messages/invalidThreadMessage.mjs"
import { threadStatusMessage } from "../messages/threadStatusMessage.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { slashCommand, slashOption } from "../models/slashCommand.mjs"
import {
  displayName,
  fetchChannel,
  tryFetchMember,
} from "../utilities/discordUtilities.mjs"
import {
  bold,
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
  SlashCommandStringOption,
} from "discord.js"

export const CloseCommand = slashCommand({
  name: "close",
  description: "Close the current thread",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  options: [
    slashOption(
      false,
      new SlashCommandStringOption()
        .setName("reason")
        .setDescription(
          "The reason for closing the thread, not sent to the user"
        )
    ),
  ],
  async handle(interaction, reason) {
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
            .setTitle("Reason too long")
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
      content: `${bold(
        displayName(
          (await tryFetchMember(interaction.user)) ?? interaction.user
        )
      )}: [thread closed]`,
    })
    await channel.setName(
      `${channel.name} (${reason ?? "closed"})`,
      "Thread was closed manually"
    )
    await channel.setAppliedTags(
      [DefaultConfig.guild.tags.closed],
      "Thread was closed manually"
    )
    await channel.setLocked(true, "Thread was closed manually")
    await channel.setArchived(true, "Thread was closed manually")
  },
})
