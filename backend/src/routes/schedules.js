import express from 'express';
import { v4 as uuid } from 'uuid';
import { collections, readJson, writeJson } from '../utils/fileDb.js';

const router = express.Router();

router.get('/', (_, res) => {
  res.json(readJson(collections.schedules));
});

router.post('/', (req, res) => {
  const schedules = readJson(collections.schedules);
  const item = { id: uuid(), enabled: true, createdAt: new Date().toISOString(), ...req.body };
  schedules.unshift(item);
  writeJson(collections.schedules, schedules);
  res.json(item);
});

router.put('/:id', (req, res) => {
  const schedules = readJson(collections.schedules);
  const next = schedules.map((s) => (s.id === req.params.id ? { ...s, ...req.body } : s));
  writeJson(collections.schedules, next);
  res.json(next.find((s) => s.id === req.params.id));
});

router.delete('/:id', (req, res) => {
  const schedules = readJson(collections.schedules).filter((s) => s.id !== req.params.id);
  writeJson(collections.schedules, schedules);
  res.json({ ok: true });
});

export default router;
