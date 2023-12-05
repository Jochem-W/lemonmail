import { boolean, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core"

export const sourceEnum = pgEnum("sourceEnum", ["dm", "guild"])

export const threadsTable = pgTable(
  "threads",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    active: boolean("active"),
    source: sourceEnum("source").notNull(),
    closedReason: text("closedReason"),
    lastMessage: text("lastMessage").notNull(),
  },
  (table) => ({
    unique: unique().on(table.active, table.userId),
  }),
)

export const staffTable = pgTable("staff", {
  id: text("id").primaryKey(),
})

export const blockedTable = pgTable("blocked", {
  id: text("id").primaryKey(),
})
