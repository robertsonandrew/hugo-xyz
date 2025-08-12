#!/usr/bin/env node

/**
 * Quote Updater Script (API Ninjas)
 * Fetches advice, dad jokes, and quotes from API Ninjas, normalizes them, and writes
 * to data/quotes.json for the quote banner to consume.
 *
 * Usage:
 *   API_NINJAS_KEY=xxxx ADVICE_LIMIT=20 DADJOKES_LIMIT=20 QUOTES_LIMIT=20 node scripts/update-quotes.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const QUOTES_FILE = path.join(__dirname, '..', 'data', 'quotes.json');
const API_KEY = process.env.API_NINJAS_KEY || '';
const ADVICE_LIMIT = Number(process.env.ADVICE_LIMIT || 10);
const DADJOKES_LIMIT = Number(process.env.DADJOKES_LIMIT || 10);
const QUOTES_LIMIT = Number(process.env.QUOTES_LIMIT || 10);
const REQUEST_TIMEOUT_MS = 10000;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage} for ${url}: ${data.slice(0, 200)}`));
          }
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function normalize(advice = [], jokes = [], quotes = []) {
  const out = [];

  // Advice: [{ advice: "..." }]
  if (Array.isArray(advice)) {
    for (const item of advice) {
      const text = (item && item.advice && String(item.advice).trim()) || '';
      // For advice, do not provide an author so it won't render in the banner
      if (text) out.push({ text, author: '', category: 'advice' });
    }
  }

  // Dad jokes: [{ joke: "..." }]
  if (Array.isArray(jokes)) {
    for (const item of jokes) {
      const text = (item && item.joke && String(item.joke).trim()) || '';
      // For dad jokes, do not provide an author so it won't render in the banner
      if (text) out.push({ text, author: '', category: 'dadjokes' });
    }
  }

  // Quotes: [{ quote: "...", author: "..." }]
  if (Array.isArray(quotes)) {
    for (const item of quotes) {
      const text = (item && item.quote && String(item.quote).trim()) || '';
      const author = (item && item.author && String(item.author).trim()) || '';
      if (text) out.push({ text, author, category: 'quotes' });
    }
  }

  // De-duplicate by normalized text
  const seen = new Set();
  const deduped = out.filter((q) => {
    const key = q.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Shuffle lightly for variety
  for (let i = deduped.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
  }

  return deduped;
}

function readCurrentQuotes() {
  try {
    if (fs.existsSync(QUOTES_FILE)) {
      const content = fs.readFileSync(QUOTES_FILE, 'utf8');
      const parsed = JSON.parse(content);
      return parsed.quotes || [];
    }
  } catch (error) {
    console.warn('Could not read current quotes file:', error.message);
  }
  return [];
}

function writeQuotes(quotes, sourceLabel) {
  const payload = {
    quotes,
    lastUpdated: new Date().toISOString(),
    source: sourceLabel,
    count: quotes.length
  };

  const dir = path.dirname(QUOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch multiple items by calling endpoint repeatedly (non-premium: no limit param)
async function fetchMany(baseUrl, desiredCount) {
  const results = [];
  const maxAttempts = Math.max(desiredCount * 3, 10);
  let attempts = 0;
  while (results.length < desiredCount && attempts < maxAttempts) {
    attempts += 1;
    try {
      const data = await fetchJSON(baseUrl);
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      for (const item of arr) {
        results.push(item);
        if (results.length >= desiredCount) break;
      }
    } catch (e) {
      // Ignore individual request errors; continue trying
    }
    await sleep(250);
  }
  return results.slice(0, desiredCount);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ Missing API_NINJAS_KEY environment variable.');
    process.exit(1);
  }

  console.log('🔄 Fetching advice and dad jokes from API Ninjas...');

  const adviceUrl = `https://api.api-ninjas.com/v1/advice`;
  const jokesUrl = `https://api.api-ninjas.com/v1/dadjokes`;
  const quotesUrl = `https://api.api-ninjas.com/v1/quotes`;

  try {
    const [advice, jokes, quotesApi] = await Promise.all([
      fetchMany(adviceUrl, ADVICE_LIMIT),
      fetchMany(jokesUrl, DADJOKES_LIMIT),
      fetchMany(quotesUrl, QUOTES_LIMIT)
    ]);

    const quotes = normalize(advice, jokes, quotesApi);

    // Merge a small sample of existing quotes (optional)
    const current = readCurrentQuotes();
    const keep = current.slice(0, Math.min(10, current.length));
    const merged = [...keep, ...quotes];
    // Final de-dup
    const seen = new Set();
    const finalQuotes = merged.filter(q => {
      const key = (q.text || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(q.text);
    }).slice(0, 150);

  writeQuotes(finalQuotes, 'api-ninjas advice+dadjokes+quotes');
    console.log(`✅ Wrote ${finalQuotes.length} quotes to ${QUOTES_FILE}`);
  } catch (err) {
    console.error('❌ Failed to fetch from API Ninjas:', err.message);
    console.log('💡 Falling back to existing quotes if available...');
    const current = readCurrentQuotes();
    if (current.length) {
      writeQuotes(current, 'fallback-existing');
      console.log(`📋 Kept existing ${current.length} quotes`);
    } else {
      const defaults = [
        { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'inspiration' },
        { text: 'Life is what happens to you while you\'re busy making other plans.', author: 'John Lennon', category: 'life' },
        { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'inspiration' }
      ];
  writeQuotes(defaults, 'defaults');
  console.log('📝 Wrote default quotes');
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { main };
