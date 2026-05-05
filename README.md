# 🚀 InternFlow

**InternFlow** is a monorepo containing:

- ⚙️ **Express API** — backend for intern management  
- 🌐 **React + Vite Web App** — frontend dashboard  
- 🤖 **AI-assisted candidate evaluation system**

It helps manage:
- Intern referrals  
- Onboarding workflows  
- Candidate evaluation (AI + automation)

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Sai-Dangade777/InternFlow.git
cd InternFlow
npm install
2. Run Development Servers

👉 Open 2 terminals
npm run dev:api   # Backend (nodemon)
npm run dev:web   # Frontend (Vite)

💡 Alternative (run from anywhere)
npm --prefix "D:\path\to\InternFlow" run dev:api
npm --prefix "D:\path\to\InternFlow" run dev:web

3. Build for Production
npm run build

4. Start API (Production)
npm run start -w apps/api

🧰 Prerequisites
Node.js v18+
npm v9+ (or Yarn / pnpm)
MongoDB (local or remote)

Example MongoDB URI:
mongodb://localhost:27017/internflow

Optional:
Claude / OpenAI API keys
n8n (for workflows)

📁 Repository Structure
InternFlow/
│
├── apps/
│   ├── api/        # Express backend
│   └── web/        # React + Vite frontend
│
├── docs/           # Documentation & workflows
├── package.json    # Root workspace config

🔐 Environment Setup
API (apps/api/.env)
cp apps/api/.env.example apps/api/.env

Key variables:
PORT=
MONGODB_URI=
CLAUDE_API_KEY=
CORS_ORIGIN=
N8N_WEBHOOK_SECRET=
DEMO_MODE=
AI_MODE=

Web (apps/web/.env)
cp apps/web/.env.example apps/web/.env

Key variable:
VITE_API_URL=
🧪 Running Locally (Recommended)
1. Start MongoDB (Docker)
docker run -d -p 27017:27017 --name internflow-mongo mongo:6
2. Setup Environment Files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
Edit values as needed.

3. Start Servers
npm run dev:api
npm run dev:web

📜 Available Scripts
npm run dev:api        # Start backend (nodemon)
npm run dev:web        # Start frontend (Vite)
npm run build          # Build frontend
npm run start -w apps/api  # Run backend (production)

🛠 Troubleshooting
❌ ENOENT: Could not read package.json
👉 You are in the wrong directory
cd "D:\InternFlow\InternFlow"
npm run dev:web
npm run dev:api

💡 Alternative
npm --prefix "D:\InternFlow\InternFlow" run dev:web
npm --prefix "D:\InternFlow\InternFlow" run dev:api

❌ CORS Errors
Set:
CORS_ORIGIN
in apps/api/.env

❌ Database Errors
Check MONGODB_URI
Ensure MongoDB is running

❌ Upload Issues
Ensure directory exists:
apps/api/uploads

🤖 AI & Integrations
Requires API keys (CLAUDE_API_KEY, etc.)
n8n integration uses:
N8N_WEBHOOK_SECRET

Modes:
AI_MODE → controls AI behavior
DEMO_MODE → demo/testing mode

🤝 Contributing
Create a branch from main
Make changes
Test locally (API + Web)
Open a PR with clear description

👉 Add tests where applicable:
apps/api/tests
apps/web/tests

🚀 Deployment Notes
Use PM2 / Docker for backend
Serve frontend via static hosting / CDN
Never commit .env files
Use environment/secret managers

🔗 Useful Paths
API Entry → apps/api/src/app.js
API Server → apps/api/src/server.js
DB Config → apps/api/src/config/db.js
Frontend Entry → apps/web/src/main.jsx
