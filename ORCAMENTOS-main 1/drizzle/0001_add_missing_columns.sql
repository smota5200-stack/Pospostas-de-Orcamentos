ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "birthday" text;
--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN IF NOT EXISTS "proposal_id" integer;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "budgets_proposal_id_unique" ON "budgets" ("proposal_id") WHERE "proposal_id" IS NOT NULL;
