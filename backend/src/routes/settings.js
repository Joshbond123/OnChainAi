import express from 'express';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { collections, readJson, writeJson } from '../utils/fileDb.js';
import { validateCerebrasKey, validateCloudflareKey, validateUnrealKey } from '../services/providers.js';

const router = express.Router();

async function validateKeyByType(type, body) {
  try {
    if (type === 'cerebras') return await validateCerebrasKey(body.value);
    if (type === 'unreal') return await validateUnrealKey(body.value);
    if (type === 'cloudflare') return await validateCloudflareKey({ accountId: body.accountId, apiKey: body.value });
  } catch {
    return false;
  }
  return false;
}

router.get('/', (_, res) => {
  res.json({ settings: readJson(collections.settings), usage: readJson(collections.usage) });
});

router.put('/', (req, res) => {
  const current = readJson(collections.settings);
  const next = { ...current, ...req.body };
  writeJson(collections.settings, next);
  res.json(next);
});

router.post('/keys/:type', async (req, res) => {
  const { type } = req.params;
  const settings = readJson(collections.settings);
  const target = `${type}Keys`;
  if (!settings[target]) return res.status(400).json({ error: 'Invalid key type' });

  const valid = await validateKeyByType(type, req.body);
  const key = {
    id: uuid(),
    label: req.body.label || `${type}-${Date.now()}`,
    value: req.body.value,
    accountId: req.body.accountId || '',
    status: valid ? 'valid' : 'invalid',
    lastCheckedAt: new Date().toISOString()
  };
  settings[target].push(key);
  writeJson(collections.settings, settings);
  res.json(key);
});

router.put('/keys/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const settings = readJson(collections.settings);
  const target = `${type}Keys`;
  if (!settings[target]) return res.status(400).json({ error: 'Invalid key type' });

  const key = settings[target].find((k) => k.id === id);
  if (!key) return res.status(404).json({ error: 'Key not found' });

  key.label = req.body.label ?? key.label;
  key.value = req.body.value ?? key.value;
  key.accountId = req.body.accountId ?? key.accountId;
  const valid = await validateKeyByType(type, key);
  key.status = valid ? 'valid' : 'invalid';
  key.lastCheckedAt = new Date().toISOString();

  writeJson(collections.settings, settings);
  res.json(key);
});

router.post('/keys/:type/:id/validate', async (req, res) => {
  const { type, id } = req.params;
  const settings = readJson(collections.settings);
  const target = `${type}Keys`;
  if (!settings[target]) return res.status(400).json({ error: 'Invalid key type' });

  const keys = settings[target];
  const key = keys.find((k) => k.id === id);
  if (!key) return res.status(404).json({ error: 'Key not found' });

  const valid = await validateKeyByType(type, key);
  key.status = valid ? 'valid' : 'invalid';
  key.lastCheckedAt = new Date().toISOString();
  writeJson(collections.settings, settings);
  res.json({ ok: true, status: key.status, lastCheckedAt: key.lastCheckedAt });
});

router.delete('/keys/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const settings = readJson(collections.settings);
  const target = `${type}Keys`;
  settings[target] = settings[target].filter((k) => k.id !== id);
  writeJson(collections.settings, settings);
  res.json({ ok: true });
});

router.post('/pages/connect', async (req, res) => {
  const { token } = req.body;
  const settings = readJson(collections.settings);

  let page = null;
  try {
    const { data } = await axios.get('https://graph.facebook.com/v20.0/me/accounts', { params: { access_token: token }, timeout: 20000 });
    const first = data?.data?.[0];
    page = {
      id: uuid(),
      graphPageId: first?.id || '',
      name: first?.name || `Connected Page ${settings.pages.length + 1}`,
      token,
      status: first ? 'valid' : 'expired'
    };
  } catch {
    page = {
      id: uuid(),
      graphPageId: '',
      name: `Connected Page ${settings.pages.length + 1}`,
      token,
      status: 'expired'
    };
  }

  settings.pages.push(page);
  writeJson(collections.settings, settings);
  res.json(page);
});

router.delete('/pages/:id', (req, res) => {
  const settings = readJson(collections.settings);
  settings.pages = settings.pages.filter((p) => p.id !== req.params.id);
  writeJson(collections.settings, settings);
  res.json({ ok: true });
});

export default router;
