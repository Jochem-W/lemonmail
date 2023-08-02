import { ORM } from "../clients.mjs"
import { threadAlreadyExistsMessage } from "../messages/threadAlreadyExistsMessage.mjs"
import { threadOpenedMessage } from "../messages/threadOpenedMessage.mjs"
import { userIsBotMessage } from "../messages/userIsBotMessage.mjs"
import { userNotInGuildMessage } from "../messages/userNotInGuildMessage.mjs"
import { slashCommand, slashOption } from "../models/slashCommand.mjs"
import { tryFetchMember } from "../utilities/discordUtilities.mjs"
import { interactionGuild } from "../utilities/interactionUtilities.mjs"
import { createThreadFromInteraction } from "../utilities/threadUtilities.mjs"
import { PermissionFlagsBits, SlashCommandUserOption } from "discord.js"

export const OpenCommand = slashCommand({
  name: "open",
  description: "Open a modmail thread for this user",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  options: [
    slashOption(
      true,
      new SlashCommandUserOption()
        .setName("user")
        .setDescription("The user to open a thread for"),
    ),
  ],
  async handle(interaction, user) {
    const guild = await interactionGuild(interaction, true)

    if (user.bot) {
      await interaction.reply({ ...userIsBotMessage(user), ephemeral: true })
      return
    }

    await interaction.deferReply({ ephemeral: true })

    let thread = await ORM.thread.findFirst({
      where: { userId: user.id, active: true },
    })
    if (thread) {
      await interaction.editReply(threadAlreadyExistsMessage(thread))
      return
    }

    const member = await tryFetchMember(guild, user.id)
    if (!member) {
      await interaction.editReply(userNotInGuildMessage(user))
      return
    }

    thread = await createThreadFromInteraction(member, interaction)

    await interaction.editReply(threadOpenedMessage(thread))
  },
})
