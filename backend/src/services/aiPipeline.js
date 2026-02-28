import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { spawnSync } from 'child_process';
import { v4 as uuid } from 'uuid';
import { appendJson, collections, databaseRoot, readJson, writeJson } from '../utils/fileDb.js';
import { isNearDuplicate } from '../utils/similarity.js';
import { fetchTrendingTopics } from './topicDiscovery.js';
import { rotateKey, markKeyResult, getSettings } from './keyRotation.js';
import { catboxUpload, cerebrasChat, cloudflareImage, facebookPhotoPublish, facebookVideoPublish, unrealSpeechTTS } from './providers.js';

const dryRun = process.env.DRY_RUN_AUTOMATION !== 'false';
const mediaRoot = path.join(databaseRoot, 'assets');
const renderDuration = Number(process.env.RENDER_VIDEO_SECONDS || 60);

function ensureMediaRoot() {
  fs.mkdirSync(mediaRoot, { recursive: true });
}

function shellEscapeForFilter(value) {
  return value.replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/,/g, '\\,').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function pickUniqueTopic(candidates) {
  const history = readJson(collections.topics);
  for (let i = 0; i < candidates.length; i += 1) {
    const idx = Math.floor(Math.random() * candidates.length);
    const topic = candidates[idx];
    if (!isNearDuplicate(topic, history)) {
      const row = { id: uuid(), topic, at: new Date().toISOString() };
      appendJson(collections.topics, row, 5000);
      return topic;
    }
  }
  return `New crypto scam pattern detected ${dayjs().format('YYYY-MM-DD HH:mm')}`;
}

function subtitleChunks(script) {
  const words = script.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4).join(' '));
  return chunks;
}

async function withRotatingKey(type, work) {
  const settings = getSettings();
  const listName = `${type}Keys`;
  const keys = settings[listName] || [];
  if (!keys.length) throw new Error(`No ${type} keys configured`);
  for (let i = 0; i < keys.length; i += 1) {
    const key = rotateKey(type);
    try {
      const out = await work(key);
      markKeyResult(type, key.id, true);
      return out;
    } catch {
      markKeyResult(type, key.id, false);
    }
  }
  throw new Error(`All ${type} keys failed`);
}

async function generateScriptWithCerebras(topic, type) {
  const prompt = `Create a 1-minute ${type === 'video' ? 'voiceover script' : 'caption'} about ${topic} for short-form anti-crypto-scam content. Must include: hook in first line, escalating tension, concrete warning signs, and final CTA. Tone: investigative, urgent, authoritative.`;
  const settings = getSettings();
  if (dryRun || !settings.cerebrasKeys.length) {
    return `Hook: Stop scrolling. ${topic} is trapping new victims daily. Tension: scammers exploit trust, urgency, and fake profits. Breakdown: we identified repeat manipulation patterns, staged dashboards, and wallet-drain routes. CTA: report suspicious accounts, warn your friends, and share this to prevent the next victim.`;
  }
  const text = await withRotatingKey('cerebras', (key) => cerebrasChat({ apiKey: key.value, prompt }));
  return text || `Alert on ${topic}. Verify identities, verify wallets, and never send funds based on emotional pressure.`;
}

async function maybeDownload(url, outFile) {
  if (!url) return false;
  const res = await axios.get(url, { responseType: 'stream', timeout: 120000 });
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outFile);
    res.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return true;
}

function ffprobeDuration(filePath) {
  const out = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath], { encoding: 'utf-8' });
  if (out.status !== 0) return null;
  const value = Number((out.stdout || '').trim());
  return Number.isFinite(value) ? value : null;
}

function createSilentAudio(filePath, duration = renderDuration) {
  const out = spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-t', String(duration), '-q:a', '9', '-acodec', 'libmp3lame', filePath]);
  return out.status === 0;
}

async function generateVoiceover(script) {
  ensureMediaRoot();
  const audioFile = path.join(mediaRoot, `${uuid()}-voice.mp3`);
  const settings = getSettings();

  if (dryRun || !settings.unrealKeys.length) {
    createSilentAudio(audioFile, renderDuration);
    return { audioUrl: null, provider: 'dry-run', audioFile, duration: renderDuration };
  }

  const tts = await withRotatingKey('unreal', (key) => unrealSpeechTTS({ apiKey: key.value, text: script }));
  const downloaded = await maybeDownload(tts.audioUrl, audioFile);
  if (!downloaded) createSilentAudio(audioFile, renderDuration);
  const duration = ffprobeDuration(audioFile) || renderDuration;
  return { audioUrl: tts.audioUrl, provider: 'unrealspeech', voice: tts.voice, audioFile, duration };
}

