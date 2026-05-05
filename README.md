Intern Flow
Intern Flow is a monorepo containing an Express API and a React + Vite web app for managing intern referrals, onboarding, and AI-assisted candidate evaluation.

Quick Start
Clone the repo and install:
git clone <repo-url>
cd InternFlow
npm install

Run development servers (open two terminals):
npm run dev:api   # API with nodemon
npm run dev:web   # Web (Vite)

Alternative (run from anywhere using --prefix):
npm --prefix "D:\path\to\InternFlow" run dev:api
npm --prefix "D:\path\to\InternFlow" run dev:web

Build web for production:
npm run build

Start API (production):
npm run start -w apps/api

Prerequisites
Node.js v18+ and npm v9+ (or Yarn/pnpm)
MongoDB (local or remote). Example URI: mongodb://localhost:27017/internflow
Optional: AI provider keys (Claude/OpenAI) and n8n for workflows
Repository Layout
Root workspace scripts: package.json
API: apps/api — Express server, controllers, models, services
Web: apps/web — React + Vite SPA
Docs: docs/ — workflows and auxiliary docs
Environment
API env example: apps/api/.env.example
Key vars: PORT, MONGODB_URI, CLAUDE_API_KEY, CORS_ORIGIN, N8N_WEBHOOK_SECRET, DEMO_MODE, AI_MODE
Web env example: apps/web/.env.example
Key var: VITE_API_URL

Running Locally (recommended)
1.Start MongoDB (local or Docker):
docker run -d -p 27017:27017 --name internflow-mongo mongo:6

2. Copy env examples and edit:
cp apps\api\.env.example apps\api\.env
cp apps\web\.env.example apps\web\.env
# then edit values as needed

3.Start dev servers:
npm run dev:api
npm run dev:web

Common Scripts
npm run dev:api — start API with nodemon
npm run dev:web — start Vite dev server
npm run build — build web for production
npm run start -w apps/api — run API in production mode

Troubleshooting
ENOENT: Could not read package.json
Cause: running npm run from the wrong directory. Fix:
cd "D:\InternFlow\InternFlow"
npm run dev:web
npm run dev:api

Or run with --prefix:
npm --prefix "D:\InternFlow\InternFlow" run dev:web
npm --prefix "D:\InternFlow\InternFlow" run dev:api

CORS errors: set CORS_ORIGIN in apps/api/.env
DB errors: confirm MONGODB_URI and MongoDB availability
Uploads: ensure apps/api/uploads exists and is writable

AI & Integrations
AI features require provider API keys set in the API env (CLAUDE_API_KEY or similar).
n8n webhook integration uses N8N_WEBHOOK_SECRET.
Toggle AI behavior via AI_MODE and DEMO_MODE in apps/api/.env.

Contributing
Branch from main, implement changes, run both servers locally, open a PR with a clear description.
Add tests under apps/api/tests and apps/web/tests where applicable.

Deployment Notes
Use a process manager (e.g., pm2) or Docker for the API.
Serve apps/web build via static host or CDN.
Keep secrets in environment/secret manager; never commit .env files.

Useful Links
API entry: apps/api/src/app.js
API server: apps/api/src/server.js
DB config: apps/api/src/config/db.js
Frontend entry: apps/web/src/main.jsx

