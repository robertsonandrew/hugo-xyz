<div align="center">

# 🌐 Hugo Blowfish Custom

Modern, performant Hugo site with animated branding, quote banner, interactive screensaver, and polished homepage UX.

[![Hugo](https://img.shields.io/badge/Hugo-Extended-FF4088?logo=hugo)](https://gohugo.io/)
[![Theme](https://img.shields.io/badge/Theme-Blowfish-00D4AA)](https://blowfish.page/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Static Hosting](https://img.shields.io/badge/Deploy-Static%20Site-0ea5e9)](#-quick-start)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

> Static‑first: no runtime external fetches, zero third‑party JS, predictable performance.

---

## 📚 Table of Contents
* [Feature Matrix](#-feature-matrix)
* [Quick Start](#-quick-start)
* [Screenshots](#-screenshots)
* [Gradient Logo](#-gradient-logo)
* [Homepage Customizations](#-homepage-customizations)
* [Quote Banner](#-quote-banner)
* [Screensaver](#-screensaver)
* [Development](#-development)
* [Troubleshooting](#-troubleshooting)
* [Architecture](#-architecture)
* [Project Stats](#-project-stats)
* [Contributing](#-contributing)
* [License](#-license)

---

## ✨ Feature Matrix
| Feature | Status | Key Point |
|---------|--------|-----------|
| 🎨 Gradient Logo | Stable | Multi-stop animated via CSS vars |
| 🖼️ Homepage Hover | Stable | Dual image fade (primary + hover) |
| 💬 Quote Banner | Production | Local JSON rotation + optional weighting |
| 🌌 Screensaver | Production | Idle starfield / satellites + glass controls |
| ⚡ Performance | Active | Minimal DOM churn / pre-bundled |
| ♿ Accessibility | Active | Keyboard & reduced-motion aware |

---

## 🚀 Quick Start
Prereqs: Hugo Extended, Node.js (for quote updates).
```bash
git clone <this-repo-url>
cd andrew-hugo-warp
hugo server --disableFastRender
```
Visit http://localhost:1313

Optional quotes refresh:
```bash
API_NINJAS_KEY=your_key ADVICE_LIMIT=20 DADJOKES_LIMIT=15 QUOTES_LIMIT=25 node scripts/update-quotes.js
```

---

## 📸 Screenshots
| Preview | Description |
|---------|-------------|
| ![Gradient Logo](static/images/screenshot-logo.png) | Animated multi-stop gradient text |
| ![Quote Banner](static/images/screenshot-quote-banner.png) | Banner with author rule |
| ![Homepage Hover](static/images/screenshot-home-hover.png) | Dual image hero swap |
| ![Screensaver](static/images/screenshot-screensaver.png) | Starfield overlay active |

Add images under `static/images/` (≈1200px hero, 800px components). Prefer WebP.

---

## 🎨 Gradient Logo
`config/_default/params.toml`:
```toml
customLogo = "arobertsonxyz"
logoStyle = "gradient"
logoGradientStops = ["#1d4ed8","#7c3aed","#0ea5e9"]
logoGradientAngle = 135
logoAnimationSpeed = "6s"
```
Tips: Angle 120–150; hard refresh (Cmd+Shift+R) after edits. Solid text? Check `logoStyle`.

---

## 🏠 Homepage Customizations
Content: `content/_index.md`
Partial: `layouts/partials/home/custom.html`
Hover images:
```toml
customHomepageImage = "images/homepage-image.png"
customHomepageImageSwitch = "images/homepage-image-switch.png"
```
Social links (icons auto-rendered):
```toml
[author]
  name = "Andrew Robertson"
  headline = "Full-Stack Developer | DevOps Engineer | Generative AI Enthusiast"
  image = "images/homepage-image.png"
  links = [
    { github = "https://github.com/arobertson67" },
    { linkedin = "https://linkedin.com/in/andrew-robertson-ab7a57103" }
  ]
```

---

## 💬 Quote Banner
Per-page enable (front matter):
```yaml
---
title: Example
show_quote_banner: true
---
```
Global settings:
```toml
[quoteBanner]
  enabled = true
  refreshInterval = 2000
  showDelay = 300
  fadeTransitionDuration = 400
  lightModeGradient = ["#667eea","#764ba2"]
  darkModeGradient  = ["#db2777","#9333ea"]
  # weights = { quotes = 3, advice = 2, dadjokes = 1 }
  # selectionMode = "random"
```
Update quotes:
```bash
API_NINJAS_KEY=your_key ADVICE_LIMIT=20 node scripts/update-quotes.js
```
Script CONFIG supports: `ADVICE_LIMIT`, `DADJOKES_LIMIT`, `QUOTES_LIMIT`, `KEEP_EXISTING`.

---

## 🌌 Screensaver
### Overview
Beautiful starfield screensaver with glass-morphic transparency controls. Activates after idle periods with smooth animations.

### Features
- **🌟 Starfield Animation**: Configurable floating stars with smooth movement
- **🎛️ Live Controls**: Glass-morphic slider for transparency adjustment
- **✨ Mouse Parallax**: 3D depth illusion with mouse-responsive star layers
- **⚡ Smart Timing**: Synchronized fade-in with user controls
- **📱 Responsive**: Works on desktop, tablet, and mobile
- **♿ Accessible**: Keyboard navigation and screen reader support

### Quick Setup
Add to `config/_default/params.toml`:
```toml
[screensaver]
  enable = true
  idleTimeout = 10000      # 10 seconds
  fadeDuration = 10000     # 10 second fade-in
  backgroundOpacity = 0.95 # Default darkness
  starCount = 200         # Number of stars
  showHint = true         # Show "Click to exit"
```

### File Structure
```
your-hugo-site/
├── config/_default/
│   └── params.toml              # Screensaver settings
├── assets/
│   ├── css/
│   │   └── custom.css          # Styling (glass-morphic effects)
│   └── js/
│       └── screensaver.js      # Core animation logic
└── layouts/partials/
    └── extend-footer.html      # Integration & controls
```

### Customization Examples

#### Change Star Density
```toml
[screensaver]
  starCount = 300  # Dense starfield
  # or
  starCount = 100  # Minimal stars
```

#### Adjust Timing
```toml
[screensaver]
  idleTimeout = 5000   # 5 second activation
  fadeDuration = 15000 # 15 second fade-in
```

#### Performance Tuning
```toml
[screensaver]
  starCount = 150      # Reduce for older devices
  showHint = false     # Minimize DOM elements
```

### CSS Customization
Edit `assets/css/custom.css`:

```css
/* Custom star colors */
#screensaver-overlay canvas {
  filter: hue-rotate(45deg); /* Golden stars */
}

/* Custom slider styling */
#screensaver-opacity-slider {
  height: 16px; /* Thicker track */
}

/* Custom hint styling */
.screensaver-hint {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
}
```

### Parallax Effect Details
The 3D parallax creates depth illusion through:
- **Depth Assignment**: Each star gets random depth value (1-5)
- **Parallax Strength**: `depth * 0.02` determines movement sensitivity  
- **Mouse Tracking**: Normalized to -1 to +1 range for smooth calculations
- **Smooth Interpolation**: `mouseX += (targetMouseX - mouseX) * 0.05` for fluid motion
- **Visual Depth Cues**: 
  - Far stars (depth 1): Dimmer, smaller, less movement
  - Close stars (depth 5): Brighter, larger, more movement

---

## 🧪 Development
```bash
hugo server --disableFastRender
node scripts/update-quotes.js --dry-run
hugo --minify
```
Optional: Lighthouse audit `http://localhost:1313`.

---

## 🛠️ Troubleshooting
| Issue | Action |
|-------|--------|
| Logo not animated | Ensure `logoStyle = "gradient"`; hard refresh |
| Banner missing | Per-page flag + `[quoteBanner].enabled` |
| Quotes stale | Run update script with API key |
| Layout jump | Use modern browser (needs `:has()`) |
| Screensaver absent | Check `enable` + idle activity noise |
| Low FPS screensaver | Lower `starCount` / raise `starSpeed` |

---

## 🧱 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Hugo Config   │───▶│   JavaScript    │───▶│   CSS Styling   │
│   params.toml   │    │   screensaver.js│    │   custom.css    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Quote Data    │    │   Canvas API    │    │  Glass-morphic  │
│   quotes.json   │    │   Animation     │    │    Effects      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```
Principles: static-first, explicit enable flags, CSS-driven layout shifts, no runtime network.
---

## 📊 Project Stats
| Metric | Value |
|--------|-------|
| Core Custom Systems | 4 |
| External JS Deps | 0 |
| CSS Effects | 3+ |
| Lighthouse Target | 95+ |
| Update Script | `scripts/update-quotes.js` |

---

## 🤝 Contributing
PRs welcome (accessibility, performance, new rotation modes). Keep changes atomic & documented.

---

## 📜 License
MIT – see `LICENSE`.

---

<div align="center">
Made with ❤️ using Hugo & Blowfish
</div>


