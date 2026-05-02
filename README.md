# Intern Flow

AI-powered internship management system.

## Setup

- Install Node.js (includes npm)
- From the project root, install dependencies for each app

```powershell
Set-Location .
npm install -w apps/web
npm install -w apps/api
```

## Develop

- Run the API in one terminal
- Run the web app in another terminal

```powershell
Set-Location .
npm run dev:api
```

```powershell
Set-Location .
npm run dev:web
```

## Environment

Create environment files based on the examples:

- `apps/api/.env.example`
- `apps/web/.env.example`
