// Viewers repository - tenant-aware database operations using Drizzle ORM
import { eq, and, ilike, or, gte, desc, asc, count, sql, isNull } from 'drizzle-orm';
import { db, emailAccessGrants, tickets, viewerTenantMappings } from '../../db/index';
import type {
  ViewerAccess,
  ViewerAccessStatus,
  ViewerAccessListResponse,
  ViewerAccessFilter,
  ViewerMapping,
  PaginationParams,
  SortParams,
} from './types';

// Transform database row to API response format
const transformViewerAccess = (
  row: typeof emailAccessGrants.$inferSelect,
  ticketTitle?: string,
  viewerUserId?: string
): ViewerAccess => {
  return {
    id: row.id,
    app_id: row.appId,
    tenant_id: row.tenantId,
    user_id: row.userId,
    ticket_id: row.ticketId,
    email: row.email,
    status: (row.status as ViewerAccessStatus) ?? 'active',
    granted_at: row.grantedAt,
    expires_at: row.expiresAt ?? undefined,
    used_at: row.usedAt ?? undefined,
    ticket_title: ticketTitle,
    viewer_user_id: viewerUserId,
    has_signed_up: !!viewerUserId,
  };
};

// ===== Access Grants Operations =====

export const createAccessGrant = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  email: string,
  expiresAt?: Date
): Promise<ViewerAccess> => {
  const [grant] = await db
    .insert(emailAccessGrants)
    .values({
      appId,
      tenantId,
      userId,
      ticketId,
      email: email.toLowerCase().trim(),
      expiresAt,
      status: 'active',
    })
    .returning();

  return transformViewerAccess(grant);
};

export const getAccessGrantById = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<ViewerAccess | null> => {
  const [grant] = await db
    .select({
      grant: emailAccessGrants,
      ticketTitle: tickets.title,
    })
    .from(emailAccessGrants)
    .leftJoin(tickets, eq(emailAccessGrants.ticketId, tickets.id))
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.id, grantId)
      )
    )
    .limit(1);

  if (!grant) return null;
  return transformViewerAccess(grant.grant, grant.ticketTitle ?? undefined);
};

export const getAccessGrantByEmail = async (
  appId: string,
  tenantId: string,
  ticketId: number,
  email: string
): Promise<ViewerAccess | null> => {
  const [grant] = await db
    .select()
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.ticketId, ticketId),
        eq(emailAccessGrants.email, email.toLowerCase().trim())
      )
    )
    .limit(1);

  return grant ? transformViewerAccess(grant) : null;
};

export const updateAccessGrant = async (
  appId: string,
  tenantId: string,
  grantId: number,
  updates: { status?: ViewerAccessStatus; expiresAt?: Date | null; usedAt?: Date | null }
): Promise<ViewerAccess | null> => {
  const updateData: Partial<typeof emailAccessGrants.$inferInsert> = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.expiresAt !== undefined) updateData.expiresAt = updates.expiresAt;
  if (updates.usedAt !== undefined) updateData.usedAt = updates.usedAt;

  const [grant] = await db
    .update(emailAccessGrants)
    .set(updateData)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.id, grantId)
      )
    )
    .returning();

  return grant ? transformViewerAccess(grant) : null;
};

export const deleteAccessGrant = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  const result = await db
    .delete(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.id, grantId)
      )
    )
    .returning({ id: emailAccessGrants.id });

  return result.length > 0;
};

export const listAccessGrants = async (
  appId: string,
  tenantId: string,
  filter: ViewerAccessFilter = {},
  pagination: PaginationParams = {},
  sort: SortParams = {}
): Promise<ViewerAccessListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 20));
  const offset = (page - 1) * pageSize;

  // Build where conditions
  const conditions = [
    eq(emailAccessGrants.appId, appId),
    eq(emailAccessGrants.tenantId, tenantId),
  ];

  if (filter.ticket_id) {
    conditions.push(eq(emailAccessGrants.ticketId, filter.ticket_id));
  }
  if (filter.email) {
    conditions.push(ilike(emailAccessGrants.email, `%${filter.email}%`));
  }
  if (filter.status) {
    conditions.push(eq(emailAccessGrants.status, filter.status));
  }
  if (filter.search) {
    conditions.push(ilike(emailAccessGrants.email, `%${filter.search}%`));
  }

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(emailAccessGrants)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  // Get data with sorting and joins
  const sortBy = sort.sort_by || 'granted_at';
  const sortOrder = sort.sort_order || 'desc';

  const sortColumn =
    sortBy === 'granted_at' ? emailAccessGrants.grantedAt
    : sortBy === 'email' ? emailAccessGrants.email
    : sortBy === 'status' ? emailAccessGrants.status
    : sortBy === 'expires_at' ? emailAccessGrants.expiresAt
    : emailAccessGrants.grantedAt;

  const data = await db
    .select({
      grant: emailAccessGrants,
      ticketTitle: tickets.title,
    })
    .from(emailAccessGrants)
    .leftJoin(tickets, eq(emailAccessGrants.ticketId, tickets.id))
    .where(and(...conditions))
    .orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map((row) => transformViewerAccess(row.grant, row.ticketTitle ?? undefined)),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

