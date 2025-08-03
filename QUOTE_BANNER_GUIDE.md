# Guide: Quote Banner Implementation

This document outlines the architecture and implementation of the dynamic quote banner feature for the Hugo Blowfish theme.

---

## 1. High-Level Overview

The quote banner system is designed to be modular and easy to manage. It displays a random quote from a predefined list on specific pages. The core logic is handled by a combination of a Hugo partial, page front matter, a simple JavaScript file for interactivity, and a CSS file for all styling and layout adjustments.

The key principle of this implementation is **explicitness over complexity**. The decision to show the banner is made on a per-page basis directly in the content files, which avoids complex and error-prone global configuration.

---

## 2. How to Use

### Enabling the Banner on a Page

To display the quote banner on any specific page (including the homepage), add the following line to the top of the page's markdown file (in the front matter section):

```yaml
---
title: Your Page Title
show_quote_banner: true
---
```

### Disabling the Banner Globally

If you want to turn off the quote banner feature entirely across the whole site, you can do so by changing one line in your configuration file.

1.  **Open**: `config/_default/params.toml`
2.  **Find** the `[quoteBanner]` section.
3.  **Change** `enabled = true` to `enabled = false`.

---

## 3. Configuration

All functional settings for the banner (that aren't related to page visibility) are located in `config/_default/params.toml` under the `[quoteBanner]` section.

```toml
[quoteBanner]
  enabled = true
  refreshInterval = 2000  # milliseconds between quote changes
  showDelay = 300        # milliseconds before showing banner on first load
  showApiError = true    # show error message when API fails
  height = "42px"        # banner height for CSS calculations
  showLoadingState = true
  fadeTransitionDuration = 400
  mobileBreakpoint = 768
```

---

## 4. File Breakdown

This feature is composed of several key files that work together:

### `layouts/partials/quotes-banner.html`

*   **Role**: The central controller.
*   **Logic**: It contains a single conditional check: `{{- if and .Site.Params.quoteBanner.enabled .Params.show_quote_banner -}}`. This line checks if the feature is enabled globally (`enabled = true`) AND if the current page has opted-in (`show_quote_banner: true`).
*   **Function**: If both conditions are met, it renders the banner's HTML structure and passes the configuration data (quotes, refresh interval, etc.) to the JavaScript via the `window.quoteBannerData` object.

### `assets/js/quote-banner.js`

*   **Role**: Interactivity and State Management.
*   **Logic**: This script is the client-side brain of the operation.
    *   **Smart Initialization**: The script runs on every page load but its first job is to check if the main banner's HTML (`#quote-banner`) exists on the current page.
    *   **Conditional Logic**: If the banner's HTML is **not** present, the script ensures the "reopen" button is hidden and does nothing else. This is the key to preventing the button from appearing on the wrong pages (e.g., blog posts).
    *   **Full Functionality**: If the banner HTML **is** present, the script proceeds to:
        *   Read the configuration (like `refreshInterval`) from the `window.quoteBannerData` object.
        *   Handle the random selection and display of quotes.
        *   Manage the banner's state (open/closed) by toggling the `quote-banner-open` class on the `<body>` tag.
        *   Listen for clicks on the close and reopen buttons.
        *   Use `localStorage` to remember the user's choice to keep the banner closed across page loads.

### `assets/css/quote-banner.css`

*   **Role**: All Styling and Layout Logic.
*   **Logic**: This is the most critical piece for layout stability. It uses a modern, CSS-only approach to handle the complex header interactions.
    *   **Visibility**: The banner is hidden by default (`display: none`). It only becomes visible when the `body.quote-banner-open` class is present.
    *   **Dynamic Padding**: It uses the CSS `:has()` selector to intelligently apply padding to the `<main>` content area *only when* the `fixed-gradient` header (`#fixed-header-container`) is present on the page. This prevents the header from overlapping the content.
    *   **Calculations**: It uses CSS variables (`--quote-banner-height`, `--fixed-header-total-height`) and `calc()` to dynamically adjust the layout when the banner is open or closed, ensuring a smooth and accurate transition without any JavaScript-based measurement.

### `data/quotes.json`

*   **Role**: Content Storage.
*   **Function**: This file holds the list of quotes that are displayed in the banner. You can add, remove, or edit quotes here.

### `layouts/partials/extend-footer.html`

*   **Role**: Asset Loading and Reopen Button.
*   **Function**: This Hugo override file is used to:
    1.  Load the `quote-banner.css` and `quote-banner.js` assets on every page.
    2.  Render the HTML for the "reopen" button, ensuring it is available on all pages even if the main banner is not.

---

## 5. Features

- **Smart Quote Rotation**: Ensures all quotes are shown before repeating
- **Smooth Transitions**: Fade animations between quotes
- **State Persistence**: Banner state (open/closed) persists across page loads
- **Loading States**: Visual feedback during quote transitions
- **Error Handling**: Graceful handling of loading failures
- **Mobile Responsive**: Adjusts display for different screen sizes

---

## 6. Best Practices

1. Keep quotes concise for better mobile display
2. Ensure proper error messages are configured
3. Test on both desktop and mobile devices
4. Monitor performance impact with many quotes

---

## 7. Troubleshooting

Common issues and solutions:
- If banner doesn't appear, check front matter configuration
- If quotes don't rotate, verify refresh interval setting
- For layout issues, check banner height configuration
- For mobile display problems, verify mobileBreakpoint setting

---

This robust, front-matter-driven approach ensures that the quote banner is easy to manage, highly performant, and free of the complex logic that can lead to build errors.