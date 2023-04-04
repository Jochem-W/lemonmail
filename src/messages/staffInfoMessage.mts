import { Prisma } from "../clients.mjs"
import { formatName } from "../utilities/embedUtilities.mjs"
import type { GuildMember } from "discord.js"
import {
  channelMention,
  EmbedBuilder,
  inlineCode,
  roleMention,
  userMention,
} from "discord.js"

export async function staffInfoMessage(member: GuildMember) {
  const threads = await Prisma.thread.findMany({
    where: { userId: member.id },
  })

  const roles = [...member.roles.cache.values()]

  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: formatName(member),
          iconURL: member.displayAvatarURL(),
        })
        .setTitle("New thread")
        .setDescription(
          `Send a message in this thread to reply. Messages that are prefixed with ${inlineCode(
            "/"
          )} or ${inlineCode("=")} won't be sent. Use ${inlineCode(
            "/close"
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
