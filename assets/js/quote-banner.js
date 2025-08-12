/**
 * Quote Banner Management System
 * Handles quote display and banner visibility state.
 */
class QuoteBanner {
  constructor() {
    this.STORAGE_KEY = 'quote-banner-closed';
    const configEl = document.getElementById('quote-banner-data');
    this.config = configEl ? JSON.parse(configEl.textContent) : {};
    this.quotes = this.config.quotes || [];
  this.categoryWeights = this.config.categoryWeights || null; // e.g., { quotes: 2, advice: 1, dadjokes: 1 }
  this.selectionMode = this.config.selectionMode || null; // 'random' for pure random
    this.currentQuoteIndex = -1;
    this.quoteInterval = null;
  this.showTimeout = null;
  this.userInitiatedOpen = false;
    this.elements = {};
  }

  init() {
    this.elements.body = document.body;
    this.elements.banner = document.getElementById('quote-banner');
    this.elements.reopenButtonWrapper = document.getElementById('reopen-quote-banner-wrapper');

    // If the main banner element doesn't exist on this page, ensure the reopen button is also hidden and stop.
    if (!this.elements.banner) {
      if (this.elements.reopenButtonWrapper) {
        this.elements.reopenButtonWrapper.style.display = 'none';
      }
      return;
    }

    // If we've reached this point, the banner exists on this page. Proceed with full setup.
    this.initializeFullBanner();
  }

  initializeFullBanner() {
    this.elements.textEl = document.getElementById('quote-text');
    this.elements.authorEl = document.getElementById('quote-author');
    this.elements.closeButton = document.getElementById('quote-close');
    this.elements.quoteContent = document.querySelector('.quote-banner-content');
    this.elements.reopenButton = document.getElementById('reopen-quote-banner-button');

    if (!this.elements.textEl || !this.elements.closeButton || !this.elements.reopenButton) {
      console.error("Missing required banner child elements.");
      return;
    }

    if (!this.quotes || this.quotes.length === 0) {
      this.quotes = [{ text: "No quotes available.", author: "System" }];
    }

    this.elements.closeButton.addEventListener('click', () => this.closeBanner());
    this.elements.reopenButton.addEventListener('click', () => this.openBanner());

  // Ensure hidden before we apply delayed show
  this.elements.banner.style.display = 'none';
  this.setInitialState();
  }

  setInitialState() {
    // Clear any pending show timeouts
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (localStorage.getItem(this.STORAGE_KEY) === 'true') {
      this.elements.body.classList.remove('quote-banner-open');
      if (this.elements.reopenButtonWrapper) this.elements.reopenButtonWrapper.style.display = 'inline-block';
      this.elements.banner.style.display = 'none';
      return;
    }

    // Not closed: optionally delay showing the banner
    const delay = this.userInitiatedOpen ? 0 : (parseInt(this.config.showDelay, 10) || 0);
    if (this.elements.reopenButtonWrapper) this.elements.reopenButtonWrapper.style.display = 'none';
    if (delay > 0) {
      // Ensure it's hidden until we show it
      this.elements.body.classList.remove('quote-banner-open');
      this.showTimeout = setTimeout(() => {
        this.elements.body.classList.add('quote-banner-open');
        this.elements.banner.style.display = 'flex';
        this.startRotation();
      }, delay);
    } else {
      this.elements.body.classList.add('quote-banner-open');
      this.elements.banner.style.display = 'flex';
      this.startRotation();
    }
    // Reset the flag after we decide
    this.userInitiatedOpen = false;
  }

  startRotation() {
    if (this.selectionMode !== 'random') {
      this.preparePools();
    }
    this.rotateQuote();
    if (this.quoteInterval) clearInterval(this.quoteInterval);
    const interval = parseInt(this.config.refreshInterval, 10) || 10000;
    this.quoteInterval = setInterval(() => this.rotateQuote(), interval);
  }

  async rotateQuote() {
    if (!this.quotes || this.quotes.length === 0) {
      this.handleError("No quotes available");
      return;
    }

  try {
      const quote = this.pickNextQuote();

  await this.displayQuoteWithAnimation(quote);
    } catch (error) {
      this.handleError(error);
    }
  }

