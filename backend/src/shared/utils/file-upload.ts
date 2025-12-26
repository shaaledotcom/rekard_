import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import { extname } from 'path';

// Allowed MIME types by category
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as string[],
  video: ['video/mp4', 'video/webm', 'video/quicktime'] as string[],
  document: ['application/pdf'] as string[],
};

// All allowed types
const ALL_ALLOWED: string[] = [
  ...ALLOWED_MIME_TYPES.image,
  ...ALLOWED_MIME_TYPES.video,
  ...ALLOWED_MIME_TYPES.document,
];

// Generate unique filename
const generateFilename = (originalname: string): string => {
  const ext = extname(originalname);
  return `${randomUUID()}${ext}`;
};

// File filter factory
const createFileFilter = (allowedTypes: string[]) => {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`File type not allowed: ${file.mimetype}`));
    }
  };
};

// Memory storage for processing before S3 upload
const memoryStorage = multer.memoryStorage();

// Disk storage for local file handling
const createDiskStorage = (uploadPath: string): StorageEngine => {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadPath),
    filename: (_req, file, cb) => cb(null, generateFilename(file.originalname)),
  });
};

// Create upload middleware for images
export const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: createFileFilter(ALLOWED_MIME_TYPES.image),
});

// Create upload middleware for videos
export const videoUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: createFileFilter(ALLOWED_MIME_TYPES.video),
});

// Create upload middleware for mixed media
export const mediaUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: createFileFilter(ALL_ALLOWED),
});

// Create custom upload middleware
export const createUpload = (options: {
  storage?: 'memory' | 'disk';
  uploadPath?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}) => {
  const storage = options.storage === 'disk' && options.uploadPath
    ? createDiskStorage(options.uploadPath)
    : memoryStorage;

  return multer({
    storage,
    limits: { fileSize: options.maxFileSize || 10 * 1024 * 1024 },
    fileFilter: options.allowedTypes
      ? createFileFilter(options.allowedTypes)
      : createFileFilter(ALL_ALLOWED),
  });
};

// Extract files from request by field names
export const extractFiles = (
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  fieldNames: string[]
): Map<string, Express.Multer.File> => {
  const result = new Map<string, Express.Multer.File>();

  if (!files) return result;

  if (Array.isArray(files)) {
    for (const file of files) {
      if (fieldNames.includes(file.fieldname)) {
        result.set(file.fieldname, file);
      }
    }
  } else {
    for (const fieldName of fieldNames) {
      const fieldFiles = files[fieldName];
      if (fieldFiles && fieldFiles.length > 0) {
        result.set(fieldName, fieldFiles[0]);
      }
    }
  }

  return result;
};

