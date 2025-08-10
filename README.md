# Custom Logo Overview 

This site supports a text-based logo rendered with a configurable animated gradient. The logo text comes from the `customLogo` param and the gradient is controlled via simple settings in `config/_default/params.toml`.

## How it works
- The header renders your `customLogo` string with class `custom-logo-text`.
- Gradient colors, angle, and animation speed are passed as CSS variables on the logo element.
- The CSS in `assets/css/custom.css` reads those variables and applies an animated gradient with background-clip text.

## Configure in params.toml
```toml
# Required
customLogo = "arobertsonxyz"
logoStyle = "gradient"  # must be 'gradient' to use the controls below

# Optional controls
logoGradientStops = ["#1d4ed8", "#7c3aed", "#0ea5e9"]  # any 2–5 stops
logoGradientAngle = 135    # degrees
logoAnimationSpeed = "6s" # CSS duration
```

Notes
- After changing stops or angle, hard-refresh the browser (Cmd+Shift+R) to bypass cached CSS bundles.
- If a stop list isn’t provided, sensible defaults are used.
- The old preset classes (`custom-logo-gradient1..4`) were removed in favor of the controls above.

## Ready‑made gradient presets
Copy any set into `logoGradientStops`.

- Aurora: ["#a3e635", "#34d399", "#7dd3fc"]
- Ocean: ["#0ea5e9", "#14b8a6", "#3b82f6"]
- Sunrise: ["#f59e0b", "#f43f5e", "#8b5cf6"]
- Blueberry: ["#1d4ed8", "#2563eb", "#7c3aed"]
- Flamingo: ["#fb7185", "#f472b6", "#a78bfa"]
- Mango Mint: ["#f59e0b", "#fbbf24", "#10b981"]
- Royal: ["#3b82f6", "#8b5cf6", "#06b6d4"]
- Sunset Drift: ["#f97316", "#ef4444", "#8b5cf6"]
- Lime Sky: ["#84cc16", "#22c55e", "#38bdf8"]
- Steel Candy: ["#06b6d4", "#60a5fa", "#a78bfa"]

Suggested angles and speeds
- Angle: 120–150 works well for most headers (try 135 first)
- Speed: 4s (snappy), 6–8s (subtle), 10s+ (very calm)

## Troubleshooting
- If the logo looks solid or gray, ensure `logoStyle = "gradient"` and hard-refresh.
- Some browsers require background-clip text; this repo enables it with the necessary vendor flags. If issues persist on Safari, consider an SVG text gradient fallback.

---

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

All functional settings for the banner are located in `config/_default/params.toml` under the `[quoteBanner]` section.

```toml
[quoteBanner]
  enabled = true
  refreshInterval = 2000  # milliseconds between quote changes
  showDelay = 300        # milliseconds before showing banner on first load
  showApiError = true    # show error message when API fails
  showLoadingState = true
  fadeTransitionDuration = 400
  mobileBreakpoint = 768

  # Optional: Custom gradients for the quote banner.
  # Provide 2 or more color stops.
  lightModeGradient = ["#667eea", "#764ba2"]
  darkModeGradient = ["#db2777", "#9333ea"]
```

---

## 4. File Breakdown

This feature is composed of several key files that work together:

### `layouts/partials/quotes-banner.html`

*   **Role**: The central controller.
*   **Logic**: It contains a single conditional check: `{{- if and .Site.Params.quoteBanner.enabled .Params.show_quote_banner -}}`. This line checks if the feature is enabled globally (`enabled = true`) AND if the current page has opted-in (`show_quote_banner: true`).
*   **Function**: If both conditions are met, it renders the banner's HTML structure and passes the configuration data (quotes, refresh interval, etc.) to the JavaScript via a JSON object embedded in a `<script>` tag.

### `assets/js/quote-banner.js`

*   **Role**: Interactivity and State Management.
*   **Logic**: This script is the client-side brain of the operation.
    *   **Smart Initialization**: The script runs on every page load but its first job is to check if the main banner's HTML (`#quote-banner`) exists on the current page.
    *   **Conditional Logic**: If the banner's HTML is **not** present, the script ensures the "reopen" button is hidden and does nothing else. 
    *   **Full Functionality**: If the banner HTML **is** present, the script proceeds to:
        *   Read the configuration by parsing the JSON from the `<script id="quote-banner-data">` tag.
        *   Handle the random selection and display of quotes.
        *   Manage the banner's state (open/closed) by toggling the `quote-banner-open` class on the `<body>` tag.
        *   Listen for clicks on the close and reopen buttons.
        *   Use `localStorage` to remember the user's choice to keep the banner closed across page loads.

### `assets/css/quote-banner.css`

*   **Role**: All Styling and Layout Logic.
*   **Logic**: This is the most critical piece for layout stability. It uses a modern, CSS-only approach to handle the complex header interactions.
    *   **Visibility**: The banner is hidden by default (`display: none`). It only becomes visible when the `body.quote-banner-open` class is present.
    *   **Dynamic Padding**: It uses the CSS `:has()` selector to intelligently apply padding to the `<main>` content area *only when* the `fixed-gradient` header (`#fixed-header-container`) is present on the page. This prevents the header from overlapping the content.
    *   **Calculations**: It uses CSS variables and `calc()` to dynamically adjust the layout when the banner is open or closed, ensuring a smooth and accurate transition without any JavaScript-based measurement.

### `data/quotes.json`

*   **Role**: Content Storage.
*   **Function**: This file holds the list of quotes that are displayed in the banner. You can add, remove, or edit quotes here.

### `layouts/partials/extend-head.html`

*   **Role**: Global Head Injections and CSS Variable Definitions.
*   **Function**: This Hugo override file is used to:
    1.  Inject site-level CSS variables for features like the custom logo gradient, quote banner gradients, and default background images/colors.
    2.  Import external resources, such as Google Fonts.

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
- For layout issues, check CSS variables and calculations
- For mobile display problems, verify mobileBreakpoint setting

---

This robust, front-matter-driven approach ensures that the quote banner is easy to manage, highly performant, and free of the complex logic that can lead to build errors.

---

## Homepage Customizations

### Homepage Hero Call to Action (CTA)

The homepage features a customizable hero section with a call-to-action. This section is defined in `layouts/partials/home/custom.html` and includes:

*   A main heading: "Building for the Web"
*   A descriptive paragraph: "I design and build robust, user-friendly web applications. Explore my work or get in touch!"
*   Two call-to-action buttons:
    *   "View Projects" linking to `/docs/getting-started/`
    *   "Read the Blog" linking to `/blog/`

The styling for this section is managed in `assets/css/custom.css`.
