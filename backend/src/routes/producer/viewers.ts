// Producer viewers routes - manage viewer access to tickets
import { Router, Response } from 'express';
import { ok, created, notFound, badRequest } from '../../shared/utils/response.js';
import { asyncHandler } from '../../shared/index.js';
import { requireSession, tenantContextMiddleware } from '../../domains/auth/index.js';
import type { AuthenticatedRequest } from '../../domains/auth/index.js';
import * as viewersService from '../../domains/viewers/service.js';
import type { ViewerAccessFilter, PaginationParams, SortParams } from '../../domains/viewers/types.js';

const router = Router();

// All routes require authentication and tenant context
router.use(requireSession);
router.use(tenantContextMiddleware);

// ===== Access Grants Endpoints =====

// List all access grants for the tenant
router.get('/access', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const filter: ViewerAccessFilter = {
    ticket_id: req.query.ticket_id ? Number(req.query.ticket_id) : undefined,
    email: req.query.email as string,
    status: req.query.status as ViewerAccessFilter['status'],
    search: req.query.search as string,
  };

  const pagination: PaginationParams = {
    page: req.query.page ? Number(req.query.page) : 1,
    page_size: req.query.page_size ? Number(req.query.page_size) : 20,
  };

  const sort: SortParams = {
    sort_by: req.query.sort_by as string,
    sort_order: req.query.sort_order as 'asc' | 'desc',
  };

  const result = await viewersService.listAccessGrants(
    tenant.appId,
    tenant.tenantId,
    filter,
    pagination,
    sort
  );

  ok(res, result, 'Access grants retrieved successfully');
}));

// Get single access grant
router.get('/access/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const grantId = Number(req.params.id);
  if (isNaN(grantId)) {
    badRequest(res, 'Invalid grant ID');
    return;
  }

  const grant = await viewersService.getAccessGrant(tenant.appId, tenant.tenantId, grantId);
  if (!grant) {
    notFound(res, 'Access grant not found');
    return;
  }

  ok(res, grant, 'Access grant retrieved successfully');
}));

// Grant access to emails for a ticket
router.post('/access/grant', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  const userId = req.userId;

  if (!tenant || !userId) {
    badRequest(res, 'Authentication required');
    return;
  }

  const { emails, ticket_id, ticket_ids, expires_at, notify } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    badRequest(res, 'At least one email is required');
    return;
  }

  // Support both ticket_id (single) and ticket_ids (multiple) for backward compatibility
  if (!ticket_id && (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0)) {
    badRequest(res, 'At least one ticket ID is required (use ticket_id or ticket_ids)');
    return;
  }

  const result = await viewersService.grantAccess(
    tenant.appId,
    tenant.tenantId,
    userId,
    {
      emails,
      ticket_id: ticket_id ? Number(ticket_id) : undefined,
      ticket_ids: ticket_ids ? ticket_ids.map((id: string | number) => Number(id)) : undefined,
      expires_at: expires_at ? new Date(expires_at) : undefined,
      notify,
    }
  );

  created(res, result, `Access granted: ${result.total_granted} successful, ${result.total_failed} failed`);
}));

// Bulk import from CSV
router.post('/access/import', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  const userId = req.userId;

  if (!tenant || !userId) {
    badRequest(res, 'Authentication required');
    return;
  }

  const { csv_data, ticket_id, expires_at, notify } = req.body;

  if (!csv_data || typeof csv_data !== 'string') {
    badRequest(res, 'CSV data is required');
    return;
  }

  if (!ticket_id) {
    badRequest(res, 'Ticket ID is required');
    return;
  }

  const result = await viewersService.grantAccessFromCSV(
    tenant.appId,
    tenant.tenantId,
    userId,
    ticket_id,
    csv_data,
    expires_at ? new Date(expires_at) : undefined,
    notify
  );

  created(res, result, 'CSV import completed');
}));

// Revoke access
router.post('/access/:id/revoke', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const grantId = Number(req.params.id);
  if (isNaN(grantId)) {
    badRequest(res, 'Invalid grant ID');
    return;
  }

  const success = await viewersService.revokeAccess(tenant.appId, tenant.tenantId, grantId);
  if (!success) {
    notFound(res, 'Access grant not found');
    return;
  }

  ok(res, { id: grantId, revoked: true }, 'Access revoked successfully');
}));

// Delete access grant
router.delete('/access/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const grantId = Number(req.params.id);
  if (isNaN(grantId)) {
    badRequest(res, 'Invalid grant ID');
    return;
  }

  const success = await viewersService.deleteAccess(tenant.appId, tenant.tenantId, grantId);
  if (!success) {
    notFound(res, 'Access grant not found');
    return;
  }

  ok(res, { id: grantId, deleted: true }, 'Access grant deleted successfully');
}));

// Get access grants for a specific ticket
router.get('/tickets/:ticketId/access', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const ticketId = Number(req.params.ticketId);
  if (isNaN(ticketId)) {
    badRequest(res, 'Invalid ticket ID');
    return;
  }

  const grants = await viewersService.getTicketAccessGrants(tenant.appId, tenant.tenantId, ticketId);
  ok(res, { data: grants, total: grants.length }, 'Ticket access grants retrieved successfully');
}));

// ===== Viewer Mappings Endpoints =====

// List viewers (from tenant mappings - these are viewers who have signed up/purchased)
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const pagination: PaginationParams = {
    page: req.query.page ? Number(req.query.page) : 1,
    page_size: req.query.page_size ? Number(req.query.page_size) : 20,
  };

  const result = await viewersService.getViewerMappings(tenant.tenantId, pagination);
  ok(res, result, 'Viewers retrieved successfully');
}));

// ===== Stats Endpoint =====

// Get access grant statistics
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tenant = req.tenant;
  if (!tenant) {
    badRequest(res, 'Tenant context required');
    return;
  }

  const stats = await viewersService.getAccessStats(tenant.appId, tenant.tenantId);
  ok(res, stats, 'Access statistics retrieved successfully');
}));

// ===== CSV Validation Endpoint =====

// Validate CSV without importing
router.post('/access/validate-csv', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { csv_data } = req.body;

  if (!csv_data || typeof csv_data !== 'string') {
    badRequest(res, 'CSV data is required');
    return;
  }

  const result = viewersService.parseCSV(csv_data);
  ok(res, {
    valid_count: result.valid.length,
    invalid_count: result.invalid.length,
    valid: result.valid,
    invalid: result.invalid,
  }, 'CSV validated successfully');
}));

export const viewersRoutes: Router = router;

