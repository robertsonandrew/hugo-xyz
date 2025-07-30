document.addEventListener('DOMContentLoaded', function() {
  if (!window.quoteBannerData) {
    console.error('Quote banner data not found. Aborting.');
    return;
  }

  const { quotes: localQuotes, refreshInterval, showApiError } = window.quoteBannerData;
  console.log("Local quotes data from Hugo:", localQuotes);
  const parsedQuotes = JSON.parse(localQuotes);

  const banner = document.getElementById('quote-banner');
  const textEl = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  const closeButton = document.getElementById('quote-close');
  const quoteContent = banner.querySelector('.quote-banner-content');
  const reopenButtonWrapper = document.getElementById('reopen-quote-banner-wrapper');
  const reopenButton = document.getElementById('reopen-quote-banner-button');
  const STORAGE_KEY = 'quote-banner-closed';

  if (!banner || !textEl || !authorEl || !closeButton || !reopenButtonWrapper || !reopenButton) {
    console.error('Quote banner element(s) not found. Aborting.');
    return;
  }

  let quoteInterval;
  let quotes = [];

  async function fetchQuotes() {
    try {
      const response = await fetch('https://zenquotes.io/api/quotes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      quotes = data.map(q => ({ text: q.q, author: q.a }));
      console.log("Successfully loaded quotes from ZenQuotes API.");
    } catch (error) {
      console.error("Failed to fetch quotes from API, using local fallback.", error);
      if (showApiError) {
        const errorEl = document.createElement('div');
        errorEl.className = 'quote-banner-error';
        errorEl.textContent = 'Could not fetch new quotes. Using fallbacks.';
        banner.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 5000);
      }
      quotes = parsedQuotes;
    } finally {
      if (quotes.length === 0) {
        quotes.push({ text: "No quotes available at this time.", author: "System" });
      }
      initializeBanner();
    }
  }

  let currentQuoteIndex = -1;

  function displayQuote() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * quotes.length);
    } while (newIndex === currentQuoteIndex && quotes.length > 1);
    currentQuoteIndex = newIndex;
    const quote = quotes[currentQuoteIndex];

    quoteContent.classList.add('fade');
    setTimeout(() => {
      textEl.textContent = `"${quote.text}"`;
      authorEl.textContent = `— ${quote.author}`;
      quoteContent.classList.remove('fade');
    }, 300);
  }

  function openBanner() {
    banner.style.display = 'flex';
    reopenButtonWrapper.style.display = 'none';
    localStorage.removeItem(STORAGE_KEY);
    displayQuote();
    quoteInterval = setInterval(displayQuote, refreshInterval);
  }

  function closeBanner() {
    banner.style.display = 'none';
    reopenButtonWrapper.style.display = 'block';
    localStorage.setItem(STORAGE_KEY, 'true');
    if (quoteInterval) {
      clearInterval(quoteInterval);
    }
  }

  function initializeBanner() {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      banner.style.display = 'none';
      reopenButtonWrapper.style.display = 'block';
    } else {
      openBanner();
    }
  }

  closeButton.addEventListener('click', closeBanner);
  reopenButton.addEventListener('click', openBanner);

  fetchQuotes();
});