// ===== Bulk Operations =====

export const createBulkAccessGrants = async (
  appId: string,
  tenantId: string,
  userId: string,
  ticketId: number,
  emails: string[],
  expiresAt?: Date
): Promise<{ created: ViewerAccess[]; skipped: string[] }> => {
  const created: ViewerAccess[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if grant already exists
    const existing = await getAccessGrantByEmail(appId, tenantId, ticketId, normalizedEmail);
    if (existing) {
      skipped.push(normalizedEmail);
      continue;
    }

    const grant = await createAccessGrant(appId, tenantId, userId, ticketId, normalizedEmail, expiresAt);
    created.push(grant);
  }

  return { created, skipped };
};

export const revokeAccessGrant = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  const result = await updateAccessGrant(appId, tenantId, grantId, { status: 'revoked' });
  return result !== null;
};

export const markAccessAsUsed = async (
  appId: string,
  tenantId: string,
  grantId: number
): Promise<boolean> => {
  const result = await updateAccessGrant(appId, tenantId, grantId, {
    status: 'used',
    usedAt: new Date(),
  });
  return result !== null;
};

// ===== Access Check Operations =====

export const checkEmailHasAccess = async (
  tenantId: string,
  ticketId: number,
  email: string
): Promise<ViewerAccess | null> => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = new Date();

  const [grant] = await db
    .select()
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.ticketId, ticketId),
        eq(emailAccessGrants.email, normalizedEmail),
        eq(emailAccessGrants.status, 'active'),
        or(
          isNull(emailAccessGrants.expiresAt),
          gte(emailAccessGrants.expiresAt, now)
        )
      )
    )
    .limit(1);

  return grant ? transformViewerAccess(grant) : null;
};

export const getAccessGrantsForTicket = async (
  appId: string,
  tenantId: string,
  ticketId: number
): Promise<ViewerAccess[]> => {
  const data = await db
    .select()
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.ticketId, ticketId)
      )
    )
    .orderBy(desc(emailAccessGrants.grantedAt));

  return data.map((row) => transformViewerAccess(row));
};

export const getAccessGrantsForEmail = async (
  tenantId: string,
  email: string
): Promise<ViewerAccess[]> => {
  const normalizedEmail = email.toLowerCase().trim();

  const data = await db
    .select({
      grant: emailAccessGrants,
      ticketTitle: tickets.title,
    })
    .from(emailAccessGrants)
    .leftJoin(tickets, eq(emailAccessGrants.ticketId, tickets.id))
    .where(
      and(
        eq(emailAccessGrants.tenantId, tenantId),
        eq(emailAccessGrants.email, normalizedEmail)
      )
    )
    .orderBy(desc(emailAccessGrants.grantedAt));

  return data.map((row) => transformViewerAccess(row.grant, row.ticketTitle ?? undefined));
};

// ===== Viewer Mappings Operations =====

export const transformViewerMapping = (
  row: typeof viewerTenantMappings.$inferSelect
): ViewerMapping => {
  return {
    id: row.id,
    viewer_user_id: row.viewerUserId,
    tenant_id: row.tenantId,
    source: row.source,
    first_order_id: row.firstOrderId ?? undefined,
    status: row.status ?? 'active',
    created_at: row.createdAt,
  };
};

export const getViewerMappingsForTenant = async (
  tenantId: string,
  pagination: PaginationParams = {}
): Promise<{ data: ViewerMapping[]; total: number }> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 20));
  const offset = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ count: count() })
    .from(viewerTenantMappings)
    .where(eq(viewerTenantMappings.tenantId, tenantId));

  const total = countResult?.count || 0;

  const data = await db
    .select()
    .from(viewerTenantMappings)
    .where(eq(viewerTenantMappings.tenantId, tenantId))
    .orderBy(desc(viewerTenantMappings.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformViewerMapping),
    total,
  };
};

// ===== Stats =====

export const getAccessGrantStats = async (
  appId: string,
  tenantId: string
): Promise<{
  total_grants: number;
  active_grants: number;
  used_grants: number;
  expired_grants: number;
  revoked_grants: number;
}> => {
  const [stats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${emailAccessGrants.status} = 'active')`,
      used: sql<number>`count(*) filter (where ${emailAccessGrants.status} = 'used')`,
      expired: sql<number>`count(*) filter (where ${emailAccessGrants.status} = 'expired')`,
      revoked: sql<number>`count(*) filter (where ${emailAccessGrants.status} = 'revoked')`,
    })
    .from(emailAccessGrants)
    .where(
      and(
        eq(emailAccessGrants.appId, appId),
        eq(emailAccessGrants.tenantId, tenantId)
      )
    );

  return {
    total_grants: stats?.total || 0,
    active_grants: stats?.active || 0,
    used_grants: stats?.used || 0,
    expired_grants: stats?.expired || 0,
    revoked_grants: stats?.revoked || 0,
  };
};

