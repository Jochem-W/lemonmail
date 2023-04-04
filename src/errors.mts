import { DefaultConfig } from "./models/config.mjs"
import type { CustomId } from "./models/customId.mjs"
import { customIdToString } from "./models/customId.mjs"
import type { Command } from "./types/command.mjs"
import { fetchChannel } from "./utilities/discordUtilities.mjs"
import { makeErrorEmbed } from "./utilities/embedUtilities.mjs"
import type { Thread } from "@prisma/client"
import { ChannelType, CommandInteraction, GuildMember } from "discord.js"
import type { Channel } from "discord.js"

class CustomError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

export class BotError extends CustomError {
  public constructor(message: string) {
    super(message)
  }
}

export class ThreadAlreadyExistsError extends BotError {
  public readonly thread: Thread

  public constructor(thread: Thread, member: GuildMember) {
    super(`A thread for ${member.user.tag} (${member.id}) already exists`)
    this.thread = thread
  }
}

export class NoTargetUserError extends BotError {
  public constructor() {
    super("A target user couldn't be found")
  }
}

export class InvalidArgumentsError extends BotError {
  public constructor(message: string) {
    super(message)
  }
}

export class CommandNotFoundError extends BotError {
  public constructor(message: string) {
    super(message)
  }
}

export class CommandNotFoundByIdError extends CommandNotFoundError {
  public constructor(commandId: string) {
    super(`Command with ID "${commandId}" couldn't be found.`)
  }
}

export class CommandNotFoundByNameError extends CommandNotFoundError {
  public constructor(commandName: string) {
    super(`Command with name "${commandName}" couldn't be found.`)
  }
}

export class SubcommandGroupNotFoundError extends BotError {
  public constructor(interaction: CommandInteraction, subcommandGroup: string) {
    super(
      `Couldn't find subcommand group ${subcommandGroup} for command ${interaction.commandName} (${interaction.commandId})`
    )
  }
}

export class SubcommandNotFoundError extends BotError {
  public constructor(interaction: CommandInteraction, subcommand: string) {
    super(
      `Couldn't find subcommand ${subcommand} for command ${interaction.commandName} (${interaction.commandId})`
    )
  }
}

export class NoAutocompleteHandlerError extends BotError {
  public constructor(command: Command<CommandInteraction>) {
    super(`Command "${command.builder.name}" has no autocomplete handler.`)
  }
}

export class NoMessageComponentHandlerError extends BotError {
  public constructor(command: Command<CommandInteraction>) {
    super(
      `Command "${command.builder.name}" doesn't support message component interactions.`
    )
  }
}

export class NoPermissionError extends BotError {
  public constructor() {
    super("You don't have permission to use this command.")
  }
}

export class GuildOnlyError extends BotError {
  public constructor() {
    super("This command can only be used in a server.")
  }
}

export class InvalidCustomIdError extends BotError {
  public constructor(customId: string | CustomId) {
    if (typeof customId !== "string") {
      customId = customIdToString(customId)
    }

    super(`Invalid custom ID "${customId}".`)
  }
}

export class ChannelNotFoundError extends BotError {
  public constructor(channelId: string) {
    super(`Channel with ID "${channelId}" couldn't be found.`)
  }
}

export class InvalidChannelTypeError extends BotError {
  public constructor(channel: Channel, expected: ChannelType) {
    if ("name" in channel && channel.name) {
      super(
        `Channel "${channel.name}" (ID: "${channel.id}") is not of type "${expected}".`
      )
      return
    }

    super(`Channel "${channel.id}" is not of type "${expected}".`)
  }
}

export class OwnerOnlyError extends BotError {
  public constructor() {
    super("This command can only be used by the bot owner.")
  }
}

export class ButtonNotFoundError extends BotError {
  public constructor(customId: CustomId) {
    super(`Couldn't find a button for custom ID ${customIdToString(customId)}`)
  }
}

export class ModalNotFoundError extends BotError {
  public constructor(customId: CustomId) {
    super(`Couldn't find a modal for custom ID ${customIdToString(customId)}`)
  }
}

export class DuplicateNameError extends BotError {
  public constructor(type: "button" | "modal", name: string) {
    super(`A ${type} with the name ${name} already exists`)
  }
}

export class UnregisteredNameError extends BotError {
  public constructor(type: "button" | "modal", name: string) {
    super(`A ${type} with the name ${name} doesn't exist`)
  }
}

export async function reportError(error: Error) {
  console.error(error)
  const channel = await fetchChannel(
    DefaultConfig.guild.errorChannel,
    ChannelType.GuildText
  )
  await channel.send({ embeds: [makeErrorEmbed(error)] })
}
