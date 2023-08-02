import { Prisma } from "../clients.mjs"
import { slashCommand } from "../models/slashCommand.mjs"
import { EmbedBuilder, PermissionFlagsBits } from "discord.js"

export const ThreadAutoAddCommand = slashCommand({
  name: "thread-auto-add",
  description:
    "Toggles whether you're automatically added to new modmail threads",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  async handle(interaction) {
    await interaction.deferReply({ ephemeral: true })

    let staffMember = await Prisma.staffMember.findFirst({
      where: { id: interaction.user.id },
    })

    if (!staffMember) {
      staffMember = await Prisma.staffMember.create({
        data: { id: interaction.user.id, addToThread: true },
      })
    } else {
      staffMember = await Prisma.staffMember.update({
        where: { id: staffMember.id },
        data: { addToThread: !staffMember.addToThread },
      })
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Settings updated")
          .setDescription(
            `You will now ${
              !staffMember.addToThread ? "no longer" : ""
            } be added to new modmail threads`,
          ),
      ],
    })
  },
})
