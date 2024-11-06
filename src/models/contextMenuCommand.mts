import { NotImplementedError } from "../errors.mjs"
import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  type Message,
  type MessageContextMenuCommandInteraction,
  type User,
  type UserContextMenuCommandInteraction,
  ContextMenuCommandType,
  InteractionContextType,
} from "discord.js"

type CustomContextMenuCommandType =
  | ApplicationCommandType.Message
  | ApplicationCommandType.User

type Interaction<T extends CustomContextMenuCommandType> =
  T extends ApplicationCommandType.Message
    ? MessageContextMenuCommandInteraction
    : T extends ApplicationCommandType.User
      ? UserContextMenuCommandInteraction
      : never

type Value<T extends CustomContextMenuCommandType> =
  T extends ApplicationCommandType.Message
    ? Message
    : T extends ApplicationCommandType.User
      ? User
      : never

export function contextMenuCommand<T extends CustomContextMenuCommandType>({
  name,
  type,
  defaultMemberPermissions,
  dmPermission,
  transform,
  handle,
}: {
  name: string
  type: T
  defaultMemberPermissions: bigint | null
  dmPermission: boolean
  transform?: (builder: ContextMenuCommandBuilder) => void
  handle: (interaction: Interaction<T>, value: Value<T>) => Promise<void>
}) {
  const contexts = [InteractionContextType.Guild]
  if (dmPermission) {
    contexts.push(
      InteractionContextType.PrivateChannel,
      InteractionContextType.BotDM,
    )
  }

  const builder = new ContextMenuCommandBuilder()
    .setName(name)
    .setType(type as ContextMenuCommandType)
    .setDefaultMemberPermissions(defaultMemberPermissions)
    .setContexts(contexts)

  if (transform) {
    transform(builder)
  }

  const getOptionAndHandle = async (interaction: Interaction<T>) => {
    switch (interaction.commandType) {
      case ApplicationCommandType.Message:
        await handle(interaction, interaction.targetMessage as Value<T>)
        break
      case ApplicationCommandType.User:
        await handle(interaction, interaction.targetUser as Value<T>)
        break
      default:
        throw new NotImplementedError(
          `Context menu commands of this type haven't been implemented yet.`,
        )
    }
  }

  return { builder, handle: getOptionAndHandle, type }
}
