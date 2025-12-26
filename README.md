# Rekard

A full-stack event ticketing platform.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (optional)

### Installation

```bash
# Backend
cd backend
pnpm install
cp env.example .env
pnpm dev

# Frontend
cd frontend
pnpm install
cp env.example .env.local
pnpm dev
```

### Docker

```bash
docker-compose up
```

## Project Structure

```
├── backend/     # API server
├── frontend/    # Next.js app
└── docker-compose.yml
```

