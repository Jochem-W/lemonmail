import { Drizzle } from "../clients.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { staffTable } from "../schema.mjs"
import { EmbedBuilder, PermissionFlagsBits } from "discord.js"
import { eq } from "drizzle-orm"

export const ThreadAutoAddCommand = slashCommand({
  name: "thread-auto-add",
  description:
    "Toggles whether you're automatically added to new modmail threads",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  nsfw: false,
  async handle(interaction) {
    const [staffMember] = await Drizzle.delete(staffTable)
      .where(eq(staffTable.id, interaction.user.id))
      .returning()

    if (!staffMember) {
      await Drizzle.insert(staffTable).values({ id: interaction.user.id })
    }

    await interaction.reply({
      ephemeral: true,
      embeds: [
        new EmbedBuilder()
          .setTitle("Settings updated")
          .setDescription(
            `You will now ${
              staffMember ? "no longer" : ""
            } be added to new modmail threads`,
          ),
      ],
    })
  },
})
