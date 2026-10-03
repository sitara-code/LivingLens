# Living Lens

This repository contains the Living Lens zoo-monitoring frontend and the Zoo Sentinel backend.

- Frontend: repository root. Install dependencies with `npm install`, run locally with `npm run dev`, and build with `npm run build`.
- Backend: `backend/`. Install its dependencies separately with `cd backend && npm install`; run with `npm run dev`.
- Optional ML API: `backend/ml/`. Follow `backend/ml/README.md` to run it separately.

Configure environment variables from the corresponding `.env.example` files before running services. The backend runtime database and uploaded media are intentionally excluded from Git.