  preparePools() {
    // Build per-category pools so we can weight selection optionally
    this.pools = {
      quotes: [],
      advice: [],
      dadjokes: []
    };
    for (const q of this.quotes) {
      const cat = q.category || 'quotes';
      if (!this.pools[cat]) this.pools[cat] = [];
      this.pools[cat].push(q);
    }
    // Remaining pools for no-repeat cycle per category
    this.remainingByCategory = {};
    for (const cat of Object.keys(this.pools)) {
      this.remainingByCategory[cat] = [...this.pools[cat]];
    }
    // Flat remaining as a fallback
    this.remainingQuotes = [...this.quotes];
  }

  pickNextQuote() {
    // Pure random mode: pick any quote uniformly at random, allowing repeats
    if (this.selectionMode === 'random') {
      if (!this.quotes || this.quotes.length === 0) return { text: 'No quotes available', author: '' };
      const idx = Math.floor(Math.random() * this.quotes.length);
      return this.quotes[idx];
    }

    // If no weights configured, use existing flat pool logic
    if (!this.categoryWeights) {
      if (!this.remainingQuotes || this.remainingQuotes.length === 0) this.remainingQuotes = [...this.quotes];
      const idx = Math.floor(Math.random() * this.remainingQuotes.length);
      return this.remainingQuotes.splice(idx, 1)[0];
    }

    // Compute a weighted pick among categories that still have remaining items
    const activeCats = Object.keys(this.remainingByCategory).filter(c => this.remainingByCategory[c] && this.remainingByCategory[c].length > 0);
    if (activeCats.length === 0) {
      // Refill all
      this.preparePools();
      return this.pickNextQuote();
    }

    // Build weights array only for active categories
    const weights = activeCats.map(c => Number(this.categoryWeights[c] || 0) || 0);
    // If all weights are zero or invalid, fall back to uniform
    const total = weights.reduce((a, b) => a + b, 0);
    let chosenCat;
    if (total <= 0) {
      chosenCat = activeCats[Math.floor(Math.random() * activeCats.length)];
    } else {
      let r = Math.random() * total;
      for (let i = 0; i < activeCats.length; i++) {
        const w = weights[i];
        if (r < w) { chosenCat = activeCats[i]; break; }
        r -= w;
      }
      if (!chosenCat) chosenCat = activeCats[activeCats.length - 1];
    }

    // Pick a random quote from the chosen category's remaining pool
    const pool = this.remainingByCategory[chosenCat];
    const idx = Math.floor(Math.random() * pool.length);
    const quote = pool.splice(idx, 1)[0];
    return quote;
  }

  async displayQuoteWithAnimation(quote) {
    await new Promise(resolve => {
      this.elements.quoteContent.classList.add('fade');
      setTimeout(() => {
  const max = parseInt(this.config.maxLength, 10) || 0;
  const raw = String(quote.text || '');
  const clipped = (max > 0 && raw.length > max) ? raw.slice(0, Math.max(0, max - 1)).trimEnd() + '…' : raw;
  this.elements.textEl.textContent = `"${clipped}"`;
        const showAuthor = quote && quote.category === 'quotes' && quote.author;
        this.elements.authorEl.textContent = showAuthor ? `— ${quote.author}` : '';
        this.elements.quoteContent.classList.remove('fade');
        resolve();
      }, 400);
    });
  }

  handleError(error) {
    console.error('Quote Banner Error:', error);
    if (this.config.showApiError) {
      this.elements.textEl.textContent = "Unable to load quote";
      this.elements.authorEl.textContent = "";
    }
  }

  openBanner() {
    localStorage.removeItem(this.STORAGE_KEY);
  this.userInitiatedOpen = true;
    this.setInitialState();
  }

  closeBanner() {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.setInitialState();
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    }
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  this.elements.banner.style.display = 'none';
  }
}

// Initialize the script on every page load.
document.addEventListener('DOMContentLoaded', () => {
  new QuoteBanner().init();
});
