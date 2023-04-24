import { Variables } from "./variables.mjs"
import { PrismaClient } from "@prisma/client"
import { Client, GatewayIntentBits, Partials } from "discord.js"

export const Discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.ThreadMember,
  ],
})
Discord.rest.setToken(Variables.discordToken)
export const Prisma = new PrismaClient()
