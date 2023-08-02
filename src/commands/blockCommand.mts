import { ORM } from "../clients.mjs"
import { slashCommand, slashOption } from "../models/slashCommand.mjs"
import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandUserOption,
  User,
  userMention,
} from "discord.js"

export async function block(user: User) {
  let prismaUser = await ORM.user.findFirst({ where: { id: user.id } })
  if (!prismaUser) {
    prismaUser = await ORM.user.create({
      data: { id: user.id, blocked: true },
    })
  } else {
    prismaUser = await ORM.user.update({
      where: { id: user.id },
      data: { blocked: !prismaUser.blocked },
    })
  }

  const verb = `${prismaUser.blocked ? "" : "un"}blocked`
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

// export class BlockCommand extends ChatInputCommand {
//   public constructor() {
//     super(
//       "block",
//       "Toggles whether a user is able to open modmail threads",
//       PermissionFlagsBits.ModerateMembers
//     )
//     this.builder.addStringOption((builder) =>
//       builder
//         .setName("user")
//         .setDescription("The target user")
//         .setRequired(true)
//     )
//   }

//   public async handle(interaction: ChatInputCommandInteraction) {
//     await block(interaction)
//   }
// }

export const BlockCommand = slashCommand({
  name: "block",
  description: "Toggles whether a user is able to open modmail threads",
  defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
  dmPermission: false,
  options: [
    slashOption(
      true,
      new SlashCommandUserOption()
        .setName("user")
        .setDescription("Target user"),
    ),
  ],
  async handle(interaction, user) {
    await interaction.reply(await block(user))
  },
})
