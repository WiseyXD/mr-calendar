import { pgTable, uuid, text, timestamp, date } from "drizzle-orm/pg-core"

export const mrMaster = pgTable("mr_master", {
  mrId: uuid("mr_id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  division: text("division").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const mrVisits = pgTable("mr_visits", {
  visitId: uuid("visit_id").defaultRandom().primaryKey(),
  mrId: uuid("mr_id").notNull(),
  visitDate: date("visit_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
})
