DROP INDEX "schedule_itinerary_unique_idx";--> statement-breakpoint
DROP INDEX "schedule_common_unique_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_itinerary_unique_idx" ON "schedule" USING btree ("organization_id","degree_id","itinerary_id","academic_year","course_year","period","shift") WHERE itinerary_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "schedule_common_unique_idx" ON "schedule" USING btree ("organization_id","degree_id","academic_year","course_year","period","shift") WHERE itinerary_id IS NULL;--> statement-breakpoint
ALTER TABLE "schedule" DROP COLUMN "version";