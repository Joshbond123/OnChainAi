import express from 'express';
import { collections, readJson } from '../utils/fileDb.js';
import { runPostAutomation, runVideoAutomation, logAutomation } from '../services/aiPipeline.js';

const router = express.Router();

router.get('/dashboard', (_, res) => {
  res.json({
    pages: readJson(collections.settings).pages,
    schedules: readJson(collections.schedules).slice(0, 15),
    recentVideos: readJson(collections.publishedVideos).slice(0, 10),
    recentPosts: readJson(collections.publishedPosts).slice(0, 10),
    logs: readJson(collections.logs).slice(0, 20),
    usage: readJson(collections.usage)
  });
});

router.post('/run/:id', async (req, res) => {
  const schedules = readJson(collections.schedules);
  const schedule = schedules.find((s) => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  try {
    const data = schedule.type === 'video' ? await runVideoAutomation(schedule) : await runPostAutomation(schedule);
    logAutomation({ level: 'info', message: `manual run success`, scheduleId: schedule.id });
    res.json(data);
  } catch (error) {
    logAutomation({ level: 'error', message: error.message, scheduleId: schedule.id });
    res.status(500).json({ error: error.message });
  }
});

export default router;
