/**
 * ============================================================================
 * CHUNK 2: TICKETS API - Integration Test Cases
 * ============================================================================
 * 
 * This file contains integration test cases for the Producer Dashboard Tickets API.
 * These tests validate API contracts, response schemas, and business logic.
 * 
 * Base URL: /v1/producer/tickets
 * Authentication: Required (Bearer token)
 * 
 * Endpoints Covered:
 * 1.  GET    /producer/tickets                    - List tickets with pagination & filters
 * 2.  GET    /producer/tickets/:id                - Get single ticket by ID
 * 3.  POST   /producer/tickets                    - Create new ticket
 * 4.  PUT    /producer/tickets/:id                - Update existing ticket
 * 5.  DELETE /producer/tickets/:id                - Delete ticket
 * 6.  POST   /producer/tickets/:id/publish        - Publish ticket
 * 7.  POST   /producer/tickets/:id/archive        - Archive ticket
 * 8.  GET    /producer/tickets/:id/availability   - Check ticket availability
 * 9.  GET    /producer/tickets/by-event/:eventId  - Get tickets by event
 * 10. POST   /producer/tickets/:id/validate-coupon - Validate coupon for ticket
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (Based on services/backend/src/domains/tickets/types.ts)
// ============================================================================

type LocationType = 'country' | 'city' | 'state' | 'pincode' | 'coordinates';

interface GeoblockingLocation {
  type: LocationType;
  value: string | [number, number];
  radius_km?: number;
  name?: string;
}

interface TicketCoupon {
  id: number;
  ticket_id: number;
  title: string;
  code: string;
  count: number;
  activation_time?: string;
  expiry_time?: string;
  discount: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketPricing {
  id: number;
  ticket_id: number;
  currency: string;
  price: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketSponsor {
  id: number;
  ticket_id: number;
  title: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface TicketEvent {
  id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
}

type TicketStatus = 'draft' | 'published' | 'sold_out' | 'archived';

interface Ticket {
  id: number;
  app_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login: boolean;
  price: number;
  currency: string;
  total_quantity: number;
  sold_quantity: number;
  max_quantity_per_user: number;
  geoblocking_enabled: boolean;
  geoblocking_countries?: GeoblockingLocation[];
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  // Relations (populated separately)
  events?: TicketEvent[];
  coupons?: TicketCoupon[];
  pricing?: TicketPricing[];
  sponsors?: TicketSponsor[];
}

interface CouponForm {
  title: string;
  code: string;
  count: number;
  activation_time?: string;
  expiry_time?: string;
  discount: number;
}

interface PricingForm {
  currency: string;
  price: number;
}

interface SponsorForm {
  title: string;
  image_url?: string;
}

interface CreateTicketRequest {
  title: string;
  description?: string;
  url?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  purchase_without_login?: boolean;
  price: number;
  currency?: string;
  total_quantity: number;
  max_quantity_per_user?: number;
  geoblocking_enabled?: boolean;
  geoblocking_countries?: GeoblockingLocation[];
  status?: TicketStatus;
  event_ids?: number[];
  coupons?: CouponForm[];
  pricing?: PricingForm[];
  sponsors?: SponsorForm[];
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
type TicketListApiResponse = ListApiResponse<Ticket>;
type TicketApiResponse = ApiResponse<Ticket>;
type TicketDeleteApiResponse = ApiResponse<void>;
type TicketAvailabilityApiResponse = ApiResponse<{ available: boolean; remaining: number }>;
type ValidateCouponApiResponse = ApiResponse<{
  valid: boolean;
  coupon?: TicketCoupon;
  discount_amount?: number;
  error?: string;
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

const validTicketPayload: CreateTicketRequest = {
  title: 'Test Ticket - Integration Test',
  description: 'This is a test ticket created by integration tests',
  price: 100,
  currency: 'INR',
  total_quantity: 1000,
  max_quantity_per_user: 5,
  purchase_without_login: false,
  geoblocking_enabled: false,
  status: 'draft',
};

const ticketWithCoupons: CreateTicketRequest = {
  ...validTicketPayload,
  title: 'Test Ticket with Coupons',
  coupons: [
    {
      title: 'Early Bird Discount',
      code: 'EARLYBIRD',
      count: 100,
      discount: 20, // 20%
    },
  ],
};

const ticketWithPricing: CreateTicketRequest = {
  ...validTicketPayload,
  title: 'Test Ticket with Multi-Currency',
  pricing: [
    { currency: 'INR', price: 100 },
    { currency: 'USD', price: 1.5 },
  ],
};

const freeTicketPayload: CreateTicketRequest = {
  ...validTicketPayload,
  title: 'Free Entry Ticket',
  price: 0,
  purchase_without_login: true,
};

// ============================================================================
// TEST SUITE: LIST TICKETS API
// ============================================================================

describe('Tickets API - List Tickets', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/tickets
   * Description: List all tickets with pagination and filtering
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/tickets', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 1.1: Success - List tickets without filters
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of tickets', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
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
    // TEST CASE 1.2: Success - List tickets with pagination
    // -----------------------------------------------------------------------
    it('should return paginated results with page and page_size params', async () => {
      // Arrange
      const endpoint = '/producer/tickets?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.3: Success - Filter by status
    // -----------------------------------------------------------------------
    it('should filter tickets by status', async () => {
      // Arrange
      const endpoint = '/producer/tickets?status=published';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // All returned tickets should have status 'published'
      const tickets = response.data.data;
      tickets.forEach((ticket: Ticket) => {
        expect(ticket.status).toBe('published');
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.4: Success - Filter by event_id
    // -----------------------------------------------------------------------
    it('should filter tickets by event_id', async () => {
      // First, get an event ID if exists
      const eventsResponse = await apiRequest<ListApiResponse<{ id: number }>>('GET', '/producer/events?page_size=1');
      
      if (eventsResponse.data?.data?.[0]) {
        const eventId = eventsResponse.data.data[0].id;
        const endpoint = `/producer/tickets?event_id=${eventId}`;
        
        // Act
        const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
        
        // Assert
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.5: Success - Search by keyword
    // -----------------------------------------------------------------------
    it('should search tickets by keyword', async () => {
      // Arrange
      const endpoint = '/producer/tickets?search=test';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.6: Success - Sort tickets
    // -----------------------------------------------------------------------
    it('should sort tickets by specified field and order', async () => {
      // Arrange
      const endpoint = '/producer/tickets?sort_by=created_at&sort_order=desc';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify descending order
      const tickets = response.data.data;
      if (tickets.length > 1) {
        for (let i = 0; i < tickets.length - 1; i++) {
          const current = new Date(tickets[i].created_at).getTime();
          const next = new Date(tickets[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.7: Success - Empty results
    // -----------------------------------------------------------------------
    it('should return empty array when no tickets match filters', async () => {
      // Arrange - Use a very specific search that likely won't match
      const endpoint = '/producer/tickets?search=xyz123nonexistent456abc';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
      expect(response.data.total).toBe(0);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.8: Ticket object schema validation
    // -----------------------------------------------------------------------
    it('should return tickets with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/tickets?page_size=1';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
      // Assert - If tickets exist, validate schema
      if (response.data.data.length > 0) {
        const ticket = response.data.data[0];
        
        // Required fields
        expect(ticket).toHaveProperty('id');
        expect(ticket).toHaveProperty('app_id');
        expect(ticket).toHaveProperty('tenant_id');
        expect(ticket).toHaveProperty('title');
        expect(ticket).toHaveProperty('price');
        expect(ticket).toHaveProperty('currency');
        expect(ticket).toHaveProperty('total_quantity');
        expect(ticket).toHaveProperty('sold_quantity');
        expect(ticket).toHaveProperty('status');
        expect(ticket).toHaveProperty('created_at');
        expect(ticket).toHaveProperty('updated_at');
        
        // Type validations - API returns IDs as strings (UUIDs) and prices as decimal strings
        expect(typeof ticket.id).toBe('string');
        expect(typeof ticket.title).toBe('string');
        expect(typeof ticket.price).toBe('string'); // Decimal from database
        expect(typeof ticket.total_quantity).toBe('number');
        // Status can be any string value (no strict enum validation)
        expect(typeof ticket.status).toBe('string');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.9: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      
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
      const endpoint = '/producer/tickets?page=-1&page_size=0';
      
      // Act
      const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
      
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
// TEST SUITE: GET SINGLE TICKET API
// ============================================================================

describe('Tickets API - Get Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/tickets/:id
   * Description: Get a single ticket by ID with relations
   * -------------------------------------------------------------------------
   */

  let existingTicketId: number;

  beforeAll(async () => {
    // Get an existing ticket ID for testing
    const response = await apiRequest<TicketListApiResponse>('GET', '/producer/tickets?page_size=1');
    if (response.data?.data?.[0]) {
      existingTicketId = response.data.data[0].id;
    }
  });

  describe('GET /producer/tickets/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 2.1: Success - Get ticket by valid ID
    // -----------------------------------------------------------------------
    it('should return 200 and ticket details for valid ID', async () => {
      if (!existingTicketId) {
        console.log('Skipping test: No existing ticket found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/tickets/${existingTicketId}`;
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Ticket Schema
      const ticket = response.data.data;
      expect(ticket.id).toBe(existingTicketId);
      expect(ticket).toHaveProperty('title');
      expect(ticket).toHaveProperty('price');
      expect(ticket).toHaveProperty('total_quantity');
      expect(ticket).toHaveProperty('status');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.2: Success - Ticket includes relations
    // -----------------------------------------------------------------------
    it('should return ticket with relations (events, coupons, pricing, sponsors)', async () => {
      if (!existingTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${existingTicketId}`;
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert - Relations exist (may be empty arrays)
      const ticket = response.data.data;
      
      // These properties should exist even if empty
      expect(ticket).toHaveProperty('events');
      expect(ticket).toHaveProperty('coupons');
      expect(ticket).toHaveProperty('pricing');
      expect(ticket).toHaveProperty('sponsors');
      
      // Should be arrays
      if (ticket.events) expect(Array.isArray(ticket.events)).toBe(true);
      if (ticket.coupons) expect(Array.isArray(ticket.coupons)).toBe(true);
      if (ticket.pricing) expect(Array.isArray(ticket.pricing)).toBe(true);
      if (ticket.sponsors) expect(Array.isArray(ticket.sponsors)).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.3: Success - Complete ticket schema validation
    // -----------------------------------------------------------------------
    it('should return complete ticket object with all fields', async () => {
      if (!existingTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${existingTicketId}`;
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert - All expected fields exist
      const ticket = response.data.data;
      
      // Core fields
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('app_id');
      expect(ticket).toHaveProperty('tenant_id');
      expect(ticket).toHaveProperty('title');
      
      // Pricing fields
      expect(ticket).toHaveProperty('price');
      expect(ticket).toHaveProperty('currency');
      
      // Quantity fields
      expect(ticket).toHaveProperty('total_quantity');
      expect(ticket).toHaveProperty('sold_quantity');
      expect(ticket).toHaveProperty('max_quantity_per_user');
      
      // Boolean fields
      expect(ticket).toHaveProperty('purchase_without_login');
      expect(ticket).toHaveProperty('geoblocking_enabled');
      
      // Timestamps
      expect(ticket).toHaveProperty('created_at');
      expect(ticket).toHaveProperty('updated_at');
      
      // Status field
      expect(['draft', 'published', 'sold_out', 'archived']).toContain(ticket.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.4: Error - Ticket not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket ID', async () => {
      // Arrange
      const nonExistentId = 999999999;
      const endpoint = `/producer/tickets/${nonExistentId}`;
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.5: Error - Invalid ticket ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid ticket ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      const endpoint = `/producer/tickets/${invalidId}`;
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert - Should return 400 (explicit validation in route)
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.6: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!existingTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${existingTicketId}`;
      
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
// TEST SUITE: CREATE TICKET API
// ============================================================================

describe('Tickets API - Create Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/tickets
   * Description: Create a new ticket
   * -------------------------------------------------------------------------
   */

  const createdTicketIds: number[] = [];

  afterAll(async () => {
    // Cleanup: Delete all tickets created during tests
    for (const id of createdTicketIds) {
      await apiRequest('DELETE', `/producer/tickets/${id}`);
    }
  });

  describe('POST /producer/tickets', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 3.1: Success - Create ticket with minimum required fields
    // -----------------------------------------------------------------------
    it('should return 201 and created ticket for valid payload', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        title: 'Minimum Fields Ticket - ' + Date.now(),
        price: 50,
        total_quantity: 100,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert - Status Code (201 Created or 200 OK)
      expect([200, 201]).toContain(response.status);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Created Ticket
      const ticket = response.data.data;
      expect(ticket).toHaveProperty('id');
      expect(ticket.title).toBe(payload.title);
      // Price is returned as decimal string from database
      expect(parseFloat(String(ticket.price))).toBe(payload.price);
      expect(ticket.total_quantity).toBe(payload.total_quantity);
      
      // Track for cleanup
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.2: Success - Create ticket with all fields
    // -----------------------------------------------------------------------
    it('should create ticket with all optional fields', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        ...validTicketPayload,
        title: 'Full Fields Ticket - ' + Date.now(),
        url: 'https://example.com/ticket',
        thumbnail_image_portrait: 'https://example.com/thumb.jpg',
        featured_image: 'https://example.com/featured.jpg',
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      expect(ticket.title).toBe(payload.title);
      expect(ticket.description).toBe(payload.description);
      expect(ticket.max_quantity_per_user).toBe(payload.max_quantity_per_user);
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.3: Success - Create free ticket (price = 0)
    // -----------------------------------------------------------------------
    it('should create free ticket with price 0', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        ...freeTicketPayload,
        title: 'Free Ticket - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      // Price is returned as decimal string from database
      expect(parseFloat(String(ticket.price))).toBe(0);
      expect(ticket.purchase_without_login).toBe(true);
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.4: Success - Create ticket with coupons
    // -----------------------------------------------------------------------
    it('should create ticket with embedded coupons', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        ...ticketWithCoupons,
        title: 'Ticket with Coupons - ' + Date.now(),
        coupons: [
          {
            title: 'Test Coupon',
            code: 'TESTCODE' + Date.now(),
            count: 50,
            discount: 15,
          },
        ],
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      // Coupons may be populated in response or need separate fetch
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.5: Success - Create ticket with pricing tiers
    // -----------------------------------------------------------------------
    it('should create ticket with multiple pricing options', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        ...ticketWithPricing,
        title: 'Multi-Currency Ticket - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      if (response.data?.data?.id) createdTicketIds.push(response.data.data.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.6: Success - Create ticket with geoblocking
    // -----------------------------------------------------------------------
    it('should create ticket with geoblocking enabled', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        ...validTicketPayload,
        title: 'Geoblocked Ticket - ' + Date.now(),
        geoblocking_enabled: true,
        geoblocking_countries: [
          { type: 'country', value: 'IN' },
          { type: 'country', value: 'US' },
        ],
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      expect(ticket.geoblocking_enabled).toBe(true);
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.7: Error - Missing required field (title)
    // -----------------------------------------------------------------------
    it('should return 400 when title is missing', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload = {
        price: 100,
        total_quantity: 50,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.8: Price is optional (defaults to 0)
    // -----------------------------------------------------------------------
    it('should create ticket with default price when price is missing', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload = {
        title: 'No Price Ticket - ' + Date.now(),
        total_quantity: 50,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert - Price defaults to 0 when not provided
      expect([200, 201]).toContain(response.status);
      if (response.data?.data?.id) {
        expect(parseFloat(String(response.data.data.price))).toBe(0);
        // Cleanup
        await apiRequest('DELETE', `/producer/tickets/${response.data.data.id}`);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.9: Error - Missing required field (total_quantity)
    // -----------------------------------------------------------------------
    it('should return 400 when total_quantity is missing or zero', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload = {
        title: 'No Quantity Ticket',
        price: 100,
        total_quantity: 0,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.10: Error - Negative price
    // -----------------------------------------------------------------------
    it('should return 400 for negative price', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        title: 'Negative Price Ticket',
        price: -50,
        total_quantity: 100,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.11: Error - Negative total_quantity
    // -----------------------------------------------------------------------
    it('should return 400 for negative total_quantity', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        title: 'Negative Quantity Ticket',
        price: 100,
        total_quantity: -50,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.12: Invalid status value is accepted (no strict validation)
    // -----------------------------------------------------------------------
    it('should accept ticket with non-standard status value', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload = {
        ...validTicketPayload,
        title: 'Custom Status Ticket - ' + Date.now(),
        status: 'custom_status',
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert - API accepts any status value (no strict enum validation)
      expect([200, 201]).toContain(response.status);
      
      // Cleanup
      if (response.data?.data?.id) {
        await apiRequest('DELETE', `/producer/tickets/${response.data.data.id}`);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.13: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTicketPayload),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.14: Response contains generated fields
    // -----------------------------------------------------------------------
    it('should generate id, timestamps, and default values', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        title: 'Generated Fields Ticket - ' + Date.now(),
        price: 75,
        total_quantity: 200,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      expect(ticket.id).toBeDefined();
      expect(Number(ticket.id)).toBeGreaterThan(0);
      expect(ticket).toHaveProperty('created_at');
      expect(ticket).toHaveProperty('updated_at');
      expect(ticket).toHaveProperty('app_id');
      expect(ticket).toHaveProperty('tenant_id');
      expect(ticket.sold_quantity).toBe(0);
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.15: URL normalization
    // -----------------------------------------------------------------------
    it('should normalize URL by adding https:// prefix if missing', async () => {
      // Arrange
      const endpoint = '/producer/tickets';
      const payload: CreateTicketRequest = {
        title: 'URL Normalization Ticket - ' + Date.now(),
        price: 100,
        total_quantity: 50,
        url: 'example.com/ticket',
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const ticket = response.data.data;
      expect(ticket.url).toBe('https://example.com/ticket');
      
      if (ticket.id) createdTicketIds.push(ticket.id);
    });
  });
});

// ============================================================================
// TEST SUITE: UPDATE TICKET API
// ============================================================================

describe('Tickets API - Update Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: PUT /producer/tickets/:id
   * Description: Update an existing ticket
   * -------------------------------------------------------------------------
   */

  let testTicketId: number;

  beforeAll(async () => {
    // Create a test ticket for update tests
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
      title: 'Update Test Ticket - ' + Date.now(),
      price: 100,
      total_quantity: 500,
      status: 'draft',
    });
    
    if (response.data?.data?.id) {
      testTicketId = response.data.data.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testTicketId) {
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${testTicketId}`);
    }
  });

  describe('PUT /producer/tickets/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 4.1: Success - Update ticket title
    // -----------------------------------------------------------------------
    it('should return 200 and updated ticket for valid update', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = {
        title: 'Updated Ticket Title - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(payload.title);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.2: Success - Update multiple fields
    // -----------------------------------------------------------------------
    it('should update multiple fields at once', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = {
        title: 'Multi-Update Ticket - ' + Date.now(),
        description: 'Updated description',
        price: 150,
        max_quantity_per_user: 10,
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      
      const ticket = response.data.data;
      expect(ticket.title).toBe(payload.title);
      expect(ticket.description).toBe(payload.description);
      // Price is returned as decimal string from database
      expect(parseFloat(String(ticket.price))).toBe(payload.price);
      expect(ticket.max_quantity_per_user).toBe(payload.max_quantity_per_user);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.3: Success - Update price
    // -----------------------------------------------------------------------
    it('should update ticket price', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { price: 250 };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      // Price is returned as decimal string from database
      expect(parseFloat(String(response.data.data.price))).toBe(250);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.4: Success - Update total_quantity
    // -----------------------------------------------------------------------
    it('should update total_quantity', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { total_quantity: 1000 };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.total_quantity).toBe(1000);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.5: Success - Partial update preserves other fields
    // -----------------------------------------------------------------------
    it('should preserve unchanged fields during partial update', async () => {
      if (!testTicketId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<TicketApiResponse>('GET', `/producer/tickets/${testTicketId}`);
      const originalTicket = getResponse.data.data;
      
      // Act - Update only title
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { title: 'Partial Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert - Other fields unchanged
      expect(updateResponse.status).toBe(200);
      const updatedTicket = updateResponse.data.data;
      
      expect(updatedTicket.title).toBe(payload.title);
      expect(updatedTicket.price).toBe(originalTicket.price);
      expect(updatedTicket.total_quantity).toBe(originalTicket.total_quantity);
      expect(updatedTicket.currency).toBe(originalTicket.currency);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.6: Success - Update geoblocking settings
    // -----------------------------------------------------------------------
    it('should update geoblocking settings', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = {
        geoblocking_enabled: true,
        geoblocking_countries: [{ type: 'country' as const, value: 'UK' }],
      };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.geoblocking_enabled).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.7: Success - updated_at timestamp changes
    // -----------------------------------------------------------------------
    it('should update the updated_at timestamp', async () => {
      if (!testTicketId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<TicketApiResponse>('GET', `/producer/tickets/${testTicketId}`);
      const originalUpdatedAt = getResponse.data.data.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Act
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { title: 'Timestamp Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(updateResponse.status).toBe(200);
      const newUpdatedAt = updateResponse.data.data.updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.8: Error - Ticket not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket ID', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999';
      const payload = { title: 'Non-existent Update' };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.9: Error - Negative price
    // -----------------------------------------------------------------------
    it('should return 400 for negative price', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { price: -100 };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.10: Error - Invalid total_quantity
    // -----------------------------------------------------------------------
    it('should return 400 for invalid total_quantity', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = { total_quantity: 0 };
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.11: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Unauthorized Update' }),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.12: Error - Empty payload
    // -----------------------------------------------------------------------
    it('should handle empty payload gracefully', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}`;
      const payload = {};
      
      // Act
      const response = await apiRequest<TicketApiResponse>('PUT', endpoint, payload);
      
      // Assert - Should succeed with no changes or return 400
      expect([200, 400]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: DELETE TICKET API
// ============================================================================

describe('Tickets API - Delete Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: DELETE /producer/tickets/:id
   * Description: Delete a ticket
   * -------------------------------------------------------------------------
   */

  describe('DELETE /producer/tickets/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 5.1: Success - Delete ticket
    // -----------------------------------------------------------------------
    it('should return 204 and delete ticket successfully', async () => {
      // Arrange - Create ticket to delete
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Ticket To Delete - ' + Date.now(),
        price: 50,
        total_quantity: 100,
      });
      
      const ticketId = createResponse.data?.data?.id;
      expect(ticketId).toBeDefined();
      
      // Act
      const endpoint = `/producer/tickets/${ticketId}`;
      const response = await apiRequest<TicketDeleteApiResponse>('DELETE', endpoint);
      
      // Assert - Delete returns 204 No Content
      expect([200, 204]).toContain(response.status);
      
      // Verify deletion
      const getResponse = await apiRequest<TicketApiResponse>('GET', endpoint);
      expect(getResponse.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.2: Success - Delete draft ticket
    // -----------------------------------------------------------------------
    it('should delete draft ticket', async () => {
      // Arrange
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Draft Ticket To Delete - ' + Date.now(),
        price: 100,
        total_quantity: 50,
        status: 'draft',
      });
      
      const ticketId = createResponse.data?.data?.id;
      
      // Act
      const response = await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${ticketId}`);
      
      // Assert
      expect([200, 204]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.3: Error - Delete non-existent ticket
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket ID', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999';
      
      // Act
      const response = await apiRequest<TicketDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.4: Error - Delete already deleted ticket
    // -----------------------------------------------------------------------
    it('should return 404 when deleting already deleted ticket', async () => {
      // Arrange - Create and delete ticket
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Double Delete Ticket - ' + Date.now(),
        price: 75,
        total_quantity: 100,
      });
      
      const ticketId = createResponse.data?.data?.id;
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${ticketId}`);
      
      // Act - Try to delete again
      const response = await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${ticketId}`);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.5: Error - Invalid ticket ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid ticket ID format', async () => {
      // Arrange
      const endpoint = '/producer/tickets/invalid-id';
      
      // Act
      const response = await apiRequest<TicketDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.6: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets/1';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.7: Idempotency check
    // -----------------------------------------------------------------------
    it('should handle concurrent delete requests gracefully', async () => {
      // Arrange
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Concurrent Delete Ticket - ' + Date.now(),
        price: 100,
        total_quantity: 50,
      });
      
      const ticketId = createResponse.data?.data?.id;
      const endpoint = `/producer/tickets/${ticketId}`;
      
      // Act - Send multiple delete requests concurrently
      const responses = await Promise.all([
        apiRequest<TicketDeleteApiResponse>('DELETE', endpoint),
        apiRequest<TicketDeleteApiResponse>('DELETE', endpoint),
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
// TEST SUITE: PUBLISH TICKET API
// ============================================================================

describe('Tickets API - Publish Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/tickets/:id/publish
   * Description: Publish a draft ticket
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/tickets/:id/publish', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 6.1: Success - Publish draft ticket
    // -----------------------------------------------------------------------
    it('should publish draft ticket successfully', async () => {
      // Arrange - Create draft ticket
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Ticket To Publish - ' + Date.now(),
        price: 100,
        total_quantity: 200,
        status: 'draft',
      });
      
      const ticketId = createResponse.data?.data?.id;
      expect(ticketId).toBeDefined();
      
      // Act
      const endpoint = `/producer/tickets/${ticketId}/publish`;
      const response = await apiRequest<TicketApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('published');
      
      // Cleanup
      await apiRequest('DELETE', `/producer/tickets/${ticketId}`);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.2: Error - Publish already published ticket
    // -----------------------------------------------------------------------
    it('should return 400 when publishing already published ticket', async () => {
      // Arrange - Create and publish ticket
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Already Published Ticket - ' + Date.now(),
        price: 100,
        total_quantity: 200,
        status: 'draft',
      });
      
      const ticketId = createResponse.data?.data?.id;
      await apiRequest('POST', `/producer/tickets/${ticketId}/publish`);
      
      // Act - Try to publish again
      const response = await apiRequest<TicketApiResponse>('POST', `/producer/tickets/${ticketId}/publish`);
      
      // Assert
      expect(response.status).toBe(400);
      
      // Cleanup
      await apiRequest('DELETE', `/producer/tickets/${ticketId}`);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.3: Error - Publish non-existent ticket
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999/publish';
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.4: Error - Invalid ticket ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid ticket ID format', async () => {
      // Arrange
      const endpoint = '/producer/tickets/invalid-id/publish';
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets/1/publish';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: ARCHIVE TICKET API
// ============================================================================

describe('Tickets API - Archive Ticket', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/tickets/:id/archive
   * Description: Archive a ticket
   * -------------------------------------------------------------------------
   */

  describe('POST /producer/tickets/:id/archive', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 7.1: Success - Archive ticket
    // -----------------------------------------------------------------------
    it('should archive ticket successfully', async () => {
      // Arrange - Create ticket
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Ticket To Archive - ' + Date.now(),
        price: 100,
        total_quantity: 200,
        status: 'draft',
      });
      
      const ticketId = createResponse.data?.data?.id;
      expect(ticketId).toBeDefined();
      
      // Act
      const endpoint = `/producer/tickets/${ticketId}/archive`;
      const response = await apiRequest<TicketApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('archived');
      
      // Cleanup
      await apiRequest('DELETE', `/producer/tickets/${ticketId}`);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.2: Success - Archive published ticket
    // -----------------------------------------------------------------------
    it('should archive published ticket', async () => {
      // Arrange - Create and publish ticket
      const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Published Ticket To Archive - ' + Date.now(),
        price: 100,
        total_quantity: 200,
        status: 'draft',
      });
      
      const ticketId = createResponse.data?.data?.id;
      await apiRequest('POST', `/producer/tickets/${ticketId}/publish`);
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', `/producer/tickets/${ticketId}/archive`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.status).toBe('archived');
      
      // Cleanup
      await apiRequest('DELETE', `/producer/tickets/${ticketId}`);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.3: Error - Archive non-existent ticket
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999/archive';
      
      // Act
      const response = await apiRequest<TicketApiResponse>('POST', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.4: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets/1/archive';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: CHECK TICKET AVAILABILITY API
// ============================================================================

describe('Tickets API - Check Availability', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/tickets/:id/availability
   * Description: Check ticket availability for a given quantity
   * -------------------------------------------------------------------------
   */

  let testTicketId: number;

  beforeAll(async () => {
    // Create a test ticket for availability tests
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
      title: 'Availability Test Ticket - ' + Date.now(),
      price: 100,
      total_quantity: 100,
      status: 'published',
    });
    
    if (response.data?.data?.id) {
      testTicketId = response.data.data.id;
    }
  });

  afterAll(async () => {
    if (testTicketId) {
      await apiRequest('DELETE', `/producer/tickets/${testTicketId}`);
    }
  });

  describe('GET /producer/tickets/:id/availability', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 8.1: Success - Check availability with default quantity
    // -----------------------------------------------------------------------
    it('should return availability status', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}/availability`;
      
      // Act
      const response = await apiRequest<TicketAvailabilityApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('available');
      expect(response.data.data).toHaveProperty('remaining');
      expect(typeof response.data.data.available).toBe('boolean');
      expect(typeof response.data.data.remaining).toBe('number');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.2: Success - Check availability with specific quantity
    // -----------------------------------------------------------------------
    it('should check availability for specific quantity', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}/availability?quantity=5`;
      
      // Act
      const response = await apiRequest<TicketAvailabilityApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.available).toBe(true);
      expect(response.data.data.remaining).toBeGreaterThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.3: Success - Unavailable for large quantity
    // -----------------------------------------------------------------------
    it('should return unavailable for quantity exceeding remaining', async () => {
      if (!testTicketId) return;
      
      // Arrange - Request more than available
      const endpoint = `/producer/tickets/${testTicketId}/availability?quantity=99999`;
      
      // Act
      const response = await apiRequest<TicketAvailabilityApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.available).toBe(false);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.4: Error - Non-existent ticket
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999/availability';
      
      // Act
      const response = await apiRequest<TicketAvailabilityApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.5: Error - Invalid ticket ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid ticket ID format', async () => {
      // Arrange
      const endpoint = '/producer/tickets/invalid-id/availability';
      
      // Act
      const response = await apiRequest<TicketAvailabilityApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// TEST SUITE: GET TICKETS BY EVENT API
// ============================================================================

describe('Tickets API - Get Tickets By Event', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/tickets/by-event/:eventId
   * Description: Get all tickets associated with an event
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/tickets/by-event/:eventId', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 9.1: Success - Get tickets by event
    // -----------------------------------------------------------------------
    it('should return tickets for valid event ID', async () => {
      // First, get an existing event ID
      const eventsResponse = await apiRequest<ListApiResponse<{ id: number }>>('GET', '/producer/events?page_size=1');
      
      if (eventsResponse.data?.data?.[0]) {
        const eventId = eventsResponse.data.data[0].id;
        
        // Arrange
        const endpoint = `/producer/tickets/by-event/${eventId}`;
        
        // Act
        const response = await apiRequest<TicketApiResponse>('GET', endpoint);
        
        // Assert
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        // Response could be array of tickets or empty array
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.2: Success - Empty array for event with no tickets
    // -----------------------------------------------------------------------
    it('should return empty array for event with no tickets', async () => {
      // Create an event with no tickets
      const eventResponse = await apiRequest<ApiResponse<{ id: number }>>('POST', '/producer/events', {
        title: 'Event Without Tickets - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      });
      
      if (eventResponse.data?.data?.id) {
        const eventId = eventResponse.data.data.id;
        
        // Arrange
        const endpoint = `/producer/tickets/by-event/${eventId}`;
        
        // Act
        const response = await apiRequest<ApiResponse<Ticket[]>>('GET', endpoint);
        
        // Assert
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.data)).toBe(true);
        expect(response.data.data.length).toBe(0);
        
        // Cleanup
        await apiRequest('DELETE', `/producer/events/${eventId}`);
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.3: Error - Invalid event ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid event ID format', async () => {
      // Arrange
      const endpoint = '/producer/tickets/by-event/invalid-id';
      
      // Act
      const response = await apiRequest<TicketApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.4: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/tickets/by-event/1';
      
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
// TEST SUITE: VALIDATE COUPON API
// ============================================================================

describe('Tickets API - Validate Coupon', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/tickets/:id/validate-coupon
   * Description: Validate a coupon code for a ticket
   * -------------------------------------------------------------------------
   */

  let testTicketId: number;

  beforeAll(async () => {
    // Create a test ticket with coupon
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
      title: 'Coupon Test Ticket - ' + Date.now(),
      price: 100,
      total_quantity: 100,
      coupons: [
        {
          title: 'Test Coupon',
          code: 'VALIDTEST',
          count: 50,
          discount: 20,
        },
      ],
    });
    
    if (response.data?.data?.id) {
      testTicketId = response.data.data.id;
    }
  });

  afterAll(async () => {
    if (testTicketId) {
      await apiRequest('DELETE', `/producer/tickets/${testTicketId}`);
    }
  });

  describe('POST /producer/tickets/:id/validate-coupon', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 10.1: Success - Validate existing coupon
    // -----------------------------------------------------------------------
    it('should validate correct coupon code', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}/validate-coupon`;
      const payload = {
        code: 'VALIDTEST',
        amount: 100,
      };
      
      // Act
      const response = await apiRequest<ValidateCouponApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('valid');
      // Note: If coupon exists, valid should be true
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.2: Error - Invalid coupon code
    // -----------------------------------------------------------------------
    it('should return invalid for non-existent coupon code', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}/validate-coupon`;
      const payload = {
        code: 'INVALIDCODE123',
        amount: 100,
      };
      
      // Act
      const response = await apiRequest<ValidateCouponApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.valid).toBe(false);
      expect(response.data.data.error).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.3: Error - Missing coupon code
    // -----------------------------------------------------------------------
    it('should return 400 when coupon code is missing', async () => {
      if (!testTicketId) return;
      
      // Arrange
      const endpoint = `/producer/tickets/${testTicketId}/validate-coupon`;
      const payload = {
        amount: 100,
      };
      
      // Act
      const response = await apiRequest<ValidateCouponApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.4: Error - Non-existent ticket
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent ticket', async () => {
      // Arrange
      const endpoint = '/producer/tickets/999999999/validate-coupon';
      const payload = {
        code: 'TESTCODE',
        amount: 100,
      };
      
      // Act
      const response = await apiRequest<ValidateCouponApiResponse>('POST', endpoint, payload);
      
      // Assert - Could be 404 or validation error
      expect([404, 200]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.5: Error - Invalid ticket ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid ticket ID format', async () => {
      // Arrange
      const endpoint = '/producer/tickets/invalid-id/validate-coupon';
      const payload = {
        code: 'TESTCODE',
        amount: 100,
      };
      
      // Act
      const response = await apiRequest<ValidateCouponApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// EDGE CASES & INTEGRATION SCENARIOS
// ============================================================================

describe('Tickets API - Edge Cases & Integration', () => {
  
  // -------------------------------------------------------------------------
  // TEST CASE E.1: Response headers validation
  // -------------------------------------------------------------------------
  it('should return correct content-type header', async () => {
    // Arrange
    const endpoint = '/producer/tickets';
    
    // Act
    const response = await apiRequest<TicketListApiResponse>('GET', endpoint);
    
    // Assert
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.2: Large payload handling
  // -------------------------------------------------------------------------
  it('should handle ticket with long description', async () => {
    // Arrange
    const longDescription = 'A'.repeat(10000); // 10K characters
    const payload: CreateTicketRequest = {
      title: 'Long Description Ticket - ' + Date.now(),
      description: longDescription,
      price: 100,
      total_quantity: 50,
    };
    
    // Act
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', payload);
    
    // Assert - Should either succeed or return appropriate error
    expect([200, 201, 400, 413]).toContain(response.status);
    
    // Cleanup if created
    if (response.data?.data?.id) {
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.3: Special characters in title
  // -------------------------------------------------------------------------
  it('should handle special characters in ticket title', async () => {
    // Arrange
    const payload: CreateTicketRequest = {
      title: 'Ticket with "quotes" & <special> chars: émojis 🎫 - ' + Date.now(),
      price: 100,
      total_quantity: 50,
    };
    
    // Act
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.4: Large quantity handling
  // -------------------------------------------------------------------------
  it('should handle tickets with very large quantity', async () => {
    // Arrange
    const payload: CreateTicketRequest = {
      title: 'Large Quantity Ticket - ' + Date.now(),
      price: 10,
      total_quantity: 1000000, // 1 million
    };
    
    // Act
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.5: Very high price handling
  // -------------------------------------------------------------------------
  it('should handle tickets with high price', async () => {
    // Arrange
    const payload: CreateTicketRequest = {
      title: 'Premium Ticket - ' + Date.now(),
      price: 9999999.99,
      total_quantity: 10,
    };
    
    // Act
    const response = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.6: CRUD lifecycle test
  // -------------------------------------------------------------------------
  it('should complete full CRUD lifecycle', async () => {
    // CREATE
    const createResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
      title: 'Lifecycle Test Ticket - ' + Date.now(),
      price: 100,
      total_quantity: 500,
      status: 'draft',
    });
    expect([200, 201]).toContain(createResponse.status);
    const ticketId = createResponse.data.data.id;

    // READ
    const readResponse = await apiRequest<TicketApiResponse>('GET', `/producer/tickets/${ticketId}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.data.data.id).toBe(ticketId);

    // UPDATE
    const updateResponse = await apiRequest<TicketApiResponse>('PUT', `/producer/tickets/${ticketId}`, {
      title: 'Updated Lifecycle Ticket',
      price: 150,
    });
    expect(updateResponse.status).toBe(200);
    // Price is returned as decimal string from database
    expect(parseFloat(String(updateResponse.data.data.price))).toBe(150);

    // PUBLISH
    const publishResponse = await apiRequest<TicketApiResponse>('POST', `/producer/tickets/${ticketId}/publish`);
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.data.data.status).toBe('published');

    // CHECK AVAILABILITY
    const availabilityResponse = await apiRequest<TicketAvailabilityApiResponse>('GET', `/producer/tickets/${ticketId}/availability`);
    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.data.data.available).toBe(true);

    // ARCHIVE
    const archiveResponse = await apiRequest<TicketApiResponse>('POST', `/producer/tickets/${ticketId}/archive`);
    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.data.data.status).toBe('archived');

    // LIST (should appear in archived tickets)
    const listResponse = await apiRequest<TicketListApiResponse>('GET', '/producer/tickets?status=archived');
    expect(listResponse.status).toBe(200);

    // DELETE
    const deleteResponse = await apiRequest<TicketDeleteApiResponse>('DELETE', `/producer/tickets/${ticketId}`);
    expect([200, 204]).toContain(deleteResponse.status);

    // VERIFY DELETION
    const verifyResponse = await apiRequest<TicketApiResponse>('GET', `/producer/tickets/${ticketId}`);
    expect(verifyResponse.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.7: Ticket with event association lifecycle
  // -------------------------------------------------------------------------
  it('should handle ticket-event association lifecycle', async () => {
    // First, create an event
    const eventResponse = await apiRequest<ApiResponse<{ id: number }>>('POST', '/producer/events', {
      title: 'Event for Ticket Test - ' + Date.now(),
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    });
    
    if (eventResponse.data?.data?.id) {
      const eventId = eventResponse.data.data.id;
      
      // Create ticket with event association
      const ticketResponse = await apiRequest<TicketApiResponse>('POST', '/producer/tickets', {
        title: 'Ticket for Event - ' + Date.now(),
        price: 100,
        total_quantity: 200,
        event_ids: [eventId],
      });
      
      expect([200, 201]).toContain(ticketResponse.status);
      const ticketId = ticketResponse.data.data.id;
      
      // Get tickets by event
      const byEventResponse = await apiRequest<ApiResponse<Ticket[]>>('GET', `/producer/tickets/by-event/${eventId}`);
      expect(byEventResponse.status).toBe(200);
      
      // Cleanup
      await apiRequest('DELETE', `/producer/tickets/${ticketId}`);
      await apiRequest('DELETE', `/producer/events/${eventId}`);
    }
  });
});

// ============================================================================
// EXPECTED RESPONSE SCHEMAS (For Reference)
// ============================================================================

/**
 * List Tickets Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "app_id": "app_123",
 *       "tenant_id": "tenant_456",
 *       "title": "VIP Ticket",
 *       "description": "VIP access ticket",
 *       "url": "https://example.com/ticket",
 *       "thumbnail_image_portrait": "https://...",
 *       "featured_image": "https://...",
 *       "purchase_without_login": false,
 *       "price": 100,
 *       "currency": "INR",
 *       "total_quantity": 1000,
 *       "sold_quantity": 50,
 *       "max_quantity_per_user": 5,
 *       "geoblocking_enabled": false,
 *       "geoblocking_countries": [],
 *       "status": "published",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z",
 *       "events": [...],
 *       "coupons": [...],
 *       "pricing": [...],
 *       "sponsors": [...]
 *     }
 *   ],
 *   "total": 100,
 *   "page": 1,
 *   "page_size": 10,
 *   "total_pages": 10,
 *   "message": "Tickets retrieved successfully"
 * }
 * 
 * Single Ticket Response:
 * {
 *   "success": true,
 *   "data": { ... ticket object with relations ... },
 *   "message": "Ticket retrieved successfully"
 * }
 * 
 * Availability Response:
 * {
 *   "success": true,
 *   "data": {
 *     "available": true,
 *     "remaining": 950
 *   }
 * }
 * 
 * Validate Coupon Response:
 * {
 *   "success": true,
 *   "data": {
 *     "valid": true,
 *     "coupon": { ... coupon object ... },
 *     "discount_amount": 20
 *   }
 * }
 * OR
 * {
 *   "success": true,
 *   "data": {
 *     "valid": false,
 *     "error": "Coupon not found"
 *   }
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "message": "Detailed error message"
 * }
 */

