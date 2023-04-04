import { Prisma } from "../clients.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import { DefaultConfig } from "../models/config.mjs"
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js"

export class ToggleAddCommand extends ChatInputCommand {
  public constructor() {
    super(
      "toggle-add",
      "Toggles whether you want to be added to new ModMail threads",
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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: "Settings updated",
            iconURL: DefaultConfig.icons.success.toString(),
          })
          .setDescription(
            `You will now ${
              !staffMember.addToThread ? "no longer" : ""
            } be added to new ModMail threads`
          ),
      ],
      ephemeral: true,
    })
  }
}