function writeViralAss(subtitles, duration, outPath) {
  const lineDur = Math.max(duration / Math.max(subtitles.length, 1), 1.2);
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Viral,Arial Black,74,&H00FFFFFF,&H0000FFFF,&H00000000,&H32000000,1,0,0,0,100,100,0,0,1,4,0,2,60,60,260,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
`;

  const assTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = (s % 60).toFixed(2);
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(5, '0')}`;
  };

  const events = subtitles.map((line, idx) => {
    const start = idx * lineDur;
    const end = Math.min((idx + 1) * lineDur + 0.2, duration);
    const text = `{\\an2\\bord6\\shad0\\3c&H000000&\\c&HFFFFFF&\\t(0,240,\\fscx114\\fscy114)\\t(240,500,\\fscx100\\fscy100)}${line.toUpperCase()}`;
    return `Dialogue: 0,${assTime(start)},${assTime(end)},Viral,,0,0,0,,${text}`;
  }).join('\n');

  fs.writeFileSync(outPath, `${header}${events}\n`);
}

function createScenePlaceholderImage(i) {
  ensureMediaRoot();
  const out = path.join(mediaRoot, `${uuid()}-scene-${i + 1}.jpg`);
  const color = ['#0f172a', '#1e1b4b', '#111827', '#3f1d2e'][i % 4];
  spawnSync('ffmpeg', ['-y', '-f', 'lavfi', '-i', `color=${color}:s=1080x1920:d=1`, '-frames:v', '1', out]);
  return out;
}

async function generateImages(script) {
  const settings = getSettings();
  const scenes = subtitleChunks(script).slice(0, 10);

  if (dryRun || !settings.cloudflareKeys.length) {
    return scenes.map((line, i) => ({ index: i + 1, prompt: `cinematic realistic no text ${line}`, localPath: createScenePlaceholderImage(i), url: null }));
  }

  const firstKey = settings.cloudflareKeys[0];
  const accountId = firstKey.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  return Promise.all(
    scenes.map(async (line, i) => {
      try {
        const result = await withRotatingKey('cloudflare', (key) => cloudflareImage({ accountId, apiKey: key.value, prompt: `Cinematic, realistic, no text. ${line}` }));
        const base64 = result?.result?.image;
        const outPath = path.join(mediaRoot, `${uuid()}-scene-${i + 1}.jpg`);
        if (base64) fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
        else fs.copyFileSync(createScenePlaceholderImage(i), outPath);
        return { index: i + 1, prompt: line, localPath: outPath, url: null };
      } catch {
        return { index: i + 1, prompt: line, localPath: createScenePlaceholderImage(i), url: null };
      }
    })
  );
}

