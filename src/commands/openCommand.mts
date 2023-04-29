import { Prisma } from "../clients.mjs"
import { threadAlreadyExistsMessage } from "../messages/threadAlreadyExistsMessage.mjs"
import { threadOpenedMessage } from "../messages/threadOpenedMessage.mjs"
import { userIsBotMessage } from "../messages/userIsBotMessage.mjs"
import { userNotInGuildMessage } from "../messages/userNotInGuildMessage.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { tryFetchMember } from "../utilities/discordUtilities.mjs"
import { createThreadFromInteraction } from "../utilities/threadUtilities.mjs"
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js"

export class OpenCommand extends ChatInputCommand {
  public constructor() {
    super(
      "open",
      "Open a modmail thread for this user",
      PermissionFlagsBits.ModerateMembers
    )
    this.builder.addUserOption((builder) =>
      builder
        .setName("user")
        .setDescription("The user to open a thread for")
        .setRequired(true)
    )
  }

  public async handle(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    const user = interaction.options.getUser("user", true)
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
