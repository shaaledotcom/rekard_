import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../../../deploy/.env.dev') });

const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

const getEnvInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

const getEnvArray = (key: string, defaultValue: string[]): string[] => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.split(',').map((s) => s.trim());
};

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isDev: getEnv('NODE_ENV', 'development') === 'development',
  isProd: getEnv('NODE_ENV', 'development') === 'production',

  server: {
    port: getEnvInt('PORT', 9999),
    host: getEnv('HOST', '0.0.0.0'),
    baseUrl: getEnv('BASE_URL', ''),
  },

  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvInt('DB_PORT', 5432),
    username: getEnv('DB_USERNAME', ''),
    password: getEnv('DB_PASSWORD', ''),
    database: getEnv('DB_DATABASE', ''),
    sslMode: getEnv('DB_SSL_MODE', 'disable'),
    poolMin: getEnvInt('DB_POOL_MIN', 2),
    poolMax: getEnvInt('DB_POOL_MAX', 10),
  },

  supabase: {
    url: getEnv('SUPABASE_URL', ''),
    anonKey: getEnv('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY', ''),
    dbPassword: getEnv('SUPABASE_DB_PASSWORD', ''),
    dbHost: getEnv('SUPABASE_DB_HOST', ''),
    dbPort: getEnvInt('SUPABASE_DB_PORT', 5432),
  },

  cors: {
    allowedOrigins: getEnvArray('CORS_ALLOWED_ORIGINS', ['http://localhost:3000']),
    allowCredentials: getEnvBool('CORS_ALLOW_CREDENTIALS', true),
    maxAge: getEnvInt('CORS_MAX_AGE', 300),
  },

  s3: {
    region: getEnv('S3_REGION', ''),
    bucketName: getEnv('S3_BUCKET_NAME', ''),
    accessKeyId: getEnv('S3_ACCESS_KEY_ID', ''),
    secretAccessKey: getEnv('S3_SECRET_ACCESS_KEY', ''),
    endpoint: getEnv('S3_ENDPOINT', ''),
  },

  razorpay: {
    keyId: getEnv('RAZORPAY_KEY_ID', ''),
    keySecret: getEnv('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: getEnv('RAZORPAY_WEBHOOK_SECRET', ''),
  },

  security: {
    tokenSecretKey: getEnv('SECURITY_TOKEN_SECRET_KEY', 'change-in-production'),
    tokenTtlHours: getEnvInt('SECURITY_TOKEN_TTL_HOURS', 24),
    adminApiKey: getEnv('ADMIN_API_KEY', ''),
  },

  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvInt('REDIS_PORT', 6379),
    password: getEnv('REDIS_PASSWORD', ''),
    db: getEnvInt('REDIS_DB', 0),
  },

  email: {
    defaultEmail: getEnv('DEFAULT_EMAIL', 'live@rekard.com'),
    smtpPassword: getEnv('SMTP_PASSWORD', ''),
    supportEmail: getEnv('SUPPORT_EMAIL', 'live@rekard.com'),
    supportPhone: getEnv('SUPPORT_PHONE', ''),
    resendApiKey: getEnv('RESEND_API_KEY', ''),
    fromEmail: getEnv('EMAIL_FROM', 'noreply@rekard.com'),
    fromName: getEnv('EMAIL_FROM_NAME', 'Rekard'),
  },

  // Default platform settings for shared domain (watch.rekard.com)
  platform: {
    defaultLegalName: getEnv('DEFAULT_LEGAL_NAME', 'Rekard Media Pvt Ltd'),
    defaultLogoUrl: getEnv('DEFAULT_LOGO_URL', '/rekard_logo.png'),
    defaultSupportEmail: getEnv('DEFAULT_SUPPORT_EMAIL', 'support@rekard.com'),
    sharedDomains: getEnvArray('SHARED_DOMAINS', ['watch.rekard.com', 'localhost:3001', 'localhost']),
    defaultTermsUrl: getEnv('DEFAULT_TERMS_URL', '/terms'),
    defaultPrivacyUrl: getEnv('DEFAULT_PRIVACY_URL', '/privacy'),
    defaultRefundUrl: getEnv('DEFAULT_REFUND_URL', '/refund'),
  },
} as const;

export type Env = typeof env;

