import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';

const parser = new Parser();

const nicheKeywords = {
  romance: ['romance scam', 'pig butchering', 'crypto fraud', 'dating app scam'],
  deepfake: ['deepfake scam', 'ai crypto fraud', 'voice clone theft', 'synthetic identity'],
  stats: ['crypto scam statistics', 'fraud losses', 'blockchain crime', 'victim numbers']
};

const feeds = [
  'https://cointelegraph.com/rss',
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://www.reddit.com/r/CryptoCurrency/.rss',
  'https://www.bleepingcomputer.com/feed/',
  'https://feeds.feedburner.com/TheHackersNews'
];

async function scrapeTitles(url, selector) {
  const { data } = await axios.get(url, { timeout: 20000 });
  const $ = cheerio.load(data);
  const out = [];
  $(selector).each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 20) out.push(t);
  });
  return out;
}

export async function fetchTrendingTopics(niche) {
  const topics = new Set();

  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.slice(0, 35).forEach((item) => item.title && topics.add(item.title));
    } catch {
      // no-op
    }
  }

  const scrapers = [
    ['https://trends.google.com/trending?geo=US', 'a'],
    ['https://news.ycombinator.com/', '.titleline a'],
    ['https://www.coindesk.com/', 'h3, h2']
  ];

  for (const [url, selector] of scrapers) {
    try {
      (await scrapeTitles(url, selector)).forEach((x) => topics.add(x));
    } catch {
      // no-op
    }
  }

  const keywords = nicheKeywords[niche] || nicheKeywords.stats;
  const seeded = Array.from(topics).flatMap((topic) => keywords.map((k) => `${k}: ${topic}`));
  while (seeded.length < 50) seeded.push(`${keywords[seeded.length % keywords.length]} breaking case #${seeded.length + 1}`);
  return seeded.slice(0, 90);
}
