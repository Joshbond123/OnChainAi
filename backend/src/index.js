import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import settingsRoutes from './routes/settings.js';
import schedulesRoutes from './routes/schedules.js';
import automationRoutes from './routes/automation.js';
import { ensureDb } from './utils/fileDb.js';
import { startScheduler } from './jobs/scheduler.js';

ensureDb();
if (process.env.ENABLE_INLINE_SCHEDULER === 'true') startScheduler();

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.get('/health', (_, res) => res.json({ ok: true, scheduler: process.env.ENABLE_INLINE_SCHEDULER === 'true' }));
app.use('/api/settings', settingsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/automation', automationRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distCandidates = [
  process.env.FRONTEND_DIST,
  path.resolve(process.cwd(), 'frontend', 'dist'),
  path.resolve(process.cwd(), '..', 'frontend', 'dist'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(__dirname, '..', 'public')
].filter(Boolean);

const frontendDist = distCandidates.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('*', (_, res) => res.sendFile(path.join(frontendDist, 'index.html')));
} else {
  app.get('/', (_, res) => {
    res.status(503).json({
      error: 'Frontend not built',
      hint: 'Run `npm run build` before starting the web service in production.',
      searchedPaths: distCandidates,
      cwd: process.cwd()
    });
  });
}

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
