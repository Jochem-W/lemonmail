import { DefaultConfig } from "../models/config.mjs"
import type { Thread } from "@prisma/client"
import { channelMention, EmbedBuilder } from "discord.js"

export function threadAlreadyExistsMessage(thread: Thread) {
  return {
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: "Thread already exists",
          iconURL: DefaultConfig.icons.fail.toString(),
        })
        .setDescription(
          `A thread for this member already exists! ${channelMention(
            thread.id
          )}`
        )
        .setColor(0xff0000),
    ],
    ephemeral: true,
  }
}
