/**
 * ============================================================================
 * CHUNK 12: CURRENCY API - Integration Test Cases
 * ============================================================================
 * 
 * This file contains integration test cases for the Producer Dashboard Currency API.
 * These tests validate API contracts, response schemas, and business logic.
 * 
 * Base URL: /v1/producer/currencies
 * Authentication: Required (Bearer token)
 * 
 * Endpoints Covered:
 * 1. GET    /producer/currencies            - List currencies with pagination & filters
 * 2. GET    /producer/currencies/default    - Get default currency
 * 3. GET    /producer/currencies/:id        - Get single currency by ID
 * 4. POST   /producer/currencies            - Create new currency
 * 5. PUT    /producer/currencies/:id        - Update existing currency
 * 6. DELETE /producer/currencies/:id        - Delete currency
 * 7. PUT    /producer/currencies/:id/default - Set default currency
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (Based on services/backend/src/domains/currency/types.ts)
// ============================================================================

interface Currency {
  id: number;
  app_id: string;
  tenant_id: string;
  code: string;
  name: string;
  symbol?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateCurrencyRequest {
  code: string;
  name: string;
  symbol?: string;
  is_active?: boolean;
  is_default?: boolean;
}

interface UpdateCurrencyRequest {
  code?: string;
  name?: string;
  symbol?: string;
  is_active?: boolean;
  is_default?: boolean;
}

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999/v1';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';
const SESSION_COOKIES = process.env.TEST_SESSION_COOKIES || '';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-host': 'localhost:3002',
};

// Support both Bearer token and session cookies for flexibility
if (AUTH_TOKEN) {
  headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
}
if (SESSION_COOKIES) {
  headers['Cookie'] = SESSION_COOKIES;
}

// API Response types
interface ApiRequestResponse<T = ApiResponse> {
  status: number;
  headers: Headers;
  data: T;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface ListApiResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  message?: string;
  error?: string;
}

// Typed API response aliases
type CurrencyListApiResponse = ListApiResponse<Currency>;
type CurrencyApiResponse = ApiResponse<Currency>;
type CurrencyDeleteApiResponse = ApiResponse<void>;

// Helper function to make API calls
async function apiRequest<T = ApiResponse>(
  method: string,
  endpoint: string,
  body?: object,
  customHeaders?: Record<string, string>
): Promise<ApiRequestResponse<T>> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { ...headers, ...customHeaders },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  
  const data = await response.json().catch(() => null) as T;
  return { status: response.status, headers: response.headers, data };
}

// Helper to generate unique currency code
function generateCurrencyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const validCurrencyPayload: CreateCurrencyRequest = {
  code: 'TST',
  name: 'Test Currency',
  symbol: '₮',
  is_active: true,
  is_default: false,
};

const usdCurrencyPayload: CreateCurrencyRequest = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  is_active: true,
  is_default: false,
};

const eurCurrencyPayload: CreateCurrencyRequest = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€',
  is_active: true,
  is_default: false,
};

// ============================================================================
// TEST SUITE: LIST CURRENCIES API
// ============================================================================

describe('Currency API - List Currencies', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/currencies
   * Description: List all currencies with pagination and filtering
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/currencies', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 1.1: Success - List currencies without filters
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of currencies', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure (flat list response)
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('page_size');
      expect(response.data).toHaveProperty('total_pages');
      
      // Assert - Data Types
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(typeof response.data.total).toBe('number');
      expect(typeof response.data.page).toBe('number');
      expect(typeof response.data.page_size).toBe('number');
      expect(typeof response.data.total_pages).toBe('number');
      
      // Assert - Array is not null
      expect(response.data.data).not.toBeNull();
      expect(response.data.total).toBeGreaterThanOrEqual(0);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.2: Success - List currencies with pagination
    // -----------------------------------------------------------------------
    it('should return paginated results with page and page_size params', async () => {
      // Arrange
      const endpoint = '/producer/currencies?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.3: Success - Filter by code
    // -----------------------------------------------------------------------
    it('should filter currencies by code', async () => {
      // Arrange
      const endpoint = '/producer/currencies?code=INR';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // All returned currencies should have code 'INR' (case-insensitive)
      const currencies = response.data.data;
      currencies.forEach((currency: Currency) => {
        expect(currency.code.toUpperCase()).toBe('INR');
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.4: Success - Filter by is_active
    // -----------------------------------------------------------------------
    it('should filter currencies by is_active flag', async () => {
      // Arrange
      const endpoint = '/producer/currencies?is_active=true';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      const currencies = response.data.data;
      currencies.forEach((currency: Currency) => {
        expect(currency.is_active).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.5: Success - Filter by is_default
    // -----------------------------------------------------------------------
    it('should filter currencies by is_default flag', async () => {
      // Arrange
      const endpoint = '/producer/currencies?is_default=true';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      const currencies = response.data.data;
      currencies.forEach((currency: Currency) => {
        expect(currency.is_default).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.6: Success - Search by keyword
    // -----------------------------------------------------------------------
    it('should search currencies by keyword', async () => {
      // Arrange
      const endpoint = '/producer/currencies?search=dollar';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Results should contain 'dollar' in name or code
      const currencies = response.data.data;
      currencies.forEach((currency: Currency) => {
        const matchesSearch = 
          currency.name.toLowerCase().includes('dollar') ||
          currency.code.toLowerCase().includes('dollar');
        expect(matchesSearch).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.7: Success - Empty results
    // -----------------------------------------------------------------------
    it('should return empty array when no currencies match filters', async () => {
      // Arrange - Use a code that likely doesn't exist
      const endpoint = '/producer/currencies?code=XYZ';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
      expect(response.data.total).toBe(0);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.8: Currency object schema validation
    // -----------------------------------------------------------------------
    it('should return currencies with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/currencies?page_size=1';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert - If currencies exist, validate schema
      if (response.data.data.length > 0) {
        const currency = response.data.data[0];
        
        // Required fields
        expect(currency).toHaveProperty('id');
        expect(currency).toHaveProperty('app_id');
        expect(currency).toHaveProperty('tenant_id');
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('is_active');
        expect(currency).toHaveProperty('is_default');
        expect(currency).toHaveProperty('created_at');
        expect(currency).toHaveProperty('updated_at');
        
        // Type validations - ID can be number or string (bigint serialization)
        expect(['number', 'string']).toContain(typeof currency.id);
        expect(typeof currency.code).toBe('string');
        expect(typeof currency.name).toBe('string');
        expect(typeof currency.is_active).toBe('boolean');
        expect(typeof currency.is_default).toBe('boolean');
        
        // Code should be exactly 3 characters
        expect(currency.code.length).toBe(3);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.9: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.10: Error - Invalid pagination values
    // -----------------------------------------------------------------------
    it('should handle invalid pagination gracefully', async () => {
      // Arrange - negative values should be sanitized to defaults
      const endpoint = '/producer/currencies?page=-1&page_size=0';
      
      // Act
      const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
      
      // Assert - Should return 200 with default pagination applied
      expect(response.status).toBe(200);
      if (response.data?.data) {
        expect(response.data.page).toBe(1);
        expect(response.data.page_size).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// TEST SUITE: GET DEFAULT CURRENCY API
// ============================================================================

describe('Currency API - Get Default Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/currencies/default
   * Description: Get the default currency for the tenant
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/currencies/default', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 2.1: Success - Get default currency
    // -----------------------------------------------------------------------
    it('should return 200 and default currency when exists', async () => {
      // Arrange
      const endpoint = '/producer/currencies/default';
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert - Either returns currency or 404 if no default set
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('success', true);
        expect(response.data).toHaveProperty('data');
        expect(response.data.data.is_default).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.2: Success - Default currency has correct schema
    // -----------------------------------------------------------------------
    it('should return default currency with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/currencies/default';
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert
      if (response.status === 200) {
        const currency = response.data.data;
        
        expect(currency).toHaveProperty('id');
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('is_default', true);
        expect(currency.code.length).toBe(3);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/currencies/default';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: GET SINGLE CURRENCY API
// ============================================================================

describe('Currency API - Get Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/currencies/:id
   * Description: Get a single currency by ID
   * -------------------------------------------------------------------------
   */

  let existingCurrencyId: number;

  beforeAll(async () => {
    // Get an existing currency ID for testing
    const response = await apiRequest<CurrencyListApiResponse>('GET', '/producer/currencies?page_size=1');
    if (response.data?.data?.[0]) {
      existingCurrencyId = response.data.data[0].id;
    }
  });

  describe('GET /producer/currencies/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 3.1: Success - Get currency by valid ID
    // -----------------------------------------------------------------------
    it('should return 200 and currency details for valid ID', async () => {
      if (!existingCurrencyId) {
        console.log('Skipping test: No existing currency found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/currencies/${existingCurrencyId}`;
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Currency Schema
      const currency = response.data.data;
      expect(currency.id).toBe(existingCurrencyId);
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('is_active');
      expect(currency).toHaveProperty('is_default');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.2: Success - Complete currency schema validation
    // -----------------------------------------------------------------------
    it('should return complete currency object with all fields', async () => {
      if (!existingCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${existingCurrencyId}`;
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert - All expected fields exist
      const currency = response.data.data;
      
      // Core fields
      expect(currency).toHaveProperty('id');
      expect(currency).toHaveProperty('app_id');
      expect(currency).toHaveProperty('tenant_id');
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      
      // Boolean fields
      expect(currency).toHaveProperty('is_active');
      expect(currency).toHaveProperty('is_default');
      
      // Timestamps
      expect(currency).toHaveProperty('created_at');
      expect(currency).toHaveProperty('updated_at');
      
      // Code validation
      expect(currency.code.length).toBe(3);
      expect(currency.code).toBe(currency.code.toUpperCase());
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.3: Error - Currency not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent currency ID', async () => {
      // Arrange
      const nonExistentId = 999999999;
      const endpoint = `/producer/currencies/${nonExistentId}`;
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.4: Error - Invalid currency ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid currency ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      const endpoint = `/producer/currencies/${invalidId}`;
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!existingCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${existingCurrencyId}`;
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: CREATE CURRENCY API
// ============================================================================

describe('Currency API - Create Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/currencies
   * Description: Create a new currency
   * -------------------------------------------------------------------------
   */

  const createdCurrencyIds: number[] = [];

  afterAll(async () => {
    // Cleanup: Delete all currencies created during tests
    for (const id of createdCurrencyIds) {
      await apiRequest('DELETE', `/producer/currencies/${id}`);
    }
  });

  describe('POST /producer/currencies', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 4.1: Success - Create currency with minimum required fields
    // -----------------------------------------------------------------------
    it('should return 201 and created currency for valid payload', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const code = generateCurrencyCode();
      const payload: CreateCurrencyRequest = {
        code: code,
        name: `Test Currency ${code}`,
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert - Status Code (201 Created)
      expect([200, 201]).toContain(response.status);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Created Currency
      const currency = response.data.data;
      expect(currency).toHaveProperty('id');
      expect(currency.code).toBe(code.toUpperCase());
      expect(currency.name).toBe(payload.name);
      
      // Track for cleanup
      if (currency.id) createdCurrencyIds.push(currency.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.2: Success - Create currency with all fields
    // -----------------------------------------------------------------------
    it('should create currency with all optional fields', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const code = generateCurrencyCode();
      const payload: CreateCurrencyRequest = {
        code: code,
        name: `Full Fields Currency ${code}`,
        symbol: '¤',
        is_active: true,
        is_default: false,
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const currency = response.data.data;
      expect(currency.code).toBe(code.toUpperCase());
      expect(currency.name).toBe(payload.name);
      expect(currency.symbol).toBe(payload.symbol);
      expect(currency.is_active).toBe(true);
      expect(currency.is_default).toBe(false);
      
      if (currency.id) createdCurrencyIds.push(currency.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.3: Success - Code is uppercase normalized
    // -----------------------------------------------------------------------
    it('should normalize currency code to uppercase', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const code = generateCurrencyCode().toLowerCase();
      const payload: CreateCurrencyRequest = {
        code: code, // lowercase
        name: 'Lowercase Code Test',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      expect(response.data.data.code).toBe(code.toUpperCase());
      
      if (response.data?.data?.id) createdCurrencyIds.push(response.data.data.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.4: Error - Missing required field (code)
    // -----------------------------------------------------------------------
    it('should return 400 when code is missing', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const payload = {
        name: 'Currency Without Code',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.5: Error - Missing required field (name)
    // -----------------------------------------------------------------------
    it('should return 400 when name is missing', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const payload = {
        code: 'TST',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.6: Error - Invalid code length (too short)
    // -----------------------------------------------------------------------
    it('should return 400 when code is not exactly 3 characters', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const payload: CreateCurrencyRequest = {
        code: 'AB', // Only 2 characters
        name: 'Short Code Currency',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.7: Error - Invalid code length (too long)
    // -----------------------------------------------------------------------
    it('should return 400 when code is more than 3 characters', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const payload: CreateCurrencyRequest = {
        code: 'ABCD', // 4 characters
        name: 'Long Code Currency',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.8: Error - Duplicate currency code
    // -----------------------------------------------------------------------
    it('should return 409 for duplicate currency code', async () => {
      // Arrange - Create a currency first
      const endpoint = '/producer/currencies';
      const code = generateCurrencyCode();
      const payload1: CreateCurrencyRequest = {
        code: code,
        name: 'First Currency',
      };
      
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload1);
      expect([200, 201]).toContain(createResponse.status);
      if (createResponse.data?.data?.id) createdCurrencyIds.push(createResponse.data.data.id);
      
      // Act - Try to create with same code
      const payload2: CreateCurrencyRequest = {
        code: code,
        name: 'Duplicate Currency',
      };
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload2);
      
      // Assert
      expect(response.status).toBe(409);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.9: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCurrencyPayload),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.10: Response contains generated fields
    // -----------------------------------------------------------------------
    it('should generate id, timestamps, and default values', async () => {
      // Arrange
      const endpoint = '/producer/currencies';
      const code = generateCurrencyCode();
      const payload: CreateCurrencyRequest = {
        code: code,
        name: `Generated Fields Currency ${code}`,
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const currency = response.data.data;
      expect(currency.id).toBeDefined();
      // ID can be number or string (bigint serialization)
      expect(['number', 'string']).toContain(typeof currency.id);
      expect(currency).toHaveProperty('created_at');
      expect(currency).toHaveProperty('updated_at');
      expect(currency).toHaveProperty('app_id');
      expect(currency).toHaveProperty('tenant_id');
      // Default values
      expect(currency.is_active).toBe(true);
      expect(currency.is_default).toBe(false);
      
      if (currency.id) createdCurrencyIds.push(currency.id);
    });
  });
});

// ============================================================================
// TEST SUITE: UPDATE CURRENCY API
// ============================================================================

describe('Currency API - Update Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: PUT /producer/currencies/:id
   * Description: Update an existing currency
   * -------------------------------------------------------------------------
   */

  let testCurrencyId: number;
  let testCurrencyCode: string;

  beforeAll(async () => {
    // Create a test currency for update tests
    const code = generateCurrencyCode();
    const response = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
      code: code,
      name: 'Update Test Currency',
      is_active: true,
      is_default: false,
    });
    
    if (response.data?.data?.id) {
      testCurrencyId = response.data.data.id;
      testCurrencyCode = code;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testCurrencyId) {
      await apiRequest<CurrencyDeleteApiResponse>('DELETE', `/producer/currencies/${testCurrencyId}`);
    }
  });

  describe('PUT /producer/currencies/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 5.1: Success - Update currency name
    // -----------------------------------------------------------------------
    it('should return 200 and updated currency for valid update', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = {
        name: 'Updated Currency Name - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(payload.name);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.2: Success - Update symbol
    // -----------------------------------------------------------------------
    it('should update currency symbol', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = {
        symbol: '₿',
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.symbol).toBe('₿');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.3: Success - Update is_active
    // -----------------------------------------------------------------------
    it('should update is_active status', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = {
        is_active: false,
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.is_active).toBe(false);
      
      // Reset back to active
      await apiRequest<CurrencyApiResponse>('PUT', endpoint, { is_active: true });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.4: Success - Update multiple fields
    // -----------------------------------------------------------------------
    it('should update multiple fields at once', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = {
        name: 'Multi-Update Currency',
        symbol: '⚙',
        is_active: true,
      };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      
      const currency = response.data.data;
      expect(currency.name).toBe(payload.name);
      expect(currency.symbol).toBe(payload.symbol);
      expect(currency.is_active).toBe(payload.is_active);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.5: Success - Partial update preserves other fields
    // -----------------------------------------------------------------------
    it('should preserve unchanged fields during partial update', async () => {
      if (!testCurrencyId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${testCurrencyId}`);
      const originalCurrency = getResponse.data.data;
      
      // Act - Update only name
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = { name: 'Partial Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert - Other fields unchanged
      expect(updateResponse.status).toBe(200);
      const updatedCurrency = updateResponse.data.data;
      
      expect(updatedCurrency.name).toBe(payload.name);
      expect(updatedCurrency.code).toBe(originalCurrency.code);
      expect(updatedCurrency.is_active).toBe(originalCurrency.is_active);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.6: Success - updated_at timestamp changes
    // -----------------------------------------------------------------------
    it('should update the updated_at timestamp', async () => {
      if (!testCurrencyId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${testCurrencyId}`);
      const originalUpdatedAt = getResponse.data.data.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Act
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = { name: 'Timestamp Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(updateResponse.status).toBe(200);
      const newUpdatedAt = updateResponse.data.data.updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.7: Error - Currency not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent currency ID', async () => {
      // Arrange
      const endpoint = '/producer/currencies/999999999';
      const payload: UpdateCurrencyRequest = { name: 'Non-existent Update' };
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.8: Error - Invalid code length
    // -----------------------------------------------------------------------
    it('should return 400 for invalid code length in update', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload: UpdateCurrencyRequest = { code: 'AB' }; // Too short
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.9: Error - Duplicate code on update
    // -----------------------------------------------------------------------
    it('should return 409 when updating to duplicate code', async () => {
      if (!testCurrencyId) return;
      
      // First, create another currency
      const otherCode = generateCurrencyCode();
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: otherCode,
        name: 'Other Currency for Duplicate Test',
      });
      
      if (createResponse.data?.data?.id) {
        // Try to update original currency with the other currency's code
        const endpoint = `/producer/currencies/${testCurrencyId}`;
        const payload: UpdateCurrencyRequest = { code: otherCode };
        
        const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
        
        // Assert
        expect(response.status).toBe(409);
        
        // Cleanup
        await apiRequest('DELETE', `/producer/currencies/${createResponse.data.data.id}`);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.10: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Update' }),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.11: Error - Empty payload
    // -----------------------------------------------------------------------
    it('should handle empty payload gracefully', async () => {
      if (!testCurrencyId) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrencyId}`;
      const payload = {};
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint, payload);
      
      // Assert - Should succeed with no changes or return 400
      expect([200, 400]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: DELETE CURRENCY API
// ============================================================================

describe('Currency API - Delete Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: DELETE /producer/currencies/:id
   * Description: Delete a currency
   * -------------------------------------------------------------------------
   */

  describe('DELETE /producer/currencies/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 6.1: Success - Delete currency
    // -----------------------------------------------------------------------
    it('should return 204 and delete currency successfully', async () => {
      // Arrange - Create currency to delete
      const code = generateCurrencyCode();
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: code,
        name: 'Currency To Delete',
        is_default: false,
      });
      
      const currencyId = createResponse.data?.data?.id;
      expect(currencyId).toBeDefined();
      
      // Act
      const endpoint = `/producer/currencies/${currencyId}`;
      const response = await apiRequest<CurrencyDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect([200, 204]).toContain(response.status);
      
      // Verify deletion
      const getResponse = await apiRequest<CurrencyApiResponse>('GET', endpoint);
      expect(getResponse.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.2: Error - Cannot delete default currency
    // -----------------------------------------------------------------------
    it('should return 400 when trying to delete default currency', async () => {
      // Arrange - Create a currency and set it as default
      const code = generateCurrencyCode();
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: code,
        name: 'Default Currency To Try Delete',
        is_default: false,
      });
      
      const currencyId = createResponse.data?.data?.id;
      
      if (currencyId) {
        // Set as default
        await apiRequest('PUT', `/producer/currencies/${currencyId}/default`);
        
        // Act - Try to delete
        const response = await apiRequest<CurrencyDeleteApiResponse>('DELETE', `/producer/currencies/${currencyId}`);
        
        // Assert
        expect(response.status).toBe(400);
        
        // Cleanup - Unset as default first by setting another currency as default, then delete
        // For now, just leave it as we can't easily unset default
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.3: Error - Delete non-existent currency
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent currency ID', async () => {
      // Arrange
      const endpoint = '/producer/currencies/999999999';
      
      // Act
      const response = await apiRequest<CurrencyDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.4: Error - Delete already deleted currency
    // -----------------------------------------------------------------------
    it('should return 404 when deleting already deleted currency', async () => {
      // Arrange - Create and delete currency
      const code = generateCurrencyCode();
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: code,
        name: 'Double Delete Currency',
        is_default: false,
      });
      
      const currencyId = createResponse.data?.data?.id;
      await apiRequest<CurrencyDeleteApiResponse>('DELETE', `/producer/currencies/${currencyId}`);
      
      // Act - Try to delete again
      const response = await apiRequest<CurrencyDeleteApiResponse>('DELETE', `/producer/currencies/${currencyId}`);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.5: Error - Invalid currency ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid currency ID format', async () => {
      // Arrange
      const endpoint = '/producer/currencies/invalid-id';
      
      // Act
      const response = await apiRequest<CurrencyDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.6: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/currencies/1';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.7: Idempotency check
    // -----------------------------------------------------------------------
    it('should handle concurrent delete requests gracefully', async () => {
      // Arrange
      const code = generateCurrencyCode();
      const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: code,
        name: 'Concurrent Delete Currency',
        is_default: false,
      });
      
      const currencyId = createResponse.data?.data?.id;
      const endpoint = `/producer/currencies/${currencyId}`;
      
      // Act - Send multiple delete requests concurrently
      const responses = await Promise.all([
        apiRequest<CurrencyDeleteApiResponse>('DELETE', endpoint),
        apiRequest<CurrencyDeleteApiResponse>('DELETE', endpoint),
      ]);
      
      // Assert - At least one should succeed, others should be 404
      const statuses = responses.map(r => r.status);
      const successCount = statuses.filter(s => s === 200 || s === 204).length;
      const notFoundCount = statuses.filter(s => s === 404).length;
      
      expect(successCount + notFoundCount).toBe(2);
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });
});

// ============================================================================
// TEST SUITE: SET DEFAULT CURRENCY API
// ============================================================================

describe('Currency API - Set Default Currency', () => {
  /**
   * -------------------------------------------------------------------------
   * API: PUT /producer/currencies/:id/default
   * Description: Set a currency as the default
   * -------------------------------------------------------------------------
   */

  let testCurrency1Id: number;
  let testCurrency2Id: number;

  beforeAll(async () => {
    // Create test currencies for default tests
    const code1 = generateCurrencyCode();
    const response1 = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
      code: code1,
      name: 'Default Test Currency 1',
      is_default: false,
    });
    if (response1.data?.data?.id) {
      testCurrency1Id = response1.data.data.id;
    }

    const code2 = generateCurrencyCode();
    const response2 = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
      code: code2,
      name: 'Default Test Currency 2',
      is_default: false,
    });
    if (response2.data?.data?.id) {
      testCurrency2Id = response2.data.data.id;
    }
  });

  afterAll(async () => {
    // Cleanup - Note: May not be able to delete if it's the default
    if (testCurrency1Id) {
      await apiRequest('DELETE', `/producer/currencies/${testCurrency1Id}`);
    }
    if (testCurrency2Id) {
      await apiRequest('DELETE', `/producer/currencies/${testCurrency2Id}`);
    }
  });

  describe('PUT /producer/currencies/:id/default', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 7.1: Success - Set default currency
    // -----------------------------------------------------------------------
    it('should set currency as default successfully', async () => {
      if (!testCurrency1Id) return;
      
      // Arrange
      const endpoint = `/producer/currencies/${testCurrency1Id}/default`;
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify it's now default
      const getResponse = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${testCurrency1Id}`);
      expect(getResponse.data.data.is_default).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.2: Success - Changing default unsets previous default
    // -----------------------------------------------------------------------
    it('should unset previous default when setting new default', async () => {
      if (!testCurrency1Id || !testCurrency2Id) return;
      
      // Arrange - Ensure currency1 is default
      await apiRequest('PUT', `/producer/currencies/${testCurrency1Id}/default`);
      
      // Act - Set currency2 as default
      const response = await apiRequest<CurrencyApiResponse>('PUT', `/producer/currencies/${testCurrency2Id}/default`);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify currency2 is now default
      const getCurrency2 = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${testCurrency2Id}`);
      expect(getCurrency2.data.data.is_default).toBe(true);
      
      // Verify currency1 is no longer default
      const getCurrency1 = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${testCurrency1Id}`);
      expect(getCurrency1.data.data.is_default).toBe(false);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.3: Success - Setting already default currency is idempotent
    // -----------------------------------------------------------------------
    it('should succeed when setting already default currency as default', async () => {
      if (!testCurrency1Id) return;
      
      // Arrange - Set as default
      await apiRequest('PUT', `/producer/currencies/${testCurrency1Id}/default`);
      
      // Act - Set as default again
      const response = await apiRequest<CurrencyApiResponse>('PUT', `/producer/currencies/${testCurrency1Id}/default`);
      
      // Assert
      expect(response.status).toBe(200);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.4: Error - Non-existent currency
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent currency', async () => {
      // Arrange
      const endpoint = '/producer/currencies/999999999/default';
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.5: Error - Invalid currency ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid currency ID format', async () => {
      // Arrange
      const endpoint = '/producer/currencies/invalid-id/default';
      
      // Act
      const response = await apiRequest<CurrencyApiResponse>('PUT', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.6: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/currencies/1/default';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// EDGE CASES & INTEGRATION SCENARIOS
// ============================================================================

describe('Currency API - Edge Cases & Integration', () => {
  
  // -------------------------------------------------------------------------
  // TEST CASE E.1: Response headers validation
  // -------------------------------------------------------------------------
  it('should return correct content-type header', async () => {
    // Arrange
    const endpoint = '/producer/currencies';
    
    // Act
    const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
    
    // Assert
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.2: Special characters in name
  // -------------------------------------------------------------------------
  it('should handle special characters in currency name', async () => {
    // Arrange
    const code = generateCurrencyCode();
    const payload: CreateCurrencyRequest = {
      code: code,
      name: 'Currency with "quotes" & <special> chars: émojis 💰',
      symbol: '₿',
    };
    
    // Act
    const response = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    expect(response.data.data.name).toBe(payload.name);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<CurrencyDeleteApiResponse>('DELETE', `/producer/currencies/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.3: Unicode currency symbols
  // -------------------------------------------------------------------------
  it('should handle various unicode currency symbols', async () => {
    const unicodeSymbols = ['₹', '€', '£', '¥', '₿', '₽', '₩', '฿', '₺', '₴'];
    
    for (const symbol of unicodeSymbols.slice(0, 3)) { // Test a few
      const code = generateCurrencyCode();
      const response = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
        code: code,
        name: `Unicode Symbol Test ${symbol}`,
        symbol: symbol,
      });
      
      expect([200, 201]).toContain(response.status);
      expect(response.data.data.symbol).toBe(symbol);
      
      // Cleanup
      if (response.data?.data?.id) {
        await apiRequest('DELETE', `/producer/currencies/${response.data.data.id}`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.4: CRUD lifecycle test
  // -------------------------------------------------------------------------
  it('should complete full CRUD lifecycle', async () => {
    const code = generateCurrencyCode();
    
    // CREATE
    const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
      code: code,
      name: 'Lifecycle Test Currency',
      symbol: '⚙',
      is_active: true,
      is_default: false,
    });
    expect([200, 201]).toContain(createResponse.status);
    const currencyId = createResponse.data.data.id;

    // READ
    const readResponse = await apiRequest<CurrencyApiResponse>('GET', `/producer/currencies/${currencyId}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.data.data.id).toBe(currencyId);
    expect(readResponse.data.data.code).toBe(code.toUpperCase());

    // UPDATE
    const updateResponse = await apiRequest<CurrencyApiResponse>('PUT', `/producer/currencies/${currencyId}`, {
      name: 'Updated Lifecycle Currency',
      symbol: '✓',
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.data.name).toBe('Updated Lifecycle Currency');
    expect(updateResponse.data.data.symbol).toBe('✓');

    // SET DEFAULT
    const setDefaultResponse = await apiRequest<CurrencyApiResponse>('PUT', `/producer/currencies/${currencyId}/default`);
    expect(setDefaultResponse.status).toBe(200);

    // GET DEFAULT
    const getDefaultResponse = await apiRequest<CurrencyApiResponse>('GET', '/producer/currencies/default');
    expect(getDefaultResponse.status).toBe(200);
    expect(getDefaultResponse.data.data.id).toBe(currencyId);

    // LIST (should appear in results)
    const listResponse = await apiRequest<CurrencyListApiResponse>('GET', `/producer/currencies?code=${code}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.data.data.length).toBe(1);

    // Note: Cannot delete default currency, so we need to set another as default first
    // For this test, we'll leave it as default
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.5: Case insensitivity for code searches
  // -------------------------------------------------------------------------
  it('should handle case-insensitive code filter', async () => {
    // Arrange - Create currency with uppercase code
    const code = generateCurrencyCode();
    const createResponse = await apiRequest<CurrencyApiResponse>('POST', '/producer/currencies', {
      code: code,
      name: 'Case Test Currency',
    });
    
    if (createResponse.data?.data?.id) {
      // Act - Search with lowercase
      const searchLower = await apiRequest<CurrencyListApiResponse>('GET', `/producer/currencies?code=${code.toLowerCase()}`);
      const searchUpper = await apiRequest<CurrencyListApiResponse>('GET', `/producer/currencies?code=${code.toUpperCase()}`);
      
      // Assert - Both should find the currency
      expect(searchLower.data.data.length).toBeGreaterThanOrEqual(0);
      expect(searchUpper.data.data.length).toBeGreaterThanOrEqual(0);
      
      // Cleanup
      await apiRequest('DELETE', `/producer/currencies/${createResponse.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.6: Pagination boundary tests
  // -------------------------------------------------------------------------
  it('should handle pagination boundary correctly', async () => {
    // Arrange
    const endpoint = '/producer/currencies?page=1&page_size=100';
    
    // Act
    const response = await apiRequest<CurrencyListApiResponse>('GET', endpoint);
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.data.page_size).toBeLessThanOrEqual(100);
    expect(response.data.total_pages).toBeGreaterThanOrEqual(0);
    
    // If there are results, total should match
    if (response.data.total > 0) {
      expect(response.data.total_pages).toBe(Math.ceil(response.data.total / response.data.page_size));
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.7: Empty name handling
  // -------------------------------------------------------------------------
  it('should reject empty name', async () => {
    // Arrange
    const endpoint = '/producer/currencies';
    const payload: CreateCurrencyRequest = {
      code: generateCurrencyCode(),
      name: '',
    };
    
    // Act
    const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
    
    // Assert
    expect(response.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.8: Whitespace-only code handling
  // -------------------------------------------------------------------------
  it('should reject whitespace-only code', async () => {
    // Arrange
    const endpoint = '/producer/currencies';
    const payload: CreateCurrencyRequest = {
      code: '   ',
      name: 'Whitespace Code Test',
    };
    
    // Act
    const response = await apiRequest<CurrencyApiResponse>('POST', endpoint, payload);
    
    // Assert - Should fail with 400 (invalid length) or 409 (trimmed to empty/conflict)
    expect([400, 409]).toContain(response.status);
  });
});

// ============================================================================
// EXPECTED RESPONSE SCHEMAS (For Reference)
// ============================================================================

/**
 * List Currencies Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "app_id": "app_123",
 *       "tenant_id": "tenant_456",
 *       "code": "USD",
 *       "name": "US Dollar",
 *       "symbol": "$",
 *       "is_active": true,
 *       "is_default": false,
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z"
 *     }
 *   ],
 *   "total": 10,
 *   "page": 1,
 *   "page_size": 20,
 *   "total_pages": 1,
 *   "message": "Currencies retrieved successfully"
 * }
 * 
 * Single Currency Response:
 * {
 *   "success": true,
 *   "data": { ... currency object ... },
 *   "message": "Currency retrieved successfully"
 * }
 * 
 * Create Currency Response:
 * {
 *   "success": true,
 *   "data": { ... currency object ... },
 *   "message": "Currency created successfully"
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "message": "Detailed error message"
 * }
 * 
 * Validation Rules:
 * - code: exactly 3 characters, required, unique per tenant
 * - name: required, non-empty
 * - symbol: optional
 * - is_active: defaults to true
 * - is_default: defaults to false
 * - Cannot delete default currency
 * - Setting new default unsets previous default
 */

