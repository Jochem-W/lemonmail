import type { Snowflake } from "discord.js"
import { readFile } from "fs/promises"

type RawConfig = {
  bot: {
    applicationId: string
  }
  guild: {
    errorChannel: string
    id: string
    mailForum: string
    restart: {
      channel: string
      user?: string
    }
  }
  icons: {
    fail: string
    success: string
    warning: string
  }
  repository: {
    name: string
    owner: string
  }
  sendPrefixes: string[]
}

class BotConfig {
  public readonly applicationId: Snowflake

  public constructor(data: RawConfig["bot"]) {
    this.applicationId = data.applicationId
  }
}

class GuildConfig {
  public readonly errorChannel: Snowflake
  public readonly id: Snowflake
  public readonly mailForum: Snowflake
  public readonly restart: GuildRestartConfig

  public constructor(data: RawConfig["guild"]) {
    this.errorChannel = data.errorChannel
    this.id = data.id
    this.mailForum = data.mailForum
    this.restart = new GuildRestartConfig(data.restart)
  }
}

class GuildRestartConfig {
  public readonly channel: Snowflake
  public readonly user?: Snowflake

  public constructor(data: RawConfig["guild"]["restart"]) {
    this.channel = data.channel
    if (data.user) {
      this.user = data.user
    }
  }
}

class IconsConfig {
  public readonly fail: URL
  public readonly success: URL
  public readonly warning: URL

  public constructor(data: RawConfig["icons"]) {
    this.fail = new URL(data.fail)
    this.success = new URL(data.success)
    this.warning = new URL(data.warning)
  }
}

class RepositoryConfig {
  public readonly name: string
  public readonly owner: string

  public constructor(data: RawConfig["repository"]) {
    this.name = data.name
    this.owner = data.owner
  }
}

class Config {
  public readonly bot: BotConfig
  public readonly guild: GuildConfig
  public readonly icons: IconsConfig
  public readonly repository: RepositoryConfig
  public readonly sendPrefixes: string[]

  private constructor(data: RawConfig) {
    this.bot = new BotConfig(data.bot)
    this.guild = new GuildConfig(data.guild)
    this.icons = new IconsConfig(data.icons)
    this.repository = new RepositoryConfig(data.repository)
    this.sendPrefixes = data.sendPrefixes
  }

  public static async load() {
    return new Config(
      JSON.parse(await readFile("config.json", "utf-8")) as RawConfig
    )
  }
}

export const DefaultConfig = await Config.load()
