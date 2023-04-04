import { ThreadAlreadyExistsError } from "../errors.mjs"
import { threadAlreadyExistsMessage } from "../messages/threadAlreadyExistsMessage.mjs"
import { threadOpenedMessage } from "../messages/threadOpenedMessage.mjs"
import { UserContextMenuCommand } from "../models/userContextMenuCommand.mjs"
import { createThreadFromInteraction } from "../utilities/threadUtilities.mjs"
import {
  PermissionFlagsBits,
  UserContextMenuCommandInteraction,
} from "discord.js"

export class OpenContextCommand extends UserContextMenuCommand {
  public constructor() {
    super("Open ModMail thread", PermissionFlagsBits.ModerateMembers)
  }

  public async handle(interaction: UserContextMenuCommandInteraction) {
    await interaction.deferReply({ ephemeral: true })

    let thread
    try {
      thread = await createThreadFromInteraction(interaction)
    } catch (e) {
      if (e instanceof ThreadAlreadyExistsError) {
        await interaction.editReply(threadAlreadyExistsMessage(e.thread))
        return
      }

      throw e
    }

    await interaction.editReply(threadOpenedMessage(thread))
  }
}
