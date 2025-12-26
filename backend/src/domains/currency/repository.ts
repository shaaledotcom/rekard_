import { eq, and, ilike, or, asc, count } from 'drizzle-orm';
import { db, currencies } from '../../db/index';
import type {
  Currency,
  CreateCurrencyRequest,
  UpdateCurrencyRequest,
  CurrencyFilter,
  CurrencyListResponse,
  PaginationParams,
} from './types';

// Transform database row to API response format
const transformCurrency = (row: typeof currencies.$inferSelect): Currency => ({
  id: row.id,
  app_id: row.appId,
  tenant_id: row.tenantId,
  code: row.code,
  name: row.name,
  symbol: row.symbol ?? undefined,
  is_active: row.isActive ?? true,
  is_default: row.isDefault ?? false,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
});

export const createCurrency = async (
  appId: string,
  tenantId: string,
  data: CreateCurrencyRequest
): Promise<Currency> => {
  const [currency] = await db
    .insert(currencies)
    .values({
      appId,
      tenantId,
      code: data.code.toUpperCase(),
      name: data.name,
      symbol: data.symbol,
      isActive: data.is_active ?? true,
      isDefault: data.is_default ?? false,
    })
    .returning();

  return transformCurrency(currency);
};

export const getCurrencyById = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<Currency | null> => {
  const [currency] = await db
    .select()
    .from(currencies)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.id, currencyId)
      )
    )
    .limit(1);

  return currency ? transformCurrency(currency) : null;
};

export const getCurrencyByCode = async (
  appId: string,
  tenantId: string,
  code: string
): Promise<Currency | null> => {
  const [currency] = await db
    .select()
    .from(currencies)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.code, code.toUpperCase())
      )
    )
    .limit(1);

  return currency ? transformCurrency(currency) : null;
};

export const updateCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number,
  data: UpdateCurrencyRequest
): Promise<Currency | null> => {
  const updates: Partial<typeof currencies.$inferInsert> = { updatedAt: new Date() };

  if (data.code !== undefined) updates.code = data.code.toUpperCase();
  if (data.name !== undefined) updates.name = data.name;
  if (data.symbol !== undefined) updates.symbol = data.symbol;
  if (data.is_active !== undefined) updates.isActive = data.is_active;
  if (data.is_default !== undefined) updates.isDefault = data.is_default;

  const [currency] = await db
    .update(currencies)
    .set(updates)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.id, currencyId)
      )
    )
    .returning();

  return currency ? transformCurrency(currency) : null;
};

export const deleteCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<boolean> => {
  const result = await db
    .delete(currencies)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.id, currencyId)
      )
    )
    .returning({ id: currencies.id });

  return result.length > 0;
};

export const listCurrencies = async (
  appId: string,
  tenantId: string,
  filter: CurrencyFilter = {},
  pagination: PaginationParams = {}
): Promise<CurrencyListResponse> => {
  const page = Math.max(1, pagination.page || 1);
  const pageSize = Math.max(1, Math.min(100, pagination.page_size || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(currencies.appId, appId),
    eq(currencies.tenantId, tenantId),
  ];

  if (filter.code) {
    conditions.push(eq(currencies.code, filter.code.toUpperCase()));
  }
  if (filter.search) {
    conditions.push(
      or(
        ilike(currencies.name, `%${filter.search}%`),
        ilike(currencies.code, `%${filter.search}%`)
      )!
    );
  }
  if (filter.is_active !== undefined) {
    conditions.push(eq(currencies.isActive, filter.is_active));
  }
  if (filter.is_default !== undefined) {
    conditions.push(eq(currencies.isDefault, filter.is_default));
  }

  const [countResult] = await db
    .select({ count: count() })
    .from(currencies)
    .where(and(...conditions));

  const total = countResult?.count || 0;

  const data = await db
    .select()
    .from(currencies)
    .where(and(...conditions))
    .orderBy(asc(currencies.name))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data.map(transformCurrency),
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
};

export const getDefaultCurrency = async (
  appId: string,
  tenantId: string
): Promise<Currency | null> => {
  const [currency] = await db
    .select()
    .from(currencies)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.isDefault, true)
      )
    )
    .limit(1);

  return currency ? transformCurrency(currency) : null;
};

export const setDefaultCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<boolean> => {
  return await db.transaction(async (tx) => {
    // Unset all default currencies
    await tx
      .update(currencies)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(
        and(
          eq(currencies.appId, appId),
          eq(currencies.tenantId, tenantId)
        )
      );

    // Set the new default
    const result = await tx
      .update(currencies)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(currencies.appId, appId),
          eq(currencies.tenantId, tenantId),
          eq(currencies.id, currencyId)
        )
      )
      .returning({ id: currencies.id });

    return result.length > 0;
  });
};

export const getActiveCurrencies = async (
  appId: string,
  tenantId: string
): Promise<Currency[]> => {
  const data = await db
    .select()
    .from(currencies)
    .where(
      and(
        eq(currencies.appId, appId),
        eq(currencies.tenantId, tenantId),
        eq(currencies.isActive, true)
      )
    )
    .orderBy(asc(currencies.name));

  return data.map(transformCurrency);
};
