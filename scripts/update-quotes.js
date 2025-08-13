#!/usr/bin/env node

/**
 * Quote Updater Script (API Ninjas)
 * Fetches advice, dad jokes, and quotes from API Ninjas, normalizes them, and writes
 * to data/quotes.json for the quote banner to consume.
 * 
 * Features:
 * - Filters quotes by maximum length during processing (not in browser)
 * - Deduplicates and shuffles results
 * - Graceful fallback to existing quotes on API failure
 * - Configurable limits and timeout
 *
 * Usage:
 *   API_NINJAS_KEY=xxxx ADVICE_LIMIT=20 DADJOKES_LIMIT=20 QUOTES_LIMIT=20 MAX_LENGTH=140 node scripts/update-quotes.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const QUOTES_FILE = path.join(__dirname, '..', 'data', 'quotes.json');
const API_KEY = process.env.API_NINJAS_KEY || 'lD0ZnWbn5+h9fBVTsfpnog==wz6e6diLupIYn9o6'; // TEMPORARY: Replace with your actual key
const ADVICE_LIMIT = Number(process.env.ADVICE_LIMIT || 10);
const DADJOKES_LIMIT = Number(process.env.DADJOKES_LIMIT || 10);
const QUOTES_LIMIT = Number(process.env.QUOTES_LIMIT || 10);
const MAX_LENGTH = Number(process.env.MAX_LENGTH || 140); // Filter quotes by length during processing
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

  // Helper to process and filter quotes by length
  const processQuote = (text, author, category) => {
    const cleanText = String(text).trim();
    const cleanAuthor = String(author || '').trim();
    
    // Filter by length at processing time
    if (cleanText && cleanText.length <= MAX_LENGTH) {
      return { text: cleanText, author: cleanAuthor, category };
    }
    return null;
  };

  // Advice: [{ advice: "..." }]
  if (Array.isArray(advice)) {
    for (const item of advice) {
      const processed = processQuote(item?.advice, '', 'advice');
      if (processed) out.push(processed);
    }
  }

  // Dad jokes: [{ joke: "..." }]
  if (Array.isArray(jokes)) {
    for (const item of jokes) {
      const processed = processQuote(item?.joke, '', 'dadjokes');
      if (processed) out.push(processed);
    }
  }

  // Quotes: [{ quote: "...", author: "..." }]
  if (Array.isArray(quotes)) {
    for (const item of quotes) {
      const processed = processQuote(item?.quote, item?.author, 'quotes');
      if (processed) out.push(processed);
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
    count: quotes.length,
    config: {
      maxLength: MAX_LENGTH,
      limits: {
        advice: ADVICE_LIMIT,
        dadjokes: DADJOKES_LIMIT,
        quotes: QUOTES_LIMIT
      }
    }
  };

  const dir = path.dirname(QUOTES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch multiple items by calling endpoint repeatedly (non-premium: no limit param)
async function fetchMany(baseUrl, desiredCount, category = 'items') {
  const results = [];
  const maxAttempts = Math.max(desiredCount * 3, 10);
  let attempts = 0;
  
  console.log(`📡 Fetching ${desiredCount} ${category}...`);
  
  while (results.length < desiredCount && attempts < maxAttempts) {
    attempts += 1;
    try {
      const data = await fetchJSON(baseUrl);
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      for (const item of arr) {
        results.push(item);
        if (results.length >= desiredCount) break;
      }
      
      // Progress indicator
      if (attempts % 5 === 0) {
        console.log(`   ${category}: ${results.length}/${desiredCount} (attempt ${attempts})`);
      }
    } catch (e) {
      // Ignore individual request errors; continue trying
      if (attempts % 10 === 0) {
        console.log(`   ${category}: retrying after ${attempts} attempts...`);
      }
    }
    await sleep(250);
  }
  
  console.log(`✓ ${category}: collected ${results.length}/${desiredCount}`);
  return results.slice(0, desiredCount);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ Missing API_NINJAS_KEY environment variable.');
    console.log('💡 Get your API key from: https://api.api-ninjas.com/');
    process.exit(1);
  }

  console.log('🔄 Quote Updater Starting...');
  console.log(`📋 Config: MAX_LENGTH=${MAX_LENGTH}, ADVICE=${ADVICE_LIMIT}, DADJOKES=${DADJOKES_LIMIT}, QUOTES=${QUOTES_LIMIT}`);

  const adviceUrl = `https://api.api-ninjas.com/v1/advice`;
  const jokesUrl = `https://api.api-ninjas.com/v1/dadjokes`;
  const quotesUrl = `https://api.api-ninjas.com/v1/quotes`;

  try {
    const [advice, jokes, quotesApi] = await Promise.all([
      fetchMany(adviceUrl, ADVICE_LIMIT, 'advice'),
      fetchMany(jokesUrl, DADJOKES_LIMIT, 'dad jokes'),
      fetchMany(quotesUrl, QUOTES_LIMIT, 'quotes')
    ]);

    console.log('🔄 Processing and filtering quotes...');
    const quotes = normalize(advice, jokes, quotesApi);
    console.log(`📏 After length filtering (≤${MAX_LENGTH} chars): ${quotes.length} quotes`);

    // Merge a small sample of existing quotes (optional)
    const current = readCurrentQuotes();
    const keep = current.filter(q => q.text.length <= MAX_LENGTH).slice(0, Math.min(10, current.length));
    const merged = [...keep, ...quotes];
    
    // Final de-dup and limit
    const seen = new Set();
    const finalQuotes = merged.filter(q => {
      const key = (q.text || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(q.text);
    }).slice(0, 150);

    writeQuotes(finalQuotes, 'api-ninjas advice+dadjokes+quotes');
    console.log(`✅ Successfully wrote ${finalQuotes.length} quotes to ${QUOTES_FILE}`);
    
    // Summary by category
    const categories = finalQuotes.reduce((acc, q) => {
      acc[q.category] = (acc[q.category] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Categories:', categories);
    
  } catch (err) {
    console.error('❌ Failed to fetch from API Ninjas:', err.message);
    console.log('💡 Falling back to existing quotes if available...');
    
    const current = readCurrentQuotes();
    if (current.length) {
      // Apply length filter to existing quotes too
      const filtered = current.filter(q => q.text.length <= MAX_LENGTH);
      writeQuotes(filtered, 'fallback-existing');
      console.log(`📋 Kept ${filtered.length} existing quotes (filtered by length)`);
    } else {
      const defaults = [
        { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'inspiration' },
        { text: 'Life is what happens while you\'re busy making plans.', author: 'John Lennon', category: 'life' },
        { text: 'Believe in the beauty of your dreams.', author: 'Eleanor Roosevelt', category: 'inspiration' }
      ].filter(q => q.text.length <= MAX_LENGTH); // Apply length filter to defaults too
      
      writeQuotes(defaults, 'defaults');
      console.log('📝 Wrote filtered default quotes');
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
