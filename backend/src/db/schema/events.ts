import { pgTable, serial, varchar, integer, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  appId: varchar('app_id', { length: 255 }).notNull(),
  tenantId: varchar('tenant_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  startDatetime: timestamp('start_datetime'),
  endDatetime: timestamp('end_datetime'),
  language: varchar('language', { length: 10 }).default('en'),
  isVod: boolean('is_vod').default(false),
  convertToVodAfterEvent: boolean('convert_to_vod_after_event').default(false),
  vodUrl: text('vod_url'),
  vodVideoUrl: text('vod_video_url'),
  watchLink: text('watch_link'),
  maxConcurrentViewersPerLink: integer('max_concurrent_viewers_per_link').default(1),
  signupDisabled: boolean('signup_disabled').default(false),
  purchaseDisabled: boolean('purchase_disabled').default(false),
  embed: text('embed'),
  status: varchar('status', { length: 50 }).default('draft'),
  watchUpto: timestamp('watch_upto'),
  archiveAfter: timestamp('archive_after'),
  thumbnailImagePortrait: text('thumbnail_image_portrait'),
  featuredImage: text('featured_image'),
  featuredVideo: text('featured_video'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  appTenantIdx: index('idx_events_app_tenant').on(table.appId, table.tenantId),
  statusIdx: index('idx_events_status').on(table.status),
  startDatetimeIdx: index('idx_events_start_datetime').on(table.startDatetime),
}));

