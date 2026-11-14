# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used across the **Backend**, **Frontend**, and **AI Services** in Niraksh-Guardian.

---

## ⚡ Quick Start: Minimum Variables for Local Development

To run the application locally without third-party integrations (e.g. AWS SES, Cloudinary, Gemini API), you only need the following minimum variables:

### 1. Backend (`backend/.env`)
```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/niraksh_guardian?schema=public"
JWT_SECRET=local_dev_jwt_secret_min32chars_for_testing
JWT_REFRESH_SECRET=local_dev_refresh_secret_min32chars_for_testing
```
*Note: Redis is optional locally; if disconnected, the backend runs in degraded mode without caching.*

### 2. Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. AI Services (`ai-services/.env` or defaults)
```env
OLLAMA_API_URL=http://localhost:11434/api/generate
LOCAL_MODEL=medgemma1.5
```

---

## 🔐 Public vs. Server-Only Variables

Security and data privacy are paramount in healthcare systems. Understanding variable visibility prevents accidental credential leaks:

| Scope | Prefix / Location | Visibility | Security Guidelines |
|---|---|---|---|
| **Public (Browser)** | `NEXT_PUBLIC_*` in `frontend/` | Inlined into client-side JS bundles at build time. Visible to anyone in browser DevTools. | **NEVER** store private keys, secrets, database credentials, or tokens in `NEXT_PUBLIC_` variables. Only use for public client endpoints, client IDs, and public API keys. |
| **Server-Only (Frontend)** | No prefix in `frontend/` (e.g., `GOOGLE_SITE_VERIFICATION`) | Accessible only in Server Components, Route Handlers, and `getServerSideProps`. Never sent to the browser. | Safe for server-side build steps or search engine verification tags. |
| **Server-Only (Backend)** | `process.env.*` in `backend/` | Stored exclusively on the Node.js/Express host runtime. | **Always confidential.** Never return raw secrets in API responses or log sensitive credential strings. |
| **Server-Only (AI Services)** | `os.getenv(*)` in `ai-services/` | Stored exclusively on the FastAPI/Python host runtime. | Used for local Ollama endpoints and internal model parameters. |

---

## 📂 Configuration Files

Each service contains an `.env.example` template with safe mock values:

- [Backend `.env.example`](./backend/.env.example) → Copy to `backend/.env`
- [Frontend `.env.example`](./frontend/.env.example) → Copy to `frontend/.env.local`
- [AI Services `.env.example`](./ai-services/.env.example) → Copy to `ai-services/.env` (optional)

> [!IMPORTANT]
> Real credential files (`.env`, `.env.local`, `.env.production`) are listed in `.gitignore` and **must never be committed** to version control. Always use synthetic values for testing.

---

## 📋 Master Environment Variables Table

### 1. Backend (`backend/`)

Validated at startup via Zod in [`backend/src/config/env.ts`](./backend/src/config/env.ts).

| Variable | Status | Default / Fallback | Safe Local Example | Visibility | Purpose & Behavior |
|---|---|---|---|---|---|
| `PORT` | Optional | `4000` (code fallback: `5000`) | `4000` | Server-only | Port on which the Express HTTP server listens. |
| `NODE_ENV` | Optional | `development` | `development` | Server-only | Runtime mode (`development`, `production`, `test`). Affects Helmet CSP, logging, and error details. |
| `DATABASE_URL` | **Required** | *None* | `postgresql://user:password@localhost:5432/niraksh_guardian?schema=public` | Server-only (Secret) | Primary PostgreSQL connection string used by Prisma ORM for queries, connections, and migrations. |
| `DIRECT_DATABASE_URL` | Optional | Falls back to `DATABASE_URL` | `postgresql://user:password@localhost:5432/niraksh_guardian?schema=public` | Server-only (Secret) | Direct PostgreSQL connection string required when `DATABASE_URL` uses Prisma Accelerate or connection pooling proxies for migrations. |
| `REDIS_URL` | Optional | `redis://localhost:6379` | `redis://localhost:6379` | Server-only | Redis connection URL for caching, rate limiting stores, and real-time pub/sub. If unavailable, server continues in degraded mode. |
| `TOKEN_BLACKLIST_FAIL_MODE` | Optional | `open` | `open` | Server-only | Fallback strategy when Redis check fails during token invalidation: `open` allows requests (prioritizing uptime), `closed` rejects (prioritizing strict security). |
| `JWT_SECRET` | **Required** | *None* | `local_dev_jwt_secret_min32chars_for_testing` | Server-only (Secret) | HMAC secret key used to sign and verify short-lived access JWT tokens. Must be a secure string. |
| `JWT_REFRESH_SECRET` | **Required** | *None* | `local_dev_refresh_secret_min32chars_for_testing` | Server-only (Secret) | HMAC secret key used to sign and verify long-lived refresh JWT tokens. |
| `GOOGLE_CLIENT_ID` | Optional | `undefined` | `local-google-client-id.apps.googleusercontent.com` | Server-only | Google OAuth 2.0 client ID used by the backend to verify incoming Google ID tokens for social login. |
| `GOOGLE_CLIENT_SECRET` | Optional | `undefined` | `local_google_client_secret` | Server-only (Secret) | Google OAuth 2.0 client secret used in authorization code exchange flows. |
| `GEMINI_API_KEY` | Optional | `undefined` | `synthetic_gemini_api_key` | Server-only (Secret) | Google Gemini / GenAI API key for medical document analysis, prescription parsing, and AI chat. |
| `GEMINI_MODEL_NAME` | Optional | `gemini-3.1-flash-lite` | `gemini-3.1-flash-lite` | Server-only | Name of the Gemini model used for GenAI calls. |
| `FRONTEND_URL` | Optional | `http://localhost:3000` | `http://localhost:3000` | Server-only | Base URL of the frontend application, used to construct email verification and password reset links. |
| `CORS_ORIGINS` | Optional | `http://localhost:3000,http://localhost:5173,https://niraksh.bhemu.in,https://niraksh.vercel.app` | `http://localhost:3000` | Server-only | Comma-separated list of allowed browser origins for CORS requests. |
| `SENDER_EMAIL` | Optional | `undefined` | `verify@example.com` | Server-only | Verified sender email address used for AWS SES transactional emails. |
| `AWS_REGION` | Optional | `ap-south-1` | `ap-south-1` | Server-only | AWS region for AWS SES client initialization. |
| `AWS_ACCESS_KEY_ID` | Optional | `undefined` | `synthetic_aws_access_key` | Server-only (Secret) | AWS IAM access key ID with SES sending permissions. |
| `AWS_SECRET_ACCESS_KEY` | Optional | `undefined` | `synthetic_aws_secret_key` | Server-only (Secret) | AWS IAM secret access key for SES authentication. |
| `CLOUDINARY_CLOUD_NAME` | Optional | `undefined` | `synthetic_cloud_name` | Server-only | Cloudinary account name for prescription and lab report asset storage. |
| `CLOUDINARY_API_KEY` | Optional | `undefined` | `synthetic_cloudinary_key` | Server-only (Secret) | Cloudinary API key for uploading medical attachments. |
| `CLOUDINARY_API_SECRET` | Optional | `undefined` | `synthetic_cloudinary_secret` | Server-only (Secret) | Cloudinary API secret for signing uploads. |

