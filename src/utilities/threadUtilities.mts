import { Discord, Prisma } from "../clients.mjs"
import { NoTargetUserError, ThreadAlreadyExistsError } from "../errors.mjs"
import { dmsDisabledMessage } from "../messages/dmsDisabledMessage.mjs"
import { memberLeftMessage } from "../messages/memberLeftMessage.mjs"
import { receivedMessage } from "../messages/receivedMessage.mjs"
import { sentMessage } from "../messages/sentMessage.mjs"
import { staffInfoMessage } from "../messages/staffInfoMessage.mjs"
import { userInfoMessage } from "../messages/userInfoMessage.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { fetchChannel, tryFetchMember } from "./discordUtilities.mjs"
import type {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js"
import {
  ChannelType,
  DiscordAPIError,
  EmbedBuilder,
  Message,
  RESTJSONErrorCodes,
} from "discord.js"
import { MIMEType } from "util"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)
const mailForum = await fetchChannel(
  DefaultConfig.guild.mailCategory,
  ChannelType.GuildForum
)

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
          .setImage(`attachment://${attachment.name}`)
          .setColor(colour ?? null)
      )
    }
  }

  return embeds
}

export async function createThreadFromMessage(message: Message) {
  const member = await guild.members.fetch(message.author.id)

  const channel = await mailForum.threads.create({
    name: member.user.tag,
    message: await staffInfoMessage(member),
  })

  const staffMembers = await Prisma.staffMember.findMany({
    where: { addToThread: true },
  })
  for (const staffMember of staffMembers) {
    await channel.members.add(staffMember.id)
  }

  const thread = await Prisma.thread.create({
    data: {
      id: channel.id,
      userId: member.id,
      active: true,
      source: "DM",
      lastMessage: message.id, // TODO: this is technically wrong
    },
  })

  await member.send(await userInfoMessage(message, "opened"))

  return thread
}

export async function createThreadFromInteraction(
  interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction
) {
  let user
  if (interaction.isUserContextMenuCommand()) {
    user = interaction.targetUser
  } else if (interaction.isChatInputCommand()) {
    user = interaction.options.getUser("user", true)
  } else {
    throw new NoTargetUserError()
  }

  const member = await guild.members.fetch(user)

  let thread = await Prisma.thread.findFirst({
    where: { userId: user.id, active: true },
  })
  if (thread) {
    throw new ThreadAlreadyExistsError(thread, member)
  }

  const channel = await mailForum.threads.create({
    name: member.user.tag,
    message: await staffInfoMessage(member),
  })

  const staffMembers = await Prisma.staffMember.findMany({
    where: { addToThread: true },
  })
  for (const staffMember of staffMembers) {
    await channel.members.add(staffMember.id)
  }

  thread = await Prisma.thread.create({
    data: {
      id: channel.id,
      userId: member.id,
      active: true,
      source: "GUILD",
      lastMessage: interaction.id,
    },
  })

  try {
    await user.send(await userInfoMessage(interaction, "opened"))
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

export async function processGuildMessage(message: Message) {
  if (message.content.startsWith("=") || message.content.startsWith("/")) {
    return
  }

  const thread = await Prisma.thread.findFirst({
    where: { id: message.channelId, active: true },
  })

  if (!thread) {
    return
  }

  const member = await tryFetchMember(thread.userId)
  if (!member) {
    await message.channel.send(memberLeftMessage(thread, message))
    return
  }

  try {
    await member.send(await receivedMessage(message))
  } catch (e) {
    if (
      !(e instanceof DiscordAPIError) ||
      e.code !== RESTJSONErrorCodes.CannotSendMessagesToThisUser
    ) {
      throw e
    }

    await message.channel.send(dmsDisabledMessage(member, message))
    await Prisma.thread.update({
      where: { id: thread.id },
      data: { lastMessage: message.id },
    })
    return
  }

  await message.channel.send(await sentMessage(message))
  await message.delete()

  await Prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessage: message.id },
  })
}

export async function processDmMessage(message: Message) {
  let thread = await Prisma.thread.findFirst({
    where: { userId: message.author.id, active: true },
  })

  if (!thread) {
    thread = await createThreadFromMessage(message)
  }

  const channel = await fetchChannel(thread.id, ChannelType.PublicThread)

  await channel.send(await receivedMessage(message))

  try {
    await message.author.send(await sentMessage(message))
  } catch (e) {
    const member = await tryFetchMember(message.author.id)
    if (!member) {
      await channel.send(memberLeftMessage(thread))
    } else {
      await channel.send(dmsDisabledMessage(member))
    }
  }

  await Prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessage: message.id },
  })
}