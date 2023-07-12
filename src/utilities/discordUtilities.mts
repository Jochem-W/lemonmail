import { ChannelNotFoundError, InvalidChannelTypeError } from "../errors.mjs"
import {
  User,
  type Channel,
  type FetchChannelOptions,
  GuildMember,
  type PublicThreadChannel,
  type Snowflake,
  Guild,
} from "discord.js"
import { ChannelType, DiscordAPIError, RESTJSONErrorCodes } from "discord.js"
import type { Client, FetchMemberOptions, UserResolvable } from "discord.js"

export function uniqueName(user: User) {
  if (user.discriminator !== "0") {
    return `${user.username}#${user.discriminator}`
  }

  return user.username
}

export function displayName(userOrMember: User | GuildMember) {
  if (userOrMember instanceof User) {
    return userDisplayName(userOrMember)
  }

  if (userOrMember.nickname) {
    return userOrMember.nickname
  }

  return userDisplayName(userOrMember.user)
}

function userDisplayName(user: User) {
  if (user.globalName) {
    return user.globalName
  }

  return user.username
}

export async function tryFetchMember(
  data: { id: Snowflake; client: Client<true> } | Guild,
  options: FetchMemberOptions | UserResolvable
) {
  let guild
  if (!(data instanceof Guild)) {
    const { id, client } = data
    guild = await client.guilds.fetch(id)
  } else {
    guild = data
  }

  try {
    return await guild.members.fetch(options)
  } catch (e) {
    if (
      e instanceof DiscordAPIError &&
      e.code === RESTJSONErrorCodes.UnknownMember
    ) {
      return null
    }

    throw e
  }
}

export async function fetchChannel<T extends ChannelType>(
  client: Client<true>,
  id: Snowflake,
  type: T | T[],
  options?: FetchChannelOptions
) {
  const channel = await client.channels.fetch(id, {
    allowUnknownGuild: true,
    ...options,
  })
  if (!channel) {
    throw new ChannelNotFoundError(id)
  }

  if (
    (typeof type === "number" && channel.type !== type) ||
    (typeof type === "object" && !type.includes(channel.type as T))
  )
    if (channel.type !== type) {
      throw new InvalidChannelTypeError(channel, type)
    }

  return channel as T extends
    | ChannelType.PublicThread
    | ChannelType.AnnouncementThread
    ? PublicThreadChannel
    : Extract<Channel, { type: T }>
}
