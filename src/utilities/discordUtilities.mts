import { Discord } from "../clients.mjs"
import {
  ChannelNotFoundError,
  GuildOnlyError,
  InvalidChannelTypeError,
  OwnerOnlyError,
} from "../errors.mjs"
import { DefaultConfig } from "../models/config.mjs"
import type {
  FetchChannelOptions,
  GuildBasedChannel,
  Snowflake,
} from "discord.js"
import {
  ChannelType,
  DiscordAPIError,
  RESTJSONErrorCodes,
  Team,
} from "discord.js"
import type {
  FetchMemberOptions,
  Interaction,
  UserResolvable,
} from "discord.js"

const guild = await Discord.guilds.fetch(DefaultConfig.guild.id)

export async function tryFetchMember(
  options: FetchMemberOptions | UserResolvable
) {
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
  id: Snowflake,
  type: T,
  options?: FetchChannelOptions
) {
  const channel = await Discord.channels.fetch(id, options)
  if (!channel) {
    throw new ChannelNotFoundError(id)
  }

  if (channel.type !== type) {
    throw new InvalidChannelTypeError(channel, type)
  }

  return channel as Extract<GuildBasedChannel, { type: T }>
}

export async function fetchInteractionGuild(interaction: Interaction) {
  if (!interaction.inGuild()) {
    throw new GuildOnlyError()
  }

  return interaction.guild ?? (await Discord.guilds.fetch(interaction.guildId))
}

export async function ensureOwner(interaction: Interaction) {
  let application = interaction.client.application
  if (!application.owner) {
    application = await application.fetch()
  }

  if (!application.owner) {
    throw new OwnerOnlyError()
  }

  if (application.owner instanceof Team) {
    if (!application.owner.members.has(interaction.user.id)) {
      throw new OwnerOnlyError()
    }

    return
  }

  if (application.owner.id !== interaction.user.id) {
    throw new OwnerOnlyError()
  }
}

export function isInPrivateChannel(interaction: Interaction) {
  if (!interaction.inGuild()) {
    return false
  }

  if (!interaction.channelId) {
    return false
  }

  return DefaultConfig.guild.privateChannels.includes(interaction.channelId)
}
