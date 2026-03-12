CREATE TABLE "mr_master" (
	"mr_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company" text NOT NULL,
	"division" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mr_visits" (
	"visit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mr_id" uuid NOT NULL,
	"visit_date" date DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
