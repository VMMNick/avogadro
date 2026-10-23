CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(120) NOT NULL,
	"name" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"session_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opponent" varchar(80) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"location" varchar(120),
	"our_sets" smallint,
	"their_sets" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_score_valid" CHECK (("matches"."our_sets" IS NULL AND "matches"."their_sets" IS NULL) OR ("matches"."our_sets" BETWEEN 0 AND 3 AND "matches"."their_sets" BETWEEN 0 AND 3))
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"number" smallint,
	"role" varchar(16) NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_number_range" CHECK ("players"."number" IS NULL OR "players"."number" BETWEEN 0 AND 99),
	CONSTRAINT "players_role_valid" CHECK ("players"."role" IN ('setter','spiker','middle','opposite','libero','staff'))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"tagline" varchar(160),
	"about" text,
	"phone" varchar(40),
	"email" varchar(120),
	"address" varchar(200),
	"instagram" text,
	"facebook" text,
	"telegram" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_unique" ON "admins" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "login_attempts_key_idx" ON "login_attempts" USING btree ("key","created_at");--> statement-breakpoint
CREATE INDEX "matches_starts_at_idx" ON "matches" USING btree ("starts_at");