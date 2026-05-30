-- Custom SQL migration file --
DROP INDEX IF EXISTS "schedule_slot_classroom_time_unique_idx";--> statement-breakpoint
ALTER TABLE "schedule_slot" DROP COLUMN IF EXISTS "start_time";--> statement-breakpoint
ALTER TABLE "schedule_slot" DROP COLUMN IF EXISTS "end_time";--> statement-breakpoint
ALTER TABLE "schedule_slot" ADD COLUMN "slot_index" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_slot_classroom_time_unique_idx" ON "schedule_slot" USING btree ("classroom_id", "day_of_week", "slot_index", "schedule_id") WHERE classroom_id IS NOT NULL AND day_of_week IS NOT NULL AND slot_index IS NOT NULL;