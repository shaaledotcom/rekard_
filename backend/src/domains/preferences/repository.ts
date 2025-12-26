// User preferences repository - tenant-aware database operations using Drizzle ORM
import { eq, and } from 'drizzle-orm';
import { db, userPreferences } from '../../db/index';
import type {
  UserPreference,
  CreateUserPreferenceRequest,
  UpdateUserPreferenceRequest,
} from './types';

// Default values for new preferences
const DEFAULT_THEME = 'light';
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_TIMEZONE = 'UTC';
const DEFAULT_NOTIFICATIONS_ENABLED = true;

// Transform database row to API response format
const transformPreference = (row: typeof userPreferences.$inferSelect): UserPreference => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  user_id: row.userId,
  theme: row.theme ?? DEFAULT_THEME,
  language: row.language ?? DEFAULT_LANGUAGE,
  timezone: row.timezone ?? DEFAULT_TIMEZONE,
  notifications_enabled: row.notificationsEnabled ?? DEFAULT_NOTIFICATIONS_ENABLED,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

export const createPreference = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: CreateUserPreferenceRequest = {}
): Promise<UserPreference> => {
  const [preference] = await db
    .insert(userPreferences)
    .values({
      appId,
      tenantId,
      userId,
      theme: data.theme || DEFAULT_THEME,
      language: data.language || DEFAULT_LANGUAGE,
      timezone: data.timezone || DEFAULT_TIMEZONE,
      notificationsEnabled: data.notifications_enabled ?? DEFAULT_NOTIFICATIONS_ENABLED,
    })
    .returning();

  return transformPreference(preference);
};

export const getPreferenceByUserId = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserPreference | null> => {
  const [preference] = await db
    .select()
    .from(userPreferences)
    .where(
      and(
        eq(userPreferences.appId, appId),
        eq(userPreferences.tenantId, tenantId),
        eq(userPreferences.userId, userId)
      )
    )
    .limit(1);

  return preference ? transformPreference(preference) : null;
};

export const getOrCreatePreference = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserPreference> => {
  const existing = await getPreferenceByUserId(appId, tenantId, userId);
  if (existing) {
    return existing;
  }

  return createPreference(appId, tenantId, userId);
};

export const updatePreference = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: UpdateUserPreferenceRequest
): Promise<UserPreference | null> => {
  const updates: Partial<typeof userPreferences.$inferInsert> = { updatedAt: new Date() };

  if (data.theme !== undefined) updates.theme = data.theme;
  if (data.language !== undefined) updates.language = data.language;
  if (data.timezone !== undefined) updates.timezone = data.timezone;
  if (data.notifications_enabled !== undefined) updates.notificationsEnabled = data.notifications_enabled;

  const [preference] = await db
    .update(userPreferences)
    .set(updates)
    .where(
      and(
        eq(userPreferences.appId, appId),
        eq(userPreferences.tenantId, tenantId),
        eq(userPreferences.userId, userId)
      )
    )
    .returning();

  return preference ? transformPreference(preference) : null;
};

export const deletePreference = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const result = await db
    .delete(userPreferences)
    .where(
      and(
        eq(userPreferences.appId, appId),
        eq(userPreferences.tenantId, tenantId),
        eq(userPreferences.userId, userId)
      )
    )
    .returning({ id: userPreferences.id });

  return result.length > 0;
};
