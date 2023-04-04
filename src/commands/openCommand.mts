import { ThreadAlreadyExistsError } from "../errors.mjs"
import { threadAlreadyExistsMessage } from "../messages/threadAlreadyExistsMessage.mjs"
import { threadOpenedMessage } from "../messages/threadOpenedMessage.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { createThreadFromInteraction } from "../utilities/threadUtilities.mjs"
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js"

export class OpenCommand extends ChatInputCommand {
  public constructor() {
    super(
      "open",
      "Open a ModMail thread for this user",
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

    try {
      await createThreadFromInteraction(interaction)
    } catch (e) {
      if (e instanceof ThreadAlreadyExistsError) {
        await interaction.editReply(threadAlreadyExistsMessage())
        return
      }

      throw e
    }

    await interaction.editReply(threadOpenedMessage())
  }
}
