// Uploads service - S3 operations
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { env } from '../../config/env.js';
import { log } from '../../shared/middleware/logger.js';
import { badRequest, internalError } from '../../shared/errors/app-error.js';
import type {
  UploadCategory,
  UploadedFile,
  PresignedUrlRequest,
  PresignedUrlResponse,
  UploadResult,
  DeleteResult,
  BatchDeleteResult,
} from './types.js';
import { ALL_ALLOWED_TYPES, FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from './types.js';

// Initialize S3 client
const createS3Client = (): S3Client => {
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.s3.region || 'us-east-1',
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  };

  // Support custom endpoints (e.g., MinIO, DigitalOcean Spaces, Cloudflare R2)
  if (env.s3.endpoint) {
    config.endpoint = env.s3.endpoint;
    config.forcePathStyle = true; // Required for MinIO and similar services
  }

  return new S3Client(config);
};

// Lazy initialization
let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3Client) {
    if (!env.s3.accessKeyId || !env.s3.secretAccessKey || !env.s3.bucketName) {
      throw internalError('S3 is not configured. Please set S3 environment variables.');
    }
    s3Client = createS3Client();
  }
  return s3Client;
};

// Generate unique file key with organized path structure
const generateFileKey = (
  category: UploadCategory,
  originalFilename: string,
  tenantId?: string
): string => {
  const ext = extname(originalFilename).toLowerCase();
  const uuid = randomUUID();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Structure: category/tenant/year/month/uuid.ext
  const basePath = tenantId
    ? `${category}/${tenantId}/${year}/${month}`
    : `${category}/${year}/${month}`;

  return `${basePath}/${uuid}${ext}`;
};

// Get the public URL for a file
const getPublicUrl = (key: string): string => {
  if (env.s3.endpoint) {
    // Custom endpoint (e.g., CDN, custom domain)
    return `${env.s3.endpoint}/${env.s3.bucketName}/${key}`;
  }
  // Standard S3 URL
  return `https://${env.s3.bucketName}.s3.${env.s3.region}.amazonaws.com/${key}`;
};

// Validate MIME type
const validateMimeType = (mimeType: string): boolean => {
  return ALL_ALLOWED_TYPES.includes(mimeType);
};

// Get file type category from MIME type
const getFileTypeCategory = (mimeType: string): keyof typeof FILE_SIZE_LIMITS => {
  if (ALLOWED_MIME_TYPES.image.includes(mimeType as any)) return 'image';
  if (ALLOWED_MIME_TYPES.video.includes(mimeType as any)) return 'video';
  if (ALLOWED_MIME_TYPES.document.includes(mimeType as any)) return 'document';
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType as any)) return 'audio';
  return 'default';
};

// Upload file to S3
export const uploadFile = async (
  file: Express.Multer.File,
  category: UploadCategory,
  tenantId?: string
): Promise<UploadResult> => {
  try {
    // Validate MIME type
    if (!validateMimeType(file.mimetype)) {
      throw badRequest(`File type not allowed: ${file.mimetype}`);
    }

    // Validate file size
    const typeCategory = getFileTypeCategory(file.mimetype);
    const maxSize = FILE_SIZE_LIMITS[typeCategory];
    if (file.size > maxSize) {
      throw badRequest(
        `File size exceeds limit. Max size for ${typeCategory}: ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    const client = getS3Client();
    const key = generateFileKey(category, file.originalname, tenantId);

    const command = new PutObjectCommand({
      Bucket: env.s3.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        'original-name': encodeURIComponent(file.originalname),
        'uploaded-by': tenantId || 'system',
      },
    });

    await client.send(command);

    const uploadedFile: UploadedFile = {
      key,
      url: getPublicUrl(key),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    log.info(`Uploaded file to S3: ${key}`);
    return { success: true, file: uploadedFile };
  } catch (error) {
    log.error('Failed to upload file to S3', error);
    if (error instanceof Error && 'statusCode' in error) {
      throw error; // Re-throw AppError
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

// Upload multiple files
export const uploadFiles = async (
  files: Express.Multer.File[],
  category: UploadCategory,
  tenantId?: string
): Promise<UploadResult[]> => {
  return Promise.all(files.map((file) => uploadFile(file, category, tenantId)));
};

// Generate presigned URL for direct upload
export const getPresignedUploadUrl = async (
  request: PresignedUrlRequest,
  tenantId?: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<PresignedUrlResponse> => {
  // Validate MIME type
  if (!validateMimeType(request.contentType)) {
    throw badRequest(`File type not allowed: ${request.contentType}`);
  }

  const client = getS3Client();
  const key = generateFileKey(request.category, request.filename, tenantId);

  const command = new PutObjectCommand({
    Bucket: env.s3.bucketName,
    Key: key,
    ContentType: request.contentType,
    Metadata: {
      'original-name': encodeURIComponent(request.filename),
      'uploaded-by': tenantId || 'system',
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  log.info(`Generated presigned upload URL for: ${key}`);

  return {
    uploadUrl,
    key,
    publicUrl: getPublicUrl(key),
    expiresIn,
  };
};

// Generate presigned URL for file download
export const getPresignedDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: env.s3.bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
};

// Check if file exists
export const fileExists = async (key: string): Promise<boolean> => {
  try {
    const client = getS3Client();
    const command = new HeadObjectCommand({
      Bucket: env.s3.bucketName,
      Key: key,
    });
    await client.send(command);
    return true;
  } catch {
    return false;
  }
};

// Delete single file
export const deleteFile = async (key: string): Promise<DeleteResult> => {
  try {
    const client = getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: env.s3.bucketName,
      Key: key,
    });

    await client.send(command);
    log.info(`Deleted file from S3: ${key}`);

    return { success: true, key };
  } catch (error) {
    log.error(`Failed to delete file: ${key}`, error);
    return {
      success: false,
      key,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};

// Delete multiple files
export const deleteFiles = async (keys: string[]): Promise<BatchDeleteResult> => {
  if (keys.length === 0) {
    return { deleted: [], failed: [] };
  }

  try {
    const client = getS3Client();

    const command = new DeleteObjectsCommand({
      Bucket: env.s3.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    });

    const response = await client.send(command);

    const deleted = response.Deleted?.map((d) => d.Key!).filter(Boolean) || [];
    const failed =
      response.Errors?.map((e) => ({
        key: e.Key!,
        error: e.Message || 'Unknown error',
      })) || [];

    log.info(`Batch deleted ${deleted.length} files, ${failed.length} failed`);

    return { deleted, failed };
  } catch (error) {
    log.error('Batch delete failed', error);
    return {
      deleted: [],
      failed: keys.map((key) => ({
        key,
        error: error instanceof Error ? error.message : 'Delete failed',
      })),
    };
  }
};

// Extract key from URL
export const extractKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Handle different URL formats
    if (urlObj.pathname.startsWith('/')) {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    return urlObj.pathname;
  } catch {
    return null;
  }
};

// Delete file by URL
export const deleteFileByUrl = async (url: string): Promise<DeleteResult> => {
  const key = extractKeyFromUrl(url);
  if (!key) {
    return { success: false, key: url, error: 'Invalid URL' };
  }
  return deleteFile(key);
};

