CREATE TYPE "public"."group_type" AS ENUM('theory', 'problems', 'practices');--> statement-breakpoint
CREATE TYPE "public"."period_type" AS ENUM('semester', 'trimestral', 'annual');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."shift" AS ENUM('morning', 'afternoon');--> statement-breakpoint
CREATE TABLE "classroom" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "classroom_organization_id_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"period_type" "period_type" NOT NULL,
	"morning_start" time DEFAULT '08:00:00' NOT NULL,
	"afternoon_start" time DEFAULT '14:00:00' NOT NULL,
	"morning_end" time DEFAULT '14:00:00' NOT NULL,
	"afternoon_end" time DEFAULT '20:00:00' NOT NULL,
	"slot_duration_minutes" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_member_organization_id_user_id_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"academic_year" text NOT NULL,
	"shift" "shift" NOT NULL,
	"course_year" integer NOT NULL,
	"period" integer NOT NULL,
	"status" "schedule_status" DEFAULT 'draft' NOT NULL,
	"version" text DEFAULT 'v1' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_organization_id_academic_year_course_year_shift_period_version_unique" UNIQUE("organization_id","academic_year","course_year","shift","period","version")
);
--> statement-breakpoint
CREATE TABLE "schedule_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"subject_group_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"available_shifts" "shift"[] NOT NULL,
	"number_of_students" integer NOT NULL,
	"course_year" integer NOT NULL,
	"degree" text NOT NULL,
	"period" integer DEFAULT 0 NOT NULL,
	"weekly_hours" integer DEFAULT 0 NOT NULL,
	"is_common" boolean DEFAULT true NOT NULL,
	"itinerary_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_organization_id_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "subject_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" text NOT NULL,
	"group_type" "group_type" NOT NULL,
	"shift" "shift" NOT NULL,
	"group_number" integer NOT NULL,
	"weekly_hours" numeric(4, 1) NOT NULL,
	"number_of_students" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_group_subject_id_group_type_group_number_shift_unique" UNIQUE("subject_id","group_type","group_number","shift")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "classroom" ADD CONSTRAINT "classroom_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule" ADD CONSTRAINT "schedule_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_entry_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_entry_subject_group_id_subject_group_id_fk" FOREIGN KEY ("subject_group_id") REFERENCES "public"."subject_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_entry_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject" ADD CONSTRAINT "subject_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_group" ADD CONSTRAINT "subject_group_subject_id_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subject"("id") ON DELETE cascade ON UPDATE no action;