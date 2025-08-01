/**
 * Quote Banner Management System
 * Handles quote display, API fetching, and header positioning
 */
class QuoteBanner {
  constructor() {
    // Configuration and state
    this.STORAGE_KEY = 'quote-banner-closed';
    this.config = window.quoteBannerData || {};
    this.quotes = JSON.parse(this.config.quotes || '[]');
    this.currentQuoteIndex = 0;
    this.quoteInterval = null;

    // DOM elements
    this.elements = {};
    this.initializeElements();
  }

  init() {
    if (!this.validateDOMElements()) return;
    this.setupEventListeners();

    // Ensure we have quotes loaded
    if (!this.quotes || this.quotes.length === 0) {
      this.quotes = [{ text: "No quotes available at this time.", author: "System" }];
      console.warn('No quotes found in quotes.json. Run "node scripts/update-quotes.js" to fetch fresh quotes.');
    } else {
      console.log(`Loaded ${this.quotes.length} quotes from static file`);
    }
    
    this.initializeBanner();
  }

  initializeElements() {
    this.elements = {
      banner: document.getElementById('quote-banner'),
      textEl: document.getElementById('quote-text'),
      authorEl: document.getElementById('quote-author'),
      closeButton: document.getElementById('quote-close'),
      quoteContent: document.querySelector('.quote-banner-content'),
      reopenButtonWrapper: document.getElementById('reopen-quote-banner-wrapper'),
      reopenButton: document.getElementById('reopen-quote-banner-button')
    };
  }

  validateDOMElements() {
    const requiredElements = ['banner', 'textEl', 'authorEl', 'closeButton', 'reopenButtonWrapper', 'reopenButton'];
    const missingElements = requiredElements.filter(key => !this.elements[key]);
    
    if (missingElements.length > 0) {
      console.error(`Quote banner element(s) not found: ${missingElements.join(', ')}. Aborting.`);
      return false;
    }
    return true;
  }

  setupEventListeners() {
    this.elements.closeButton.addEventListener('click', () => this.closeBanner());
    this.elements.reopenButton.addEventListener('click', () => this.openBanner());
  }

  rotateQuote() {
    // Randomly select a quote instead of cycling sequentially
    if (this.quotes.length > 1) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * this.quotes.length);
      } while (newIndex === this.currentQuoteIndex); // Avoid showing the same quote twice in a row
      this.currentQuoteIndex = newIndex;
    }
    this.displayQuote();
  }

  displayQuote() {
    if (!this.quotes || this.quotes.length === 0) return;

    const quote = this.quotes[this.currentQuoteIndex];
    
    this.elements.quoteContent.classList.add('fade');
    setTimeout(() => {
      this.elements.textEl.textContent = `"${quote.text}"`;
      this.elements.authorEl.textContent = quote.author ? `— ${quote.author}` : '';
      this.elements.quoteContent.classList.remove('fade');
    }, 300);
  }

  openBanner() {
    this.elements.banner.style.display = 'flex';
    this.elements.reopenButtonWrapper.style.display = 'none';
    localStorage.removeItem(this.STORAGE_KEY);
    this.positionHeaderBelowBanner();
    this.displayQuote();
    if (this.quoteInterval) clearInterval(this.quoteInterval);
    this.quoteInterval = setInterval(() => this.rotateQuote(), this.config.refreshInterval);
  }

  closeBanner() {
    this.elements.banner.style.display = 'none';
    this.elements.reopenButtonWrapper.style.display = 'block';
    localStorage.setItem(this.STORAGE_KEY, 'true');
    this.positionHeaderAtTop();
    if (this.quoteInterval) {
      clearInterval(this.quoteInterval);
      this.quoteInterval = null;
    }
  }

  initializeBanner() {
    if (localStorage.getItem(this.STORAGE_KEY) === 'true') {
      this.elements.banner.style.display = 'none';
      this.elements.reopenButtonWrapper.style.display = 'block';
      this.positionHeaderAtTop();
    } else {
      this.openBanner();
    }
  }

  // Header positioning logic
  getHeaderLayout() {
    const fixedHeaders = document.querySelectorAll('.fixed.inset-x-0');
    const spacingDiv = document.querySelector('.min-h-\\[190px\\]');
    return (fixedHeaders.length > 0 && spacingDiv) ? 'fixed-gradient' : 'basic';
  }

  positionHeaderBelowBanner() {
    const headerLayout = this.getHeaderLayout();
    const bannerHeight = this.elements.banner.offsetHeight || 42;
    
    if (headerLayout === 'fixed-gradient') {
      const headerElements = document.querySelectorAll('.fixed.inset-x-0');
      headerElements.forEach(element => {
        if (element !== this.elements.banner && element.classList.contains('fixed')) {
          element.style.top = `${bannerHeight}px`;
        }
      });
    } else {
      const mainMenus = document.querySelectorAll('.main-menu');
      mainMenus.forEach(element => {
        element.style.marginTop = `${bannerHeight}px`;
      });
    }
  }

  positionHeaderAtTop() {
    const headerLayout = this.getHeaderLayout();
    
    if (headerLayout === 'fixed-gradient') {
      const headerElements = document.querySelectorAll('.fixed.inset-x-0');
      headerElements.forEach(element => {
        if (element !== this.elements.banner && element.classList.contains('fixed')) {
          element.style.top = '0px';
        }
      });
    } else {
      const mainMenus = document.querySelectorAll('.main-menu');
      mainMenus.forEach(element => {
        element.style.marginTop = '0px';
      });
    }
  }
}

// Initialize the banner manager
document.addEventListener('DOMContentLoaded', () => {
  if (window.quoteBannerData) {
    new QuoteBanner().init();
  }
});
