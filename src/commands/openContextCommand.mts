import { Prisma } from "../clients.mjs"
import { threadAlreadyExistsMessage } from "../messages/threadAlreadyExistsMessage.mjs"
import { threadOpenedMessage } from "../messages/threadOpenedMessage.mjs"
import { userIsBotMessage } from "../messages/userIsBotMessage.mjs"
import { userNotInGuildMessage } from "../messages/userNotInGuildMessage.mjs"
import { UserContextMenuCommand } from "../models/userContextMenuCommand.mjs"
import { tryFetchMember } from "../utilities/discordUtilities.mjs"
import { createThreadFromInteraction } from "../utilities/threadUtilities.mjs"
import {
  PermissionFlagsBits,
  UserContextMenuCommandInteraction,
} from "discord.js"

export class OpenContextCommand extends UserContextMenuCommand {
  public constructor() {
    super("Open modmail thread", PermissionFlagsBits.ModerateMembers)
  }

  public async handle(interaction: UserContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const user = interaction.targetUser
    if (user.bot) {
      await interaction.editReply(userIsBotMessage(user))
      return
    }

    let thread = await Prisma.thread.findFirst({
      where: { userId: user.id, active: true },
    })
    if (thread) {
      await interaction.editReply(threadAlreadyExistsMessage(thread))
      return
    }

    const member = await tryFetchMember(user.id)
    if (!member) {
      await interaction.editReply(userNotInGuildMessage(user))
      return
    }

    thread = await createThreadFromInteraction(member, interaction)

    await interaction.editReply(threadOpenedMessage(thread))
  }
}
