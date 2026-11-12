# Ample LMS

Learning platform for Ample Semiconductors: VLSI, embedded and Edge AI courses with a trainee dashboard, lesson viewer and admin portal.

React 18 + TypeScript + Vite on the front end, Express REST API with a JSON file store on the back end.

## Run locally
```bash
npm install
npm run dev        # API on :5001, app on :5174
```

## Production
```bash
npm run build      # type-checks, then builds to dist/
npm start          # Express serves dist/ and /api on $PORT (default 5001)
```
Or `docker build -t ample-lms . && docker run -p 5001:5001 ample-lms`. Health check: `GET /healthz`.

Copy `.env.example` to `.env` and set `DEMO_MODE=false` to disable the demo sign-in password.

## Before real users sign up
- Passwords in `server/data/store.json` are stored in plain text for demo purposes. Move to a database with hashed passwords (bcrypt/argon2) and server-side sessions or JWTs.
- Admin endpoints trust the client; add server-side role checks.
- The JSON file store is single-instance only.
