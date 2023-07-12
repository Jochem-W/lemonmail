import { contextMenuCommand } from "../models/contextMenuCommand.mjs"
import { block } from "./blockCommand.mjs"
import { ApplicationCommandType, PermissionFlagsBits } from "discord.js"

export const BlockContextCommand = contextMenuCommand({
  type: ApplicationCommandType.User,
  name: "Block",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  async handle(interaction, user) {
    await interaction.reply(await block(user))
  },
})
