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