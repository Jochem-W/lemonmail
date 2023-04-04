export const Variables = {
  discordToken: process.env["DISCORD_BOT_TOKEN"] as string,
  commitHash: process.env["COMMIT_HASH"],
  githubToken: process.env["GITHUB_TOKEN"] as string,
  nodeEnvironment: process.env["NODE_ENV"] as string,
}
