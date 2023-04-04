import { DefaultConfig } from "../models/config.mjs"
import type { Thread } from "@prisma/client"
import { EmbedBuilder, Message, userMention } from "discord.js"

export function memberLeftMessage(thread: Thread, message?: Message) {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "User left",
      iconURL: DefaultConfig.icons.fail.toString(),
    })
    .setDescription(`${userMention(thread.userId)} is no longer in the server`)
    .setColor(0xff0000)
  if (!message) {
    return {
      embeds: [embed],
      ephemeral: true,
    }
  }

  return {
    embeds: [embed],
    ephemeral: true,
    reply: { messageReference: message.id },
  }
}
