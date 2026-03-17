import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core"

export const mrMaster = pgTable("mr_master", {
  mrId: uuid("mr_id").defaultRandom().primaryKey(),

  name: text("name").notNull(),

  company: text("company").notNull(),

  division: text("division").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
})

export const mrVisits = pgTable(
  "mr_visits",
  {
    visitId: uuid("visit_id").defaultRandom().primaryKey(),

    mrId: uuid("mr_id")
      .notNull()
      .references(() => mrMaster.mrId, {
        onDelete: "restrict",
      }),

    visitDate: date("visit_date").notNull().defaultNow(),

    visitType: text("visit_type").default("normal"),

    // this column enables monthly visit tracking
    visitMonth: date("visit_month"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      mrMonthIndex: index("idx_mr_visits_mr_month").on(
        table.mrId,
        table.visitMonth
      ),
    }
  }
)
