# Andrew's Hugo Theme

This repository contains the source code for my personal website, built with the Hugo Blowfish theme. It includes a number of custom features designed to create a unique and performant user experience.

<details>
<summary style="border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; background-color: #113e6eff; font-weight: bold; display: block; cursor: pointer;">📚 Table of Contents</summary>

- [Site Features and Customizations](#site-features-and-customizations)
  - [1. Animated Gradient Logo](#1-animated-gradient-logo)
  - [2. Homepage Customizations](#2-homepage-customizations)
  - [3. Dynamic Quote Banner](#3-dynamic-quote-banner)
  - [4. Satellite Screensaver](#4-satellite-screensaver)

</details>

## Site Features and Customizations

This section provides an overview of the custom features implemented in this theme.

### 1. Animated Gradient Logo

This site supports a text-based logo rendered with a configurable animated gradient. The logo text comes from the `customLogo` param and the gradient is controlled via simple settings in `config/_default/params.toml`.

#### How it works
- The header renders your `customLogo` string with class `custom-logo-text`.
- Gradient colors, angle, and animation speed are passed as CSS variables on the logo element.
- The CSS in `assets/css/custom.css` reads those variables and applies an animated gradient with background-clip text.

#### Configure in params.toml
```toml
# Required
customLogo = "arobertsonxyz"
logoStyle = "gradient"  # must be 'gradient' to use the controls below

# Optional controls
logoGradientStops = ["#1d4ed8", "#7c3aed", "#0ea5e9"]  # any 2–5 stops
logoGradientAngle = 135    # degrees
logoAnimationSpeed = "6s" # CSS duration
```

**Notes**
- After changing stops or angle, hard-refresh the browser (Cmd+Shift+R) to bypass cached CSS bundles.
- If a stop list isn’t provided, sensible defaults are used.

<details>
<summary style="border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; background-color: #1a5c47ff; font-weight: bold; display: block; cursor: pointer;">🎨 Ready-made gradient presets</summary>

Copy any set into `logoGradientStops`.

- **Aurora**: `["#a3e635", "#34d399", "#7dd3fc"]`
- **Ocean**: `["#0ea5e9", "#14b8a6", "#3b82f6"]`
- **Sunrise**: `["#f59e0b", "#f43f5e", "#8b5cf6"]`
- **Blueberry**: `["#1d4ed8", "#2563eb", "#7c3aed"]`
- **Flamingo**: `["#fb7185", "#f472b6", "#a78bfa"]`
- **Mango Mint**: `["#f59e0b", "#fbbf24", "#10b981"]`
- **Royal**: `["#3b82f6", "#8b5cf6", "#06b6d4"]`
- **Sunset Drift**: `["#f97316", "#ef4444", "#8b5cf6"]`
- **Lime Sky**: `["#84cc16", "#22c55e", "#38bdf8"]`
- **Steel Candy**: `["#06b6d4", "#60a5fa", "#a78bfa"]`

</details>

**Suggested angles and speeds**
- **Angle**: 120–150 works well for most headers (try 135 first)
- **Speed**: 4s (snappy), 6–8s (subtle), 10s+ (very calm)

#### Troubleshooting
- If the logo looks solid or gray, ensure `logoStyle = "gradient"` and hard-refresh.

---

### 2. Homepage Customizations

The homepage uses a custom layout that pulls its main content directly from `content/_index.md`. This allows you to easily edit the hero text without touching any HTML files.

- **Content File**: `content/_index.md`
- **Layout File**: `layouts/partials/home/custom.html`

#### Custom Homepage Image Hover Effect

The homepage features a custom image hover effect where hovering over the main image switches to an alternate image, creating an engaging interactive element.

**Configuration in params.toml:**
```toml
customHomepageImage = "images/homepage-image.png"          # Primary image
customHomepageImageSwitch = "images/homepage-image-switch.png"  # Hover/switch image
```

**Key Features:**
- Smooth opacity transition between images
- Responsive sizing and positioning
- Fallback to author.image if custom images aren't available
- Hugo resources pipeline integration for optimization

The social media icons displayed below the author's headline are configured in `config/_default/params.toml` under the `[author].links` section. The theme automatically renders these icons.

```toml
# In config/_default/params.toml
[author]
  name = "Andrew Robertson"
  headline = "Full-Stack Developer | DevOps Engineer | Generative AI Enthusiast"
  image = "images/homepage-image.png"
  links = [
    { github = "https://github.com/arobertson67" },
    { linkedin = "https://linkedin.com/in/andrew-robertson-ab7a57103" },
    # ... other links
  ]
```

---

### 3. Dynamic Quote Banner

This document outlines the architecture and implementation of the dynamic quote banner feature for the Hugo Blowfish theme.

---

#### Data sources and author rules

Quotes are generated at build time from API Ninjas and written to `data/quotes.json`:
- Sources: `advice`, `dadjokes`, and `quotes` endpoints
- Normalization:
  - advice -> category: `advice`, author: empty
  - dadjokes -> category: `dadjokes`, author: empty
  - quotes -> category: `quotes`, author: meaningful from API
- Display rule: the banner only shows an author for items with category `quotes`.

---

#### 1. High-Level Overview

The quote banner system is designed to be modular and easy to manage. It displays a random quote from a predefined list on specific pages. The core logic is handled by a combination of a Hugo partial, page front matter, a simple JavaScript file for interactivity, and a CSS file for all styling and layout adjustments.

The key principle of this implementation is **explicitness over complexity**. The decision to show the banner is made on a per-page basis directly in the content files, which avoids complex and error-prone global configuration.

---

#### 2. How to Use

##### Enabling the Banner on a Page

To display the quote banner on any specific page (including the homepage), add the following line to the top of the page's markdown file (in the front matter section):

```yaml
---
title: Your Page Title
show_quote_banner: true
---
```

##### Disabling the Banner Globally

If you want to turn off the quote banner feature entirely across the whole site, you can do so by changing one line in your configuration file.

1.  **Open**: `config/_default/params.toml`
2.  **Find** the `[quoteBanner]` section.
3.  **Change** `enabled = true` to `enabled = false`.

---

#### 3. Configuration

All functional settings for the banner are located in `config/_default/params.toml` under the `[quoteBanner]` section.

```toml
[quoteBanner]
  enabled = true
  refreshInterval = 2000  # milliseconds between quote changes
  showDelay = 300        # milliseconds before showing banner on first load (banner slides in after this delay)
  showApiError = true    # show error message when API fails
  showLoadingState = true  # (ignored) banner now uses simple fade-only transitions without a loading placeholder
  fadeTransitionDuration = 400
  mobileBreakpoint = 768

  # Optional: Custom gradients for the quote banner.
  # Provide 2 or more color stops.
  lightModeGradient = ["#667eea", "#764ba2"]
  darkModeGradient = ["#db2777", "#9333ea"]

  # Optional: Category weighting for rotation (omit for simple random cycle)
  # weights = { quotes = 3, advice = 2, dadjokes = 1 }

  # Optional: Selection mode
  # "random" = pure random each time (repeats allowed)
  # omit for cycle-based rotation (no repeats until pool exhausts; can combine with weights)
  # selectionMode = "random"
```

---

#### 4. File Breakdown

This feature is composed of several key files that work together:

##### `layouts/partials/quotes-banner.html`

*   **Role**: The central controller.
*   **Logic**: It contains a single conditional check: `{{- if and .Site.Params.quoteBanner.enabled .Params.show_quote_banner -}}`. This line checks if the feature is enabled globally (`enabled = true`) AND if the current page has opted-in (`show_quote_banner: true`).
*   **Function**: If both conditions are met, it renders the banner's HTML structure and passes the configuration data (quotes, refresh interval, etc.) to the JavaScript via a JSON object embedded in a `<script>` tag.

##### `assets/js/quote-banner.js`

*   **Role**: Interactivity and State Management.
*   **Logic**: This script is the client-side brain of the operation.
    *   **Smart Initialization**: The script runs on every page load but its first job is to check if the main banner's HTML (`#quote-banner`) exists on the current page.
    *   **Conditional Logic**: If the banner's HTML is **not** present, the script ensures the "reopen" button is hidden and does nothing else. 
    *   **Full Functionality**: If the banner HTML **is** present, the script proceeds to:
        *   Read the configuration by parsing the JSON from the `<script id="quote-banner-data">` tag.
    *   Handle the random selection and display of quotes (no loading placeholder; fade-only).
    *   Supports selection modes:
      - random: pure random each rotation
      - cycle (default): no repeats within a cycle; optional category weights
  *   Honor an optional showDelay (ms) before sliding the banner into view on first load.
        *   Manage the banner's state (open/closed) by toggling the `quote-banner-open` class on the `<body>` tag.
        *   Listen for clicks on the close and reopen buttons.
        *   Use `localStorage` to remember the user's choice to keep the banner closed across page loads.

##### `assets/css/quote-banner.css`

*   **Role**: All Styling and Layout Logic.
*   **Logic**: This is the most critical piece for layout stability. It uses a modern, CSS-only approach to handle the complex header interactions.
    *   **Visibility**: The banner is hidden by default (`display: none`). It only becomes visible when the `body.quote-banner-open` class is present.
    *   **Dynamic Padding**: It uses the CSS `:has()` selector to intelligently apply padding to the `<main>` content area *only when* the `fixed-gradient` header (`#fixed-header-container`) is present on the page. This prevents the header from overlapping the content.
  *   **Calculations**: It uses CSS variables and `calc()` to dynamically adjust the layout when the banner is open or closed, ensuring a smooth and accurate transition without any JavaScript-based measurement. There is no separate "Loading…" placeholder anymore; only smooth fades.

##### `data/quotes.json`

*   **Role**: Content Storage.
*   **Function**: This file holds the list of quotes that are displayed in the banner. You can add, remove, or edit quotes here.

##### `scripts/update-quotes.js`

*   **Role**: Build-time content fetcher.
*   **Function**: Fetches from API Ninjas (`/v1/advice`, `/v1/dadjokes`, `/v1/quotes`), normalizes to a unified shape, de-duplicates, and writes to `data/quotes.json`.
*   **Env Vars**:
  - `API_NINJAS_KEY` (required)
  - `ADVICE_LIMIT`, `DADJOKES_LIMIT`, `QUOTES_LIMIT` (optional; small repeated requests are used to respect non-premium limits)
*   **Author rule**: Only the `quotes` category includes an author; advice/dadjokes do not.
*   **Run**:

```bash
API_NINJAS_KEY=xxxx ADVICE_LIMIT=20 DADJOKES_LIMIT=20 QUOTES_LIMIT=20 node scripts/update-quotes.js
```

##### `layouts/partials/extend-head.html`

*   **Role**: Global Head Injections and CSS Variable Definitions.
*   **Function**: This Hugo override file is used to:
    1.  Inject site-level CSS variables for features like the custom logo gradient, quote banner gradients, and default background images/colors.
    2.  Import external resources, such as Google Fonts.

##### `layouts/partials/extend-footer.html`

*   **Role**: Asset Loading and Reopen Button.
*   **Function**: This Hugo override file is used to:
    1.  Load the `quote-banner.css` and `quote-banner.js` assets on every page.
    2.  Render the HTML for the "reopen" button, ensuring it is available on all pages even if the main banner is not.

---

#### 5. Features

- **Smart Quote Rotation**: Ensures all quotes are shown before repeating
- **Smooth Transitions**: Fade animations between quotes
- **State Persistence**: Banner state (open/closed) persists across page loads
- **Loading States**: Visual feedback during quote transitions
- **Error Handling**: Graceful handling of loading failures
- **Mobile Responsive**: Adjusts display for different screen sizes
- **Author Display Rule**: Author is only shown for items from the `quotes` API category
- **Optional Category Weighting**: Bias rotation across `quotes`, `advice`, and `dadjokes` via `[quoteBanner].weights`
- **Delayed Appearance**: `showDelay` cleanly slides the banner in after page load

---

#### 6. Best Practices

1. Keep quotes concise for better mobile display
2. Ensure proper error messages are configured
3. Test on both desktop and mobile devices
4. Monitor performance impact with many quotes

---

#### 7. Troubleshooting

Common issues and solutions:
- If banner doesn't appear, check front matter configuration
- If quotes don't rotate, verify refresh interval setting
- For layout issues, check CSS variables and calculations
- For mobile display problems, verify mobileBreakpoint setting

---

This robust, front-matter-driven approach ensures that the quote banner is easy to manage, highly performant, and free of the complex logic that can lead to build errors.

---

### 4. Satellite Screensaver

A serene, ambient screensaver that activates after a period of inactivity, featuring slowly moving satellites across a dark sky - perfect for creating that "stargazing in the countryside" atmosphere.

#### Features

- **Realistic Movement**: 80% of satellites enter from screen edges, 20% from center for natural motion
- **Variable Appearance**: Configurable satellite sizes and opacity levels for depth perception
- **Smooth Fade-In**: Cinematic 10-second fade-in with easing curves for gentle activation
- **Exact Count Control**: Maintains precisely the configured number of satellites
- **Full Screen Coverage**: High z-index ensures screensaver appears above all page content
- **Enhanced Visibility**: 95% background opacity for optimal satellite visibility against dark overlay

#### Configuration

All screensaver settings are configurable in `config/_default/params.toml`:

```toml
[screensaver]
  idleTimeout = 10000     # ms of inactivity before screensaver shows
  starCount = 100         # exact number of satellites (any value works)
  starMinSize = 2         # minimum satellite size (px)
  starMaxSize = 7         # maximum satellite size (px)
  starSpeed = 0.4         # movement speed (lower = slower, more peaceful)
```

#### Implementation Files

- **`assets/js/screensaver.js`**: Core screensaver logic with Hugo config parsing
- **`assets/css/custom.css`**: Styling for screensaver overlay and smooth transitions
- **`layouts/_default/baseof.html`**: HTML structure and JSON config injection

#### Technical Details

- **Hugo Integration**: Automatically parses configuration from Hugo params via JSON
- **Idle Detection**: Monitors mouse movement, keyboard, and touch events
- **Smooth Animation**: 10-second fade-in with ease-in-out curves for cinematic effect
- **Precise Control**: Maintains exact satellite count specified in configuration
- **Performance Optimized**: Efficient canvas rendering with minimal DOM manipulation
- **Mixed Movement Patterns**: 
  - Edge satellites: Enter from screen borders, move in straight lines
  - Center satellites: Begin near center with radial movement

#### Activation

The screensaver automatically activates after the configured idle timeout with a beautiful 10-second fade-in. Click anywhere on the screensaver to dismiss it instantly and return to normal browsing.

**Perfect for**: Creating a calming, contemplative atmosphere during breaks while maintaining the site's peaceful aesthetic. The slow satellite movement mimics real satellite passes visible from dark sky locations.

---
