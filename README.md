# Rekard

A full-stack event ticketing platform.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Redux Toolkit
- **Viewers**: Next.js 15, React 19, Tailwind CSS (viewer-facing app)
- **Backend**: Node.js, TypeScript, Hono, Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Payments**: Razorpay
- **Storage**: S3-compatible (AWS S3, MinIO, Cloudflare R2, etc.)

## Project Structure

```
├── backend/          # API server (port 9999)
├── frontend/         # Producer dashboard (port 3000)
├── viewers/          # Viewer-facing app (port 3001)
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- pnpm
- Docker (for containerized deployment)
- PostgreSQL database (or Supabase)
- S3-compatible storage bucket

---

## Local Development

### Backend

```bash
cd backend
pnpm install
cp env.example .env
# Edit .env with your values
pnpm dev
```

### Frontend (Producer Dashboard)

```bash
cd frontend
pnpm install
cp env.example .env.local
# Edit .env.local with your values
pnpm dev
```

### Viewers (Viewer App)

```bash
cd viewers
pnpm install
cp env.example .env.local
# Edit .env.local with your values
pnpm dev
```

---

## Docker Deployment (Individual Services)

### 1. Backend

#### Build

```bash
docker build -t rekard-backend ./backend
```

#### Run

```bash
docker run -d \
  --name rekard-backend \
  -p 9999:9999 \
  -e NODE_ENV=production \
  -e PORT=9999 \
  -e HOST=0.0.0.0 \
  -e BASE_URL=https://api.yourdomain.com \
  -e DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres \
  -e DB_HOST=db.YOUR_PROJECT.supabase.co \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=YOUR_PASSWORD \
  -e DB_DATABASE=postgres \
  -e DB_SSL_MODE=require \
  -e DB_POOL_MIN=2 \
  -e DB_POOL_MAX=10 \
  -e SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  -e SUPABASE_ANON_KEY=your-supabase-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key \
  -e CORS_ALLOWED_ORIGINS=https://producer.yourdomain.com,https://viewer.yourdomain.com \
  -e CORS_ALLOW_CREDENTIALS=true \
  -e CORS_MAX_AGE=300 \
  -e S3_REGION=us-east-1 \
  -e S3_BUCKET_NAME=your-bucket-name \
  -e S3_ACCESS_KEY_ID=your-s3-access-key \
  -e S3_SECRET_ACCESS_KEY=your-s3-secret-key \
  -e S3_ENDPOINT= \
  -e RAZORPAY_KEY_ID=rzp_live_your_key \
  -e RAZORPAY_KEY_SECRET=your-razorpay-secret \
  -e RAZORPAY_WEBHOOK_SECRET=your-webhook-secret \
  -e SECURITY_TOKEN_SECRET_KEY=your-32-char-random-secret-key \
  -e SECURITY_TOKEN_TTL_HOURS=24 \
  -e REDIS_HOST=localhost \
  -e REDIS_PORT=6379 \
  -e REDIS_PASSWORD= \
  -e REDIS_DB=0 \
  -e DEFAULT_EMAIL=live@rekard.com \
  -e SMTP_PASSWORD= \
  -e SUPPORT_EMAIL=support@rekard.com \
  -e SUPPORT_PHONE= \
  --restart unless-stopped \
  rekard-backend
```

---

### 2. Frontend (Producer Dashboard)

> **Note**: Next.js `NEXT_PUBLIC_*` variables are embedded at build time, so they must be passed as build args.

#### Build

```bash
docker build -t rekard-frontend ./frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key \
  --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key
```

#### Run

```bash
docker run -d \
  --name rekard-frontend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  rekard-frontend
```

---

### 3. Viewers (Viewer App)

> **Note**: Next.js `NEXT_PUBLIC_*` variables are embedded at build time, so they must be passed as build args.

#### Build

```bash
docker build -t rekard-viewers ./viewers \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Run

```bash
docker run -d \
  --name rekard-viewers \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  --restart unless-stopped \
  rekard-viewers
```

---

## Docker Compose (All Services)

For running all services together:

```bash
# Create .env file in root directory with all variables
cp .env.example .env
# Edit .env with your values

docker-compose up -d
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `9999` |
| `HOST` | Server host | `0.0.0.0` |
| `BASE_URL` | Public API URL | `https://api.yourdomain.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@host:5432/db` |
| `DB_HOST` | Database host | `db.xxx.supabase.co` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your-password` |
| `DB_DATABASE` | Database name | `postgres` |
| `DB_SSL_MODE` | SSL mode | `require` or `disable` |
| `DB_POOL_MIN` | Min pool connections | `2` |
| `DB_POOL_MAX` | Max pool connections | `10` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `https://app.com,https://viewer.com` |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials | `true` |
| `CORS_MAX_AGE` | CORS max age seconds | `300` |
| `S3_REGION` | S3 region | `us-east-1` |
| `S3_BUCKET_NAME` | S3 bucket name | `rekard-uploads` |
| `S3_ACCESS_KEY_ID` | S3 access key | `AKIA...` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `xxx` |
| `S3_ENDPOINT` | Custom S3 endpoint (optional) | `https://r2.cloudflarestorage.com` |
| `RAZORPAY_KEY_ID` | Razorpay key ID | `rzp_live_xxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `xxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | `xxx` |
| `SECURITY_TOKEN_SECRET_KEY` | JWT secret (32+ chars) | `random-32-char-string` |
| `SECURITY_TOKEN_TTL_HOURS` | Token TTL in hours | `24` |
| `REDIS_HOST` | Redis host (optional) | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `` |
| `REDIS_DB` | Redis database | `0` |
| `DEFAULT_EMAIL` | Default sender email | `live@rekard.com` |
| `SMTP_PASSWORD` | SMTP password | `xxx` |
| `SUPPORT_EMAIL` | Support email | `support@rekard.com` |
| `SUPPORT_PHONE` | Support phone | `+1234567890` |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID (public) | `rzp_live_xxx` |

### Viewers (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |

---

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend | 9999 | API server |
| Frontend | 3000 | Producer dashboard |
| Viewers | 3001 | Viewer-facing app |

---

## Health Checks

- **Backend**: `GET /api/health`
- **Frontend**: `GET /` (returns 200)
- **Viewers**: `GET /` (returns 200)

---

## Quick Copy-Paste Templates

### Backend Environment File (.env)

```env
# Server
NODE_ENV=production
PORT=9999
HOST=0.0.0.0
BASE_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
DB_HOST=db.YOUR_PROJECT.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_DATABASE=postgres
DB_SSL_MODE=require
DB_POOL_MIN=2
DB_POOL_MAX=10

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# CORS
CORS_ALLOWED_ORIGINS=https://producer.yourdomain.com,https://viewer.yourdomain.com
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=300

# S3 Storage
S3_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key
S3_ENDPOINT=

# Razorpay
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Security
SECURITY_TOKEN_SECRET_KEY=your-32-char-random-secret-key
SECURITY_TOKEN_TTL_HOURS=24

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email
DEFAULT_EMAIL=live@rekard.com
SMTP_PASSWORD=
SUPPORT_EMAIL=support@rekard.com
SUPPORT_PHONE=
```

### Frontend Environment File (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key
```

### Viewers Environment File (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
