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
    const userPreference = localStorage.getItem('screensaverDisabled');
    let isEnabled = false;

    console.log('updateVisualState - userPreference:', userPreference);
    console.log('window.screensaverConfig:', window.screensaverConfig);

    if (userPreference === 'false') {
      // User explicitly enabled it
      isEnabled = true;
      console.log('User explicitly enabled screensaver');
    } else if (userPreference === 'true') {
      // User explicitly disabled it
      isEnabled = false;
      console.log('User explicitly disabled screensaver');
    } else {
      // No user preference, read config from JSON script tag
      const cfgTag = document.getElementById('screensaver-config');
      if (cfgTag) {
        try {
          // JSON on the page may be double-encoded ("{...}"), so parse defensively.
          const raw = cfgTag.textContent.trim();
          let config = JSON.parse(raw);
          if (typeof config === 'string') {
            // second parse to unwrap double-encoded JSON
            try { config = JSON.parse(config); } catch (e) { /* keep original string */ }
          }
          console.log('Raw config.enabled:', config && config.enabled, 'type:', typeof (config && config.enabled));
          isEnabled = config && (config.enabled === true || config.enabled === 'true');
          console.log('Read from JSON config:', config, 'isEnabled:', isEnabled);
        } catch (e) {
          console.error('Failed to parse JSON config:', e);
          isEnabled = false;
        }
      } else {
        console.log('No screensaver-config element found');
      }
    }

    console.log('Final isEnabled:', isEnabled);

    // Show disabled state if screensaver is not enabled
    if (!isEnabled) {
      yearSpan.classList.add('disabled');
      console.log('Added disabled class to copyright year');
    } else {
      yearSpan.classList.remove('disabled');
      console.log('Removed disabled class from copyright year');
    }
  }

  // Set initial state
  updateVisualState();

  yearSpan.addEventListener('click', () => {
    const userPreference = localStorage.getItem('screensaverDisabled');

    // Determine current enabled state
    let isCurrentlyEnabled = false;
    if (userPreference === 'false') {
      isCurrentlyEnabled = true;
    } else if (userPreference === 'true') {
      isCurrentlyEnabled = false;
      } else {
        // No user preference, read config from JSON script tag (defensive parse)
        const cfgTag = document.getElementById('screensaver-config');
        if (cfgTag) {
          try {
            const raw = cfgTag.textContent.trim();
            let config = JSON.parse(raw);
            if (typeof config === 'string') {
              try { config = JSON.parse(config); } catch (e) { /* leave as-is */ }
            }
            isCurrentlyEnabled = config && (config.enabled === true || config.enabled === 'true');
          } catch (e) {
            console.error('Failed to parse screensaver config for click handler:', e);
            isCurrentlyEnabled = false;
          }
        }
      }

    if (isCurrentlyEnabled) {
      // User wants to DISABLE screensaver
      localStorage.setItem('screensaverDisabled', 'true');
      if (window.screensaverConfig) {
        window.screensaverConfig.enabled = false;
      }
    } else {
      // User wants to ENABLE screensaver
      localStorage.setItem('screensaverDisabled', 'false');
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