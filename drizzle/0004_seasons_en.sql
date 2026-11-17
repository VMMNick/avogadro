CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "tournament_id" uuid;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tagline_en" varchar(160);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "about_en" text;--> statement-breakpoint
CREATE UNIQUE INDEX "tournaments_name_unique" ON "tournaments" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE set null ON UPDATE no action;