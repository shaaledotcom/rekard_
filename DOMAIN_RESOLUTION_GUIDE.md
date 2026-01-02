# Domain Resolution Guide

## How Pro Users with Custom Domains are Determined

The system determines if a Pro user has a custom domain by checking the `tenants.primary_domain` field in the database. Here's how it works:

### Database Structure

1. **`tenants` table**:
   - `is_pro` (boolean): Whether the tenant is a Pro user
   - `primary_domain` (varchar, nullable): The custom domain for this tenant (e.g., "events.example.com")
   - If `primary_domain` is `NULL`, the tenant doesn't have a custom domain
   - If `primary_domain` is set, the tenant has a custom domain

2. **Domain Resolution Flow**:
   ```
   Frontend sends: X-Host header → Backend resolves domain → Checks tenants.primary_domain
   ```

## What Frontend Should Send

### For Viewer App (viewers/)

The frontend **automatically** sends the domain in the `X-Host` header:

**Location**: `viewers/src/store/api/baseApi.ts`

```typescript
// Add current domain for tenant resolution
if (typeof window !== "undefined") {
  headers.set("X-Host", window.location.host);
}
```

**What gets sent**:
- `X-Host`: The current domain (e.g., `"watch.rekard.com"` or `"events.example.com"`)
- This is automatically set from `window.location.host`

**Example**:
- If user visits `https://watch.rekard.com` → `X-Host: watch.rekard.com`
- If user visits `https://events.example.com` → `X-Host: events.example.com`

### For Producer Dashboard (frontend/)

The producer dashboard doesn't need to send domain info - it uses session-based tenant resolution.

## Backend Resolution Process

### Step 1: Domain Lookup

**Location**: `backend/src/shared/middleware/tenant.ts` → `tenantMiddleware()` → `extractTenantContext()`

The middleware automatically:
1. Reads `X-Host` header from the request
2. Resolves tenant from domain using `resolveTenantFromDomain()`
3. Sets `req.tenant.fromDomain = true` if resolved from domain
4. Sets `req.tenant.resolvedFrom = 'domain'` if resolved from domain

```typescript
// Backend automatically does this:
const host = req.headers['x-host'] || req.headers.host || '';
const tenant = await tenantService.resolveTenantFromDomain(host);
if (tenant) {
  req.tenant = {
    fromDomain: true,
    resolvedFrom: 'domain',
    tenantId: tenant.tenantId,
    appId: tenant.appId,
    isPro: tenant.is_pro,
    // ...
  };
}
```

### Step 2: Database Query

**Location**: `backend/src/domains/tenant/repository.ts` → `getTenantByDomain()`

```typescript
// Looks up tenant by primary_domain field
const [tenant] = await db
  .select()
  .from(tenants)
  .where(eq(tenants.primaryDomain, domain))
  .limit(1);
```

### Step 3: Determine Custom Domain Status

**Location**: `backend/src/domains/tenant/config.ts` → `getTenantConfigForDomain()`

```typescript
// Check if this is a shared domain (watch.rekard.com, localhost, etc.)
if (isSharedDomain(domain)) {
  // Returns default config (not a custom domain)
  return { is_custom_domain: false, ... };
}

// Try to resolve tenant from custom domain
const tenantInfo = await tenantService.resolveTenantFromDomain(domain);
if (tenantInfo && tenant.is_pro) {
  // This is a Pro user with custom domain
  return { is_custom_domain: true, is_pro: true, ... };
}
```

## How Tickets are Filtered

### On `watch.rekard.com` (Shared Domain)

**Location**: `backend/src/domains/dashboard/repository.ts` → `listAllTicketsForDashboard()`

**Shows**:
- ✅ Free users (non-Pro)
- ✅ Pro users **without** custom domains (`primary_domain IS NULL`)

**Excludes**:
- ❌ Pro users **with** custom domains (`primary_domain IS NOT NULL`)

**Query Logic**:
```typescript
or(
  eq(tenants.isPro, false), // Free users
  and(
    eq(tenants.isPro, true),
    isNull(tenants.primaryDomain) // Pro users without custom domains
  )!
)!
```

### On Custom Domain (e.g., `events.example.com`)

**Location**: `backend/src/domains/dashboard/repository.ts` → `listTicketsForDashboardByDomain()`

**Shows**:
- ✅ Only tickets from that specific tenant (filtered by `appId` and `tenantId`)

## Setting Up a Custom Domain

### For Producers (via API)

1. **Set Domain Settings**:
   ```
   POST /v1/producer/configuration/domain
   {
     "domain": "events.example.com",
     "is_active": true
   }
   ```

2. **Backend Updates**:
   - Creates/updates entry in `domain_settings` table
   - Updates `tenants.primary_domain` field
   - Domain is now active

### For System Administrators

1. **Update `tenants.primary_domain`** directly in database:
   ```sql
   UPDATE tenants 
   SET primary_domain = 'events.example.com' 
   WHERE id = '<tenant-uuid>';
   ```

## Domain Resolution Priority

When a request comes in, the backend checks in this order:

1. **X-Host header** → Resolve tenant from `primary_domain`
2. **X-Tenant-Id header** → Use explicit tenant UUID
3. **Session (authenticated)** → Auto-create/get tenant for producer
4. **Default** → System tenant (for shared domain)

## Important Notes

1. **Frontend doesn't need to do anything special** - it automatically sends `X-Host` header
2. **Domain must match exactly** - The `X-Host` value must match `tenants.primary_domain` exactly
3. **Shared domains are configured** in `SHARED_DOMAINS` env variable (default: `watch.rekard.com`, `localhost:3001`, `localhost`)
4. **Pro status is required** - Only Pro users (`is_pro = true`) can have custom domains
5. **Tickets automatically filter** - Once `primary_domain` is set, tickets won't show on `watch.rekard.com`
6. **Backend checks `req.tenant.fromDomain`** - Routes check `req.tenant.fromDomain === true` and `req.tenant.resolvedFrom === 'domain'` to determine if it's a custom domain request
7. **No manual header setting needed** - The backend automatically resolves from `X-Host` header and sets the tenant context

## Example Flow

### Scenario: Pro user with custom domain `events.example.com`

1. **User visits**: `https://events.example.com`
2. **Frontend sends**: `X-Host: events.example.com` (automatic)
3. **Backend receives**: Request with `X-Host` header
4. **Backend queries**: `SELECT * FROM tenants WHERE primary_domain = 'events.example.com'`
5. **Backend finds**: Tenant with `is_pro = true` and `primary_domain = 'events.example.com'`
6. **Backend returns**: Tenant-specific tickets (only that tenant's tickets)
7. **Dashboard shows**: Only tickets from this Pro user

### Scenario: Free user or Pro without custom domain

1. **User visits**: `https://watch.rekard.com`
2. **Frontend sends**: `X-Host: watch.rekard.com` (automatic)
3. **Backend checks**: `isSharedDomain('watch.rekard.com')` → `true`
4. **Backend returns**: Default config (`is_custom_domain = false`)
5. **Dashboard shows**: All tickets from free users + Pro users without custom domains

