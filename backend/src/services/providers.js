import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';
const UNREAL_VOICES = ['Scarlett', 'Dan', 'Liv', 'Will'];

export async function cerebrasChat({ apiKey, prompt }) {
  const body = {
    model: CEREBRAS_MODEL,
    messages: [
      { role: 'system', content: 'You create viral short-form anti-scam social content.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.8
  };
  const { data } = await axios.post('https://inference.cerebras.ai/v1/chat/completions', body, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 45000
  });
  return data?.choices?.[0]?.message?.content?.trim();
}

export async function validateCerebrasKey(apiKey) {
  const { status } = await axios.post('https://inference.cerebras.ai/v1/chat/completions', {
    model: CEREBRAS_MODEL,
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 5
  }, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 20000,
    validateStatus: () => true
  });
  return status >= 200 && status < 300;
}

export async function unrealSpeechTTS({ apiKey, text }) {
  const voice = UNREAL_VOICES[Math.floor(Math.random() * UNREAL_VOICES.length)];
  const { data } = await axios.post(
    'https://api.v8.unrealspeech.com/speech',
    { Text: text.slice(0, 3000), VoiceId: voice, Bitrate: '192k', Speed: 0, Format: 'mp3' },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 45000 }
  );
  return { audioUrl: data?.OutputUri || data?.output_uri || null, voice };
}

export async function validateUnrealKey(apiKey) {
  const { status } = await axios.post(
    'https://api.v8.unrealspeech.com/speech',
    { Text: 'Key check', VoiceId: 'Dan', Bitrate: '192k', Speed: 0, Format: 'mp3' },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 20000, validateStatus: () => true }
  );
  return status >= 200 && status < 300;
}

export async function cloudflareImage({ accountId, apiKey, prompt }) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`;
  const { data } = await axios.post(
    endpoint,
    { prompt, width: 1080, height: 1920, num_steps: 6 },
    { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 60000 }
  );
  return data;
}

export async function validateCloudflareKey({ accountId, apiKey }) {
  if (!accountId) return false;
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
  const { status } = await axios.post(endpoint, { prompt: 'ping' }, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 20000,
    validateStatus: () => true
  });
  return status >= 200 && status < 300;
}

export async function catboxUpload({ hash, filePath }) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  if (hash) form.append('userhash', hash);
  form.append('fileToUpload', fs.createReadStream(filePath));
  const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    timeout: 120000
  });
  return String(data).trim();
}

export async function facebookVideoPublish({ pageId, pageToken, videoUrl, description }) {
  const { data } = await axios.post(`https://graph.facebook.com/v20.0/${pageId}/videos`, null, {
    params: { file_url: videoUrl, description, access_token: pageToken },
    timeout: 45000
  });
  return data;
}

export async function facebookPhotoPublish({ pageId, pageToken, imageUrl, caption }) {
  const { data } = await axios.post(`https://graph.facebook.com/v20.0/${pageId}/photos`, null, {
    params: { url: imageUrl, caption, access_token: pageToken },
    timeout: 45000
  });
  return data;
}
