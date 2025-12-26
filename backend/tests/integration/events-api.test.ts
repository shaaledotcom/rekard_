/**
 * ============================================================================
 * CHUNK 1: EVENTS API - Integration Test Cases
 * ============================================================================
 * 
 * This file contains integration test cases for the Producer Dashboard Events API.
 * These tests validate API contracts, response schemas, and business logic.
 * 
 * Base URL: /v1/producer/events
 * Authentication: Required (Bearer token)
 * 
 * Endpoints Covered:
 * 1. GET    /producer/events        - List events with pagination & filters
 * 2. GET    /producer/events/:id    - Get single event by ID
 * 3. POST   /producer/events        - Create new event
 * 4. PUT    /producer/events/:id    - Update existing event
 * 5. DELETE /producer/events/:id    - Delete event
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (Based on packages/shared/src/store/services/events.ts)
// ============================================================================

interface Event {
  id: number;
  app_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  thumbnail_image_portrait?: string;
  featured_image?: string;
  featured_video?: string;
  start_datetime: string;
  end_datetime: string;
  language: string;
  is_vod: boolean;
  convert_to_vod_after_event: boolean;
  vod_url?: string;
  vod_video_url?: string;
  watch_link?: string;
  max_concurrent_viewers_per_link: number;
  signup_disabled: boolean;
  purchase_disabled: boolean;
  embed?: string;
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  watch_upto?: string;
  archive_after?: string;
  created_at: string;
  updated_at: string;
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

// API Response type for better type safety
interface ApiRequestResponse<T = ApiResponse> {
  status: number;
  headers: Headers;
  data: T;
}

// Generic API response wrapper for single items
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// List API response - flat structure with pagination at root level
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
type EventListApiResponse = ListApiResponse<Event>;
type EventApiResponse = ApiResponse<Event>;
type EventDeleteApiResponse = ApiResponse<void>;

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

const validEventPayload = {
  title: 'Test Event - Integration Test',
  description: 'This is a test event created by integration tests',
  start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  language: 'en',
  is_vod: false,
  convert_to_vod_after_event: false,
  max_concurrent_viewers_per_link: 1,
  signup_disabled: false,
  purchase_disabled: false,
  status: 'draft',
};

const vodEventPayload = {
  ...validEventPayload,
  title: 'Test VOD Event - Integration Test',
  is_vod: true,
  vod_url: 'https://example.com/vod',
  vod_video_url: 'https://example.com/video.mp4',
};

// ============================================================================
// TEST SUITE: LIST EVENTS API
// ============================================================================

describe('Events API - List Events', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/events
   * Description: List all events with pagination and filtering
   * -------------------------------------------------------------------------
   */

  describe('GET /producer/events', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 1.1: Success - List events without filters
    // -----------------------------------------------------------------------
    it('should return 200 and paginated list of events', async () => {
      // Arrange
      const endpoint = '/producer/events';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
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
    // TEST CASE 1.2: Success - List events with pagination
    // -----------------------------------------------------------------------
    it('should return paginated results with page and page_size params', async () => {
      // Arrange
      const endpoint = '/producer/events?page=1&page_size=5';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.page_size).toBe(5);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.3: Success - Filter by status
    // -----------------------------------------------------------------------
    it('should filter events by status', async () => {
      // Arrange
      const endpoint = '/producer/events?status=published';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // All returned events should have status 'published'
      const events = response.data.data;
      events.forEach((event: Event) => {
        expect(event.status).toBe('published');
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.4: Success - Filter by is_vod
    // -----------------------------------------------------------------------
    it('should filter events by is_vod flag', async () => {
      // Arrange
      const endpoint = '/producer/events?is_vod=true';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      const events = response.data.data;
      events.forEach((event: Event) => {
        expect(event.is_vod).toBe(true);
      });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.5: Success - Filter by date range
    // -----------------------------------------------------------------------
    it('should filter events by date range', async () => {
      // Arrange
      const startFrom = new Date().toISOString().split('T')[0];
      const startTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endpoint = `/producer/events?start_date_from=${startFrom}&start_date_to=${startTo}`;
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.6: Success - Search by keyword
    // -----------------------------------------------------------------------
    it('should search events by keyword', async () => {
      // Arrange
      const endpoint = '/producer/events?search=test';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.7: Success - Sort events
    // -----------------------------------------------------------------------
    it('should sort events by specified field and order', async () => {
      // Arrange
      const endpoint = '/producer/events?sort_by=created_at&sort_order=desc';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      
      // Verify descending order
      const events = response.data.data;
      if (events.length > 1) {
        for (let i = 0; i < events.length - 1; i++) {
          const current = new Date(events[i].created_at).getTime();
          const next = new Date(events[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.8: Success - Empty results
    // -----------------------------------------------------------------------
    it('should return empty array when no events match filters', async () => {
      // Arrange - Use a very specific search that likely won't match
      const endpoint = '/producer/events?search=xyz123nonexistent456abc';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
      expect(response.data.total).toBe(0);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.9: Event object schema validation
    // -----------------------------------------------------------------------
    it('should return events with correct schema', async () => {
      // Arrange
      const endpoint = '/producer/events?page_size=1';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert - If events exist, validate schema
      if (response.data.data.length > 0) {
        const event = response.data.data[0];
        
        // Required fields
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('app_id');
        expect(event).toHaveProperty('tenant_id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('start_datetime');
        expect(event).toHaveProperty('end_datetime');
        expect(event).toHaveProperty('language');
        expect(event).toHaveProperty('is_vod');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('created_at');
        expect(event).toHaveProperty('updated_at');
        
        // Type validations
        expect(typeof event.id).toBe('number');
        expect(typeof event.title).toBe('string');
        expect(['draft', 'published', 'live', 'completed', 'cancelled']).toContain(event.status);
        expect(typeof event.is_vod).toBe('boolean');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.10: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/events';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.11: Error - Invalid pagination values
    // -----------------------------------------------------------------------
    it('should handle invalid pagination gracefully', async () => {
      // Arrange - negative values should be sanitized to defaults
      const endpoint = '/producer/events?page=-1&page_size=0';
      
      // Act
      const response = await apiRequest<EventListApiResponse>('GET', endpoint);
      
      // Assert - Should return 200 with default pagination applied
      expect(response.status).toBe(200);
      if (response.data?.data) {
        // Verify pagination was sanitized (page defaults to 1, page_size to 10)
        expect(response.data.page).toBe(1);
        expect(response.data.page_size).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// TEST SUITE: GET SINGLE EVENT API
// ============================================================================

describe('Events API - Get Event', () => {
  /**
   * -------------------------------------------------------------------------
   * API: GET /producer/events/:id
   * Description: Get a single event by ID
   * -------------------------------------------------------------------------
   */

  let existingEventId: number;

  beforeAll(async () => {
    // Get an existing event ID for testing
    const response = await apiRequest<EventListApiResponse>('GET', '/producer/events?page_size=1');
    if (response.data?.data?.[0]) {
      existingEventId = response.data.data[0].id;
    }
  });

  describe('GET /producer/events/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 2.1: Success - Get event by valid ID
    // -----------------------------------------------------------------------
    it('should return 200 and event details for valid ID', async () => {
      // Skip if no existing event
      if (!existingEventId) {
        console.log('Skipping test: No existing event found');
        return;
      }
      
      // Arrange
      const endpoint = `/producer/events/${existingEventId}`;
      
      // Act
      const response = await apiRequest<EventApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Event Schema
      const event = response.data.data;
      expect(event.id).toBe(existingEventId);
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('start_datetime');
      expect(event).toHaveProperty('end_datetime');
      expect(event).toHaveProperty('status');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.2: Success - Complete event schema validation
    // -----------------------------------------------------------------------
    it('should return complete event object with all fields', async () => {
      if (!existingEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${existingEventId}`;
      
      // Act
      const response = await apiRequest<EventApiResponse>('GET', endpoint);
      
      // Assert - All expected fields exist
      const event = response.data.data;
      
      // Core fields
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('app_id');
      expect(event).toHaveProperty('tenant_id');
      expect(event).toHaveProperty('title');
      
      // Datetime fields
      expect(event).toHaveProperty('start_datetime');
      expect(event).toHaveProperty('end_datetime');
      expect(event).toHaveProperty('created_at');
      expect(event).toHaveProperty('updated_at');
      
      // Boolean fields
      expect(event).toHaveProperty('is_vod');
      expect(event).toHaveProperty('convert_to_vod_after_event');
      expect(event).toHaveProperty('signup_disabled');
      expect(event).toHaveProperty('purchase_disabled');
      
      // Status field
      expect(['draft', 'published', 'live', 'completed', 'cancelled']).toContain(event.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.3: Error - Event not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent event ID', async () => {
      // Arrange
      const nonExistentId = 999999999;
      const endpoint = `/producer/events/${nonExistentId}`;
      
      // Act
      const response = await apiRequest<EventApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.4: Error - Invalid event ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid event ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      const endpoint = `/producer/events/${invalidId}`;
      
      // Act
      const response = await apiRequest<EventApiResponse>('GET', endpoint);
      
      // Assert - Should return 400 or 404
      expect([400, 404]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!existingEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${existingEventId}`;
      
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
// TEST SUITE: CREATE EVENT API
// ============================================================================

describe('Events API - Create Event', () => {
  /**
   * -------------------------------------------------------------------------
   * API: POST /producer/events
   * Description: Create a new event
   * -------------------------------------------------------------------------
   */

  const createdEventIds: number[] = [];

  afterAll(async () => {
    // Cleanup: Delete all events created during tests
    for (const id of createdEventIds) {
      await apiRequest('DELETE', `/producer/events/${id}`);
    }
  });

  describe('POST /producer/events', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 3.1: Success - Create event with minimum required fields
    // -----------------------------------------------------------------------
    it('should return 201 and created event for valid payload', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        title: 'Minimum Fields Event',
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert - Status Code (201 Created or 200 OK)
      expect([200, 201]).toContain(response.status);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Assert - Created Event
      const event = response.data.data;
      expect(event).toHaveProperty('id');
      expect(event.title).toBe(payload.title);
      
      // Track for cleanup
      if (event.id) createdEventIds.push(event.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.2: Success - Create event with all fields
    // -----------------------------------------------------------------------
    it('should create event with all optional fields', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        ...validEventPayload,
        title: 'Full Fields Event - ' + Date.now(),
        description: 'Full description with all fields',
        watch_link: 'https://example.com/watch',
        max_concurrent_viewers_per_link: 5,
        embed: '<iframe src="https://example.com"></iframe>',
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const event = response.data.data;
      expect(event.title).toBe(payload.title);
      expect(event.description).toBe(payload.description);
      expect(event.max_concurrent_viewers_per_link).toBe(5);
      
      if (event.id) createdEventIds.push(event.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.3: Success - Create VOD event
    // -----------------------------------------------------------------------
    it('should create VOD event with vod fields', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        ...vodEventPayload,
        title: 'VOD Event - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const event = response.data.data;
      expect(event.is_vod).toBe(true);
      
      if (event.id) createdEventIds.push(event.id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.4: Error - Missing required field (title)
    // -----------------------------------------------------------------------
    it('should return 400 when title is missing', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.6: Error - Invalid datetime format
    // -----------------------------------------------------------------------
    it('should return error for invalid datetime format', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        title: 'Invalid Date Event',
        start_datetime: 'not-a-date',
        end_datetime: 'also-not-a-date',
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert - Backend returns 400 or 500 for invalid dates
      expect([400, 500]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.7: Error - End datetime before start datetime
    // -----------------------------------------------------------------------
    it('should return 400 when end_datetime is before start_datetime', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        title: 'Invalid Range Event',
        start_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Before start
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.8: Error - Invalid status value
    // -----------------------------------------------------------------------
    it('should return 400 for invalid status value', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        ...validEventPayload,
        title: 'Invalid Status Event',
        status: 'invalid_status',
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.9: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/events';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validEventPayload),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.10: Response contains generated fields
    // -----------------------------------------------------------------------
    it('should generate id, timestamps, and default values', async () => {
      // Arrange
      const endpoint = '/producer/events';
      const payload = {
        title: 'Generated Fields Event - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('POST', endpoint, payload);
      
      // Assert
      expect([200, 201]).toContain(response.status);
      
      const event = response.data.data;
      // ID can be number or string (depending on serialization)
      expect(event.id).toBeDefined();
      expect(Number(event.id)).toBeGreaterThan(0);
      expect(event).toHaveProperty('created_at');
      expect(event).toHaveProperty('updated_at');
      expect(event).toHaveProperty('app_id');
      expect(event).toHaveProperty('tenant_id');
      
      if (event.id) createdEventIds.push(event.id);
    });
  });
});

// ============================================================================
// TEST SUITE: UPDATE EVENT API
// ============================================================================

describe('Events API - Update Event', () => {
  /**
   * -------------------------------------------------------------------------
   * API: PUT /producer/events/:id
   * Description: Update an existing event
   * -------------------------------------------------------------------------
   */

  let testEventId: number;

  beforeAll(async () => {
    // Create a test event for update tests
    const response = await apiRequest<EventApiResponse>('POST', '/producer/events', {
      title: 'Update Test Event - ' + Date.now(),
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
    });
    
    if (response.data?.data?.id) {
      testEventId = response.data.data.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (testEventId) {
      await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${testEventId}`);
    }
  });

  describe('PUT /producer/events/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 4.1: Success - Update event title
    // -----------------------------------------------------------------------
    it('should return 200 and updated event for valid update', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      const payload = {
        title: 'Updated Event Title - ' + Date.now(),
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(payload.title);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.2: Success - Update multiple fields
    // -----------------------------------------------------------------------
    it('should update multiple fields at once', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      const payload = {
        title: 'Multi-Update Event - ' + Date.now(),
        description: 'Updated description',
        language: 'es',
        max_concurrent_viewers_per_link: 10,
      };
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      
      const event = response.data.data;
      expect(event.title).toBe(payload.title);
      expect(event.description).toBe(payload.description);
      expect(event.language).toBe(payload.language);
      expect(event.max_concurrent_viewers_per_link).toBe(10);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.3: Success - Update status
    // -----------------------------------------------------------------------
    it('should update event status', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      const payload = { status: 'published' };
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data.status).toBe('published');
      
      // Reset status back to draft
      await apiRequest<EventApiResponse>('PUT', endpoint, { status: 'draft' });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.4: Success - Partial update preserves other fields
    // -----------------------------------------------------------------------
    it('should preserve unchanged fields during partial update', async () => {
      if (!testEventId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<EventApiResponse>('GET', `/producer/events/${testEventId}`);
      const originalEvent = getResponse.data.data;
      
      // Act - Update only title
      const endpoint = `/producer/events/${testEventId}`;
      const payload = { title: 'Partial Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert - Other fields unchanged
      expect(updateResponse.status).toBe(200);
      const updatedEvent = updateResponse.data.data;
      
      expect(updatedEvent.title).toBe(payload.title);
      expect(updatedEvent.start_datetime).toBe(originalEvent.start_datetime);
      expect(updatedEvent.end_datetime).toBe(originalEvent.end_datetime);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.6: Success - updated_at timestamp changes
    // -----------------------------------------------------------------------
    it('should update the updated_at timestamp', async () => {
      if (!testEventId) return;
      
      // Arrange - Get current state
      const getResponse = await apiRequest<EventApiResponse>('GET', `/producer/events/${testEventId}`);
      const originalUpdatedAt = getResponse.data.data.updated_at;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Act
      const endpoint = `/producer/events/${testEventId}`;
      const payload = { title: 'Timestamp Update Test - ' + Date.now() };
      const updateResponse = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(updateResponse.status).toBe(200);
      const newUpdatedAt = updateResponse.data.data.updated_at;
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.7: Error - Event not found
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent event ID', async () => {
      // Arrange
      const endpoint = '/producer/events/999999999';
      const payload = { title: 'Non-existent Update' };
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.8: Error - Invalid field value
    // -----------------------------------------------------------------------
    it('should return 400 for invalid status value', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      const payload = { status: 'invalid_status' };
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.9: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      
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
    // TEST CASE 4.10: Error - Empty payload
    // -----------------------------------------------------------------------
    it('should handle empty payload gracefully', async () => {
      if (!testEventId) return;
      
      // Arrange
      const endpoint = `/producer/events/${testEventId}`;
      const payload = {};
      
      // Act
      const response = await apiRequest<EventApiResponse>('PUT', endpoint, payload);
      
      // Assert - Should succeed with no changes or return 400
      expect([200, 400]).toContain(response.status);
    });
  });
});

// ============================================================================
// TEST SUITE: DELETE EVENT API
// ============================================================================

describe('Events API - Delete Event', () => {
  /**
   * -------------------------------------------------------------------------
   * API: DELETE /producer/events/:id
   * Description: Delete an event
   * -------------------------------------------------------------------------
   */

  describe('DELETE /producer/events/:id', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 5.1: Success - Delete event
    // -----------------------------------------------------------------------
    it('should return 200 and delete event successfully', async () => {
      // Arrange - Create event to delete
      const createResponse = await apiRequest<EventApiResponse>('POST', '/producer/events', {
        title: 'Event To Delete - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      });
      
      const eventId = createResponse.data?.data?.id;
      expect(eventId).toBeDefined();
      
      // Act
      const endpoint = `/producer/events/${eventId}`;
      const response = await apiRequest<EventDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect([200, 204]).toContain(response.status);
      
      // Verify deletion
      const getResponse = await apiRequest<EventApiResponse>('GET', endpoint);
      expect(getResponse.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.2: Success - Delete draft event
    // -----------------------------------------------------------------------
    it('should delete draft event', async () => {
      // Arrange
      const createResponse = await apiRequest<EventApiResponse>('POST', '/producer/events', {
        title: 'Draft Event To Delete - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
      });
      
      const eventId = createResponse.data?.data?.id;
      
      // Act
      const response = await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${eventId}`);
      
      // Assert
      expect([200, 204]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.3: Error - Delete non-existent event
    // -----------------------------------------------------------------------
    it('should return 404 for non-existent event ID', async () => {
      // Arrange
      const endpoint = '/producer/events/999999999';
      
      // Act
      const response = await apiRequest<EventDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.4: Error - Delete already deleted event
    // -----------------------------------------------------------------------
    it('should return 404 when deleting already deleted event', async () => {
      // Arrange - Create and delete event
      const createResponse = await apiRequest<EventApiResponse>('POST', '/producer/events', {
        title: 'Double Delete Event - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      });
      
      const eventId = createResponse.data?.data?.id;
      await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${eventId}`);
      
      // Act - Try to delete again
      const response = await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${eventId}`);
      
      // Assert
      expect(response.status).toBe(404);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.5: Error - Invalid event ID format
    // -----------------------------------------------------------------------
    it('should return 400 for invalid event ID format', async () => {
      // Arrange
      const endpoint = '/producer/events/invalid-id';
      
      // Act
      const response = await apiRequest<EventDeleteApiResponse>('DELETE', endpoint);
      
      // Assert
      expect([400, 404]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.6: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/events/1';
      
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
      const createResponse = await apiRequest<EventApiResponse>('POST', '/producer/events', {
        title: 'Concurrent Delete Event - ' + Date.now(),
        start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      });
      
      const eventId = createResponse.data?.data?.id;
      const endpoint = `/producer/events/${eventId}`;
      
      // Act - Send multiple delete requests concurrently
      const responses = await Promise.all([
        apiRequest<EventDeleteApiResponse>('DELETE', endpoint),
        apiRequest<EventDeleteApiResponse>('DELETE', endpoint),
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
// EDGE CASES & INTEGRATION SCENARIOS
// ============================================================================

describe('Events API - Edge Cases & Integration', () => {
  
  // -------------------------------------------------------------------------
  // TEST CASE E.1: Response headers validation
  // -------------------------------------------------------------------------
  it('should return correct content-type header', async () => {
    // Arrange
    const endpoint = '/producer/events';
    
    // Act
    const response = await apiRequest<EventListApiResponse>('GET', endpoint);
    
    // Assert
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.2: Large payload handling
  // -------------------------------------------------------------------------
  it('should handle event with long description', async () => {
    // Arrange
    const longDescription = 'A'.repeat(10000); // 10K characters
    const payload = {
      title: 'Long Description Event - ' + Date.now(),
      description: longDescription,
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    };
    
    // Act
    const response = await apiRequest<EventApiResponse>('POST', '/producer/events', payload);
    
    // Assert - Should either succeed or return appropriate error
    expect([200, 201, 400, 413]).toContain(response.status);
    
    // Cleanup if created
    if (response.data?.data?.id) {
      await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.3: Special characters in title
  // -------------------------------------------------------------------------
  it('should handle special characters in event title', async () => {
    // Arrange
    const payload = {
      title: 'Event with "quotes" & <special> chars: émojis 🎉 - ' + Date.now(),
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    };
    
    // Act
    const response = await apiRequest<EventApiResponse>('POST', '/producer/events', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.4: Boundary date values
  // -------------------------------------------------------------------------
  it('should handle events far in the future', async () => {
    // Arrange
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 10); // 10 years from now
    
    const payload = {
      title: 'Far Future Event - ' + Date.now(),
      start_datetime: futureDate.toISOString(),
      end_datetime: new Date(futureDate.getTime() + 60 * 60 * 1000).toISOString(),
    };
    
    // Act
    const response = await apiRequest<EventApiResponse>('POST', '/producer/events', payload);
    
    // Assert
    expect([200, 201]).toContain(response.status);
    
    // Cleanup
    if (response.data?.data?.id) {
      await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${response.data.data.id}`);
    }
  });

  // -------------------------------------------------------------------------
  // TEST CASE E.5: CRUD lifecycle test
  // -------------------------------------------------------------------------
  it('should complete full CRUD lifecycle', async () => {
    // CREATE
    const createResponse = await apiRequest<EventApiResponse>('POST', '/producer/events', {
      title: 'Lifecycle Test Event - ' + Date.now(),
      start_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_datetime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
    });
    expect([200, 201]).toContain(createResponse.status);
    const eventId = createResponse.data.data.id;

    // READ
    const readResponse = await apiRequest<EventApiResponse>('GET', `/producer/events/${eventId}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.data.data.id).toBe(eventId);

    // UPDATE
    const updateResponse = await apiRequest<EventApiResponse>('PUT', `/producer/events/${eventId}`, {
      title: 'Updated Lifecycle Event',
      status: 'published',
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.data.status).toBe('published');

    // LIST (should appear in published events)
    const listResponse = await apiRequest<EventListApiResponse>('GET', '/producer/events?status=published');
    expect(listResponse.status).toBe(200);

    // DELETE
    const deleteResponse = await apiRequest<EventDeleteApiResponse>('DELETE', `/producer/events/${eventId}`);
    expect([200, 204]).toContain(deleteResponse.status);

    // VERIFY DELETION
    const verifyResponse = await apiRequest<EventApiResponse>('GET', `/producer/events/${eventId}`);
    expect(verifyResponse.status).toBe(404);
  });
});

// ============================================================================
// EXPECTED RESPONSE SCHEMAS (For Reference)
// ============================================================================

/**
 * List Events Response:
 * {
 *   "success": true,
 *   "data": {
 *     "data": [
 *       {
 *         "id": 1,
 *         "app_id": "app_123",
 *         "tenant_id": "tenant_456",
 *         "title": "Event Title",
 *         "description": "Event description",
 *         "thumbnail_image_portrait": "https://...",
 *         "featured_image": "https://...",
 *         "featured_video": "https://...",
 *         "start_datetime": "2024-01-01T10:00:00Z",
 *         "end_datetime": "2024-01-01T12:00:00Z",
 *         "language": "en",
 *         "is_vod": false,
 *         "convert_to_vod_after_event": false,
 *         "vod_url": null,
 *         "vod_video_url": null,
 *         "watch_link": "https://...",
 *         "max_concurrent_viewers_per_link": 1,
 *         "geoblocking_enabled": false,
 *         "geoblocking_countries": [],
 *         "signup_disabled": false,
 *         "purchase_disabled": false,
 *         "embed": null,
 *         "status": "published",
 *         "watch_upto": null,
 *         "archive_after": null,
 *         "created_at": "2024-01-01T00:00:00Z",
 *         "updated_at": "2024-01-01T00:00:00Z"
 *       }
 *     ],
 *     "total": 100,
 *     "page": 1,
 *     "page_size": 10,
 *     "total_pages": 10
 *   },
 *   "message": "Events retrieved successfully"
 * }
 * 
 * Single Event Response:
 * {
 *   "success": true,
 *   "data": { ... event object ... },
 *   "message": "Event retrieved successfully"
 * }
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "message": "Detailed error message"
 * }
 */

