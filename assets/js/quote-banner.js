/**
 * Quote Banner Management System
 * Handles quote display and banner visibility state.
 */
class QuoteBanner {
  constructor() {
    this.STORAGE_KEY = 'quote-banner-closed';
    this.config = window.quoteBannerData || {};
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
      this.elements.reopenButtonWrapper.style.display = 'block';
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

  rotateQuote() {
    if (this.quotes.length <= 1) {
      this.currentQuoteIndex = this.quotes.length === 1 ? 0 : -1;
    } else {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * this.quotes.length);
      } while (newIndex === this.currentQuoteIndex);
      this.currentQuoteIndex = newIndex;
    }
    this.displayQuote();
  }

  displayQuote() {
    if (this.currentQuoteIndex === -1 || !this.elements.quoteContent) return;
    const quote = this.quotes[this.currentQuoteIndex];
    
    this.elements.quoteContent.classList.add('fade');
    setTimeout(() => {
      this.elements.textEl.textContent = `"${quote.text}"`;
      this.elements.authorEl.textContent = quote.author ? `— ${quote.author}` : '';
      this.elements.quoteContent.classList.remove('fade');
    }, 300);
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
