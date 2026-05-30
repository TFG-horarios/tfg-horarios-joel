ALTER TABLE "schedule_slot" ALTER COLUMN "classroom_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_slot" ALTER COLUMN "day_of_week" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_slot" ALTER COLUMN "start_time" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedule_slot" ALTER COLUMN "end_time" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_slot_classroom_time_unique_idx" ON "schedule_slot" USING btree ("classroom_id","day_of_week","start_time") WHERE classroom_id IS NOT NULL AND day_of_week IS NOT NULL AND start_time IS NOT NULL;