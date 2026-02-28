import { collections, readJson, writeJson } from '../utils/fileDb.js';

export function getSettings() {
  return readJson(collections.settings);
}

export function rotateKey(type) {
  const settings = getSettings();
  const usage = readJson(collections.usage);
  const map = { cerebras: settings.cerebrasKeys, unreal: settings.unrealKeys, cloudflare: settings.cloudflareKeys };
  const keys = map[type] || [];
  if (!keys.length) throw new Error(`No ${type} keys configured`);

  usage._cursor = usage._cursor || {};
  const nextIndex = (usage._cursor[type] ?? -1) + 1;
  const idx = nextIndex % keys.length;
  usage._cursor[type] = idx;

  const key = keys[idx];
  usage[type][key.id] = usage[type][key.id] || { used: 0, success: 0, failure: 0 };
  usage[type][key.id].used += 1;
  writeJson(collections.usage, usage);
  return key;
}

export function markKeyResult(type, keyId, success = true) {
  const usage = readJson(collections.usage);
  usage[type][keyId] = usage[type][keyId] || { used: 0, success: 0, failure: 0 };
  usage[type][keyId][success ? 'success' : 'failure'] += 1;
  writeJson(collections.usage, usage);
}