function renderVideoWithFfmpeg({ images, audioFile, subtitles, outFile, duration }) {
  const safeImages = images.length ? images : [{ localPath: createScenePlaceholderImage(0) }];
  const inputs = [];
  const filterParts = [];

  safeImages.forEach((img, idx) => {
    inputs.push('-loop', '1', '-t', String(duration), '-i', img.localPath);
    filterParts.push(`[${idx}:v]scale=1080:1920,format=yuv420p,zoompan=z='min(zoom+0.0008,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1080x1920,setsar=1[v${idx}]`);
  });

  const chain = safeImages.map((_, i) => `[v${i}]`).join('');
  filterParts.push(`${chain}concat=n=${safeImages.length}:v=1:a=0[vcat]`);

  const assPath = path.join(mediaRoot, `${uuid()}.ass`);
  writeViralAss(subtitles, duration, assPath);
  filterParts.push(`[vcat]trim=duration=${duration},setpts=PTS-STARTPTS,ass='${shellEscapeForFilter(assPath)}'[vout]`);

  const cmd = ['-y', ...inputs, '-i', audioFile, '-filter_complex', filterParts.join(';'), '-map', '[vout]', '-map', `${safeImages.length}:a`, '-t', String(duration), '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-shortest', outFile];
  const out = spawnSync('ffmpeg', cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return out.status === 0;
}

async function uploadAndPublishVideo({ schedule, script, localVideoPath }) {
  const settings = getSettings();
  const page = settings.pages.find((p) => p.id === schedule.pageId);
  if (!page) throw new Error('Selected Facebook page not found');

  let videoUrl = null;
  if (!dryRun && settings.catboxHash) videoUrl = await catboxUpload({ hash: settings.catboxHash, filePath: localVideoPath });

  if (!dryRun && videoUrl) {
    const fb = await facebookVideoPublish({ pageId: page.graphPageId || page.id, pageToken: page.token, videoUrl, description: script });
    return { videoUrl, facebookPostId: fb.id || null };
  }

  return {
    videoUrl: `https://files.catbox.moe/${Math.random().toString(36).slice(2, 8)}.mp4`,
    facebookPostId: `fb_${Math.random().toString(36).slice(2, 10)}`
  };
}

async function publishTextImage({ schedule, caption, imagePath }) {
  const settings = getSettings();
  const page = settings.pages.find((p) => p.id === schedule.pageId);
  if (!page) throw new Error('Selected Facebook page not found');

  if (!dryRun && imagePath) {
    const catboxUrl = settings.catboxHash ? await catboxUpload({ hash: settings.catboxHash, filePath: imagePath }) : null;
    if (catboxUrl) {
      const fb = await facebookPhotoPublish({ pageId: page.graphPageId || page.id, pageToken: page.token, imageUrl: catboxUrl, caption });
      return { facebookPostId: fb.post_id || fb.id || null, imageUrl: catboxUrl };
    }
  }
  return { facebookPostId: `fb_${Math.random().toString(36).slice(2, 10)}`, imageUrl: null };
}

export async function runVideoAutomation(schedule) {
  const candidates = await fetchTrendingTopics(schedule.niche);
  const topic = pickUniqueTopic(candidates);
  const script = await generateScriptWithCerebras(topic, 'video');
  const subtitles = subtitleChunks(script);
  const voiceover = await generateVoiceover(script);
  const images = await generateImages(script);

  ensureMediaRoot();
  const localVideoPath = path.join(mediaRoot, `${uuid()}.mp4`);
  const duration = Math.max(voiceover.duration || renderDuration, 12);
  renderVideoWithFfmpeg({ images, audioFile: voiceover.audioFile, subtitles, outFile: localVideoPath, duration });
  const publish = await uploadAndPublishVideo({ schedule, script, localVideoPath });

  const result = {
    id: uuid(),
    type: 'video',
    status: 'published',
    publishedAt: new Date().toISOString(),
    scheduleId: schedule.id,
    niche: schedule.niche,
    pageId: schedule.pageId,
    topic,
    script,
    voiceover,
    images,
    subtitles,
    localVideoPath,
    catboxUrl: publish.videoUrl,
    facebookPostId: publish.facebookPostId
  };
  appendJson(collections.publishedVideos, result, 300);
  appendJson(collections.history, result, 3000);
  return result;
}

export async function runPostAutomation(schedule) {
  const candidates = await fetchTrendingTopics(schedule.niche);
  const topic = pickUniqueTopic(candidates);
  const caption = await generateScriptWithCerebras(topic, 'post');
  const images = await generateImages(caption);
  const publish = await publishTextImage({ schedule, caption, imagePath: images?.[0]?.localPath });

  const result = {
    id: uuid(),
    type: 'post',
    status: 'published',
    publishedAt: new Date().toISOString(),
    scheduleId: schedule.id,
    niche: schedule.niche,
    pageId: schedule.pageId,
    topic,
    caption,
    hashtags: '#CryptoScam #FraudAlert #StaySafe',
    image: images[0],
    imageUrl: publish.imageUrl,
    facebookPostId: publish.facebookPostId
  };
  appendJson(collections.publishedPosts, result, 300);
  appendJson(collections.history, result, 3000);
  return result;
}

export function logAutomation(event) {
  appendJson(collections.logs, { id: uuid(), at: new Date().toISOString(), ...event }, 3000);
}

export function updateScheduleRun(scheduleId) {
  const schedules = readJson(collections.schedules);
  const next = schedules.map((s) => (s.id === scheduleId ? { ...s, lastRunAt: new Date().toISOString() } : s));
  writeJson(collections.schedules, next);
}
