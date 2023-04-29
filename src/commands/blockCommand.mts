import { Prisma } from "../clients.mjs"
import { ChatInputCommand } from "../models/chatInputCommand.mjs"
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  UserContextMenuCommandInteraction,
  userMention,
} from "discord.js"

export async function block(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction
) {
  const user = interaction.options.getUser("user", true)
  let prismaUser = await Prisma.user.findFirst({ where: { id: user.id } })
  if (!prismaUser) {
    prismaUser = await Prisma.user.create({
      data: { id: user.id, blocked: true },
    })
  } else {
    prismaUser = await Prisma.user.update({
      where: { id: user.id },
      data: { blocked: !prismaUser.blocked },
    })
  }

  const verb = `${prismaUser.blocked ? "" : "un"}blocked`
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`User ${verb}`)
        .setDescription(
          `${userMention(
            user.id
          )} is now ${verb} from making new modmail threads`
        ),
    ],
  })
}

export class BlockCommand extends ChatInputCommand {
  public constructor() {
    super(
      "block",
      "Toggles whether a user is able to open modmail threads",
      PermissionFlagsBits.ModerateMembers
    )
    this.builder.addStringOption((builder) =>
      builder
        .setName("user")
        .setDescription("The target user")
        .setRequired(true)
    )
  }

  public async handle(interaction: ChatInputCommandInteraction) {
    await block(interaction)
  }
}
