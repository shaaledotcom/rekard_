// User preferences service - business logic
import * as repo from './repository.js';
import type {
  UserPreference,
  UpdateUserPreferenceRequest,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { notFound } from '../../shared/errors/app-error.js';

// Get or create user preference (returns default if not exists)
export const getOrCreatePreference = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserPreference> => {
  const preference = await repo.getOrCreatePreference(appId, tenantId, userId);
  return preference;
};

// Get user preference
export const getPreference = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<UserPreference> => {
  const preference = await repo.getPreferenceByUserId(appId, tenantId, userId);
  if (!preference) {
    // Create with defaults if not found
    return repo.createPreference(appId, tenantId, userId);
  }
  return preference;
};

// Update user preference
export const updatePreference = async (
  appId: string,
  tenantId: string,
  userId: string,
  data: UpdateUserPreferenceRequest
): Promise<UserPreference> => {
  // Ensure preference exists first
  let preference = await repo.getPreferenceByUserId(appId, tenantId, userId);

  if (!preference) {
    // Create with the update data as initial values
    preference = await repo.createPreference(appId, tenantId, userId, data);
    log.info(`Created new preference for user ${userId}`);
    return preference;
  }

  // Update existing
  const updated = await repo.updatePreference(appId, tenantId, userId, data);
  if (!updated) {
    throw notFound('Preference');
  }

  log.info(`Updated preference for user ${userId}`);
  return updated;
};

// Update theme only
export const updateTheme = async (
  appId: string,
  tenantId: string,
  userId: string,
  theme: string
): Promise<UserPreference> => {
  return updatePreference(appId, tenantId, userId, { theme });
};

// Update language only
export const updateLanguage = async (
  appId: string,
  tenantId: string,
  userId: string,
  language: string
): Promise<UserPreference> => {
  return updatePreference(appId, tenantId, userId, { language });
};

// Update timezone only
export const updateTimezone = async (
  appId: string,
  tenantId: string,
  userId: string,
  timezone: string
): Promise<UserPreference> => {
  return updatePreference(appId, tenantId, userId, { timezone });
};

// Update notifications setting
export const updateNotifications = async (
  appId: string,
  tenantId: string,
  userId: string,
  enabled: boolean
): Promise<UserPreference> => {
  return updatePreference(appId, tenantId, userId, { notifications_enabled: enabled });
};

// Delete user preference
export const deletePreference = async (
  appId: string,
  tenantId: string,
  userId: string
): Promise<boolean> => {
  const deleted = await repo.deletePreference(appId, tenantId, userId);
  if (deleted) {
    log.info(`Deleted preference for user ${userId}`);
  }
  return deleted;
};

