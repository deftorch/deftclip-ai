import {
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core'

/** Pipeline: satu sesi analisis video end-to-end */
export const pipelines = pgTable('pipelines', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  status: text('status').notNull().default('pending'),
  // 'pending' | 'analyzing' | 'review' | 'rendering' | 'done' | 'error'

  // Source
  sourceUrl: text('source_url').notNull(),
  sourceType: text('source_type'),
  sourceTitle: text('source_title'),

  // Config snapshot saat analisis dijalankan
  configSnapshot: jsonb('config_snapshot'),

  // AI Analysis result
  strategyJson: jsonb('strategy_json'),

  // Metadata analisis
  aiModelUsed: text('ai_model_used'),
  apiKeyIndexUsed: integer('api_key_index_used'),
  apiKeyLabelUsed: text('api_key_label_used'),
  tokenUsageInput: integer('token_usage_input'),
  tokenUsageOutput: integer('token_usage_output'),
  analysisDurationMs: integer('analysis_duration_ms'),
  errorMessage: text('error_message'),
})

/** Clips: setiap klip hasil analisis AI dari satu pipeline */
export const clips = pgTable('clips', {
  id: text('id').primaryKey(), // clip_001, clip_002
  pipelineId: text('pipeline_id').references(() => pipelines.id),
  createdAt: timestamp('created_at').defaultNow(),

  // Data dari strategy.json
  startTime: numeric('start_time').notNull(),
  endTime: numeric('end_time').notNull(),
  duration: numeric('duration').notNull(),
  hookType: text('hook_type').notNull(),
  viralityScore: integer('virality_score').notNull(),
  emotionTrigger: text('emotion_trigger'),
  transcriptSnippet: text('transcript_snippet'),
  aiSuggestedTitle: text('ai_suggested_title'),
  aiReasoning: text('ai_reasoning'),
  scoreBreakdown: jsonb('score_breakdown'),

  // Human review decision
  humanApproved: boolean('human_approved').default(false),
  humanRejected: boolean('human_rejected').default(false),
  userEditedTitle: text('user_edited_title'),
  reviewedAt: timestamp('reviewed_at'),

  // Render result
  renderStatus: text('render_status'), // 'pending' | 'rendering' | 'done' | 'error'
  outputFileUrl: text('output_file_url'),
  renderedAt: timestamp('rendered_at'),

  // Analytics (Fase 3)
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  engagementRate: numeric('engagement_rate').default('0'),
  isHighPerformer: boolean('is_high_performer').default(false),
})

/** UserConfig: konfigurasi yang disimpan user di UI Settings */
export const userConfig = pgTable('user_config', {
  id: text('id').primaryKey().default('default'),
  updatedAt: timestamp('updated_at').defaultNow(),
  config: jsonb('config').notNull(), // AnalysisConfig + RenderConfig
})

export type Pipeline = typeof pipelines.$inferSelect
export type NewPipeline = typeof pipelines.$inferInsert
export type Clip = typeof clips.$inferSelect
export type NewClip = typeof clips.$inferInsert
export type UserConfig = typeof userConfig.$inferSelect
