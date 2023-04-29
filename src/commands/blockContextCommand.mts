import { UserContextMenuCommand } from "../models/userContextMenuCommand.mjs"
import { block } from "./blockCommand.mjs"
import {
  PermissionFlagsBits,
  UserContextMenuCommandInteraction,
} from "discord.js"

export class BlockContextCommand extends UserContextMenuCommand {
  public constructor() {
    super("Block", PermissionFlagsBits.ModerateMembers)
  }

  public async handle(interaction: UserContextMenuCommandInteraction) {
    await block(interaction)
  }
}
