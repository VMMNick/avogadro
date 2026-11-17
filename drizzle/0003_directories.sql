CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"city" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"address" varchar(200),
	"map_query" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "venue_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "teams_name_unique" ON "teams" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "venues_name_unique" ON "venues" USING btree (lower("name"));--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Наповнюємо довідники суперниками й залами з уже внесених матчів
INSERT INTO "teams" ("name")
SELECT DISTINCT ON (lower(btrim("opponent"))) btrim("opponent")
FROM "matches" WHERE btrim("opponent") <> ''
ORDER BY lower(btrim("opponent")), "starts_at" DESC;--> statement-breakpoint
INSERT INTO "venues" ("name")
SELECT DISTINCT ON (lower(btrim("location"))) btrim("location")
FROM "matches" WHERE "location" IS NOT NULL AND btrim("location") <> ''
ORDER BY lower(btrim("location")), "starts_at" DESC;--> statement-breakpoint
UPDATE "matches" m SET "team_id" = t."id" FROM "teams" t WHERE lower(btrim(m."opponent")) = lower(t."name");--> statement-breakpoint
UPDATE "matches" m SET "venue_id" = v."id" FROM "venues" v WHERE lower(btrim(m."location")) = lower(v."name");
