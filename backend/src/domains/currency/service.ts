// Currency service - business logic
import * as repo from './repository.js';
import type {
  Currency,
  CreateCurrencyRequest,
  UpdateCurrencyRequest,
  CurrencyFilter,
  CurrencyListResponse,
  PaginationParams,
} from './types.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, notFound, conflict } from '../../shared/errors/app-error.js';

export const createCurrency = async (
  appId: string,
  tenantId: string,
  data: CreateCurrencyRequest
): Promise<Currency> => {
  if (!data.code || data.code.length !== 3) {
    throw badRequest('Currency code must be exactly 3 characters');
  }
  if (!data.name) {
    throw badRequest('Currency name is required');
  }

  // Check for duplicate code
  const existing = await repo.getCurrencyByCode(appId, tenantId, data.code);
  if (existing) {
    throw conflict('Currency with this code already exists');
  }

  const currency = await repo.createCurrency(appId, tenantId, data);
  log.info(`Created currency ${currency.code} for tenant ${tenantId}`);
  return currency;
};

export const getCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<Currency> => {
  const currency = await repo.getCurrencyById(appId, tenantId, currencyId);
  if (!currency) {
    throw notFound('Currency');
  }
  return currency;
};

export const getCurrencyByCode = async (
  appId: string,
  tenantId: string,
  code: string
): Promise<Currency> => {
  const currency = await repo.getCurrencyByCode(appId, tenantId, code);
  if (!currency) {
    throw notFound('Currency');
  }
  return currency;
};

export const updateCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number,
  data: UpdateCurrencyRequest
): Promise<Currency> => {
  if (data.code !== undefined && data.code.length !== 3) {
    throw badRequest('Currency code must be exactly 3 characters');
  }

  // Check for duplicate code if updating
  if (data.code) {
    const existing = await repo.getCurrencyByCode(appId, tenantId, data.code);
    if (existing && existing.id !== currencyId) {
      throw conflict('Currency with this code already exists');
    }
  }

  const currency = await repo.updateCurrency(appId, tenantId, currencyId, data);
  if (!currency) {
    throw notFound('Currency');
  }

  log.info(`Updated currency ${currency.code}`);
  return currency;
};

export const deleteCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<void> => {
  // Check if it's the default currency
  const currency = await repo.getCurrencyById(appId, tenantId, currencyId);
  if (currency?.is_default) {
    throw badRequest('Cannot delete default currency');
  }

  const deleted = await repo.deleteCurrency(appId, tenantId, currencyId);
  if (!deleted) {
    throw notFound('Currency');
  }

  log.info(`Deleted currency ${currencyId}`);
};

export const listCurrencies = async (
  appId: string,
  tenantId: string,
  filter: CurrencyFilter = {},
  pagination: PaginationParams = {}
): Promise<CurrencyListResponse> => {
  return repo.listCurrencies(appId, tenantId, filter, pagination);
};

export const getDefaultCurrency = async (
  appId: string,
  tenantId: string
): Promise<Currency> => {
  const currency = await repo.getDefaultCurrency(appId, tenantId);
  if (!currency) {
    throw notFound('Default currency');
  }
  return currency;
};

export const setDefaultCurrency = async (
  appId: string,
  tenantId: string,
  currencyId: number
): Promise<void> => {
  // Verify currency exists
  const currency = await repo.getCurrencyById(appId, tenantId, currencyId);
  if (!currency) {
    throw notFound('Currency');
  }

  await repo.setDefaultCurrency(appId, tenantId, currencyId);
  log.info(`Set currency ${currency.code} as default`);
};

export const getActiveCurrencies = async (
  appId: string,
  tenantId: string
): Promise<Currency[]> => {
  return repo.getActiveCurrencies(appId, tenantId);
};

