# Ample LMS

Learning platform for Ample Semiconductors: VLSI, embedded and Edge AI courses with a trainee dashboard, lesson viewer and admin portal.

React 18 + TypeScript + Vite on the front end, Express REST API with MongoDB Atlas (or local JSON store fallback) on the back end.

## Run locally
```bash
npm install
npm run dev        # API on :5001, app on :5174
```

## Deploy Full-Stack on Vercel
The repository includes [`vercel.json`](vercel.json) and the serverless entry [`api/index.js`](api/index.js).

In Vercel Project Settings:
- **Framework Preset**: `Vite`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

Set these **Environment Variables** in Vercel:
- `SESSION_SECRET`: long random string (required so sessions survive serverless cold starts)
- `MONGODB_URI`: MongoDB Atlas connection string (`MONGODB_DB` defaults to `ample_lms`)
- `DEMO_MODE`: `"false"` for production
- `APP_URL`: your production URL (e.g. `https://your-app.vercel.app`) for OAuth callbacks

Optional integrations (activate automatically when set):
- **Cloud Images & Videos (Cloudinary)**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **OAuth 2.0**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- **Transactional Email (Brevo)**: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`

## Production (Node / Docker)
```bash
npm run build      # type-checks, then builds to dist/
npm start          # Express serves dist/ and /api on $PORT (default 5001)
```
Or `docker build -t ample-lms . && docker run -p 5001:5001 ample-lms`. Health check: `GET /healthz` or `GET /api/health`.
