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
    this.currentQuoteIndex = -1;
    this.quoteInterval = null;
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

    this.setInitialState();
  }

  setInitialState() {
    if (localStorage.getItem(this.STORAGE_KEY) === 'true') {
      this.elements.body.classList.remove('quote-banner-open');
      this.elements.reopenButtonWrapper.style.display = 'inline-block';
    } else {
      this.elements.body.classList.add('quote-banner-open');
      this.elements.reopenButtonWrapper.style.display = 'none';
      this.startRotation();
    }
  }

  startRotation() {
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
      this.elements.quoteContent.classList.add('loading');
      
      // Ensure we don't repeat quotes until all have been shown
      if (!this.remainingQuotes || this.remainingQuotes.length === 0) {
        this.remainingQuotes = [...this.quotes];
      }

      const randomIndex = Math.floor(Math.random() * this.remainingQuotes.length);
      const quote = this.remainingQuotes.splice(randomIndex, 1)[0];

      await this.displayQuoteWithAnimation(quote);
    } catch (error) {
      this.handleError(error);
    }
  }

  async displayQuoteWithAnimation(quote) {
    await new Promise(resolve => {
      this.elements.quoteContent.classList.add('fade');
      setTimeout(() => {
        this.elements.textEl.textContent = `"${quote.text}"`;
        this.elements.authorEl.textContent = quote.author ? `— ${quote.author}` : '';
        this.elements.quoteContent.classList.remove('loading', 'fade');
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
    this.setInitialState();
  }

  closeBanner() {
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.setInitialState();
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    }
  }
}

// Initialize the script on every page load.
document.addEventListener('DOMContentLoaded', () => {
  new QuoteBanner().init();
});
