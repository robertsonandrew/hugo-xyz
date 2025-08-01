#!/usr/bin/env node

/**
 * Quote Updater Script
 * Updates the static quotes.json file with fresh quotes from quotable.io
 * Run with: node scripts/update-quotes.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const QUOTES_FILE = path.join(__dirname, '..', 'data', 'quotes.json');
const API_URL = 'https://zenquotes.io/api/quotes'; // Fetch 50 quotes from ZenQuotes

/**
 * Fetch quotes from the API
 */
function fetchQuotes() {
  return new Promise((resolve, reject) => {
    const request = https.get(API_URL, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const quotes = parsed.map(quote => ({
              text: quote.q,
              author: quote.a
            }));
            resolve(quotes);
          } else {
            reject(new Error('Invalid API response format'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Read current quotes file
 */
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

/**
 * Write quotes to file
 */
function writeQuotes(quotes) {
  const quotesData = {
    quotes: quotes,
    lastUpdated: new Date().toISOString(),
    source: "zenquotes.io API",
    count: quotes.length
  };
  
  // Create directory if it doesn't exist
  const dir = path.dirname(QUOTES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotesData, null, 2));
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Updating quotes from zenquotes.io...');
  
  try {
    // Try to fetch fresh quotes
    const freshQuotes = await fetchQuotes();
    console.log(`✅ Fetched ${freshQuotes.length} fresh quotes from API`);
    
    // Keep some existing quotes and add fresh ones
    const currentQuotes = readCurrentQuotes();
    const keepCount = Math.min(10, currentQuotes.length); // Keep up to 10 existing quotes
    const keptQuotes = currentQuotes.slice(0, keepCount);
    
    // Combine kept quotes with fresh quotes (remove duplicates)
    const allQuotes = [...keptQuotes];
    freshQuotes.forEach(newQuote => {
      const isDuplicate = allQuotes.some(existing => 
        existing.text === newQuote.text || 
        (existing.author === newQuote.author && existing.text.includes(newQuote.text.substring(0, 20)))
      );
      if (!isDuplicate) {
        allQuotes.push(newQuote);
      }
    });
    
    // Limit total quotes to reasonable number
    const finalQuotes = allQuotes.slice(0, 100);
    
    writeQuotes(finalQuotes);
    console.log(`✅ Updated quotes.json with ${finalQuotes.length} quotes`);
    console.log(`📍 File location: ${QUOTES_FILE}`);
    console.log(`🕒 Last updated: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Failed to fetch fresh quotes:', error.message);
    console.log('💡 Using existing quotes as fallback...');
    
    // If API fails, at least ensure we have some quotes
    const currentQuotes = readCurrentQuotes();
    if (currentQuotes.length === 0) {
      // Add some default quotes if file is empty
      const defaultQuotes = [
        {
          "text": "The only way to do great work is to love what you do.",
          "author": "Steve Jobs"
        },
        {
          "text": "Life is what happens to you while you're busy making other plans.",
          "author": "John Lennon"
        },
        {
          "text": "The future belongs to those who believe in the beauty of their dreams.",
          "author": "Eleanor Roosevelt"
        }
      ];
      writeQuotes(defaultQuotes);
      console.log('📝 Created quotes.json with default quotes');
    } else {
      console.log(`📋 Keeping existing ${currentQuotes.length} quotes`);
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
