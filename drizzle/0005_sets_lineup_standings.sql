CREATE TABLE "match_players" (
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	CONSTRAINT "match_players_match_id_player_id_pk" PRIMARY KEY("match_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "set_scores" jsonb;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "mvp_player_id" uuid;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "standings" jsonb;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "standings_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_players_player_idx" ON "match_players" USING btree ("player_id");--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_mvp_player_id_players_id_fk" FOREIGN KEY ("mvp_player_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;