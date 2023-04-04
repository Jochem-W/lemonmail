import { Prisma } from "../clients.mjs"
import { RegisteredCommands } from "../commands.mjs"
import { CommandNotFoundByNameError } from "../errors.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import type { GuildMember } from "discord.js"
import {
  channelMention,
  chatInputApplicationCommandMention,
  EmbedBuilder,
  inlineCode,
  roleMention,
  userMention,
} from "discord.js"

export async function staffInfoMessage(member: GuildMember) {
  const threads = await Prisma.thread.findMany({ where: { userId: member.id } })

  const roles = [...member.roles.cache.values()]

  let closeCommand
  for (const [id, command] of RegisteredCommands) {
    if (command.builder.name === "close") {
      closeCommand = { id, command }
    }
  }

  if (!closeCommand) {
    throw new CommandNotFoundByNameError("close")
  }

  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: formatName(member),
          iconURL: member.displayAvatarURL(),
        })
        .setTitle("New thread")
        .setDescription(
          `Prefix a message with "${inlineCode(
            DefaultConfig.sendPrefix.trim()
          )}" to reply. Use ${chatInputApplicationCommandMention(
            closeCommand.command.builder.name,
            closeCommand.id
          )} to close the thread.`
        )
        .setFields(
          { name: "User", value: userMention(member.id) },
          { name: "User ID", value: member.id },
          {
            name: "Previous threads",
            value: threads.map((t) => channelMention(t.id)).join("\n") || "-",
          },
          {
            name: "Roles",
            value:
              roles
                .filter((r) => r.id !== member.guild.roles.everyone.id)
                .map((r) => roleMention(r.id))
                .join("\n") || "-",
          }
        )
        .setTimestamp(new Date())
        .setColor(0x0080ff),
    ],
  }
}
