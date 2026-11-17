CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season" varchar(7) NOT NULL,
	"title" varchar(120) NOT NULL,
	"title_en" varchar(120),
	"kind" varchar(16) NOT NULL,
	"note" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_kind_valid" CHECK ("achievements"."kind" IN ('gold','silver','bronze','cup','award')),
	CONSTRAINT "achievements_season_format" CHECK ("achievements"."season" ~ '^[0-9]{4}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"contact" varchar(120) NOT NULL,
	"experience" varchar(16) NOT NULL,
	"position" varchar(16),
	"message" text,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"venue_id" uuid,
	"location" varchar(120),
	"note" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainings_weekday_range" CHECK ("trainings"."weekday" BETWEEN 1 AND 7),
	CONSTRAINT "trainings_time_format" CHECK ("trainings"."start_time" ~ '^[0-2][0-9]:[0-5][0-9]$' AND "trainings"."end_time" ~ '^[0-2][0-9]:[0-5][0-9]$')
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "role" varchar(16) DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_season_idx" ON "achievements" USING btree ("season");--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_role_valid" CHECK ("admins"."role" IN ('admin','editor'));