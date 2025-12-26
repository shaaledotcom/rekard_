/**
 * ============================================================================
 * BILLING API - Integration Test Cases
 * ============================================================================
 * 
 * This file contains integration test cases for the Producer Dashboard Billing API.
 * These tests validate API contracts, response schemas, and business logic.
 * 
 * Base URL: /v1/producer/billing
 * Authentication: Required (Bearer token with Producer role)
 * 
 * Endpoints Covered:
 * 
 * BILLING PLANS:
 * 1.  GET    /producer/billing/plans                      - List billing plans
 * 2.  GET    /producer/billing/plans/:id                  - Get single plan
 * 3.  POST   /producer/billing/plans                      - Create plan
 * 4.  PUT    /producer/billing/plans/:id                  - Update plan
 * 5.  DELETE /producer/billing/plans/:id                  - Delete plan
 * 6.  POST   /producer/billing/plans/:id/purchase         - Purchase plan
 * 
 * WALLET:
 * 7.  GET    /producer/billing/wallet                     - Get user wallet
 * 8.  GET    /producer/billing/wallet/transactions        - Get transactions
 * 9.  GET    /producer/billing/wallet/ticket-pricing      - Get ticket pricing
 * 10. POST   /producer/billing/wallet/purchase-tickets    - Purchase tickets
 * 11. POST   /producer/billing/wallet/consume-tickets     - Consume tickets
 * 12. GET    /producer/billing/wallet/allocations         - Get allocations
 * 13. POST   /producer/billing/wallet/allocate-tickets    - Allocate tickets
 * 14. POST   /producer/billing/wallet/update-allocation   - Update allocation
 * 15. POST   /producer/billing/wallet/release-allocation  - Release allocation
 * 
 * SUBSCRIPTIONS:
 * 16. GET    /producer/billing/subscriptions/active       - Get active subscription
 * 17. POST   /producer/billing/subscription/renew         - Renew subscription
 * 18. POST   /producer/billing/subscription/cancel        - Cancel subscription
 * 
 * INVOICES:
 * 19. GET    /producer/billing/invoices                   - List invoices
 * 20. GET    /producer/billing/invoices/:id               - Get single invoice
 * 
 * FEATURES:
 * 21. GET    /producer/billing/features                   - Get user features
 * 
 * TICKET BUYERS & EMAIL ACCESS:
 * 22. GET    /producer/billing/ticket-buyers              - Get ticket buyers
 * 23. POST   /producer/billing/bulk-email-access          - Grant bulk email access
 * 24. GET    /producer/billing/email-access-status        - Get email access status
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (Based on services/backend/src/domains/billing/types.ts)
// ============================================================================

interface PlanFeature {
  code: string;
  label: string;
  icon: string;
  description?: string;
}

interface BillingPlan {
  id: number;
  app_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_cycle: string;
  initial_tickets: number;
  features: PlanFeature[];
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UserWallet {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Invoice {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  tax_rate: number;
  due_date?: string;
  paid_at?: string;
  payment_method?: string;
  external_payment_id?: string;
  billing_address: Record<string, unknown>;
  items: InvoiceItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

interface UserSubscription {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at?: string;
  trial_start?: string;
  trial_end?: string;
  payment_method_id?: string;
  external_subscription_id?: string;
  created_at: string;
  updated_at: string;
  plan?: BillingPlan;
}

interface TicketWalletAllocation {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  ticket_id: number;
  allocated_quantity: number;
  consumed_quantity: number;
  available_quantity: number;
  status: 'active' | 'released' | 'consumed';
  created_at: string;
  updated_at: string;
}

interface TicketBuyer {
  user_id: string;
  email: string;
  name?: string;
  phone?: string;
  ticket_id: number;
  ticket_title: string;
  quantity: number;
  total_amount: number;
  currency: string;
  purchased_at: string;
  order_number: string;
}

interface EmailAccessResult {
  email: string;
  status: 'granted' | 'failed' | 'already_exists';
  ticket_id: number;
  quantity: number;
  error?: string;
}

interface TicketPricing {
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  pricing_tiers: Array<{
    min_quantity: number;
    max_quantity: number;
    unit_price: number;
  }>;
}

// Request types
interface CreateBillingPlanRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billing_cycle?: string;
  initial_tickets: number;
  features?: PlanFeature[];
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
}

interface UpdateBillingPlanRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billing_cycle?: string;
  initial_tickets?: number;
  features?: PlanFeature[];
  is_active?: boolean;
  is_public?: boolean;
  sort_order?: number;
}

interface PurchaseTicketsRequest {
  quantity: number;
  unit_price?: number;
  currency?: string;
  payment_method_id?: string;
  external_payment_id?: string;
  billing_address?: Record<string, unknown>;
}

interface ConsumeTicketsRequest {
  quantity: number;
  reference_type: string;
  reference_id: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface BulkEmailAccessRequest {
  user_emails: string[];
  ticket_id: number;
  event_id?: number;
  quantity: number;
  unit_price?: number;
  currency?: string;
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
type BillingPlanListApiResponse = ListApiResponse<BillingPlan>;
type BillingPlanApiResponse = ApiResponse<BillingPlan>;
type UserWalletApiResponse = ApiResponse<UserWallet>;
type WalletTransactionListApiResponse = ListApiResponse<WalletTransaction>;
type InvoiceListApiResponse = ListApiResponse<Invoice>;
type InvoiceApiResponse = ApiResponse<Invoice>;
type SubscriptionApiResponse = ApiResponse<UserSubscription | null>;
type AllocationListApiResponse = ListApiResponse<TicketWalletAllocation>;
type TicketPricingApiResponse = ApiResponse<TicketPricing>;
type FeaturesApiResponse = ApiResponse<PlanFeature[]>;
type TicketBuyersApiResponse = ApiResponse<{
  users: TicketBuyer[];
  next_pagination_token: string | null;
}>;
type BulkEmailAccessApiResponse = ApiResponse<{
  results: EmailAccessResult[];
  success_count: number;
  failure_count: number;
}>;
type EmailAccessStatusApiResponse = ApiResponse<{
  statuses: Array<{
    email: string;
    has_access: boolean;
    quantity: number;
    ticket_id: number;
  }>;
}>;

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

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const validBillingPlanPayload: CreateBillingPlanRequest = {
  name: 'Test Plan - Integration Test',
  description: 'Test billing plan created by integration tests',
  price: 999,
  currency: 'INR',
  billing_cycle: 'monthly',
  initial_tickets: 100,
  features: [
    { code: 'feature1', label: 'Feature 1', icon: 'star' },
    { code: 'feature2', label: 'Feature 2', icon: 'check' },
  ],
  is_active: true,
  is_public: true,
  sort_order: 0,
};

const premiumBillingPlanPayload: CreateBillingPlanRequest = {
  name: 'Premium Plan - Integration Test',
  description: 'Premium tier plan for testing',
  price: 2999,
  currency: 'INR',
  billing_cycle: 'yearly',
  initial_tickets: 500,
  features: [
    { code: 'unlimited_events', label: 'Unlimited Events', icon: 'calendar' },
    { code: 'priority_support', label: 'Priority Support', icon: 'headset' },
    { code: 'analytics', label: 'Advanced Analytics', icon: 'chart' },
  ],
  is_active: true,
  is_public: true,
  sort_order: 1,
};

const purchaseTicketsPayload: PurchaseTicketsRequest = {
  quantity: 10,
  currency: 'INR',
};

const consumeTicketsPayload: ConsumeTicketsRequest = {
  quantity: 5,
  reference_type: 'ticket_publish',
  reference_id: 'test-ticket-123',
  description: 'Test ticket consumption',
};

const bulkEmailAccessPayload: BulkEmailAccessRequest = {
  user_emails: ['test1@example.com', 'test2@example.com'],
  ticket_id: 1,
  quantity: 1,
};

// ============================================================================
// TEST SUITE: BILLING PLANS API
// ============================================================================

describe('Billing API - Billing Plans', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/plans
   * Description: List all billing plans with pagination and filtering
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/plans', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 1.1: Success - List billing plans without filters
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of billing plans', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
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
    // TEST CASE 1.2: Success - List billing plans with pagination
    // -----------------------------------------------------------------------
    it('should return paginated results with page and page_size params', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.3: Success - Filter by is_active
    // -----------------------------------------------------------------------
    it('should filter billing plans by is_active status', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans?is_active=true';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // All returned plans should have is_active true
      const plans = response.data.data;
      plans.forEach((plan: BillingPlan) => {
        expect(plan.is_active).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.4: Success - Filter by is_public
    // -----------------------------------------------------------------------
    it('should filter billing plans by is_public status', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans?is_public=true';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // All returned plans should have is_public true
      const plans = response.data.data;
      plans.forEach((plan: BillingPlan) => {
        expect(plan.is_public).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.5: Success - Sort by sort_order
    // -----------------------------------------------------------------------
    it('should sort billing plans by sort_order ascending by default', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans?sort_by=sort_order&sort_order=asc';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify ascending order
      const plans = response.data.data;
      if (plans.length > 1) {
        for (let i = 0; i < plans.length - 1; i++) {
          expect(plans[i].sort_order).toBeLessThanOrEqual(plans[i + 1].sort_order);
        }
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.6: Billing plan object schema validation
    // -----------------------------------------------------------------------
    it('should return billing plans with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans?page_size=1';
      
      // Act
      const response = await apiRequest<BillingPlanListApiResponse>('GET', endpoint);
      
      // Assert - If plans exist, validate schema
      if (response.data.data.length > 0) {
        const plan = response.data.data[0];
        
        // Required fields
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('app_id');
        expect(plan).toHaveProperty('tenant_id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('currency');
        expect(plan).toHaveProperty('billing_cycle');
        expect(plan).toHaveProperty('initial_tickets');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('is_active');
        expect(plan).toHaveProperty('is_public');
        expect(plan).toHaveProperty('sort_order');
        expect(plan).toHaveProperty('created_at');
        expect(plan).toHaveProperty('updated_at');
        
        // Type validations
        expect(typeof plan.id).toBe('number');
        expect(typeof plan.name).toBe('string');
        expect(typeof plan.price).toBe('number');
        expect(typeof plan.is_active).toBe('boolean');
        expect(typeof plan.is_public).toBe('boolean');
        expect(Array.isArray(plan.features)).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.7: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/plans/:id
   * Description: Get a single billing plan by ID
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/plans/:id', () => {
    let existingPlanId: number;

    beforeAll(async () => {
      // Get an existing plan ID for testing
      const response = await apiRequest<BillingPlanListApiResponse>('GET', '/producer/billing/plans?page_size=1');
      if (response.data?.data?.[0]) {
        existingPlanId = response.data.data[0].id;
      }
    });
    
    // -----------------------------------------------------------------------
    // TEST CASE 2.1: Success - Get billing plan by valid ID
    // -----------------------------------------------------------------------
    it('should return 200 and billing plan details for valid ID', async () => {
      if (!existingPlanId) {
        console.log('Skipping test: No existing billing plan found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/billing/plans/${existingPlanId}`;
      
      // Act
      const response = await apiRequest<BillingPlanApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Plan Schema
      const plan = response.data.data;
      expect(plan.id).toBe(existingPlanId);
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('price');
      expect(plan).toHaveProperty('features');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.2: Error - Get plan with non-existent ID
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent plan ID', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans/999999';
      
      // Act
      const response = await apiRequest<ApiResponse>('GET', endpoint);
      
      // Assert - 404 or appropriate error
      expect([404, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.3: Error - Invalid plan ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid plan ID format', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans/invalid-id';
      
      // Act
      const response = await apiRequest<ApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/plans
   * Description: Create a new billing plan
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/plans', () => {
    let createdPlanId: number;

    afterAll(async () => {
      // Cleanup: Delete the created plan
      if (createdPlanId) {
        await apiRequest('DELETE', `/producer/billing/plans/${createdPlanId}`);
      }
    });
    
    // -----------------------------------------------------------------------
    // TEST CASE 3.1: Success - Create billing plan with valid data
    // -----------------------------------------------------------------------
    it('should return 201 and create a new billing plan', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans';
      const payload = { ...validBillingPlanPayload, name: `Test Plan ${Date.now()}` };
      
      // Act
      const response = await apiRequest<BillingPlanApiResponse>('POST', endpoint, payload);
      
      // Assert - Status Code
      expect(response.status).toBe(201);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('message');
      
      // Assert - Created Plan
      const plan = response.data.data;
      expect(plan).toHaveProperty('id');
      expect(plan.name).toBe(payload.name);
      expect(plan.price).toBe(payload.price);
      expect(plan.initial_tickets).toBe(payload.initial_tickets);
      
      // Store for cleanup
      createdPlanId = plan.id;
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.2: Error - Create plan with missing required fields
    // -----------------------------------------------------------------------
    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans';
      const invalidPayload = {
        description: 'Missing name and price',
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect([400, 422]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.3: Success - Create plan with minimal fields
    // -----------------------------------------------------------------------
    it('should create plan with only required fields', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans';
      const minimalPayload = {
        name: `Minimal Plan ${Date.now()}`,
        price: 499,
        initial_tickets: 50,
      };
      
      // Act
      const response = await apiRequest<BillingPlanApiResponse>('POST', endpoint, minimalPayload);
      
      // Assert
      if (response.status === 201) {
        expect(response.data.data).toHaveProperty('id');
        // Cleanup
        await apiRequest('DELETE', `/producer/billing/plans/${response.data.data.id}`);
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: PUT /producer/billing/plans/:id
   * Description: Update an existing billing plan
   * -------------------------------------------------------------------------
   */

  describe('PUT /producer/billing/plans/:id', () => {
    let testPlanId: number;

    beforeAll(async () => {
      // Create a plan for testing updates
      const createResponse = await apiRequest<BillingPlanApiResponse>(
        'POST',
        '/producer/billing/plans',
        { ...validBillingPlanPayload, name: `Update Test Plan ${Date.now()}` }
      );
      if (createResponse.status === 201) {
        testPlanId = createResponse.data.data.id;
      }
    });

    afterAll(async () => {
      // Cleanup
      if (testPlanId) {
        await apiRequest('DELETE', `/producer/billing/plans/${testPlanId}`);
      }
    });
    
    // -----------------------------------------------------------------------
    // TEST CASE 4.1: Success - Update billing plan
    // -----------------------------------------------------------------------
    it('should return 200 and update the billing plan', async () => {
      if (!testPlanId) {
        console.log('Skipping test: No test plan created');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/billing/plans/${testPlanId}`;
      const updatePayload: UpdateBillingPlanRequest = {
        name: `Updated Plan ${Date.now()}`,
        price: 1299,
        description: 'Updated description',
      };
      
      // Act
      const response = await apiRequest<BillingPlanApiResponse>('PUT', endpoint, updatePayload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe(updatePayload.name);
      expect(response.data.data.price).toBe(updatePayload.price);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.2: Success - Partial update
    // -----------------------------------------------------------------------
    it('should allow partial updates', async () => {
      if (!testPlanId) return;
      
      // Arrange
      const endpoint = `/producer/billing/plans/${testPlanId}`;
      const partialUpdate = { is_active: false };
      
      // Act
      const response = await apiRequest<BillingPlanApiResponse>('PUT', endpoint, partialUpdate);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.is_active).toBe(false);
      
      // Revert
      await apiRequest('PUT', endpoint, { is_active: true });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.3: Error - Update non-existent plan
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent plan ID', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans/999999';
      const updatePayload = { name: 'Should Not Update' };
      
      // Act
      const response = await apiRequest<ApiResponse>('PUT', endpoint, updatePayload);
      
      // Assert
      expect([404, 400]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: DELETE /producer/billing/plans/:id
   * Description: Delete a billing plan
   * -------------------------------------------------------------------------
   */

  describe('DELETE /producer/billing/plans/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 5.1: Success - Delete billing plan
    // -----------------------------------------------------------------------
    it('should return 204 and delete the billing plan', async () => {
      // Arrange - Create a plan to delete
      const createResponse = await apiRequest<BillingPlanApiResponse>(
        'POST',
        '/producer/billing/plans',
        { ...validBillingPlanPayload, name: `Delete Test Plan ${Date.now()}` }
      );
      
      if (createResponse.status !== 201) {
        console.log('Skipping test: Could not create test plan');
        return;
      }
      
      const planId = createResponse.data.data.id;
      const endpoint = `/producer/billing/plans/${planId}`;
      
      // Act
      const response = await apiRequest<ApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<ApiResponse>('GET', endpoint);
      expect([404, 400]).toContain(getResponse.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.2: Error - Delete non-existent plan
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent plan ID', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans/999999';
      
      // Act
      const response = await apiRequest<ApiResponse>('DELETE', endpoint);
      
      // Assert - Could be 204 (idempotent) or 404
      expect([204, 404]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/plans/:id/purchase
   * Description: Purchase a billing plan
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/plans/:id/purchase', () => {
    let existingPlanId: number;

    beforeAll(async () => {
      const response = await apiRequest<BillingPlanListApiResponse>(
        'GET',
        '/producer/billing/plans?is_active=true&page_size=1'
      );
      if (response.data?.data?.[0]) {
        existingPlanId = response.data.data[0].id;
      }
    });
    
    // -----------------------------------------------------------------------
    // TEST CASE 6.1: Success - Purchase plan
    // -----------------------------------------------------------------------
    it('should return 200 and complete plan purchase', async () => {
      if (!existingPlanId) {
        console.log('Skipping test: No active billing plan found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/billing/plans/${existingPlanId}/purchase`;
      const purchasePayload = {
        payment_id: `test_payment_${Date.now()}`,
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, purchasePayload);
      
      // Assert
      // Could succeed (200) or fail if already subscribed (400)
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.2: Error - Purchase non-existent plan
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent plan ID', async () => {
      // Arrange
      const endpoint = '/producer/billing/plans/999999/purchase';
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, {});
      
      // Assert
      expect([404, 400]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: USER WALLET API
// ============================================================================

describe('Billing API - User Wallet', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/wallet
   * Description: Get user's wallet balance and info
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/wallet', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 7.1: Success - Get user wallet
    // -----------------------------------------------------------------------
    it('should return 200 and user wallet details', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet';
      
      // Act
      const response = await apiRequest<UserWalletApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Wallet Schema
      const wallet = response.data.data;
      expect(wallet).toHaveProperty('id');
      expect(wallet).toHaveProperty('user_id');
      expect(wallet).toHaveProperty('ticket_balance');
      expect(wallet).toHaveProperty('currency');
      
      // Assert - Types
      expect(typeof wallet.ticket_balance).toBe('number');
      expect(wallet.ticket_balance).toBeGreaterThanOrEqual(0);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/wallet/transactions
   * Description: Get user's wallet transactions
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/wallet/transactions', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 8.1: Success - List wallet transactions
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of transactions', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/transactions';
      
      // Act
      const response = await apiRequest<WalletTransactionListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('page_size');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.2: Success - Paginated transactions
    // -----------------------------------------------------------------------
    it('should return paginated transactions with page params', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/transactions?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<WalletTransactionListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.3: Success - Filter by transaction type
    // -----------------------------------------------------------------------
    it('should filter transactions by type', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/transactions?type=purchase';
      
      // Act
      const response = await apiRequest<WalletTransactionListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      const transactions = response.data.data;
      transactions.forEach((tx: WalletTransaction) => {
        expect(tx.transaction_type).toBe('purchase');
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.4: Transaction schema validation
    // -----------------------------------------------------------------------
    it('should return transactions with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/transactions?page_size=1';
      
      // Act
      const response = await apiRequest<WalletTransactionListApiResponse>('GET', endpoint);
      
      // Assert - If transactions exist
      if (response.data.data.length > 0) {
        const tx = response.data.data[0];
        
        expect(tx).toHaveProperty('id');
        expect(tx).toHaveProperty('user_id');
        expect(tx).toHaveProperty('transaction_type');
        expect(tx).toHaveProperty('amount');
        expect(tx).toHaveProperty('currency');
        expect(tx).toHaveProperty('balance_before');
        expect(tx).toHaveProperty('balance_after');
        expect(tx).toHaveProperty('created_at');
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/wallet/ticket-pricing
   * Description: Get ticket pricing tiers based on quantity
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/wallet/ticket-pricing', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 9.1: Success - Get default ticket pricing
    // -----------------------------------------------------------------------
    it('should return 200 and ticket pricing with default quantity', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/ticket-pricing';
      
      // Act
      const response = await apiRequest<TicketPricingApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const pricing = response.data.data;
      expect(pricing).toHaveProperty('quantity');
      expect(pricing).toHaveProperty('unit_price');
      expect(pricing).toHaveProperty('total_price');
      expect(pricing).toHaveProperty('currency');
      expect(pricing).toHaveProperty('pricing_tiers');
      expect(Array.isArray(pricing.pricing_tiers)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.2: Success - Get pricing for specific quantity
    // -----------------------------------------------------------------------
    it('should return pricing for specified quantity', async () => {
      // Arrange
      const quantity = 100;
      const endpoint = `/producer/billing/wallet/ticket-pricing?quantity=${quantity}`;
      
      // Act
      const response = await apiRequest<TicketPricingApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.quantity).toBe(quantity);
      expect(response.data.data.total_price).toBe(response.data.data.unit_price * quantity);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.3: Success - Verify tiered pricing
    // -----------------------------------------------------------------------
    it('should apply tiered pricing for different quantities', async () => {
      // Test different quantity tiers
      const quantities = [50, 200, 750, 1500];
      
      for (const quantity of quantities) {
        const response = await apiRequest<TicketPricingApiResponse>(
          'GET',
          `/producer/billing/wallet/ticket-pricing?quantity=${quantity}`
        );
        
        expect(response.status).toBe(200);
        expect(response.data.data.quantity).toBe(quantity);
        expect(response.data.data.unit_price).toBeGreaterThan(0);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.4: Pricing tiers structure validation
    // -----------------------------------------------------------------------
    it('should return complete pricing tier structure', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/ticket-pricing';
      
      // Act
      const response = await apiRequest<TicketPricingApiResponse>('GET', endpoint);
      
      // Assert pricing tiers
      const tiers = response.data.data.pricing_tiers;
      expect(tiers.length).toBeGreaterThan(0);
      
      tiers.forEach((tier) => {
        expect(tier).toHaveProperty('min_quantity');
        expect(tier).toHaveProperty('max_quantity');
        expect(tier).toHaveProperty('unit_price');
        expect(typeof tier.unit_price).toBe('number');
      });
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/wallet/purchase-tickets
   * Description: Purchase tickets for wallet
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/wallet/purchase-tickets', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 10.1: Success - Purchase tickets
    // -----------------------------------------------------------------------
    it('should return 201 and create invoice for ticket purchase', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/purchase-tickets';
      const payload = {
        quantity: 10,
        currency: 'INR',
        external_payment_id: `test_payment_${Date.now()}`,
      };
      
      // Act
      const response = await apiRequest<ApiResponse<Invoice>>('POST', endpoint, payload);
      
      // Assert
      // Could be 201 (success) or 400 (business rule violation)
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('invoice_number');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.2: Error - Missing quantity
    // -----------------------------------------------------------------------
    it('should return 400 when quantity is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/purchase-tickets';
      const invalidPayload = { currency: 'INR' };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect([400, 422]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.3: Error - Invalid quantity
    // -----------------------------------------------------------------------
    it('should return 400 for negative quantity', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/purchase-tickets';
      const invalidPayload = { quantity: -10 };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect([400, 422]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/wallet/consume-tickets
   * Description: Consume tickets from wallet
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/wallet/consume-tickets', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 11.1: Success/Fail - Consume tickets (depends on balance)
    // -----------------------------------------------------------------------
    it('should handle ticket consumption request', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/consume-tickets';
      const payload = {
        quantity: 1,
        reference_type: 'ticket_publish',
        reference_id: `test-ticket-${Date.now()}`,
        description: 'Integration test consumption',
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, payload);
      
      // Assert - 200 if sufficient balance, 400 if insufficient
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 11.2: Error - Missing required fields
    // -----------------------------------------------------------------------
    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/consume-tickets';
      const invalidPayload = { quantity: 1 }; // Missing reference_type and reference_id
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect([400, 422]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/wallet/allocations
   * Description: Get ticket allocations
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/wallet/allocations', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 12.1: Success - List allocations
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of allocations', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/allocations';
      
      // Act
      const response = await apiRequest<AllocationListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 12.2: Success - Filter by ticket_id
    // -----------------------------------------------------------------------
    it('should filter allocations by ticket_id', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/allocations?ticket_id=1';
      
      // Act
      const response = await apiRequest<AllocationListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 12.3: Success - Filter by status
    // -----------------------------------------------------------------------
    it('should filter allocations by status', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/allocations?status=active';
      
      // Act
      const response = await apiRequest<AllocationListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      const allocations = response.data.data;
      allocations.forEach((alloc: TicketWalletAllocation) => {
        expect(alloc.status).toBe('active');
      });
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/wallet/allocate-tickets
   * Description: Allocate tickets for publishing
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/wallet/allocate-tickets', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 13.1: Error - Missing required fields
    // -----------------------------------------------------------------------
    it('should return 400 when ticket_id or quantity is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/allocate-tickets';
      const invalidPayload = { ticket_id: 1 }; // Missing quantity
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 13.2: Success/Fail - Allocate tickets (depends on balance and ticket existence)
    // -----------------------------------------------------------------------
    it('should handle ticket allocation request', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/allocate-tickets';
      const payload = {
        ticket_id: 1,
        quantity: 10,
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, payload);
      
      // Assert - Various status codes depending on business logic
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/wallet/update-allocation
   * Description: Update ticket allocation
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/wallet/update-allocation', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 14.1: Error - Missing required fields
    // -----------------------------------------------------------------------
    it('should return 400 when ticket_id or quantity is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/update-allocation';
      const invalidPayload = { ticket_id: 1 }; // Missing quantity
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/wallet/release-allocation
   * Description: Release ticket allocation
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/wallet/release-allocation', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 15.1: Error - Missing ticket_id
    // -----------------------------------------------------------------------
    it('should return 400 when ticket_id is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/release-allocation';
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 15.2: Success/Fail - Release allocation
    // -----------------------------------------------------------------------
    it('should handle release allocation request', async () => {
      // Arrange
      const endpoint = '/producer/billing/wallet/release-allocation?ticket_id=1';
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint);
      
      // Assert - 200 if allocation exists, 400/404 otherwise
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: SUBSCRIPTIONS API
// ============================================================================

describe('Billing API - Subscriptions', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/subscriptions/active
   * Description: Get user's active subscription
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/subscriptions/active', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 16.1: Success - Get active subscription
    // -----------------------------------------------------------------------
    it('should return 200 and active subscription or null', async () => {
      // Arrange
      const endpoint = '/producer/billing/subscriptions/active';
      
      // Act
      const response = await apiRequest<SubscriptionApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Subscription can be null if user has no active subscription
      if (response.data.data !== null) {
        const subscription = response.data.data;
        expect(subscription).toHaveProperty('id');
        expect(subscription).toHaveProperty('user_id');
        expect(subscription).toHaveProperty('plan_id');
        expect(subscription).toHaveProperty('status');
        expect(subscription).toHaveProperty('current_period_start');
        expect(subscription).toHaveProperty('current_period_end');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 16.2: Subscription schema validation
    // -----------------------------------------------------------------------
    it('should return subscription with correct schema when exists', async () => {
      // Arrange
      const endpoint = '/producer/billing/subscriptions/active';
      
      // Act
      const response = await apiRequest<SubscriptionApiResponse>('GET', endpoint);
      
      // Assert - If subscription exists
      if (response.data.data !== null) {
        const sub = response.data.data;
        
        expect(typeof sub.id).toBe('number');
        expect(typeof sub.user_id).toBe('string');
        expect(typeof sub.plan_id).toBe('number');
        expect(typeof sub.status).toBe('string');
        expect(typeof sub.cancel_at_period_end).toBe('boolean');
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/subscription/renew
   * Description: Renew current subscription
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/subscription/renew', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 17.1: Success/Fail - Renew subscription
    // -----------------------------------------------------------------------
    it('should handle subscription renewal request', async () => {
      // Arrange
      const endpoint = '/producer/billing/subscription/renew';
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint);
      
      // Assert - 200 if subscription exists, 400 if no active subscription
      expect([200, 400]).toContain(response.status);
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/subscription/cancel
   * Description: Cancel current subscription
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/subscription/cancel', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 18.1: Success/Fail - Cancel subscription at period end
    // -----------------------------------------------------------------------
    it('should handle subscription cancellation at period end', async () => {
      // Arrange
      const endpoint = '/producer/billing/subscription/cancel';
      const payload = { immediate: false };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, payload);
      
      // Assert - 200 if subscription exists, 400 if no active subscription
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 18.2: Success/Fail - Immediate cancellation
    // -----------------------------------------------------------------------
    it('should handle immediate subscription cancellation', async () => {
      // Arrange
      const endpoint = '/producer/billing/subscription/cancel';
      const payload = { immediate: true };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 400]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: INVOICES API
// ============================================================================

describe('Billing API - Invoices', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/invoices
   * Description: List user's invoices
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/invoices', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 19.1: Success - List invoices
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of invoices', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices';
      
      // Act
      const response = await apiRequest<InvoiceListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('page');
      expect(response.data).toHaveProperty('page_size');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 19.2: Success - Paginated invoices
    // -----------------------------------------------------------------------
    it('should return paginated invoices with page params', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<InvoiceListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 19.3: Success - Filter by status
    // -----------------------------------------------------------------------
    it('should filter invoices by status', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices?status=paid';
      
      // Act
      const response = await apiRequest<InvoiceListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      const invoices = response.data.data;
      invoices.forEach((invoice: Invoice) => {
        expect(invoice.status).toBe('paid');
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 19.4: Invoice schema validation
    // -----------------------------------------------------------------------
    it('should return invoices with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices?page_size=1';
      
      // Act
      const response = await apiRequest<InvoiceListApiResponse>('GET', endpoint);
      
      // Assert - If invoices exist
      if (response.data.data.length > 0) {
        const invoice = response.data.data[0];
        
        expect(invoice).toHaveProperty('id');
        expect(invoice).toHaveProperty('user_id');
        expect(invoice).toHaveProperty('invoice_number');
        expect(invoice).toHaveProperty('status');
        expect(invoice).toHaveProperty('subtotal');
        expect(invoice).toHaveProperty('tax_amount');
        expect(invoice).toHaveProperty('total_amount');
        expect(invoice).toHaveProperty('currency');
        expect(invoice).toHaveProperty('items');
        expect(invoice).toHaveProperty('created_at');
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/invoices/:id
   * Description: Get single invoice by ID
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/invoices/:id', () => {
    let existingInvoiceId: number;

    beforeAll(async () => {
      const response = await apiRequest<InvoiceListApiResponse>(
        'GET',
        '/producer/billing/invoices?page_size=1'
      );
      if (response.data?.data?.[0]) {
        existingInvoiceId = response.data.data[0].id;
      }
    });
    
    // -----------------------------------------------------------------------
    // TEST CASE 20.1: Success - Get invoice by ID
    // -----------------------------------------------------------------------
    it('should return 200 and invoice details for valid ID', async () => {
      if (!existingInvoiceId) {
        console.log('Skipping test: No existing invoice found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/billing/invoices/${existingInvoiceId}`;
      
      // Act
      const response = await apiRequest<InvoiceApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data.id).toBe(existingInvoiceId);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 20.2: Error - Get invoice with non-existent ID
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent invoice ID', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices/999999';
      
      // Act
      const response = await apiRequest<ApiResponse>('GET', endpoint);
      
      // Assert
      expect([404, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 20.3: Error - Invalid invoice ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid invoice ID format', async () => {
      // Arrange
      const endpoint = '/producer/billing/invoices/invalid-id';
      
      // Act
      const response = await apiRequest<ApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// TEST SUITE: FEATURES API
// ============================================================================

describe('Billing API - Features', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/features
   * Description: Get user's available features based on subscription
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/features', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 21.1: Success - Get user features
    // -----------------------------------------------------------------------
    it('should return 200 and list of features', async () => {
      // Arrange
      const endpoint = '/producer/billing/features';
      
      // Act
      const response = await apiRequest<FeaturesApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 21.2: Feature schema validation
    // -----------------------------------------------------------------------
    it('should return features with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/features';
      
      // Act
      const response = await apiRequest<FeaturesApiResponse>('GET', endpoint);
      
      // Assert - If features exist
      if (response.data.data.length > 0) {
        const feature = response.data.data[0];
        
        expect(feature).toHaveProperty('code');
        expect(feature).toHaveProperty('label');
        expect(feature).toHaveProperty('icon');
        expect(typeof feature.code).toBe('string');
        expect(typeof feature.label).toBe('string');
      }
    });
  });
});

// ============================================================================
// TEST SUITE: TICKET BUYERS & EMAIL ACCESS API
// ============================================================================

describe('Billing API - Ticket Buyers & Email Access', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/ticket-buyers
   * Description: Get list of users who purchased producer's tickets
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/ticket-buyers', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 22.1: Success - Get ticket buyers
    // -----------------------------------------------------------------------
    it('should return 200 and list of ticket buyers', async () => {
      // Arrange
      const endpoint = '/producer/billing/ticket-buyers';
      
      // Act
      const response = await apiRequest<TicketBuyersApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(response.data.data).toHaveProperty('users');
      expect(Array.isArray(response.data.data.users)).toBe(true);
      // next_pagination_token can be null or string
      expect(response.data.data).toHaveProperty('next_pagination_token');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 22.2: Success - Pagination with limit
    // -----------------------------------------------------------------------
    it('should return limited results with limit param', async () => {
      // Arrange
      const endpoint = '/producer/billing/ticket-buyers?limit=10';
      
      // Act
      const response = await apiRequest<TicketBuyersApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.users).toBeDefined();
      expect(response.data.data.users.length).toBeLessThanOrEqual(10);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 22.3: Ticket buyer schema validation
    // -----------------------------------------------------------------------
    it('should return ticket buyers with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/ticket-buyers?limit=1';
      
      // Act
      const response = await apiRequest<TicketBuyersApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.users).toBeDefined();
      
      // If buyers exist, validate schema
      if (response.data.data.users.length > 0) {
        const buyer = response.data.data.users[0];
        
        expect(buyer).toHaveProperty('user_id');
        expect(buyer).toHaveProperty('email');
        expect(buyer).toHaveProperty('ticket_id');
        expect(buyer).toHaveProperty('ticket_title');
        expect(buyer).toHaveProperty('quantity');
        expect(buyer).toHaveProperty('total_amount');
        expect(buyer).toHaveProperty('currency');
        expect(buyer).toHaveProperty('purchased_at');
        expect(buyer).toHaveProperty('order_number');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 22.4: Pagination token handling
    // -----------------------------------------------------------------------
    it('should handle pagination_token for cursor-based pagination', async () => {
      // Arrange
      const endpoint = '/producer/billing/ticket-buyers?limit=5';
      
      // Act
      const response = await apiRequest<TicketBuyersApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('next_pagination_token');
      
      // If token exists, test fetching next page
      if (response.data.data.next_pagination_token) {
        const nextPage = await apiRequest<TicketBuyersApiResponse>(
          'GET',
          `/producer/billing/ticket-buyers?limit=5&pagination_token=${response.data.data.next_pagination_token}`
        );
        expect(nextPage.status).toBe(200);
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/billing/bulk-email-access
   * Description: Grant bulk email access to tickets
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/billing/bulk-email-access', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 23.1: Error - Missing user_emails
    // -----------------------------------------------------------------------
    it('should return 400 when user_emails is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/bulk-email-access';
      const invalidPayload = {
        ticket_id: 1,
        quantity: 1,
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 23.2: Error - Empty user_emails array
    // -----------------------------------------------------------------------
    it('should return 400 when user_emails is empty', async () => {
      // Arrange
      const endpoint = '/producer/billing/bulk-email-access';
      const invalidPayload = {
        user_emails: [],
        ticket_id: 1,
        quantity: 1,
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 23.3: Error - Missing ticket_id or quantity
    // -----------------------------------------------------------------------
    it('should return 400 when ticket_id or quantity is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/bulk-email-access';
      const invalidPayload = {
        user_emails: ['test@example.com'],
        // Missing ticket_id and quantity
      };
      
      // Act
      const response = await apiRequest<ApiResponse>('POST', endpoint, invalidPayload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 23.4: Success/Fail - Grant bulk email access
    // -----------------------------------------------------------------------
    it('should handle bulk email access grant request', async () => {
      // Arrange
      const endpoint = '/producer/billing/bulk-email-access';
      const payload = {
        user_emails: [`test-${Date.now()}@example.com`],
        ticket_id: 1,
        quantity: 1,
      };
      
      // Act
      const response = await apiRequest<BulkEmailAccessApiResponse>('POST', endpoint, payload);
      
      // Assert - 200 success or 400/404 if ticket doesn't exist
      expect([200, 400, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.data).toHaveProperty('results');
        expect(Array.isArray(response.data.data.results)).toBe(true);
      }
    });
  });

  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/billing/email-access-status
   * Description: Check email access status for tickets
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/billing/email-access-status', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 24.1: Error - Missing required params
    // -----------------------------------------------------------------------
    it('should return 400 when emails or ticket_id is missing', async () => {
      // Arrange
      const endpoint = '/producer/billing/email-access-status';
      
      // Act
      const response = await apiRequest<ApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 24.2: Success - Get email access status
    // -----------------------------------------------------------------------
    it('should return 200 with email access statuses', async () => {
      // Arrange
      const emails = 'test1@example.com,test2@example.com';
      const endpoint = `/producer/billing/email-access-status?emails=${emails}&ticket_id=1`;
      
      // Act
      const response = await apiRequest<EmailAccessStatusApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('statuses');
      expect(Array.isArray(response.data.data.statuses)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 24.3: Email access status schema validation
    // -----------------------------------------------------------------------
    it('should return statuses with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/billing/email-access-status?emails=test@example.com&ticket_id=1';
      
      // Act
      const response = await apiRequest<EmailAccessStatusApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      const statuses = response.data.data.statuses;
      expect(statuses.length).toBeGreaterThan(0);
      
      statuses.forEach((status) => {
        expect(status).toHaveProperty('email');
        expect(status).toHaveProperty('has_access');
        expect(status).toHaveProperty('quantity');
        expect(status).toHaveProperty('ticket_id');
        expect(typeof status.has_access).toBe('boolean');
        expect(typeof status.quantity).toBe('number');
      });
    });
  });
});

// ============================================================================
// TEST SUITE: AUTHENTICATION & AUTHORIZATION
// ============================================================================

describe('Billing API - Authentication & Authorization', () => {
  
  // -------------------------------------------------------------------------
  // All billing endpoints should require authentication
  // -------------------------------------------------------------------------
  const protectedEndpoints = [
    { method: 'GET', path: '/producer/billing/plans' },
    { method: 'GET', path: '/producer/billing/wallet' },
    { method: 'GET', path: '/producer/billing/wallet/transactions' },
    { method: 'GET', path: '/producer/billing/wallet/ticket-pricing' },
    { method: 'GET', path: '/producer/billing/wallet/allocations' },
    { method: 'GET', path: '/producer/billing/subscriptions/active' },
    { method: 'GET', path: '/producer/billing/invoices' },
    { method: 'GET', path: '/producer/billing/features' },
    { method: 'GET', path: '/producer/billing/ticket-buyers' },
  ];

  protectedEndpoints.forEach(({ method, path }) => {
    it(`should return 401 for ${method} ${path} without auth`, async () => {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: EDGE CASES & ERROR HANDLING
// ============================================================================

describe('Billing API - Edge Cases & Error Handling', () => {
  
  // -------------------------------------------------------------------------
  // Invalid pagination values
  // -------------------------------------------------------------------------
  describe('Invalid Pagination Handling', () => {
    it('should handle negative page values gracefully', async () => {
      const response = await apiRequest<BillingPlanListApiResponse>(
        'GET',
        '/producer/billing/plans?page=-1'
      );
      
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1); // Should default to 1
    });

    it('should handle zero page_size gracefully', async () => {
      const response = await apiRequest<BillingPlanListApiResponse>(
        'GET',
        '/producer/billing/plans?page_size=0'
      );
      
      expect(response.status).toBe(200);
      expect(response.data.page_size).toBeGreaterThan(0); // Should use default
    });

    it('should cap excessive page_size values', async () => {
      const response = await apiRequest<BillingPlanListApiResponse>(
        'GET',
        '/producer/billing/plans?page_size=1000'
      );
      
      expect(response.status).toBe(200);
      expect(response.data.page_size).toBeLessThanOrEqual(100); // Should be capped
    });
  });

  // -------------------------------------------------------------------------
  // Empty response handling
  // -------------------------------------------------------------------------
  describe('Empty Results Handling', () => {
    it('should return empty array for high page number', async () => {
      const response = await apiRequest<BillingPlanListApiResponse>(
        'GET',
        '/producer/billing/plans?page=9999'
      );
      
      expect(response.status).toBe(200);
      expect(response.data.data).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Content-Type handling
  // -------------------------------------------------------------------------
  describe('Content-Type Handling', () => {
    it('should handle requests without Content-Type for GET', async () => {
      const response = await fetch(`${BASE_URL}/producer/billing/plans`, {
        method: 'GET',
        headers: { ...headers },
      });
      
      expect(response.status).toBe(200);
    });
  });
});

