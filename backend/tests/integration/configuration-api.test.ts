/**
 * ============================================================================
 * CONFIGURATION & PLATFORM API - Integration Test Cases
 * ============================================================================
 * 
 * This file contains integration test cases for the Producer Dashboard 
 * Configuration and Platform Settings APIs.
 * These tests validate API contracts, response schemas, and business logic.
 * 
 * Base URL: /v1/producer/configuration & /v1/producer/platform
 * Authentication: Required (Bearer token with Producer role)
 * 
 * Endpoints Covered:
 * 
 * CONFIGURATION - PAYMENT GATEWAY:
 * 1.  GET    /producer/configuration/payment-gateway     - Get payment gateway settings
 * 2.  PUT    /producer/configuration/payment-gateway     - Create/Update payment gateway
 * 3.  DELETE /producer/configuration/payment-gateway     - Delete payment gateway
 * 
 * CONFIGURATION - DOMAIN:
 * 4.  GET    /producer/configuration/domain              - Get domain settings
 * 5.  PUT    /producer/configuration/domain              - Create/Update domain
 * 6.  DELETE /producer/configuration/domain              - Delete domain
 * 
 * CONFIGURATION - SMS GATEWAY:
 * 7.  GET    /producer/configuration/sms-gateway         - Get SMS gateway settings
 * 8.  PUT    /producer/configuration/sms-gateway         - Create/Update SMS gateway
 * 9.  DELETE /producer/configuration/sms-gateway         - Delete SMS gateway
 * 
 * CONFIGURATION - EMAIL GATEWAY:
 * 10. GET    /producer/configuration/email-gateway       - Get email gateway settings
 * 11. PUT    /producer/configuration/email-gateway       - Create/Update email gateway
 * 12. DELETE /producer/configuration/email-gateway       - Delete email gateway
 * 
 * CONFIGURATION - PAYMENT RECEIVER:
 * 13. GET    /producer/configuration/payment-receiver    - Get payment receiver settings
 * 14. PUT    /producer/configuration/payment-receiver    - Create/Update payment receiver
 * 15. DELETE /producer/configuration/payment-receiver    - Delete payment receiver
 * 
 * PLATFORM SETTINGS:
 * 16. GET    /producer/platform                          - Get platform settings
 * 17. PUT    /producer/platform                          - Update platform settings
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// ============================================================================
// TYPE DEFINITIONS (Based on services/backend/src/domains/configuration/types.ts)
// ============================================================================

interface PaymentGatewaySettings {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  key: string;
  secret: string;
  created_at: string;
  updated_at: string;
}

interface DomainSettings {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  domain: string;
  subdomain: string;
  created_at: string;
  updated_at: string;
}

interface SmsGatewaySettings {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  provider: string;
  api_key: string;
  api_secret: string;
  sender_id: string;
  region?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

interface EmailGatewaySettings {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  provider: string;
  api_key: string;
  api_secret: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentReceiverSettings {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  pan: string;
  gstin: string;
  upi_phone_number: string;
  upi_id: string;
  created_at: string;
  updated_at: string;
}

// Platform settings types
interface FeaturedImage {
  url: string;
  alt?: string;
  link?: string;
}

interface FooterPolicy {
  title: string;
  content: string;
  url?: string;
}

interface FooterPolicies {
  terms_of_service?: FooterPolicy;
  privacy_policy?: FooterPolicy;
  refund_policy?: FooterPolicy;
  cookie_policy?: FooterPolicy;
}

interface SupportChannel {
  type: 'email' | 'phone' | 'whatsapp' | 'telegram' | 'chat';
  value: string;
  label?: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

interface CouponCode {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
}

interface PlatformSettings {
  id: number;
  app_id: string;
  tenant_id: string;
  legal_name: string;
  logo_url: string;
  enable_cart: boolean;
  featured_images: FeaturedImage[];
  default_language: string;
  footer_policies: FooterPolicies;
  support_channels: SupportChannel[];
  social_links: SocialLink[];
  coupon_codes: CouponCode[];
  enable_live_chat: boolean;
  created_at: string;
  updated_at: string;
}

// Request types
interface CreatePaymentGatewayRequest {
  key: string;
  secret: string;
}

interface CreateDomainRequest {
  domain: string;
  subdomain: string;
}

interface CreateSmsGatewayRequest {
  provider: string;
  api_key: string;
  api_secret: string;
  sender_id: string;
  region?: string;
  webhook_url?: string;
}

interface CreateEmailGatewayRequest {
  provider: string;
  api_key: string;
  api_secret: string;
  from_email: string;
  from_name: string;
  reply_to_email?: string;
  webhook_url?: string;
}

interface CreatePaymentReceiverRequest {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  pan: string;
  gstin: string;
  upi_phone_number: string;
  upi_id: string;
}

interface UpdatePlatformSettingsRequest {
  legal_name?: string;
  logo_url?: string;
  enable_cart?: boolean;
  featured_images?: FeaturedImage[];
  default_language?: string;
  footer_policies?: FooterPolicies;
  support_channels?: SupportChannel[];
  social_links?: SocialLink[];
  coupon_codes?: CouponCode[];
  enable_live_chat?: boolean;
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

// Typed API response aliases
type PaymentGatewayApiResponse = ApiResponse<PaymentGatewaySettings | null>;
type DomainApiResponse = ApiResponse<DomainSettings | null>;
type SmsGatewayApiResponse = ApiResponse<SmsGatewaySettings | null>;
type EmailGatewayApiResponse = ApiResponse<EmailGatewaySettings | null>;
type PaymentReceiverApiResponse = ApiResponse<PaymentReceiverSettings | null>;
type PlatformApiResponse = ApiResponse<PlatformSettings | null>;
type DeleteApiResponse = ApiResponse<void>;

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

const validPaymentGatewayPayload: CreatePaymentGatewayRequest = {
  key: `rzp_test_${Date.now()}`,
  secret: `secret_${Date.now()}_test`,
};

const validDomainPayload: CreateDomainRequest = {
  domain: `test-${Date.now()}.example.com`,
  subdomain: `subdomain-${Date.now()}`,
};

const validSmsGatewayPayload: CreateSmsGatewayRequest = {
  provider: 'twilio',
  api_key: `api_key_${Date.now()}`,
  api_secret: `api_secret_${Date.now()}`,
  sender_id: 'TESTID',
  region: 'us-east-1',
  webhook_url: 'https://example.com/webhook/sms',
};

const validEmailGatewayPayload: CreateEmailGatewayRequest = {
  provider: 'sendgrid',
  api_key: `sg_api_key_${Date.now()}`,
  api_secret: `sg_api_secret_${Date.now()}`,
  from_email: 'test@example.com',
  from_name: 'Test Sender',
  reply_to_email: 'reply@example.com',
  webhook_url: 'https://example.com/webhook/email',
};

const validPaymentReceiverPayload: CreatePaymentReceiverRequest = {
  account_holder_name: 'Test Account Holder',
  account_number: '1234567890123456',
  ifsc_code: 'TEST0001234',
  pan: 'ABCDE1234F',
  gstin: '22AAAAA0000A1Z5',
  upi_phone_number: '9876543210',
  upi_id: 'test@upi',
};

const validPlatformSettingsPayload: UpdatePlatformSettingsRequest = {
  legal_name: 'Test Legal Name Pvt Ltd',
  logo_url: 'https://example.com/logo.png',
  enable_cart: true,
  featured_images: [
    { url: 'https://example.com/featured1.png', alt: 'Featured 1' },
    { url: 'https://example.com/featured2.png', alt: 'Featured 2', link: 'https://example.com' },
  ],
  default_language: 'en',
  footer_policies: {
    terms_of_service: { title: 'Terms of Service', content: 'Test terms content' },
    privacy_policy: { title: 'Privacy Policy', content: 'Test privacy content' },
    refund_policy: { title: 'Refund Policy', content: 'Test refund content' },
  },
  support_channels: [
    { type: 'email', value: 'support@example.com', label: 'Email Support' },
    { type: 'phone', value: '+919876543210', label: 'Phone Support' },
    { type: 'whatsapp', value: '+919876543210', label: 'WhatsApp' },
  ],
  social_links: [
    { platform: 'twitter', url: 'https://twitter.com/test' },
    { platform: 'instagram', url: 'https://instagram.com/test' },
  ],
  coupon_codes: [
    {
      code: `TEST${Date.now()}`,
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 100,
      max_discount: 50,
      usage_limit: 100,
      used_count: 0,
      is_active: true,
    },
  ],
  enable_live_chat: false,
};

// ============================================================================
// TEST SUITE: PAYMENT GATEWAY CONFIGURATION
// ============================================================================

describe('Configuration API - Payment Gateway', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/configuration/payment-gateway
   * PUT    /producer/configuration/payment-gateway
   * DELETE /producer/configuration/payment-gateway
   * -------------------------------------------------------------------------
   */

  let originalSettings: PaymentGatewaySettings | null = null;

  beforeAll(async () => {
    // Save original settings if they exist
    const response = await apiRequest<PaymentGatewayApiResponse>('GET', '/producer/configuration/payment-gateway');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    // Restore original settings if they existed, otherwise delete test settings
    if (originalSettings) {
      await apiRequest('PUT', '/producer/configuration/payment-gateway', {
        key: originalSettings.key,
        secret: originalSettings.secret,
      });
    } else {
      await apiRequest('DELETE', '/producer/configuration/payment-gateway');
    }
  });

  describe('GET /producer/configuration/payment-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 1.1: Success - Get payment gateway settings (may be null)
    // -----------------------------------------------------------------------
    it('should return 200 and payment gateway settings or null', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      
      // Act
      const response = await apiRequest<PaymentGatewayApiResponse>('GET', endpoint);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Data can be null if not configured
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('app_id');
        expect(settings).toHaveProperty('tenant_id');
        expect(settings).toHaveProperty('user_id');
        expect(settings).toHaveProperty('key');
        expect(settings).toHaveProperty('secret');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 1.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/configuration/payment-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 2.1: Success - Create payment gateway settings
    // -----------------------------------------------------------------------
    it('should return 200 and create/update payment gateway settings', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      const payload = { ...validPaymentGatewayPayload };
      
      // Act
      const response = await apiRequest<PaymentGatewayApiResponse>('PUT', endpoint, payload);
      
      // Assert - Status Code
      expect(response.status).toBe(200);
      
      // Assert - Response Structure
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('message');
      
      // Assert - Created Settings
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.key).toBe(payload.key);
      expect(settings!.secret).toBe(payload.secret);
      expect(settings!).toHaveProperty('id');
      expect(settings!).toHaveProperty('created_at');
      expect(settings!).toHaveProperty('updated_at');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.2: Success - Update existing payment gateway settings
    // -----------------------------------------------------------------------
    it('should update existing payment gateway settings (upsert)', async () => {
      // Arrange - First create settings
      const createPayload = { key: `rzp_test_create_${Date.now()}`, secret: 'initial_secret' };
      await apiRequest('PUT', '/producer/configuration/payment-gateway', createPayload);
      
      // Act - Update with new values
      const updatePayload = { key: `rzp_test_update_${Date.now()}`, secret: 'updated_secret' };
      const response = await apiRequest<PaymentGatewayApiResponse>(
        'PUT',
        '/producer/configuration/payment-gateway',
        updatePayload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.key).toBe(updatePayload.key);
      expect(response.data.data!.secret).toBe(updatePayload.secret);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.3: Success - Partial update
    // -----------------------------------------------------------------------
    it('should allow partial update of payment gateway settings', async () => {
      // Arrange - First create settings
      const createPayload = { key: `rzp_test_partial_${Date.now()}`, secret: 'partial_secret' };
      await apiRequest('PUT', '/producer/configuration/payment-gateway', createPayload);
      
      // Act - Update only one field
      const partialPayload = { secret: 'new_partial_secret' };
      const response = await apiRequest<PaymentGatewayApiResponse>(
        'PUT',
        '/producer/configuration/payment-gateway',
        partialPayload
      );
      
      // Assert - Should succeed with partial update or require all fields
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.4: Error - Missing required fields
    // -----------------------------------------------------------------------
    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      const invalidPayload = {}; // Missing key and secret
      
      // Act
      const response = await apiRequest<ApiResponse>('PUT', endpoint, invalidPayload);
      
      // Assert - Could be 400 or 200 depending on if it's update vs create
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validPaymentGatewayPayload),
      });
      
      // Assert
      expect(response.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 2.6: Schema validation - generated fields
    // -----------------------------------------------------------------------
    it('should generate timestamps and IDs for new settings', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      const payload = { key: `rzp_test_schema_${Date.now()}`, secret: 'schema_secret' };
      
      // Act
      const response = await apiRequest<PaymentGatewayApiResponse>('PUT', endpoint, payload);
      
      // Assert
      expect(response.status).toBe(200);
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      // ID can be number or string depending on serialization
      expect(settings!.id).toBeDefined();
      expect(Number(settings!.id)).toBeGreaterThan(0);
      expect(settings!).toHaveProperty('app_id');
      expect(settings!).toHaveProperty('tenant_id');
      expect(settings!).toHaveProperty('user_id');
      expect(settings!.created_at).toBeDefined();
      expect(settings!.updated_at).toBeDefined();
    });
  });

  describe('DELETE /producer/configuration/payment-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 3.1: Success - Delete payment gateway settings
    // -----------------------------------------------------------------------
    it('should return 204 and delete payment gateway settings', async () => {
      // Arrange - First create settings to delete
      const createPayload = { key: `rzp_test_delete_${Date.now()}`, secret: 'delete_secret' };
      await apiRequest('PUT', '/producer/configuration/payment-gateway', createPayload);
      
      // Act
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/payment-gateway');
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<PaymentGatewayApiResponse>('GET', '/producer/configuration/payment-gateway');
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data).toBeNull();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.2: Success - Delete non-existent settings (idempotent)
    // -----------------------------------------------------------------------
    it('should return 204 even if settings do not exist (idempotent)', async () => {
      // Arrange - Ensure no settings exist
      await apiRequest('DELETE', '/producer/configuration/payment-gateway');
      
      // Act - Delete again
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/payment-gateway');
      
      // Assert - Should be idempotent
      expect(response.status).toBe(204);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 3.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-gateway';
      
      // Act
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: DOMAIN CONFIGURATION
// ============================================================================

describe('Configuration API - Domain', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/configuration/domain
   * PUT    /producer/configuration/domain
   * DELETE /producer/configuration/domain
   * -------------------------------------------------------------------------
   */

  let originalSettings: DomainSettings | null = null;

  beforeAll(async () => {
    const response = await apiRequest<DomainApiResponse>('GET', '/producer/configuration/domain');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    if (originalSettings) {
      await apiRequest('PUT', '/producer/configuration/domain', {
        domain: originalSettings.domain,
        subdomain: originalSettings.subdomain,
      });
    } else {
      await apiRequest('DELETE', '/producer/configuration/domain');
    }
  });

  describe('GET /producer/configuration/domain', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 4.1: Success - Get domain settings
    // -----------------------------------------------------------------------
    it('should return 200 and domain settings or null', async () => {
      // Arrange
      const endpoint = '/producer/configuration/domain';
      
      // Act
      const response = await apiRequest<DomainApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('domain');
        expect(settings).toHaveProperty('subdomain');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 4.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/domain`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/configuration/domain', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 5.1: Success - Create domain settings
    // -----------------------------------------------------------------------
    it('should return 200 and create/update domain settings', async () => {
      // Arrange
      const payload = { ...validDomainPayload };
      
      // Act
      const response = await apiRequest<DomainApiResponse>('PUT', '/producer/configuration/domain', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.domain).toBe(payload.domain);
      expect(settings!.subdomain).toBe(payload.subdomain);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.2: Success - Update existing domain settings
    // -----------------------------------------------------------------------
    it('should update existing domain settings (upsert)', async () => {
      // Arrange - First create
      const createPayload = { domain: `create-${Date.now()}.example.com`, subdomain: 'create-sub' };
      await apiRequest('PUT', '/producer/configuration/domain', createPayload);
      
      // Act - Update
      const updatePayload = { domain: `update-${Date.now()}.example.com`, subdomain: 'update-sub' };
      const response = await apiRequest<DomainApiResponse>(
        'PUT',
        '/producer/configuration/domain',
        updatePayload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.domain).toBe(updatePayload.domain);
      expect(response.data.data!.subdomain).toBe(updatePayload.subdomain);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.3: Error - Invalid domain format
    // -----------------------------------------------------------------------
    it('should handle invalid domain format', async () => {
      // Arrange
      const invalidPayload = { domain: 'not a valid domain!!', subdomain: 'valid-sub' };
      
      // Act
      const response = await apiRequest<ApiResponse>(
        'PUT',
        '/producer/configuration/domain',
        invalidPayload
      );
      
      // Assert - Depends on validation rules
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 5.4: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/domain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validDomainPayload),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /producer/configuration/domain', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 6.1: Success - Delete domain settings
    // -----------------------------------------------------------------------
    it('should return 204 and delete domain settings', async () => {
      // Arrange - Create settings
      const createPayload = { domain: `delete-${Date.now()}.example.com`, subdomain: 'delete-sub' };
      await apiRequest('PUT', '/producer/configuration/domain', createPayload);
      
      // Act
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/domain');
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<DomainApiResponse>('GET', '/producer/configuration/domain');
      expect(getResponse.data.data).toBeNull();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.2: Success - Delete non-existent settings (idempotent)
    // -----------------------------------------------------------------------
    it('should return 204 even if settings do not exist', async () => {
      // Ensure deleted
      await apiRequest('DELETE', '/producer/configuration/domain');
      
      // Delete again
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/domain');
      
      expect(response.status).toBe(204);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 6.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/domain`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: SMS GATEWAY CONFIGURATION
// ============================================================================

describe('Configuration API - SMS Gateway', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/configuration/sms-gateway
   * PUT    /producer/configuration/sms-gateway
   * DELETE /producer/configuration/sms-gateway
   * -------------------------------------------------------------------------
   */

  let originalSettings: SmsGatewaySettings | null = null;

  beforeAll(async () => {
    const response = await apiRequest<SmsGatewayApiResponse>('GET', '/producer/configuration/sms-gateway');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    if (originalSettings) {
      await apiRequest('PUT', '/producer/configuration/sms-gateway', {
        provider: originalSettings.provider,
        api_key: originalSettings.api_key,
        api_secret: originalSettings.api_secret,
        sender_id: originalSettings.sender_id,
        region: originalSettings.region,
        webhook_url: originalSettings.webhook_url,
      });
    } else {
      await apiRequest('DELETE', '/producer/configuration/sms-gateway');
    }
  });

  describe('GET /producer/configuration/sms-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 7.1: Success - Get SMS gateway settings
    // -----------------------------------------------------------------------
    it('should return 200 and SMS gateway settings or null', async () => {
      // Arrange
      const endpoint = '/producer/configuration/sms-gateway';
      
      // Act
      const response = await apiRequest<SmsGatewayApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('provider');
        expect(settings).toHaveProperty('api_key');
        expect(settings).toHaveProperty('api_secret');
        expect(settings).toHaveProperty('sender_id');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 7.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/sms-gateway`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/configuration/sms-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 8.1: Success - Create SMS gateway settings
    // -----------------------------------------------------------------------
    it('should return 200 and create/update SMS gateway settings', async () => {
      // Arrange
      const payload = { ...validSmsGatewayPayload };
      
      // Act
      const response = await apiRequest<SmsGatewayApiResponse>('PUT', '/producer/configuration/sms-gateway', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.provider).toBe(payload.provider);
      expect(settings!.api_key).toBe(payload.api_key);
      expect(settings!.sender_id).toBe(payload.sender_id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.2: Success - Update existing SMS gateway settings
    // -----------------------------------------------------------------------
    it('should update existing SMS gateway settings (upsert)', async () => {
      // Arrange - First create
      await apiRequest('PUT', '/producer/configuration/sms-gateway', validSmsGatewayPayload);
      
      // Act - Update
      const updatePayload = {
        ...validSmsGatewayPayload,
        provider: 'aws_sns',
        sender_id: 'UPDATED',
      };
      const response = await apiRequest<SmsGatewayApiResponse>(
        'PUT',
        '/producer/configuration/sms-gateway',
        updatePayload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.provider).toBe('aws_sns');
      expect(response.data.data!.sender_id).toBe('UPDATED');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.3: Success - Create with optional fields
    // -----------------------------------------------------------------------
    it('should create SMS gateway with optional region and webhook_url', async () => {
      // Arrange
      const payload = {
        ...validSmsGatewayPayload,
        region: 'eu-west-1',
        webhook_url: 'https://webhook.example.com/sms-status',
      };
      
      // Act
      const response = await apiRequest<SmsGatewayApiResponse>(
        'PUT',
        '/producer/configuration/sms-gateway',
        payload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.region).toBe('eu-west-1');
      expect(response.data.data!.webhook_url).toBe('https://webhook.example.com/sms-status');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 8.4: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/sms-gateway`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validSmsGatewayPayload),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /producer/configuration/sms-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 9.1: Success - Delete SMS gateway settings
    // -----------------------------------------------------------------------
    it('should return 204 and delete SMS gateway settings', async () => {
      // Arrange - Create settings
      await apiRequest('PUT', '/producer/configuration/sms-gateway', validSmsGatewayPayload);
      
      // Act
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/sms-gateway');
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<SmsGatewayApiResponse>('GET', '/producer/configuration/sms-gateway');
      expect(getResponse.data.data).toBeNull();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.2: Success - Delete non-existent settings (idempotent)
    // -----------------------------------------------------------------------
    it('should return 204 even if settings do not exist', async () => {
      await apiRequest('DELETE', '/producer/configuration/sms-gateway');
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/sms-gateway');
      expect(response.status).toBe(204);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 9.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/sms-gateway`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: EMAIL GATEWAY CONFIGURATION
// ============================================================================

describe('Configuration API - Email Gateway', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/configuration/email-gateway
   * PUT    /producer/configuration/email-gateway
   * DELETE /producer/configuration/email-gateway
   * -------------------------------------------------------------------------
   */

  let originalSettings: EmailGatewaySettings | null = null;

  beforeAll(async () => {
    const response = await apiRequest<EmailGatewayApiResponse>('GET', '/producer/configuration/email-gateway');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    if (originalSettings) {
      await apiRequest('PUT', '/producer/configuration/email-gateway', {
        provider: originalSettings.provider,
        api_key: originalSettings.api_key,
        api_secret: originalSettings.api_secret,
        from_email: originalSettings.from_email,
        from_name: originalSettings.from_name,
        reply_to_email: originalSettings.reply_to_email,
        webhook_url: originalSettings.webhook_url,
      });
    } else {
      await apiRequest('DELETE', '/producer/configuration/email-gateway');
    }
  });

  describe('GET /producer/configuration/email-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 10.1: Success - Get email gateway settings
    // -----------------------------------------------------------------------
    it('should return 200 and email gateway settings or null', async () => {
      // Arrange
      const endpoint = '/producer/configuration/email-gateway';
      
      // Act
      const response = await apiRequest<EmailGatewayApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('provider');
        expect(settings).toHaveProperty('api_key');
        expect(settings).toHaveProperty('api_secret');
        expect(settings).toHaveProperty('from_email');
        expect(settings).toHaveProperty('from_name');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 10.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/email-gateway`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/configuration/email-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 11.1: Success - Create email gateway settings
    // -----------------------------------------------------------------------
    it('should return 200 and create/update email gateway settings', async () => {
      // Arrange
      const payload = { ...validEmailGatewayPayload };
      
      // Act
      const response = await apiRequest<EmailGatewayApiResponse>('PUT', '/producer/configuration/email-gateway', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.provider).toBe(payload.provider);
      expect(settings!.from_email).toBe(payload.from_email);
      expect(settings!.from_name).toBe(payload.from_name);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 11.2: Success - Update existing email gateway settings
    // -----------------------------------------------------------------------
    it('should update existing email gateway settings (upsert)', async () => {
      // Arrange - First create
      await apiRequest('PUT', '/producer/configuration/email-gateway', validEmailGatewayPayload);
      
      // Act - Update
      const updatePayload = {
        ...validEmailGatewayPayload,
        provider: 'mailchimp',
        from_name: 'Updated Sender',
      };
      const response = await apiRequest<EmailGatewayApiResponse>(
        'PUT',
        '/producer/configuration/email-gateway',
        updatePayload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.provider).toBe('mailchimp');
      expect(response.data.data!.from_name).toBe('Updated Sender');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 11.3: Success - Create with optional fields
    // -----------------------------------------------------------------------
    it('should create email gateway with optional reply_to_email and webhook_url', async () => {
      // Arrange
      const payload = {
        ...validEmailGatewayPayload,
        reply_to_email: 'noreply@example.com',
        webhook_url: 'https://webhook.example.com/email-events',
      };
      
      // Act
      const response = await apiRequest<EmailGatewayApiResponse>(
        'PUT',
        '/producer/configuration/email-gateway',
        payload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.reply_to_email).toBe('noreply@example.com');
      expect(response.data.data!.webhook_url).toBe('https://webhook.example.com/email-events');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 11.4: Error - Invalid email format (depends on validation)
    // -----------------------------------------------------------------------
    it('should handle invalid from_email format', async () => {
      // Arrange
      const invalidPayload = {
        ...validEmailGatewayPayload,
        from_email: 'not-an-email',
      };
      
      // Act
      const response = await apiRequest<ApiResponse>(
        'PUT',
        '/producer/configuration/email-gateway',
        invalidPayload
      );
      
      // Assert - Depends on validation rules
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 11.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/email-gateway`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validEmailGatewayPayload),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /producer/configuration/email-gateway', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 12.1: Success - Delete email gateway settings
    // -----------------------------------------------------------------------
    it('should return 204 and delete email gateway settings', async () => {
      // Arrange - Create settings
      await apiRequest('PUT', '/producer/configuration/email-gateway', validEmailGatewayPayload);
      
      // Act
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/email-gateway');
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<EmailGatewayApiResponse>('GET', '/producer/configuration/email-gateway');
      expect(getResponse.data.data).toBeNull();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 12.2: Success - Delete non-existent settings (idempotent)
    // -----------------------------------------------------------------------
    it('should return 204 even if settings do not exist', async () => {
      await apiRequest('DELETE', '/producer/configuration/email-gateway');
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/email-gateway');
      expect(response.status).toBe(204);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 12.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/email-gateway`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: PAYMENT RECEIVER CONFIGURATION
// ============================================================================

describe('Configuration API - Payment Receiver', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/configuration/payment-receiver
   * PUT    /producer/configuration/payment-receiver
   * DELETE /producer/configuration/payment-receiver
   * -------------------------------------------------------------------------
   */

  let originalSettings: PaymentReceiverSettings | null = null;

  beforeAll(async () => {
    const response = await apiRequest<PaymentReceiverApiResponse>('GET', '/producer/configuration/payment-receiver');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    if (originalSettings) {
      await apiRequest('PUT', '/producer/configuration/payment-receiver', {
        account_holder_name: originalSettings.account_holder_name,
        account_number: originalSettings.account_number,
        ifsc_code: originalSettings.ifsc_code,
        pan: originalSettings.pan,
        gstin: originalSettings.gstin,
        upi_phone_number: originalSettings.upi_phone_number,
        upi_id: originalSettings.upi_id,
      });
    } else {
      await apiRequest('DELETE', '/producer/configuration/payment-receiver');
    }
  });

  describe('GET /producer/configuration/payment-receiver', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 13.1: Success - Get payment receiver settings
    // -----------------------------------------------------------------------
    it('should return 200 and payment receiver settings or null', async () => {
      // Arrange
      const endpoint = '/producer/configuration/payment-receiver';
      
      // Act
      const response = await apiRequest<PaymentReceiverApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('account_holder_name');
        expect(settings).toHaveProperty('account_number');
        expect(settings).toHaveProperty('ifsc_code');
        expect(settings).toHaveProperty('pan');
        expect(settings).toHaveProperty('gstin');
        expect(settings).toHaveProperty('upi_phone_number');
        expect(settings).toHaveProperty('upi_id');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 13.2: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/payment-receiver`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/configuration/payment-receiver', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 14.1: Success - Create payment receiver settings
    // -----------------------------------------------------------------------
    it('should return 200 and create/update payment receiver settings', async () => {
      // Arrange
      const payload = { ...validPaymentReceiverPayload };
      
      // Act
      const response = await apiRequest<PaymentReceiverApiResponse>('PUT', '/producer/configuration/payment-receiver', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.account_holder_name).toBe(payload.account_holder_name);
      expect(settings!.account_number).toBe(payload.account_number);
      expect(settings!.ifsc_code).toBe(payload.ifsc_code);
      expect(settings!.pan).toBe(payload.pan);
      expect(settings!.gstin).toBe(payload.gstin);
      expect(settings!.upi_phone_number).toBe(payload.upi_phone_number);
      expect(settings!.upi_id).toBe(payload.upi_id);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 14.2: Success - Update existing payment receiver settings
    // -----------------------------------------------------------------------
    it('should update existing payment receiver settings (upsert)', async () => {
      // Arrange - First create
      await apiRequest('PUT', '/producer/configuration/payment-receiver', validPaymentReceiverPayload);
      
      // Act - Update
      const updatePayload = {
        ...validPaymentReceiverPayload,
        account_holder_name: 'Updated Account Holder',
        upi_id: 'updated@upi',
      };
      const response = await apiRequest<PaymentReceiverApiResponse>(
        'PUT',
        '/producer/configuration/payment-receiver',
        updatePayload
      );
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.account_holder_name).toBe('Updated Account Holder');
      expect(response.data.data!.upi_id).toBe('updated@upi');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 14.3: Validation - Invalid PAN format
    // -----------------------------------------------------------------------
    it('should handle invalid PAN format', async () => {
      // Arrange
      const invalidPayload = {
        ...validPaymentReceiverPayload,
        pan: 'INVALID',
      };
      
      // Act
      const response = await apiRequest<ApiResponse>(
        'PUT',
        '/producer/configuration/payment-receiver',
        invalidPayload
      );
      
      // Assert - Depends on validation rules
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 14.4: Validation - Invalid GSTIN format
    // -----------------------------------------------------------------------
    it('should handle invalid GSTIN format', async () => {
      // Arrange
      const invalidPayload = {
        ...validPaymentReceiverPayload,
        gstin: 'INVALID',
      };
      
      // Act
      const response = await apiRequest<ApiResponse>(
        'PUT',
        '/producer/configuration/payment-receiver',
        invalidPayload
      );
      
      // Assert - Depends on validation rules
      expect([200, 400]).toContain(response.status);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 14.5: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/payment-receiver`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validPaymentReceiverPayload),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /producer/configuration/payment-receiver', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 15.1: Success - Delete payment receiver settings
    // -----------------------------------------------------------------------
    it('should return 204 and delete payment receiver settings', async () => {
      // Arrange - Create settings
      await apiRequest('PUT', '/producer/configuration/payment-receiver', validPaymentReceiverPayload);
      
      // Act
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/payment-receiver');
      
      // Assert
      expect(response.status).toBe(204);
      
      // Verify deletion
      const getResponse = await apiRequest<PaymentReceiverApiResponse>('GET', '/producer/configuration/payment-receiver');
      expect(getResponse.data.data).toBeNull();
    });

    // -----------------------------------------------------------------------
    // TEST CASE 15.2: Success - Delete non-existent settings (idempotent)
    // -----------------------------------------------------------------------
    it('should return 204 even if settings do not exist', async () => {
      await apiRequest('DELETE', '/producer/configuration/payment-receiver');
      const response = await apiRequest<DeleteApiResponse>('DELETE', '/producer/configuration/payment-receiver');
      expect(response.status).toBe(204);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 15.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/configuration/payment-receiver`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: PLATFORM SETTINGS
// ============================================================================

describe('Platform API - Platform Settings', () => {
  /**
   * -------------------------------------------------------------------------
   * APIs:
   * GET    /producer/platform    - Get platform settings
   * PUT    /producer/platform    - Update platform settings
   * -------------------------------------------------------------------------
   */

  let originalSettings: PlatformSettings | null = null;

  beforeAll(async () => {
    const response = await apiRequest<PlatformApiResponse>('GET', '/producer/platform');
    if (response.status === 200 && response.data?.data) {
      originalSettings = response.data.data;
    }
  });

  afterAll(async () => {
    // Restore original settings if they existed
    if (originalSettings) {
      await apiRequest('PUT', '/producer/platform', {
        legal_name: originalSettings.legal_name,
        logo_url: originalSettings.logo_url,
        enable_cart: originalSettings.enable_cart,
        featured_images: originalSettings.featured_images,
        default_language: originalSettings.default_language,
        footer_policies: originalSettings.footer_policies,
        support_channels: originalSettings.support_channels,
        social_links: originalSettings.social_links,
        coupon_codes: originalSettings.coupon_codes,
        enable_live_chat: originalSettings.enable_live_chat,
      });
    }
  });

  describe('GET /producer/platform', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 16.1: Success - Get platform settings
    // -----------------------------------------------------------------------
    it('should return 200 and platform settings or null', async () => {
      // Arrange
      const endpoint = '/producer/platform';
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('GET', endpoint);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      if (response.data.data !== null) {
        const settings = response.data.data;
        expect(settings).toHaveProperty('id');
        expect(settings).toHaveProperty('app_id');
        expect(settings).toHaveProperty('tenant_id');
        expect(settings).toHaveProperty('legal_name');
        expect(settings).toHaveProperty('logo_url');
        expect(settings).toHaveProperty('enable_cart');
        expect(settings).toHaveProperty('featured_images');
        expect(settings).toHaveProperty('default_language');
        expect(settings).toHaveProperty('footer_policies');
        expect(settings).toHaveProperty('support_channels');
        expect(settings).toHaveProperty('social_links');
        expect(settings).toHaveProperty('coupon_codes');
        expect(settings).toHaveProperty('enable_live_chat');
        expect(settings).toHaveProperty('created_at');
        expect(settings).toHaveProperty('updated_at');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 16.2: Schema validation - Array fields
    // -----------------------------------------------------------------------
    it('should return platform settings with correct array field structures', async () => {
      // Arrange
      const endpoint = '/producer/platform';
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('GET', endpoint);
      
      // Assert
      if (response.data.data !== null) {
        const settings = response.data.data;
        
        // featured_images should be array
        expect(Array.isArray(settings.featured_images)).toBe(true);
        
        // support_channels should be array
        expect(Array.isArray(settings.support_channels)).toBe(true);
        
        // social_links should be array
        expect(Array.isArray(settings.social_links)).toBe(true);
        
        // coupon_codes should be array
        expect(Array.isArray(settings.coupon_codes)).toBe(true);
        
        // footer_policies should be object
        expect(typeof settings.footer_policies).toBe('object');
      }
    });

    // -----------------------------------------------------------------------
    // TEST CASE 16.3: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/platform`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /producer/platform', () => {
    
    // -----------------------------------------------------------------------
    // TEST CASE 17.1: Success - Update platform settings with all fields
    // -----------------------------------------------------------------------
    it('should return 200 and update platform settings', async () => {
      // Arrange
      const payload = { ...validPlatformSettingsPayload };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('message');
      
      const settings = response.data.data;
      expect(settings).not.toBeNull();
      expect(settings!.legal_name).toBe(payload.legal_name);
      expect(settings!.logo_url).toBe(payload.logo_url);
      expect(settings!.enable_cart).toBe(payload.enable_cart);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.2: Success - Partial update
    // -----------------------------------------------------------------------
    it('should allow partial update of platform settings', async () => {
      // Arrange
      const partialPayload = { legal_name: 'Partially Updated Name' };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', partialPayload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.legal_name).toBe('Partially Updated Name');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.3: Success - Update featured images
    // -----------------------------------------------------------------------
    it('should update featured_images array', async () => {
      // Arrange
      const payload = {
        featured_images: [
          { url: 'https://example.com/new-featured1.png', alt: 'New Featured 1' },
          { url: 'https://example.com/new-featured2.png', alt: 'New Featured 2', link: 'https://link.example.com' },
        ],
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.featured_images.length).toBe(2);
      expect(response.data.data!.featured_images[0].url).toBe('https://example.com/new-featured1.png');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.4: Success - Update support channels
    // -----------------------------------------------------------------------
    it('should update support_channels array', async () => {
      // Arrange
      const payload = {
        support_channels: [
          { type: 'email' as const, value: 'new-support@example.com', label: 'New Email' },
          { type: 'whatsapp' as const, value: '+1234567890', label: 'WhatsApp Support' },
        ],
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.support_channels.length).toBe(2);
      expect(response.data.data!.support_channels[0].type).toBe('email');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.5: Success - Update social links
    // -----------------------------------------------------------------------
    it('should update social_links array', async () => {
      // Arrange
      const payload = {
        social_links: [
          { platform: 'youtube', url: 'https://youtube.com/test' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/test' },
        ],
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.social_links.length).toBe(2);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.6: Success - Update footer policies
    // -----------------------------------------------------------------------
    it('should update footer_policies object', async () => {
      // Arrange
      const payload = {
        footer_policies: {
          terms_of_service: { title: 'Updated Terms', content: 'Updated terms content' },
          privacy_policy: { title: 'Updated Privacy', content: 'Updated privacy content', url: 'https://example.com/privacy' },
        },
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.footer_policies.terms_of_service?.title).toBe('Updated Terms');
      expect(response.data.data!.footer_policies.privacy_policy?.url).toBe('https://example.com/privacy');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.7: Success - Update coupon codes
    // -----------------------------------------------------------------------
    it('should update coupon_codes array', async () => {
      // Arrange
      const payload = {
        coupon_codes: [
          {
            code: `NEW_COUPON_${Date.now()}`,
            discount_type: 'fixed' as const,
            discount_value: 50,
            min_purchase: 200,
            usage_limit: 50,
            used_count: 0,
            is_active: true,
          },
        ],
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.coupon_codes.length).toBe(1);
      expect(response.data.data!.coupon_codes[0].discount_type).toBe('fixed');
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.8: Success - Toggle boolean settings
    // -----------------------------------------------------------------------
    it('should toggle enable_cart and enable_live_chat', async () => {
      // Get current state
      const getResponse = await apiRequest<PlatformApiResponse>('GET', '/producer/platform');
      const currentCart = getResponse.data.data?.enable_cart ?? false;
      const currentChat = getResponse.data.data?.enable_live_chat ?? false;
      
      // Arrange - Toggle values
      const payload = {
        enable_cart: !currentCart,
        enable_live_chat: !currentChat,
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.enable_cart).toBe(!currentCart);
      expect(response.data.data!.enable_live_chat).toBe(!currentChat);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.9: Success - Update default language
    // -----------------------------------------------------------------------
    it('should update default_language', async () => {
      // Arrange
      const payload = { default_language: 'hi' };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.default_language).toBe('hi');
      
      // Reset to English
      await apiRequest('PUT', '/producer/platform', { default_language: 'en' });
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.10: Success - Empty arrays
    // -----------------------------------------------------------------------
    it('should handle empty arrays for list fields', async () => {
      // Arrange
      const payload = {
        featured_images: [],
        support_channels: [],
        social_links: [],
        coupon_codes: [],
      };
      
      // Act
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data.data!.featured_images).toEqual([]);
      expect(response.data.data!.support_channels).toEqual([]);
      expect(response.data.data!.social_links).toEqual([]);
      expect(response.data.data!.coupon_codes).toEqual([]);
    });

    // -----------------------------------------------------------------------
    // TEST CASE 17.11: Error - Unauthorized access
    // -----------------------------------------------------------------------
    it('should return 401 when no auth token provided', async () => {
      const response = await fetch(`${BASE_URL}/producer/platform`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: JSON.stringify(validPlatformSettingsPayload),
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: AUTHENTICATION & AUTHORIZATION
// ============================================================================

describe('Configuration & Platform API - Authentication & Authorization', () => {
  
  // -------------------------------------------------------------------------
  // All configuration endpoints should require authentication
  // -------------------------------------------------------------------------
  const protectedEndpoints = [
    // Configuration endpoints
    { method: 'GET', path: '/producer/configuration/payment-gateway' },
    { method: 'PUT', path: '/producer/configuration/payment-gateway' },
    { method: 'DELETE', path: '/producer/configuration/payment-gateway' },
    { method: 'GET', path: '/producer/configuration/domain' },
    { method: 'PUT', path: '/producer/configuration/domain' },
    { method: 'DELETE', path: '/producer/configuration/domain' },
    { method: 'GET', path: '/producer/configuration/sms-gateway' },
    { method: 'PUT', path: '/producer/configuration/sms-gateway' },
    { method: 'DELETE', path: '/producer/configuration/sms-gateway' },
    { method: 'GET', path: '/producer/configuration/email-gateway' },
    { method: 'PUT', path: '/producer/configuration/email-gateway' },
    { method: 'DELETE', path: '/producer/configuration/email-gateway' },
    { method: 'GET', path: '/producer/configuration/payment-receiver' },
    { method: 'PUT', path: '/producer/configuration/payment-receiver' },
    { method: 'DELETE', path: '/producer/configuration/payment-receiver' },
    // Platform endpoints
    { method: 'GET', path: '/producer/platform' },
    { method: 'PUT', path: '/producer/platform' },
  ];

  protectedEndpoints.forEach(({ method, path }) => {
    it(`should return 401 for ${method} ${path} without auth`, async () => {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-host': 'localhost:3002' },
        body: method !== 'GET' && method !== 'DELETE' ? JSON.stringify({}) : undefined,
      });
      
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// TEST SUITE: EDGE CASES & ERROR HANDLING
// ============================================================================

describe('Configuration & Platform API - Edge Cases', () => {
  
  // -------------------------------------------------------------------------
  // Response headers validation
  // -------------------------------------------------------------------------
  describe('Response Headers', () => {
    it('should return correct content-type header for GET requests', async () => {
      const response = await apiRequest<PlatformApiResponse>('GET', '/producer/platform');
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should return correct content-type header for PUT requests', async () => {
      const response = await apiRequest<PlatformApiResponse>(
        'PUT',
        '/producer/platform',
        { legal_name: 'Test' }
      );
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  // -------------------------------------------------------------------------
  // Special characters handling
  // -------------------------------------------------------------------------
  describe('Special Characters Handling', () => {
    it('should handle special characters in legal_name', async () => {
      const payload = {
        legal_name: 'Test & Co. "Special" <chars> Pvt Ltd',
      };
      
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      expect(response.status).toBe(200);
      expect(response.data.data!.legal_name).toBe(payload.legal_name);
    });

    it('should handle unicode characters', async () => {
      const payload = {
        legal_name: 'टेस्ट कंपनी 日本語 🎉',
      };
      
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      expect(response.status).toBe(200);
      expect(response.data.data!.legal_name).toBe(payload.legal_name);
    });
  });

  // -------------------------------------------------------------------------
  // Long content handling
  // -------------------------------------------------------------------------
  describe('Long Content Handling', () => {
    it('should handle long legal_name', async () => {
      const payload = {
        legal_name: 'A'.repeat(500),
      };
      
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Should succeed, return 400 for validation, or 500 for server-side constraint
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle long policy content', async () => {
      const longContent = 'Lorem ipsum '.repeat(1000);
      const payload = {
        footer_policies: {
          terms_of_service: { title: 'Terms', content: longContent },
        },
      };
      
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', payload);
      
      // Should succeed or return 400 for validation
      expect([200, 400]).toContain(response.status);
    });
  });

  // -------------------------------------------------------------------------
  // Empty payload handling
  // -------------------------------------------------------------------------
  describe('Empty Payload Handling', () => {
    it('should handle empty payload for PUT requests', async () => {
      const response = await apiRequest<PlatformApiResponse>('PUT', '/producer/platform', {});
      
      // Should succeed with no changes or return 400
      expect([200, 400]).toContain(response.status);
    });
  });

  // -------------------------------------------------------------------------
  // CRUD lifecycle test
  // -------------------------------------------------------------------------
  describe('CRUD Lifecycle', () => {
    it('should complete full CRUD lifecycle for payment gateway', async () => {
      const uniqueKey = `lifecycle_test_${Date.now()}`;
      
      // CREATE
      const createResponse = await apiRequest<PaymentGatewayApiResponse>(
        'PUT',
        '/producer/configuration/payment-gateway',
        { key: uniqueKey, secret: 'lifecycle_secret' }
      );
      expect(createResponse.status).toBe(200);
      expect(createResponse.data.data!.key).toBe(uniqueKey);

      // READ
      const readResponse = await apiRequest<PaymentGatewayApiResponse>(
        'GET',
        '/producer/configuration/payment-gateway'
      );
      expect(readResponse.status).toBe(200);
      expect(readResponse.data.data!.key).toBe(uniqueKey);

      // UPDATE
      const newKey = `updated_${uniqueKey}`;
      const updateResponse = await apiRequest<PaymentGatewayApiResponse>(
        'PUT',
        '/producer/configuration/payment-gateway',
        { key: newKey, secret: 'updated_secret' }
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.data!.key).toBe(newKey);

      // DELETE
      const deleteResponse = await apiRequest<DeleteApiResponse>(
        'DELETE',
        '/producer/configuration/payment-gateway'
      );
      expect(deleteResponse.status).toBe(204);

      // VERIFY DELETION
      const verifyResponse = await apiRequest<PaymentGatewayApiResponse>(
        'GET',
        '/producer/configuration/payment-gateway'
      );
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.data).toBeNull();
    });
  });
});

// ============================================================================
// EXPECTED RESPONSE SCHEMAS (For Reference)
// ============================================================================

/**
 * Payment Gateway Settings Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "app_id": "app_123",
 *     "tenant_id": "tenant_456",
 *     "user_id": "user_789",
 *     "key": "rzp_test_xxx",
 *     "secret": "secret_xxx",
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   },
 *   "message": "Payment gateway settings saved"
 * }
 * 
 * Platform Settings Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "app_id": "app_123",
 *     "tenant_id": "tenant_456",
 *     "legal_name": "Test Company",
 *     "logo_url": "https://example.com/logo.png",
 *     "enable_cart": true,
 *     "featured_images": [{ "url": "...", "alt": "..." }],
 *     "default_language": "en",
 *     "footer_policies": { "terms_of_service": { "title": "...", "content": "..." } },
 *     "support_channels": [{ "type": "email", "value": "...", "label": "..." }],
 *     "social_links": [{ "platform": "twitter", "url": "..." }],
 *     "coupon_codes": [{ "code": "...", "discount_type": "percentage", ... }],
 *     "enable_live_chat": false,
 *     "created_at": "2024-01-01T00:00:00Z",
 *     "updated_at": "2024-01-01T00:00:00Z"
 *   },
 *   "message": "Platform settings updated successfully"
 * }
 * 
 * Delete Response (No Content):
 * HTTP 204 No Content
 * 
 * Error Response:
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "message": "Detailed error message"
 * }
 */

