import { Discord } from "./clients.mjs"
import {
  MessageContextMenuCommands,
  RegisteredCommands,
  SlashCommands,
  UserContextMenuCommands,
} from "./commands.mjs"
import { CommandNotFoundByNameError, logError } from "./errors.mjs"
import { Handlers } from "./handlers.mjs"
import { DefaultConfig } from "./models/config.mjs"
import type { Command } from "./types/command.mjs"
import { Variables } from "./variables.mjs"
import { ApplicationCommandType, Routes } from "discord.js"
import type {
  RESTPutAPIApplicationGuildCommandsResult,
  RESTPutAPIApplicationGuildCommandsJSONBody,
} from "discord.js"

const commandsBody: RESTPutAPIApplicationGuildCommandsJSONBody = []
for (const command of [
  ...SlashCommands,
  ...MessageContextMenuCommands,
  ...UserContextMenuCommands,
]) {
  commandsBody.push(command.builder.toJSON())
  console.log(`Constructed command '${command.builder.name}'`)
}

const route =
  Variables.nodeEnvironment === "production"
    ? Routes.applicationCommands(DefaultConfig.bot.applicationId)
    : Routes.applicationGuildCommands(
        DefaultConfig.bot.applicationId,
        DefaultConfig.guild.id
      )

const applicationCommands = (await Discord.rest.put(route, {
  body: commandsBody,
})) as RESTPutAPIApplicationGuildCommandsResult
console.log("Commands updated")
for (const applicationCommand of applicationCommands) {
  let command: Command<ApplicationCommandType> | undefined
  switch (applicationCommand.type) {
    case ApplicationCommandType.ChatInput:
      command = SlashCommands.find(
        (command) => command.builder.name === applicationCommand.name
      )
      break
    case ApplicationCommandType.User:
      command = UserContextMenuCommands.find(
        (command) => command.builder.name === applicationCommand.name
      )
      break
    case ApplicationCommandType.Message:
      command = MessageContextMenuCommands.find(
        (command) => command.builder.name === applicationCommand.name
      )
      break
  }

  if (!command) {
    throw new CommandNotFoundByNameError(applicationCommand.name)
  }

  RegisteredCommands.set(applicationCommand.id, command)
}

for (const handler of Handlers) {
  if (handler.once) {
    Discord.once(handler.event, async (...args) => {
      try {
        await handler.handle(...args)
      } catch (e) {
        if (!(e instanceof Error)) {
          throw e
        }

        await logError(e)
      }
    })
    continue
  }

  Discord.on(handler.event, async (...args) => {
    try {
      await handler.handle(...args)
    } catch (e) {
      if (!(e instanceof Error)) {
        throw e
      }

      await logError(e)
    }
  })
}

await Discord.login(Variables.discordToken)
