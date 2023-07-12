import { BlockCommand } from "./commands/blockCommand.mjs"
import { BlockContextCommand } from "./commands/blockContextCommand.mjs"
import { CloseCommand } from "./commands/closeCommand.mjs"
import { OpenCommand } from "./commands/openCommand.mjs"
import { OpenContextCommand } from "./commands/openContextCommand.mjs"
import { ThreadAutoAddCommand } from "./commands/threadAutoAddCommand.mjs"
import type { Command } from "./types/command.mjs"
import { Collection } from "discord.js"
import type { ApplicationCommandType, Snowflake } from "discord.js"

export const SlashCommands: Command<ApplicationCommandType.ChatInput>[] = [
  BlockCommand,
  CloseCommand,
  OpenCommand,
  ThreadAutoAddCommand,
]

export const MessageContextMenuCommands: Command<ApplicationCommandType.Message>[] =
  []

export const UserContextMenuCommands: Command<ApplicationCommandType.User>[] = [
  BlockContextCommand,
  OpenContextCommand,
]

export const RegisteredCommands = new Collection<
  Snowflake,
  Command<ApplicationCommandType>
>()
