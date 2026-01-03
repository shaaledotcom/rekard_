// Upload routes
import { Router, Response } from 'express';
import { requireSession } from '../../domains/auth/session.js';
import { tenantMiddleware, getTenantContext } from '../../shared/middleware/tenant.js';
import { ok, created, noContent, badRequest } from '../../shared/utils/response.js';
import { asyncHandler } from '../../shared/middleware/error-handler.js';
import { timeoutMiddleware } from '../../shared/middleware/security.js';
import { imageUpload, mediaUpload } from '../../shared/utils/file-upload.js';
import * as uploadsService from '../../domains/uploads/service.js';
import type { UploadCategory, PresignedUrlRequest } from '../../domains/uploads/types.js';
import type { AppRequest } from '../../shared/types/index.js';

const router = Router();

// Apply longer timeout for upload routes (30 minutes for large file uploads)
// This is needed because large video files can take a long time to upload
router.use(timeoutMiddleware(30 * 60 * 1000)); // 30 minutes

// Apply authentication middleware
router.use(requireSession);
router.use(tenantMiddleware);

// Valid upload categories
const VALID_CATEGORIES: UploadCategory[] = ['events', 'tickets', 'platform', 'users', 'chat'];

const isValidCategory = (category: string): category is UploadCategory => {
  return VALID_CATEGORIES.includes(category as UploadCategory);
};

/**
 * POST /v1/uploads/image
 * Upload a single image file
 */
router.post(
  '/image',
  imageUpload.single('file'),
  asyncHandler(async (req: AppRequest, res: Response) => {
    const tenant = getTenantContext(req);
    const category = (req.body.category as string) || 'platform';

    if (!isValidCategory(category)) {
      return badRequest(res, `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (!req.file) {
      return badRequest(res, 'No file provided');
    }

    const result = await uploadsService.uploadFile(req.file, category, tenant.tenantId);

    if (!result.success) {
      return badRequest(res, result.error || 'Upload failed');
    }

    created(res, result.file, 'Image uploaded successfully');
  })
);

/**
 * POST /v1/uploads/images
 * Upload multiple image files (max 10)
 */
router.post(
  '/images',
  imageUpload.array('files', 10),
  asyncHandler(async (req: AppRequest, res: Response) => {
    const tenant = getTenantContext(req);
    const category = (req.body.category as string) || 'platform';

    if (!isValidCategory(category)) {
      return badRequest(res, `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return badRequest(res, 'No files provided');
    }

    const results = await uploadsService.uploadFiles(files, category, tenant.tenantId);

    const successful = results.filter((r) => r.success).map((r) => r.file);
    const failed = results.filter((r) => !r.success).map((r) => r.error);

    created(
      res,
      {
        uploaded: successful,
        failed,
        total: files.length,
        successCount: successful.length,
        failedCount: failed.length,
      },
      `Uploaded ${successful.length} of ${files.length} images`
    );
  })
);

/**
 * POST /v1/uploads/media
 * Upload any allowed media file (images, videos, documents)
 */
router.post(
  '/media',
  mediaUpload.single('file'),
  asyncHandler(async (req: AppRequest, res: Response) => {
    const tenant = getTenantContext(req);
    const category = (req.body.category as string) || 'platform';

    if (!isValidCategory(category)) {
      return badRequest(res, `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (!req.file) {
      return badRequest(res, 'No file provided');
    }

    const result = await uploadsService.uploadFile(req.file, category, tenant.tenantId);

    if (!result.success) {
      return badRequest(res, result.error || 'Upload failed');
    }

    created(res, result.file, 'File uploaded successfully');
  })
);

/**
 * POST /v1/uploads/presigned-url
 * Get a presigned URL for direct upload to S3
 * Useful for large files or client-side uploads
 */
router.post(
  '/presigned-url',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const tenant = getTenantContext(req);
    const { filename, contentType, category, expiresIn } = req.body;

    if (!filename || !contentType) {
      return badRequest(res, 'filename and contentType are required');
    }

    const uploadCategory = (category as UploadCategory) || 'platform';
    if (!isValidCategory(uploadCategory)) {
      return badRequest(res, `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    const request: PresignedUrlRequest = {
      filename,
      contentType,
      category: uploadCategory,
    };

    const result = await uploadsService.getPresignedUploadUrl(
      request,
      tenant.tenantId,
      expiresIn || 3600
    );

    ok(res, result, 'Presigned URL generated successfully');
  })
);

/**
 * POST /v1/uploads/presigned-download
 * Get a presigned URL for downloading a private file
 */
router.post(
  '/presigned-download',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { key, expiresIn } = req.body;

    if (!key) {
      return badRequest(res, 'key is required');
    }

    const downloadUrl = await uploadsService.getPresignedDownloadUrl(key, expiresIn || 3600);

    ok(res, { downloadUrl, key, expiresIn: expiresIn || 3600 }, 'Download URL generated');
  })
);

/**
 * DELETE /v1/uploads/:key
 * Delete a file by its S3 key
 */
router.delete(
  '/:key(*)',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { key } = req.params;

    if (!key) {
      return badRequest(res, 'File key is required');
    }

    const result = await uploadsService.deleteFile(key);

    if (!result.success) {
      return badRequest(res, result.error || 'Delete failed');
    }

    noContent(res);
  })
);

/**
 * POST /v1/uploads/delete
 * Delete a file by URL
 */
router.post(
  '/delete',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return badRequest(res, 'url is required');
    }

    const result = await uploadsService.deleteFileByUrl(url);

    if (!result.success) {
      return badRequest(res, result.error || 'Delete failed');
    }

    ok(res, { deleted: true, key: result.key }, 'File deleted successfully');
  })
);

/**
 * POST /v1/uploads/delete-batch
 * Delete multiple files by keys
 */
router.post(
  '/delete-batch',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return badRequest(res, 'keys array is required');
    }

    if (keys.length > 100) {
      return badRequest(res, 'Maximum 100 files can be deleted at once');
    }

    const result = await uploadsService.deleteFiles(keys);

    ok(
      res,
      {
        deleted: result.deleted,
        failed: result.failed,
        deletedCount: result.deleted.length,
        failedCount: result.failed.length,
      },
      `Deleted ${result.deleted.length} files`
    );
  })
);

/**
 * GET /v1/uploads/exists/:key
 * Check if a file exists
 */
router.get(
  '/exists/:key(*)',
  asyncHandler(async (req: AppRequest, res: Response) => {
    const { key } = req.params;

    if (!key) {
      return badRequest(res, 'File key is required');
    }

    const exists = await uploadsService.fileExists(key);

    ok(res, { exists, key });
  })
);

export const uploadsRoutes: Router = router;

