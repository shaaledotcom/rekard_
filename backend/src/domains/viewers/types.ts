// Viewers domain types

export type ViewerAccessStatus = 'active' | 'expired' | 'revoked' | 'used';

export const VALID_ACCESS_STATUSES: ViewerAccessStatus[] = ['active', 'expired', 'revoked', 'used'];

// Viewer with access details (joined data)
export type ViewerAccess = {
  id: number;
  app_id: string;
  tenant_id: string;
  user_id: string; // Producer who granted access
  ticket_id: number;
  email: string;
  status: ViewerAccessStatus;
  granted_at: Date;
  expires_at?: Date;
  used_at?: Date;
  // Joined data
  ticket_title?: string;
  viewer_name?: string;
  viewer_user_id?: string; // If viewer has signed up
  has_signed_up: boolean;
};

// Viewer mapping (from tenant mappings)
export type ViewerMapping = {
  id: string;
  viewer_user_id: string;
  tenant_id: string;
  source: string;
  first_order_id?: number;
  status: string;
  created_at: Date;
};

// Combined viewer info
export type Viewer = {
  id: string;
  email: string;
  name?: string;
  user_id?: string;
  has_signed_up: boolean;
  tenant_id: string;
  source: string;
  joined_at: Date;
  ticket_access_count: number;
  last_activity?: Date;
};

// Request types
export type GrantAccessRequest = {
  emails: string[];
  ticket_id?: number; // For backward compatibility
  ticket_ids?: number[]; // New: support multiple tickets
  expires_at?: Date;
  notify?: boolean;
};

export type BulkGrantAccessRequest = {
  ticket_id: number;
  csv_data: string; // CSV content: email,name (optional)
  expires_at?: Date;
  notify?: boolean;
};

export type RevokeAccessRequest = {
  access_id: number;
};

export type UpdateAccessRequest = {
  status?: ViewerAccessStatus;
  expires_at?: Date;
};

// Response types
export type ViewerAccessListResponse = {
  data: ViewerAccess[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ViewerListResponse = {
  data: Viewer[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type GrantAccessResult = {
  success: string[];
  failed: { email: string; reason: string }[];
  total_granted: number;
  total_failed: number;
};

// Filter/Query types
export type ViewerAccessFilter = {
  ticket_id?: number;
  email?: string;
  status?: ViewerAccessStatus;
  has_signed_up?: boolean;
  search?: string;
};

export type ViewerFilter = {
  source?: string;
  search?: string;
  has_ticket_access?: boolean;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

export type SortParams = {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

// CSV parsing result
export type ParsedCSVRow = {
  email: string;
  name?: string;
};

export type CSVParseResult = {
  valid: ParsedCSVRow[];
  invalid: { row: number; data: string; reason: string }[];
};

