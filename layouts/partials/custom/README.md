# Custom Partials Directory

This directory contains all custom Hugo partials for **site-wide functionality**.

> **Note**: This is separate from `layouts/partials/home/custom.html`, which is the homepage layout template required by the Blowfish theme when `homepage.layout = "custom"` is set.

## Organization

### Entry Point
- `custom-features.html` - Main entry point that includes all custom features

### Individual Feature Partials
- `logo-gradient-switcher.html` - JSON configuration for logo gradient presets
- `quotes-banner.html` - Quote banner display and configuration
- `quote-banner-controls.html` - Re-enable button for dismissed quote banner  
- `status-dot.html` - Status page link indicator
- `screensaver.html` - Screensaver overlay and configuration
- `screensaver-loader.html` - Loads screensaver JS resources

## Usage

Include the main entry point in your layouts:
```go-html-template
{{- partial "custom-features.html" . -}}
```

Or include individual features:
```go-html-template
{{- partial "custom/logo-gradient-switcher.html" . -}}
{{- partial "custom/status-dot.html" . -}}
{{- partial "custom/screensaver.html" . -}}
```

## Integration Points

These partials are integrated at different points in the site:

- **In `<head>`** (`extend-head.html`): CSS resources loaded early
- **In `<body>`** (`baseof.html`): Screensaver and quotes banner HTML
- **In footer** (`extend-footer.html`): Custom features entry point and JS resources

## File Structure Distinction

| Location | Purpose | When Used |
|----------|---------|-----------|
| `layouts/partials/custom/` | Site-wide custom features | Throughout the entire site |
| `layouts/partials/home/custom.html` | Homepage layout template | Only on homepage (when `homepage.layout = "custom"`) |

## File Purposes

| File | Purpose | Scope |
|------|---------|-------|
| `logo-gradient-switcher.html` | Outputs JSON config for logo gradients | Site-wide |
| `quotes-banner.html` | Main quote banner functionality | Pages with `show_quote_banner: true` |
| `quote-banner-controls.html` | Controls to re-show dismissed banner | Site-wide |
| `status-dot.html` | Link to external status page | Site-wide |
| `screensaver.html` | Screensaver HTML and configuration | Site-wide |
| `screensaver-loader.html` | Loads screensaver JS resources | Site-wide |

## Dependencies

These partials depend on:
- CSS: `assets/css/logo-gradient-switcher.css`
- CSS: `assets/css/quote-banner.css` 
- CSS: `assets/css/custom.css`
- CSS: `assets/css/screensaver.css`
- JS: `assets/js/logo-gradient-switcher.js`
- JS: `assets/js/quote-banner.js`
- JS: `assets/js/screensaver.js`
- JS: `assets/js/screensaver-controls.js`
- Config: `config/_default/params.toml` (logo presets, quote banner settings, screensaver settings)
- Data: `data/quotes.json`
