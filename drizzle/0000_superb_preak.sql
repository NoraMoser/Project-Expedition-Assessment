CREATE TABLE IF NOT EXISTS "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"region" text NOT NULL,
	"cost_level" text NOT NULL,
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"average_daily_budget" integer NOT NULL,
	"annual_visitors" bigint NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
