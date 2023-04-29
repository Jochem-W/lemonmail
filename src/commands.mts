import { BlockCommand } from "./commands/blockCommand.mjs"
import { BlockContextCommand } from "./commands/blockContextCommand.mjs"
import { CloseCommand } from "./commands/closeCommand.mjs"
import { OpenCommand } from "./commands/openCommand.mjs"
import { OpenContextCommand } from "./commands/openContextCommand.mjs"
import { ThreadAutoAddCommand } from "./commands/threadAutoAddCommand.mjs"
import type { ChatInputCommand } from "./models/chatInputCommand.mjs"
import type { MessageContextMenuCommand } from "./models/messageContextMenuCommand.mjs"
import type { UserContextMenuCommand } from "./models/userContextMenuCommand.mjs"
import type { Command } from "./types/command.mjs"
import { Collection, CommandInteraction } from "discord.js"
import type { Snowflake } from "discord.js"

export const SlashCommands: ChatInputCommand[] = [
  new CloseCommand(),
  new OpenCommand(),
  new ThreadAutoAddCommand(),
  new BlockCommand(),
]

export const MessageContextMenuCommands: MessageContextMenuCommand[] = []

export const UserContextMenuCommands: UserContextMenuCommand[] = [
  new OpenContextCommand(),
  new BlockContextCommand(),
]

export const RegisteredCommands = new Collection<
  Snowflake,
  Command<CommandInteraction>
>()