---

### 2. Frontend (`frontend/`)

Configured in `frontend/.env.local`. Variables with `NEXT_PUBLIC_` are exposed to the browser.

| Variable | Status | Default / Fallback | Safe Local Example | Visibility | Purpose & Behavior |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Optional | `""` (relative paths) | `http://localhost:4000` | **Public (Browser)** | Base URL for backend API requests (used by SWR fetchers, auth clients, and chat streaming). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | `""` | `local-google-client-id.apps.googleusercontent.com` | **Public (Browser)** | Google OAuth 2.0 client ID for `@react-oauth/google` sign-in buttons. If omitted, Google sign-in is disabled. |
| `NEXT_PUBLIC_CSC_API_KEY` | Optional | `""` (falls back to built-in Indian states/cities) | `synthetic_csc_api_key` | **Public (Browser)** | CountryStateCity API key for dynamic location lookups in doctor discovery and user profile. |
| `NEXT_PUBLIC_SITE_URL` | Optional | `https://niraksh.bhemu.in` | `http://localhost:3000` | **Public (Browser)** | Canonical web application origin used for metadata, OpenGraph tags, and SEO tags. |
| `GOOGLE_SITE_VERIFICATION` | Optional | `undefined` | `synthetic_google_verification_code` | Server-only | Google Search Console site verification code injected into HTML `<head>` tags. |

---

### 3. AI Services (`ai-services/`)

Configured in `ai-services/.env` or runtime environment.

| Variable | Status | Default / Fallback | Safe Local Example | Visibility | Purpose & Behavior |
|---|---|---|---|---|---|
| `OLLAMA_API_URL` | Optional | `http://localhost:11434/api/generate` | `http://localhost:11434/api/generate` | Server-only | Endpoint URL of the local Ollama LLM server. |
| `LOCAL_MODEL` | Optional | `medgemma1.5` | `medgemma1.5` | Server-only | Name of the local medical LLM pulled in Ollama. |
| `PORT` | Optional | `8000` | `8000` | Server-only | Port on which the FastAPI/Uvicorn service runs (`uvicorn main:app --port 8000`). |

---

## 🚨 How Missing or Invalid Configuration is Reported

### Backend Zod Validation
The backend validates environment variables at launch via `envSchema.parse(process.env)` in [`backend/src/config/env.ts`](./backend/src/config/env.ts).
- If any required variable (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`) is missing or has an invalid type, the process **immediately aborts** with a detailed `ZodError` showing the missing key:
  ```text
  ZodError: [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["DATABASE_URL"],
      "message": "Required"
    }
  ]
  ```
- If optional cloud services (Gemini, Cloudinary, AWS SES) are unconfigured, the backend starts normally, and individual features gracefully reject requests requiring those credentials with clear controller errors.

### Frontend Next.js Graceful Fallback
- If `NEXT_PUBLIC_API_URL` is omitted, API calls use relative paths (`/api/...`), which work when frontend and backend share an origin or reverse proxy.
- If `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is omitted, Google login buttons render disabled or hidden.
- If `NEXT_PUBLIC_CSC_API_KEY` is omitted, the application falls back to a curated internal list of Indian states and cities without throwing errors.

### AI Service Diagnostics
- If Ollama is not running at `OLLAMA_API_URL`, the service responds with HTTP `503 Service Unavailable` and a retryable JSON payload:
  ```json
  {
    "error": "Ollama service unavailable",
    "code": "OLLAMA_UNAVAILABLE",
    "retryable": true
  }
  ```

---

## 🛡️ Safe Setup Checklist for Contributors

1. Never commit `.env`, `.env.local`, or files containing real secrets.
2. Confirm your `.gitignore` contains:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```
3. Use strong, random, synthetic strings for local secrets (e.g. `openssl rand -hex 32`).
4. In pull requests and issue discussions, replace sensitive tokens, database passwords, and user IDs with placeholder tokens (e.g. `user:password`, `synthetic_key_here`).
