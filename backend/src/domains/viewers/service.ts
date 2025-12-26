// Viewers service - business logic for viewer access management
import * as repo from './repository.js';
import type {
  ViewerAccess,
  ViewerAccessListResponse,
  ViewerAccessFilter,
  GrantAccessRequest,
  GrantAccessResult,
  CSVParseResult,
  ParsedCSVRow,
  PaginationParams,
  SortParams,
  ViewerMapping,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';

// ===== CSV Parsing =====

/**
 * Parse CSV data for bulk import
 * Expected format: email,name (name is optional)
 * Supports header row detection
 */
export const parseCSV = (csvData: string): CSVParseResult => {
  const lines = csvData.trim().split('\n');
  const valid: ParsedCSVRow[] = [];
  const invalid: { row: number; data: string; reason: string }[] = [];

  // Email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row if detected
    const lowerLine = line.toLowerCase();
    if (i === 0 && (lowerLine.includes('email') || lowerLine.startsWith('email,'))) {
      continue;
    }

    const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const email = parts[0];
    const name = parts[1] || undefined;

    if (!email) {
      invalid.push({ row: i + 1, data: line, reason: 'Empty email' });
      continue;
    }

    if (!emailRegex.test(email)) {
      invalid.push({ row: i + 1, data: line, reason: 'Invalid email format' });
      continue;
    }

    valid.push({ email: email.toLowerCase(), name });
  }

  return { valid, invalid };
};

// ===== Access Grant Operations =====

/**
 * Grant access to a ticket for multiple emails
 */
export const grantAccess = async (
  appId: string,
  tenantId: string,
  userId: string,
  request: GrantAccessRequest
): Promise<GrantAccessResult> => {
  const success: string[] = [];
  const failed: { email: string; reason: string }[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const rawEmail of request.emails) {
    const email = rawEmail.toLowerCase().trim();

    // Validate email
    if (!emailRegex.test(email)) {
      failed.push({ email, reason: 'Invalid email format' });
      continue;
    }

    try {
      // Check if grant already exists
      const existing = await repo.getAccessGrantByEmail(appId, tenantId, request.ticket_id, email);
      if (existing) {
        if (existing.status === 'revoked') {
          // Re-activate revoked access
          await repo.updateAccessGrant(appId, tenantId, existing.id, {
            status: 'active',
            expiresAt: request.expires_at || null,
          });
          success.push(email);
        } else {
          failed.push({ email, reason: 'Access already granted' });
        }
        continue;
      }

      // Create new grant
      await repo.createAccessGrant(
        appId,
        tenantId,
        userId,
        request.ticket_id,
        email,
        request.expires_at
      );
      success.push(email);

      // TODO: Send notification email if notify is true
      if (request.notify) {
        log.info(`Would send access notification email to ${email}`);
      }
    } catch (error) {
      log.error(`Failed to grant access to ${email}:`, error);
      failed.push({ email, reason: 'Database error' });
    }
  }

  return {
    success,
    failed,
    total_granted: success.length,
    total_failed: failed.length,
  };
};

/**
 * Grant access via CSV import
 */
export const grantAccessFromCSV = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  csvData: string,
  expiresAt?: Date,
  notify?: boolean
): Promise<{
  parse_result: CSVParseResult;
  grant_result: GrantAccessResult;
}> => {
  // Parse CSV
  const parseResult = parseCSV(csvData);

  if (parseResult.valid.length === 0) {
    return {
      parse_result: parseResult,
      grant_result: {
        success: [],
        failed: parseResult.invalid.map((inv) => ({
          email: inv.data,
          reason: inv.reason,
        })),
        total_granted: 0,
        total_failed: parseResult.invalid.length,
      },
    };
  }

  // Grant access for valid emails
  const grantResult = await grantAccess(appId, tenantId, userId, {
    emails: parseResult.valid.map((v) => v.email),
    ticket_id: ticketId,
    expires_at: expiresAt,
    notify,
  });

  return {
    parse_result: parseResult,
    grant_result: grantResult,
  };
};

/**
 * Revoke access for a specific grant
 */
export const revokeAccess = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  const result = await repo.revokeAccessGrant(appId, tenantId, grantId);
  if (result) {
    log.info(`Revoked access grant ${grantId} for tenant ${tenantId}`);
  }
  return result;
};

/**
 * Delete access grant permanently
 */
export const deleteAccess = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  return repo.deleteAccessGrant(appId, tenantId, grantId);
};

/**
 * Get access grant by ID
 */
export const getAccessGrant = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<ViewerAccess | null> => {
  return repo.getAccessGrantById(appId, tenantId, grantId);
};

/**
 * List access grants with filtering and pagination
 */
export const listAccessGrants = async (
  appId: string,
  tenantId: string,
  filter: ViewerAccessFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ViewerAccessListResponse> => {
  return repo.listAccessGrants(appId, tenantId, filter, pagination, sort);
};

/**
 * Get all access grants for a specific ticket
 */
export const getTicketAccessGrants = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<ViewerAccess[]> => {
  return repo.getAccessGrantsForTicket(appId, tenantId, ticketId);
};

// ===== Access Verification =====

/**
 * Check if an email has active access to a ticket
 * This is used during viewer login/purchase flow
 */
export const checkAccess = async (
  tenantId: string,
  ticketId: number,
  email: string
): Promise<{ has_access: boolean; grant?: ViewerAccess }> => {
  const grant = await repo.checkEmailHasAccess(tenantId, ticketId, email);
  return {
    has_access: grant !== null,
    grant: grant || undefined,
  };
};

/**
 * Mark access as used (when viewer claims access)
 */
export const claimAccess = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  return repo.markAccessAsUsed(appId, tenantId, grantId);
};

/**
 * Get all tickets an email has access to
 */
export const getAccessibleTickets = async (
  tenantId: string,
  email: string
): Promise<ViewerAccess[]> => {
  return repo.getAccessGrantsForEmail(tenantId, email);
};

// ===== Viewer Mappings =====

/**
 * Get all viewer mappings for a tenant (viewers who have joined via purchase/signup)
 */
export const getViewerMappings = async (
  tenantId: string,
  pagination: PaginationParams = {}
): Promise<{ data: ViewerMapping[]; total: number; page: number; page_size: number; total_pages: number }> => {
  const page = pagination.page || 1;
  const pageSize = pagination.page_size || 20;
  
  const { data, total } = await repo.getViewerMappingsForTenant(tenantId, pagination);
  
  return {
    data,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

// ===== Stats =====

/**
 * Get access grant statistics for a tenant
 */
export const getAccessStats = async (
  appId: string,
  tenantId: string
): Promise<{
  total_grants: number;
  active_grants: number;
  used_grants: number;
  expired_grants: number;
  revoked_grants: number;
}> => {
  return repo.getAccessGrantStats(appId, tenantId);
};

