import { Prisma } from "../clients.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js"

export class ThreadAutoAddCommand extends ChatInputCommand {
  public constructor() {
    super(
      "thread-auto-add",
      "Toggles whether you want to be added to new modmail threads",
      PermissionFlagsBits.ModerateMembers
    )
  }

  public async handle(interaction: ChatInputCommandInteraction) {
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
            } be added to new modmail threads`
          ),
      ],
    })
  }
}
