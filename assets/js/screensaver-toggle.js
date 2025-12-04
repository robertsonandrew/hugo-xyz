document.addEventListener('DOMContentLoaded', function () {
  const copyrightP = document.querySelector('#site-footer p:first-child');

  if (!copyrightP) return;

  const year = new Date().getFullYear().toString();
  try {
    copyrightP.innerHTML = copyrightP.innerHTML.replace(year, `<span id="copyright-year">${year}</span>`);
  } catch (e) {
    console.error("Failed to inject copyright year span", e);
    return;
  }

  const yearSpan = document.getElementById('copyright-year');
  if (!yearSpan) return;

  // Set initial visual state based on whether screensaver is currently enabled
  function updateVisualState() {
  const userPreference = sessionStorage.getItem('screensaverDisabled');
    let isEnabled = false;

    // Debug info removed for production

    if (userPreference === 'false') {
      // User explicitly enabled it
      isEnabled = true;
      // User explicitly enabled screensaver
    } else if (userPreference === 'true') {
      // User explicitly disabled it
      isEnabled = false;
      // User explicitly disabled screensaver
    } else {
      // No user preference, read config from JSON script tag (use shared helper when available)
      try {
        const config = (typeof window.parseScreensaverConfig === 'function') ? window.parseScreensaverConfig() : (function() {
          const cfgTag = document.getElementById('screensaver-config');
          if (!cfgTag) return {};
          try { return JSON.parse(cfgTag.textContent.trim()); } catch (e) { return {}; }
        })();
        // Parse config enabled state
        isEnabled = config && (config.enabled === true || config.enabled === 'true');
      } catch (e) {
        console.error('Failed to parse JSON config:', e);
        isEnabled = false;
      }
    }

    // Show disabled state if screensaver is not enabled
    if (!isEnabled) {
      yearSpan.classList.add('disabled');
    } else {
      yearSpan.classList.remove('disabled');
    }
  }

  // Set initial state
  updateVisualState();

  yearSpan.addEventListener('click', () => {
  const userPreference = sessionStorage.getItem('screensaverDisabled');

    // Determine current enabled state
    let isCurrentlyEnabled = false;
    if (userPreference === 'false') {
      isCurrentlyEnabled = true;
    } else if (userPreference === 'true') {
      isCurrentlyEnabled = false;
      } else {
        // No user preference, read config from JSON script tag (use shared helper when available)
        try {
          const config = (typeof window.parseScreensaverConfig === 'function') ? window.parseScreensaverConfig() : {};
          isCurrentlyEnabled = config && (config.enabled === true || config.enabled === 'true');
        } catch (e) {
          console.error('Failed to parse screensaver config for click handler:', e);
          isCurrentlyEnabled = false;
        }
      }

    if (isCurrentlyEnabled) {
      // User wants to DISABLE screensaver
  sessionStorage.setItem('screensaverDisabled', 'true');
      if (window.screensaverConfig) {
        window.screensaverConfig.enabled = false;
      }
    } else {
      // User wants to ENABLE screensaver
  sessionStorage.setItem('screensaverDisabled', 'false');
      if (window.screensaverConfig) {
        window.screensaverConfig.enabled = true;
      }
    }

    // Update visual state
    updateVisualState();

    // Notify screensaver system of state change (if available)
    if (window.updateScreensaverState) {
      window.updateScreensaverState();
    } else {
      // Fallback: reload page if screensaver system not ready
      location.reload();
    }
  });
});