CREATE TABLE "clips" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text,
	"created_at" timestamp DEFAULT now(),
	"start_time" numeric NOT NULL,
	"end_time" numeric NOT NULL,
	"duration" numeric NOT NULL,
	"hook_type" text NOT NULL,
	"virality_score" integer NOT NULL,
	"emotion_trigger" text,
	"transcript_snippet" text,
	"ai_suggested_title" text,
	"ai_reasoning" text,
	"score_breakdown" jsonb,
	"human_approved" boolean DEFAULT false,
	"human_rejected" boolean DEFAULT false,
	"user_edited_title" text,
	"reviewed_at" timestamp,
	"render_status" text,
	"output_file_url" text,
	"rendered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"source_url" text NOT NULL,
	"source_type" text,
	"source_title" text,
	"config_snapshot" jsonb,
	"strategy_json" jsonb,
	"ai_model_used" text,
	"api_key_index_used" integer,
	"api_key_label_used" text,
	"token_usage_input" integer,
	"token_usage_output" integer,
	"analysis_duration_ms" integer,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "user_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"config" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clips" ADD CONSTRAINT "clips_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE no action ON UPDATE no action;