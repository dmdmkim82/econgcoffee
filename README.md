# Ekong Coffee

SK ecoplant meeting coffee ordering app.

## Structure

- `apps/frontend`: React + Vite client
- `apps/backend`: Express API server
- `shared`: shared meeting/order types

## Commands

- `npm run dev`: run frontend and backend together
- `npm run dev:frontend`: run only the frontend
- `npm run dev:backend`: run only the backend
- `npm run lint`: lint frontend, backend, and shared code
- `npm run build:frontend`: typecheck frontend and build Vite output
- `npm run build:backend`: typecheck backend
- `npm run build`: run both build steps
- `npm run start`: start backend API server

## Environment

Frontend example: [apps/frontend/.env.example](apps/frontend/.env.example)

- `VITE_API_BASE_URL`: optional absolute API base URL

Backend example: [apps/backend/.env.example](apps/backend/.env.example)

- `PORT`: backend port
- `CORS_ORIGIN`: comma-separated allowed frontend origins

## Data

- Backend meeting data is stored in `apps/backend/data/meetings.json`
- Frontend still keeps a local browser cache for offline-safe editing

## Notes

- Frontend and backend are separated so they can be developed and deployed independently.
- Shared order types live in `shared/meeting.ts` so both sides stay in sync.
