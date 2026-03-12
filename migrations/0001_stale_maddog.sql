ALTER TABLE "mr_visits" ALTER COLUMN "visit_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mr_visits" ADD COLUMN "visit_month" date;--> statement-breakpoint
ALTER TABLE "mr_visits" ADD CONSTRAINT "mr_visits_mr_id_mr_master_mr_id_fk" FOREIGN KEY ("mr_id") REFERENCES "public"."mr_master"("mr_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mr_visits_mr_month" ON "mr_visits" USING btree ("mr_id","visit_month");