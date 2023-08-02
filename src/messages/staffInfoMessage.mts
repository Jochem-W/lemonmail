import { ORM } from "../clients.mjs"
import { RegisteredCommands } from "../commands.mjs"
import { CommandNotFoundByNameError } from "../errors.mjs"
import { Config } from "../models/config.mjs"
import { displayName } from "../utilities/discordUtilities.mjs"
import type { GuildMember } from "discord.js"
import {
  channelMention,
  chatInputApplicationCommandMention,
  EmbedBuilder,
  inlineCode,
  roleMention,
  userMention,
} from "discord.js"

function formatPrefixes() {
  if (Config.sendPrefixes.length === 0) {
    return ""
  }

  if (Config.sendPrefixes.length === 1 && Config.sendPrefixes[0]) {
    return inlineCode(Config.sendPrefixes[0].trim())
  }

  const commaSeparated = Config.sendPrefixes
    .slice(undefined, -1)
    .map(inlineCode)
    .join(", ")

  const lastPrefix = Config.sendPrefixes.at(-1)
  if (!lastPrefix) {
    return commaSeparated
  }

  return `${commaSeparated} or ${inlineCode(lastPrefix)}`
}

export async function staffInfoMessage(member: GuildMember) {
  const threads = await ORM.thread.findMany({ where: { userId: member.id } })

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
          name: displayName(member),
          iconURL: member.displayAvatarURL(),
        })
        .setTitle("New thread")
        .setDescription(
          `Prefix a message with ${formatPrefixes()} to reply. Use ${chatInputApplicationCommandMention(
            closeCommand.command.builder.name,
            closeCommand.id,
          )} to close the thread.`,
        )
        .setFields(
          { name: "User", value: userMention(member.id) },
          { name: "User ID", value: member.id },
          {
            name: "Previous threads",
            value:
              threads.map((t) => channelMention(t.id)).join("\n") || "None",
          },
          {
            name: "Roles",
            value:
              roles
                .filter((r) => r.id !== member.guild.roles.everyone.id)
                .map((r) => roleMention(r.id))
                .join("\n") || "None",
          },
        )
        .setTimestamp(new Date())
        .setColor(0x0040ff),
    ],
  }
}
