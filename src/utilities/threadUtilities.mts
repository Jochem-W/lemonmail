import { ORM } from "../clients.mjs"
import { dmsDisabledMessage } from "../messages/dmsDisabledMessage.mjs"
import { memberLeftMessage } from "../messages/memberLeftMessage.mjs"
import { receivedMessage } from "../messages/receivedMessage.mjs"
import { sentMessage } from "../messages/sentMessage.mjs"
import { staffInfoMessage } from "../messages/staffInfoMessage.mjs"
import { threadStatusMessage } from "../messages/threadStatusMessage.mjs"
import { Config } from "../models/config.mjs"
import {
  displayName,
  fetchChannel,
  tryFetchMember,
} from "./discordUtilities.mjs"
import type { Thread } from "@prisma/client"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"
import type { CommandInteraction, GuildMember } from "discord.js"
import {
  AttachmentBuilder,
  bold,
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
  Message,
  RESTJSONErrorCodes,
} from "discord.js"
import { Stream } from "stream"
import { MIMEType } from "util"

export function attachmentsToEmbeds(message: Message, colour?: number) {
  const embeds = []
  for (const attachment of message.attachments.values()) {
    if (!attachment.contentType) {
      continue
    }

    const mimeType = new MIMEType(attachment.contentType)
    if (mimeType.type === "image") {
      embeds.push(
        new EmbedBuilder()
          .setImage(`attachment://${attachment.id}_${attachment.name}`)
          .setColor(colour ?? null),
      )
    }
  }

  return embeds
}

export async function createThreadFromMessage(message: Message) {
  const mailForum = await fetchChannel(
    message.client,
    Config.channels.mail,
    ChannelType.GuildForum,
  )

  const member = await mailForum.guild.members.fetch(message.author.id)

  const channel = await mailForum.threads.create({
    name: `${displayName(member)} ${member.id}`,
    message: await staffInfoMessage(member),
    reason: "Member sent a direct message to the bot",
    appliedTags: [Config.tags.open, Config.tags.awaitingStaff],
  })

  let thread
  try {
    thread = await ORM.thread.create({
      data: {
        id: channel.id,
        userId: member.id,
        active: true,
        source: "DM",
        lastMessage: message.id, // TODO: this is technically wrong
      },
    })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      await channel.delete()
    }

    throw e
  }

  await channel.messages.pin(channel.id, "Make the message more easy to find")

  const staffMembers = await ORM.staffMember.findMany({
    where: { addToThread: true },
  })
  for (const staffMember of staffMembers) {
    await channel.members.add(
      staffMember.id,
      "Staff member has opted in to pings",
    )
  }

  await member.send(
    await threadStatusMessage(
      message,
      "opened",
      "Any messages you send here will be automatically sent to staff.",
    ),
  )

  return thread
}

export async function createThreadFromInteraction(
  member: GuildMember,
  interaction: CommandInteraction,
) {
  const mailForum = await fetchChannel(
    member.client,
    Config.channels.mail,
    ChannelType.GuildForum,
  )

  const channel = await mailForum.threads.create({
    name: `${displayName(member)} ${member.id}`,
    message: await staffInfoMessage(member),
    reason: "Staff member manually opened a thread",
    appliedTags: [Config.tags.open, Config.tags.awaitingStaff],
  })

  let thread
  try {
    thread = await ORM.thread.create({
      data: {
        id: channel.id,
        userId: member.id,
        active: true,
        source: "GUILD",
        lastMessage: interaction.id,
      },
    })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      await channel.delete()
    }

    throw e
  }

  await channel.messages.pin(channel.id, "Make the message more easy to find")

  const staffMembers = await ORM.staffMember.findMany({
    where: { addToThread: true },
  })
  for (const staffMember of staffMembers) {
    await channel.members.add(
      staffMember.id,
      "Staff member has opted in to pings",
    )
  }

  try {
    await member.send(
      await threadStatusMessage(
        interaction,
        "opened",
        "Any messages you send here will be automatically sent to staff.",
      ),
    )
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
    ) {
      throw e
    }

    await channel.send(dmsDisabledMessage(member))
  }

  return thread
}

export async function processGuildMessage(
  thread: Thread,
  message: Message,
  prefix: string,
) {
  const guild = await message.client.guilds.fetch(Config.guild)

  const member = await tryFetchMember(guild, thread.userId)
  if (!member) {
    await message.channel.send(memberLeftMessage(thread, message))
    return
  }

  try {
    await member.send(await receivedMessage(message, prefix))
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
    ) {
      throw e
    }

    await message.channel.send(dmsDisabledMessage(member, message))
    await ORM.thread.update({
      where: { id: thread.id },
      data: { lastMessage: message.id },
    })
    return
  }

  await message.channel.send(await sentMessage(message, prefix))
  await message.delete()

  await ORM.thread.update({
    where: { id: thread.id },
    data: { lastMessage: message.id },
  })

  const author = (await tryFetchMember(guild, message.author)) ?? message.author

  await message.channel.messages.edit(thread.id, {
    content: `📤 ${bold(displayName(author))}: ${
      message.content.replace(prefix, "") || "[no text content]"
    }`,
  })
  if (message.channel.isThread()) {
    await message.channel.setAppliedTags([
      Config.tags.open,
      Config.tags.awaitingUser,
    ])
  }
}

export async function processDmMessage(message: Message) {
  let thread = await ORM.thread.findFirst({
    where: { userId: message.author.id, active: true },
  })

  if (!thread) {
    thread = await createThreadFromMessage(message)
  }

  const channel = await fetchChannel(
    message.client,
    thread.id,
    ChannelType.PublicThread,
  )

  await channel.send(await receivedMessage(message))

  const member = await tryFetchMember(channel.guild, message.author.id)
  try {
    await message.author.send(await sentMessage(message))
  } catch (e) {
    if (!member) {
      await channel.send(memberLeftMessage(thread))
    } else {
      await channel.send(dmsDisabledMessage(member))
    }
  }

  await ORM.thread.update({
    where: { id: thread.id },
    data: { lastMessage: message.id },
  })

  await channel.messages.edit(thread.id, {
    content: `📥 ${bold(displayName(member ?? message.author))}: ${
      message.content || "[no text content]"
    }`,
  })
  await channel.setAppliedTags([Config.tags.open, Config.tags.awaitingStaff])
}

export async function renameAttachments(message: Message) {
  return await Promise.all(
    message.attachments.map(async (a) => {
      const response = await fetch(a.url)
      return new AttachmentBuilder(response.body as unknown as Stream).setName(
        `${a.id}_${a.name}`,
      )
    }),
  )
}

export function messageIsNotEmpty(message: Message) {
  return message.content || message.attachments.size !== 0
}

export function messageIsFromUser(message: Message) {
  return !message.author.bot && !message.system
}

export function messageHasSendPrefix(message: Message) {
  for (const prefix of Config.sendPrefixes) {
    if (
      message.content.startsWith(`${prefix} `) ||
      (message.content === prefix && message.attachments.size !== 0)
    ) {
      return prefix
    }
  }

  return false
}
