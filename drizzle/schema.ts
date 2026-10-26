import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// lowercase + collapse/trim whitespace, so " rahul  SHARMA " matches "Rahul Sharma"
const normalized = (column: string) =>
  `lower(btrim(regexp_replace(${column}, '\\s+', ' ', 'g')))`

// Two MRs are duplicates when name + company + division match after normalizing
export const DEDUPE_KEY_SQL = `${normalized("name")} || '|' || ${normalized("company")} || '|' || ${normalized("division")}`

export const mrMaster = pgTable(
  "mr_master",
  {
    mrId: uuid("mr_id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    company: text("company").notNull(),

    division: text("division").notNull(),

    // filled in by Postgres. Not marked notNull(): drizzle-kit push would then
    // offer to TRUNCATE the table to add it (it's never null in practice)
    dedupeKey: text("dedupe_key").generatedAlwaysAs(sql.raw(DEDUPE_KEY_SQL)),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => {
    return {
      dedupeKeyIndex: uniqueIndex("uq_mr_master_dedupe_key").on(table.dedupeKey),
    }
  }
)

export const mrVisits = pgTable(
  "mr_visits",
  {
    visitId: uuid("visit_id").defaultRandom().primaryKey(),

    mrId: uuid("mr_id")
      .notNull()
      .references(() => mrMaster.mrId, {
        onDelete: "restrict",
      }),

    // IST calendar date, always set by the server (see lib/visit-rules.ts)
    visitDate: date("visit_date").notNull().defaultNow(),

    // "senior" means the MR skipped his cooldown by coming with a senior
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
      // one visit per MR per day (stops double-taps)
      mrDateIndex: uniqueIndex("uq_mr_visits_mr_date").on(
        table.mrId,
        table.visitDate
      ),
      dateIndex: index("idx_mr_visits_date").on(table.visitDate),
    }
  }
)
