import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
export const databaseRoot = fs.existsSync(path.join(cwd, 'database')) ? path.join(cwd, 'database') : path.resolve(cwd, '..', 'database');

export const collections = {
  settings: path.join(databaseRoot, 'settings', 'settings.json'),
  schedules: path.join(databaseRoot, 'schedules', 'schedules.json'),
  history: path.join(databaseRoot, 'history', 'content-history.json'),
  topics: path.join(databaseRoot, 'history', 'topic-history.json'),
  logs: path.join(databaseRoot, 'logs', 'automation-logs.json'),
  usage: path.join(databaseRoot, 'usage', 'key-usage.json'),
  publishedVideos: path.join(databaseRoot, 'history', 'published-videos.json'),
  publishedPosts: path.join(databaseRoot, 'history', 'published-posts.json')
};

const defaults = {
  [collections.settings]: {
    cerebrasKeys: [
      { id: 'cerebras-pre-1', label: 'Cerebras Key 1', value: 'csk-wmkrrnft86yyjndkk5949e3nc9dkhk895xn6dydytm83hj5d', status: 'unknown', lastCheckedAt: null, accountId: '' },
      { id: 'cerebras-pre-2', label: 'Cerebras Key 2', value: 'csk-336txmdh6tyyfn442w23yr9vtf6vdkr6jk8ne38dp98wdwme', status: 'unknown', lastCheckedAt: null, accountId: '' }
    ],
    unrealKeys: [
      { id: 'unreal-pre-1', label: 'Unreal Key 1', value: 'TLyw812I4zEG2PTl9QjrrmLR7DeNmxLqbeIujYkPJFL0YaX6VCxsYv', status: 'unknown', lastCheckedAt: null, accountId: '' },
      { id: 'unreal-pre-2', label: 'Unreal Key 2', value: '4Rz1rvYnFYPhrBZuEV6Hrl1pz2YzlLme35jeuS1r6VUeuEUo3QAg9k', status: 'unknown', lastCheckedAt: null, accountId: '' }
    ],
    cloudflareKeys: [
      { id: 'cloudflare-pre-1', label: 'Cloudflare Token 1', value: '8pXmt0lk3Jtf9noQnxV344oOkmHcrJloCtmGx1nD', status: 'unknown', lastCheckedAt: null, accountId: '' }
    ],
    catboxHash: 'aba80b53fa191e1f8e8baba33',
    pages: []
  },
  [collections.schedules]: [],
  [collections.history]: [],
  [collections.topics]: [],
  [collections.logs]: [],
  [collections.usage]: { cerebras: {}, unreal: {}, cloudflare: {} },
  [collections.publishedVideos]: [],
  [collections.publishedPosts]: []
};

export function ensureDb() {
  Object.entries(defaults).forEach(([file, initial]) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(initial, null, 2));
  });
}

export function readJson(file) {
  ensureDb();
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function writeJson(file, data) {
  ensureDb();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

export function appendJson(file, item, max = 500) {
  const data = readJson(file);
  data.unshift(item);
  writeJson(file, data.slice(0, max));
}
