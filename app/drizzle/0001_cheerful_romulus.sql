ALTER TABLE "clips" ADD COLUMN "view_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "like_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "engagement_rate" numeric DEFAULT '0';--> statement-breakpoint
ALTER TABLE "clips" ADD COLUMN "is_high_performer" boolean DEFAULT false;