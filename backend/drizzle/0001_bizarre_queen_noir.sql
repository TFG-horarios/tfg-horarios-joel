DROP INDEX "itinerary_code_degree_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "itinerary_code_org_idx" ON "itinerary" USING btree ("organization_id","code") WHERE deleted_at IS NULL;