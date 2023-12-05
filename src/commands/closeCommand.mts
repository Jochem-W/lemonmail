import { Drizzle } from "../clients.mjs"
import { invalidThreadMessage } from "../messages/invalidThreadMessage.mjs"
import { threadStatusMessage } from "../messages/threadStatusMessage.mjs"
import { Config } from "../models/config.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { threadsTable } from "../schema.mjs"
import {
  displayName,
  fetchChannel,
  tryFetchMember,
} from "../utilities/discordUtilities.mjs"
import { interactionGuild } from "../utilities/interactionUtilities.mjs"
import {
  bold,
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
  PermissionFlagsBits,
  RESTJSONErrorCodes,
} from "discord.js"
import { and, eq } from "drizzle-orm"

export const CloseCommand = slashCommand({
  name: "close",
  description: "Close the current thread",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  nsfw: false,
  options: [
    {
      name: "reason",
      description: "The reason for closing the thread, not sent to the user",
      type: "string",
      required: false,
    },
    {
      name: "silent",
      description:
        "Don't send a message to the user when the thread is closed; defaults to False",
      type: "boolean",
      required: false,
    },
  ],
  async handle(interaction, reason, silent) {
    const guild = await interactionGuild(interaction, true)

    const [thread] = await Drizzle.select()
      .from(threadsTable)
      .where(
        and(
          eq(threadsTable.id, interaction.channelId),
          eq(threadsTable.active, true),
        ),
      )
    if (!thread) {
      await interaction.reply(invalidThreadMessage())
      return
    }

    const channel = await fetchChannel(
      interaction.client,
      thread.id,
      ChannelType.PublicThread,
    )
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
              } characters long`,
            )
            .setColor(0xff0000),
        ],
        ephemeral: true,
      })
      return
    }

    await interaction.deferReply()

    await Drizzle.update(threadsTable)
      .set({ active: null, closedReason: reason })
      .where(eq(threadsTable.id, thread.id))
      .returning()

    await interaction.editReply(
      await threadStatusMessage(interaction, "closed", reason ?? undefined),
    )

    if (silent !== true) {
      try {
        await interaction.client.users.send(
          thread.userId,
          await threadStatusMessage(interaction, "closed"),
        )
      } catch (e) {
        if (
          !(e instanceof DiscordAPIError) ||
          e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
        ) {
          throw e
        }
      }
    }

    await channel.messages.edit(channel.id, {
      content: `${bold(
        displayName(
          (await tryFetchMember(guild, interaction.user)) ?? interaction.user,
        ),
      )}: [thread closed]`,
    })
    await channel.setName(
      `${channel.name} (${reason ?? "closed"})`,
      "Thread was closed manually",
    )
    await channel.setAppliedTags(
      [Config.tags.closed],
      "Thread was closed manually",
    )
    await channel.setLocked(true, "Thread was closed manually")
    await channel.setArchived(true, "Thread was closed manually")
  },
})
