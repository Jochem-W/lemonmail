import { Drizzle } from "../clients.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { blockedTable } from "../schema.mjs"
import {
  EmbedBuilder,
  PermissionFlagsBits,
  User,
  userMention,
} from "discord.js"
import { eq } from "drizzle-orm"

export async function block(user: User) {
  const [dbUser] = await Drizzle.delete(blockedTable)
    .where(eq(blockedTable.id, user.id))
    .returning()
  if (!dbUser) {
    await Drizzle.insert(blockedTable).values({ id: user.id }).returning()
  }

  const verb = `${dbUser ? "un" : ""}blocked`
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle(`User ${verb}`)
        .setDescription(
          `${userMention(
            user.id,
          )} is now ${verb} from making new modmail threads`,
        ),
    ],
    ephemeral: true,
  }
}

export const BlockCommand = slashCommand({
  name: "block",
  description: "Toggles whether a user is able to open modmail threads",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  nsfw: false,
  options: [
    { name: "user", description: "Target user", type: "user", required: true },
  ],
  async handle(interaction, user) {
    await interaction.reply(await block(user))
  },
})
