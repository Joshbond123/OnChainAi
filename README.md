# OnChain AI Social Media Automation Platform

Full-stack file-based automation platform for scheduling and publishing AI-driven crypto scam awareness content.

## Stack
- Backend: Node.js + Express + cron jobs.
- Frontend: React + Vite + Tailwind.
- Storage: `database/` JSON files only (no external DB).

## Features
- Schedule video and text/image posts across three niches.
- Real-time topic discovery from public RSS/trend pages (50+ topics).
- Topic deduplication with semantic similarity thresholding.
- API key rotation + failover + per-key usage stats for Cerebras, UnrealSpeech, Cloudflare.
- Facebook page token connection management.
- Dashboard for schedules, publications, key health, and logs.

## Local Run
```bash
npm install
npm run dev
```
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## Render.com Free Hosting
This project is configured for Render using `render.yaml`:
- **Web Service** hosts backend API and serves compiled frontend.
- **Cron Job** runs schedule execution every 5 minutes (`npm run cron`).

### Deploy steps
1. Push this repo to GitHub.
2. In Render, create a new **Blueprint** from the repo (it detects `render.yaml`).
3. Set secrets/environment variables in Render dashboard as needed:
   - `DRY_RUN_AUTOMATION=false` for live publishing.
   - `ENABLE_INLINE_SCHEDULER=false` (recommended on free plan; cron job handles scheduling).
   - Optional provider vars: `CLOUDFLARE_ACCOUNT_ID`.
4. Add API keys and Facebook page tokens in Settings UI after deployment.

### Free plan notes
- Render free services can sleep when idle.
- Persistent disk is limited; this app stores JSON data in `database/` on local disk, so for production reliability attach a persistent disk if available.

### Provider/API notes (2026-ready setup)
- Cerebras integration uses OpenAI-compatible Chat Completions at `https://inference.cerebras.ai/v1/chat/completions` with `gpt-oss-120b` as default model (override via `CEREBRAS_MODEL`).
- UnrealSpeech integration uses `/speech` with MP3 output and randomly rotates voices: Scarlett, Dan, Liv, Will.
- Cloudflare Workers AI integration uses SDXL Lightning for fast vertical scene image generation.
- Key validation is performed when keys are added and can be re-run from the Settings page.

### FFmpeg rendering pipeline
- This app now renders vertical videos by combining scene images + voiceover + animated ASS subtitles.
- Subtitle style is “viral” (bold, high-contrast, scaling pop animation) and burned into video during render.
- `apt.txt` includes `ffmpeg` for Render native builds.


## Render Free Trial Deployment Checklist (Step-by-step)
1. **Push repo to GitHub** (public or private).
2. In Render dashboard, choose **New + → Blueprint** and select this repo.
3. Render auto-detects `render.yaml` and creates:
   - Web Service: `onchain-ai-web`
   - Cron Job: `onchain-ai-scheduler`
4. In web service environment variables, set at minimum:
   - `DRY_RUN_AUTOMATION=true` (safe smoke-test mode), later set `false` for live posting.
   - `ENABLE_INLINE_SCHEDULER=false` (cron job is the scheduler on free plan).
   - Optional: `CEREBRAS_MODEL`, `CLOUDFLARE_ACCOUNT_ID`.
5. Click **Deploy** and wait for successful build/start.
6. Open web service URL and verify:
   - `GET /health` returns `{ "ok": true, ... }`
   - UI loads at `/`.
7. In **Settings UI**, add provider keys and use **validate** for each key before scheduling posts.
8. Create a schedule from UI and trigger **Run** once to confirm end-to-end generation.
9. Enable real publishing by setting `DRY_RUN_AUTOMATION=false` and redeploy.

### Render Free Trial caveats
- Free web services can sleep after inactivity.
- Local file storage can reset on restarts/redeploys unless persistent disk is attached.
- Keep in mind that scheduled jobs run via Render Cron and not continuously in sleeping web process.

## Screenshot/Playwright crash troubleshooting
If you see Chromium `SIGSEGV` in this environment, use **Firefox engine** for screenshots as a fallback.
A working Playwright pattern is:
```python
browser = await p.firefox.launch()
```
This avoids the Chromium headless crash seen in some containers.


## Frontend-not-built bug investigation & hardening
To prevent false `{"error":"Frontend not built"}` on Render or custom run directories, startup now:
- searches multiple frontend dist locations,
- supports explicit `FRONTEND_DIST` override,
- includes `searchedPaths` + `cwd` in the error response for diagnostics,
- and build step now copies frontend artifacts into `backend/public` for reliable serving.


- All API keys are used server-side only (never exposed directly in browser code).
