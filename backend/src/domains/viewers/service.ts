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
import { createUser } from '../auth/user.js';
import { ROLE_VIEWER } from '../auth/constants.js';
import * as ordersRepo from '../orders/repository.js';
import * as dashboardRepo from '../dashboard/repository.js';
import { sendAccessGrantEmail } from '../../shared/utils/email.js';
import * as billingService from '../billing/service.js';

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

// Helper function to consume tickets from producer's wallet when access is granted
// Note: This should only be called after verifying wallet balance upfront
const consumeProducerWalletTicketsForGrant = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  quantity: number
): Promise<void> => {
  // Consume tickets from producer's wallet
  // This will throw an error if insufficient tickets (shouldn't happen if checked upfront)
  await billingService.consumeTickets(
    appId,
    tenantId,
    userId,
    {
      quantity,
      reference_type: 'access_grant',
      reference_id: String(ticketId),
      description: `Consumed ${quantity} tickets for access grant (ticket ${ticketId})`,
    }
  );
  log.info(`Consumed ${quantity} tickets from producer ${userId}'s wallet for access grant on ticket ${ticketId}`);
};

// ===== Access Grant Operations =====

/**
 * Grant access to tickets for multiple emails
 * Also creates a completed order so users appear as having purchased the ticket
 * Supports both single ticket (ticket_id) and multiple tickets (ticket_ids)
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

  // Determine which tickets to grant access to
  const ticketIds: number[] = request.ticket_ids || (request.ticket_id ? [request.ticket_id] : []);
  
  if (ticketIds.length === 0) {
    return {
      success: [],
      failed: request.emails.map(email => ({ email, reason: 'No tickets specified' })),
      total_granted: 0,
      total_failed: request.emails.length,
    };
  }

  // Validate emails first
  const validEmails = request.emails.filter(email => {
    const trimmed = email.toLowerCase().trim();
    return trimmed && emailRegex.test(trimmed);
  });

  if (validEmails.length === 0) {
    return {
      success: [],
      failed: request.emails.map(email => ({ email, reason: 'Invalid email format' })),
      total_granted: 0,
      total_failed: request.emails.length,
    };
  }

  // Check ticket availability BEFORE granting access
  // Calculate how many NEW grants we need (excluding already granted access)
  let totalTicketsNeeded = 0;
  const emailToTicketMap = new Map<string, number[]>(); // Track which emails need which tickets

  for (const rawEmail of validEmails) {
    const email = rawEmail.toLowerCase().trim();
    const neededTickets: number[] = [];

    for (const ticketId of ticketIds) {
      // Check if grant already exists
      const existing = await repo.getAccessGrantByEmail(appId, tenantId, ticketId, email);
      
      // Only count tickets that need NEW grants (not already granted or revoked)
      if (!existing || existing.status === 'revoked') {
        neededTickets.push(ticketId);
        totalTicketsNeeded++;
      }
    }

    if (neededTickets.length > 0) {
      emailToTicketMap.set(email, neededTickets);
    }
  }

  // Check wallet balance if we need any tickets
  if (totalTicketsNeeded > 0) {
    try {
      const wallet = await billingService.getWallet(appId, tenantId, userId);
      const availableTickets = wallet.ticket_balance || 0;

      if (availableTickets < totalTicketsNeeded) {
        // Not enough tickets - return error for all emails
        return {
          success: [],
          failed: validEmails.map(email => ({
            email,
            reason: `Not enough tickets available. You have ${availableTickets} ticket(s) but need ${totalTicketsNeeded} ticket(s) to grant access. Please purchase more tickets.`
          })),
          total_granted: 0,
          total_failed: validEmails.length,
        };
      }
    } catch (error) {
      log.error(`Failed to check wallet balance for user ${userId}:`, error);
      // If we can't check wallet, fail the request
      return {
        success: [],
        failed: validEmails.map(email => ({
          email,
          reason: 'Unable to verify ticket availability. Please try again.'
        })),
        total_granted: 0,
        total_failed: validEmails.length,
      };
    }
  }

  // Get ticket details for all tickets (for order creation)
  const ticketDetailsMap = new Map<number, { price: number; currency: string; event_id?: number }>();
  
  for (const ticketId of ticketIds) {
    try {
      const ticket = await dashboardRepo.getPublicTicketById(ticketId);
      if (ticket) {
        ticketDetailsMap.set(ticketId, {
          price: ticket.price || 0,
          currency: ticket.currency || 'INR',
          event_id: ticket.events && ticket.events.length > 0 ? ticket.events[0].id : undefined,
        });
      }
    } catch (error) {
      log.error(`Failed to get ticket details for ticket ${ticketId}:`, error);
    }
  }

  // Process each email for each ticket
  for (const rawEmail of request.emails) {
    const email = rawEmail.toLowerCase().trim();

    // Validate email
    if (!emailRegex.test(email)) {
      failed.push({ email, reason: 'Invalid email format' });
      continue;
    }

    // Process each ticket for this email
    let emailSuccess = false;
    const emailFailedReasons: string[] = [];
    const successfullyGrantedTicketIds: number[] = [];

    // Try to create or get user by email once (optional - for order creation)
    // Access grants work with just email, so user creation is not required
    let viewerUserId: string | null = null;
    try {
      const userResult = await createUser({
        email,
        appId: 'public', // Use public appId for viewer orders
        tenantId,
        role: ROLE_VIEWER,
      });
      viewerUserId = userResult.userId;
    } catch (error) {
      log.warn(`Failed to create/get user for ${email}, will create access grants without orders:`, error);
      // Continue without user - access grants will still work
    }

    for (const ticketId of ticketIds) {
      try {
        // Check if grant already exists
        const existing = await repo.getAccessGrantByEmail(appId, tenantId, ticketId, email);
        if (existing) {
          if (existing.status === 'revoked') {
            // Re-activate revoked access
            await repo.updateAccessGrant(appId, tenantId, existing.id, {
              status: 'active',
              expiresAt: request.expires_at || null,
            });
            
            // Consume tickets from producer's wallet
            // Note: We've already checked wallet balance, but need to account for re-activations
            try {
              await consumeProducerWalletTicketsForGrant(appId, tenantId, userId, ticketId, 1);
            } catch (error) {
              log.error(`Failed to consume producer wallet tickets for re-activated access grant (ticket ${ticketId}, email ${email}):`, error);
              emailFailedReasons.push(`Ticket ${ticketId}: Insufficient tickets for re-activation`);
              continue;
            }
            
            emailSuccess = true;
            successfullyGrantedTicketIds.push(ticketId);
          } else {
            emailFailedReasons.push(`Ticket ${ticketId}: Access already granted`);
            continue;
          }
        } else {
          // Create completed order if we have ticket details and successfully got a user
          const ticketDetails = ticketDetailsMap.get(ticketId);
          if (ticketDetails && viewerUserId) {
            try {
              // Check if user already has a completed order for this ticket
              const existingOrders = await ordersRepo.getUserTicketOrders('public', tenantId, viewerUserId, ticketId);
              const hasCompletedOrder = existingOrders.some(o => o.status === 'completed');

              if (!hasCompletedOrder) {
                await ordersRepo.createCompletedOrder('public', tenantId, viewerUserId, {
                  ticket_id: ticketId,
                  event_id: ticketDetails.event_id,
                  quantity: 1,
                  unit_price: 0, // Free grant
                  currency: ticketDetails.currency,
                  payment_method: 'free_grant',
                  customer_email: email,
                  metadata: { grant_type: 'free_access', granted_by: userId },
                });
                log.info(`Created completed order for granted access: ${email} -> ticket ${ticketId}`);
              } else {
                log.info(`User ${email} already has a completed order for ticket ${ticketId}, skipping order creation`);
              }
            } catch (error) {
              log.error(`Failed to create order for ${email} ticket ${ticketId}:`, error);
              // Continue anyway - we'll still create the access grant
            }
          } else if (!viewerUserId) {
            log.info(`Skipping order creation for ${email} ticket ${ticketId} - user account could not be created (access grant will still work)`);
          }

          // Create new grant
          await repo.createAccessGrant(
            appId,
            tenantId,
            userId,
            ticketId,
            email,
            request.expires_at
          );
          
          // Consume tickets from producer's wallet
          // We've already checked wallet balance upfront, so this should succeed
          try {
            await consumeProducerWalletTicketsForGrant(appId, tenantId, userId, ticketId, 1);
          } catch (error) {
            log.error(`Failed to consume producer wallet tickets for access grant (ticket ${ticketId}, email ${email}):`, error);
            // Rollback: delete the grant we just created
            try {
              const grant = await repo.getAccessGrantByEmail(appId, tenantId, ticketId, email);
              if (grant) {
                await repo.deleteAccessGrant(appId, tenantId, grant.id);
              }
            } catch (rollbackError) {
              log.error(`Failed to rollback access grant for ${email} ticket ${ticketId}:`, rollbackError);
            }
            emailFailedReasons.push(`Ticket ${ticketId}: Failed to consume tickets`);
            continue;
          }
          
          emailSuccess = true;
          successfullyGrantedTicketIds.push(ticketId);
        }
      } catch (error) {
        log.error(`Failed to grant access to ${email} for ticket ${ticketId}:`, error);
        emailFailedReasons.push(`Ticket ${ticketId}: Database error`);
      }
    }

    // Send notification email when access is granted
    if (emailSuccess && successfullyGrantedTicketIds.length > 0) {
      log.info(`[EMAIL] Preparing to send access grant emails to ${email} for ${successfullyGrantedTicketIds.length} ticket(s)`);
      try {
        // Send email for each ticket that was successfully granted
        for (const ticketId of successfullyGrantedTicketIds) {
          log.info(`[EMAIL] Processing access grant email for ticket ${ticketId} to ${email}`);
          const ticketDetails = await dashboardRepo.getPublicTicketById(ticketId);
          if (ticketDetails) {
            log.info(`[EMAIL] Retrieved ticket details for ticket ${ticketId} - Title: ${ticketDetails.title || 'Unknown'}`);
            // Get the earliest event start datetime if available
            const firstEvent = ticketDetails.events && ticketDetails.events.length > 0
              ? ticketDetails.events
                  .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0]
              : undefined;
            const eventStartDatetime = firstEvent?.start_datetime;
            const eventEndDatetime = firstEvent?.end_datetime;
            
            // Get ticket thumbnail
            const ticketThumbnailUrl = ticketDetails.thumbnail_image_portrait 
              || ticketDetails.featured_image;

            // Construct watch link - use ticket URL if available, otherwise use ticket ID
            let watchLink: string | undefined;
            if (ticketDetails.url) {
              // Remove leading slash if present
              const cleanUrl = ticketDetails.url.replace(/^\//, '');
              watchLink = `/${cleanUrl}/watch`;
            } else {
              watchLink = `/watch?ticket=${ticketId}`;
            }

            // Get the grant to check expiration
            const grant = await repo.getAccessGrantByEmail(appId, tenantId, ticketId, email);
            const expiresAt = grant?.expires_at ? new Date(grant.expires_at) : request.expires_at;

            await sendAccessGrantEmail({
              recipientEmail: email,
              ticketTitle: ticketDetails.title || 'Ticket',
              ticketDescription: ticketDetails.description,
              ticketThumbnailUrl,
              eventTitle: firstEvent?.title,
              eventStartDatetime,
              eventEndDatetime,
              watchLink,
              expiresAt,
              tenantId,
              appId,
            });
          } else {
            log.warn(`[EMAIL] Ticket details not found for ticket ${ticketId}, skipping email to ${email}`);
          }
        }
        log.info(`[EMAIL] Completed sending access grant emails to ${email} for ${successfullyGrantedTicketIds.length} ticket(s)`);
      } catch (error) {
        // Log error but don't fail the access grant
        log.error(`[EMAIL] Failed to send access grant email to ${email}:`, error);
      }
    } else if (emailSuccess && successfullyGrantedTicketIds.length === 0) {
      log.warn(`[EMAIL] Access granted to ${email} but no tickets were successfully granted, skipping email`);
    }

    // Track success/failure for this email
    if (emailSuccess) {
      success.push(email);
    } else if (emailFailedReasons.length > 0) {
      failed.push({ email, reason: emailFailedReasons.join('; ') });
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

