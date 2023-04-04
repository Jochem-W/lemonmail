import { Discord, Prisma } from "../clients.mjs"
import { NoTargetUserError, ThreadAlreadyExistsError } from "../errors.mjs"
import { receivedMessage } from "../messages/receivedMessage.mjs"
import { sentMessage } from "../messages/sentMessage.mjs"
import { staffInfoMessage } from "../messages/staffInfoMessage.mjs"
import { userInfoMessage } from "../messages/userInfoMessage.mjs"
import { DefaultConfig } from "../models/config.mjs"
import { fetchChannel } from "./discordUtilities.mjs"
import type {
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
} from "discord.js"
import { ChannelType, EmbedBuilder, Message } from "discord.js"
import { MIMEType } from "util"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)
const mailForum = await fetchChannel(
  DefaultConfig.guild.mailCategory,
  ChannelType.GuildForum
)

export function attachmentsToEmbeds(message: Message, colour?: number) {
  const images = []
  for (const attachment of message.attachments.values()) {
    if (!attachment.contentType) {
      continue
    }

    const mimeType = new MIMEType(attachment.contentType)
    if (mimeType.type === "image") {
      images.push(
        new EmbedBuilder()
          .setImage(`attachment://${attachment.name}`)
          .setColor(colour ?? null)
      )
    }
  }

  return images
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

  if (
    await Prisma.thread.findFirst({ where: { userId: user.id, active: true } })
  ) {
    throw new ThreadAlreadyExistsError(member)
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

  const thread = await Prisma.thread.create({
    data: {
      id: channel.id,
      userId: member.id,
      active: true,
      source: "GUILD",
      lastMessage: interaction.id,
    },
  })

  await user.send(await userInfoMessage(interaction, "opened"))

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

  const member = await guild.members.fetch(thread.userId)
  await member.send(await receivedMessage(message))
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
  await message.author.send(await sentMessage(message))

  await Prisma.thread.update({
    where: { id: thread.id },
    data: { lastMessage: message.id },
  })
}
