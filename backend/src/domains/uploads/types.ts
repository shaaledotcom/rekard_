// Uploads domain types

export type UploadCategory = 'events' | 'tickets' | 'platform' | 'users' | 'chat';

export type UploadedFile = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
};

export type PresignedUrlRequest = {
  filename: string;
  contentType: string;
  category: UploadCategory;
};

export type PresignedUrlResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
};

export type UploadResult = {
  success: boolean;
  file?: UploadedFile;
  error?: string;
};

export type DeleteResult = {
  success: boolean;
  key: string;
  error?: string;
};

export type BatchDeleteResult = {
  deleted: string[];
  failed: Array<{ key: string; error: string }>;
};

// Allowed MIME types configuration
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  document: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
} as const;

export const ALL_ALLOWED_TYPES: string[] = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.video,
  ...ALLOWED_MIME_TYPES.document,
  ...ALLOWED_MIME_TYPES.audio,
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 5 * 1024 * 1024 * 1024, // 5GB
  document: 25 * 1024 * 1024, // 25MB
  audio: 50 * 1024 * 1024, // 50MB
  default: 10 * 1024 * 1024, // 10MB
} as const;

