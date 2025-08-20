function initLogoGradientSwitcher() {
    // Prevent multiple initializations
    if (window.logoGradientSwitcherInitialized) {
        // already initialized
        return;
    }
    window.logoGradientSwitcherInitialized = true;

    const configScript = document.getElementById('andrew-logo-gradient-presets');
    if (!configScript) {
        // presets script not found
        return;
    }

    let presets;
    try {
    // Trim to avoid stray whitespace issues
    const raw = (configScript.textContent || '').trim();
    presets = JSON.parse(raw);
        // Some templates/tools may double-encode JSON; if we parsed a string, parse again
        if (typeof presets === 'string') {
            // reparsing stringified JSON
            presets = JSON.parse(presets);
        }
    } catch (e) {
        console.error('Failed to parse logo gradient presets:', e);
        return;
    }

    // Validate shape: expect an array of objects with `stops`
    const isArray = Array.isArray(presets);
    const looksValid = isArray && presets.length > 0 && typeof presets[0] === 'object' && Array.isArray(presets[0].stops);

    if (!looksValid) {
        console.warn('Logo gradient presets not in expected shape.');
        return;
    }

    const logo = document.querySelector('.logo.custom-logo-text');
    // New: use footer author name as the trigger (easter egg)
    const footer = document.getElementById('site-footer');
    let triggerEl = null;
    if (footer) {
        const firstP = footer.querySelector('p');
        if (firstP) {
            // Try to wrap the author name text with a span to serve as trigger
            const authorName = (configScript.getAttribute('data-author-name') || '').trim();
            if (authorName) {
                // Search each text node within the paragraph for the author name
                const walker = document.createTreeWalker(firstP, NodeFilter.SHOW_TEXT, null);
                let found = false;
                const lowerAuthor = authorName.toLowerCase();
                while (!found) {
                    const node = walker.nextNode();
                    if (!node) break;
                    const text = node.nodeValue || '';
                    const idx = text.toLowerCase().indexOf(lowerAuthor);
                    if (idx >= 0) {
                        const before = document.createTextNode(text.slice(0, idx));
                        const matchText = text.slice(idx, idx + authorName.length);
                        const after = document.createTextNode(text.slice(idx + authorName.length));
                        const span = document.createElement('span');
                        span.id = 'footer-author-trigger';
                        span.textContent = matchText;
                        span.style.cursor = 'pointer';
                        span.setAttribute('role', 'button');
                        span.setAttribute('tabindex', '0');
                        const parent = node.parentNode;
                        parent.replaceChild(after, node);
                        parent.insertBefore(span, after);
                        parent.insertBefore(before, span);
                        triggerEl = span;
                        found = true;
                        break;
                    }
                }
            }
            // Fallbacks: any anchor inside, else the paragraph itself
            if (!triggerEl) triggerEl = firstP.querySelector('a');
            if (!triggerEl) triggerEl = firstP;
        }
    }
    
    if (!logo) {
        console.warn('Logo element not found (.logo.custom-logo-text)');
        return;
    }
    if (!triggerEl) {
        console.warn('Footer trigger element not found');
        return;
    }

    let currentPresetIndex = 0;
    const STORAGE_KEY_NAME = 'logoGradientPresetName';
    const LEGACY_STORAGE_KEY_INDEX = 'logoGradientPresetIndex';

    // Helper to find index by preset name (case-insensitive)
    const findIndexByName = (name) => {
        if (!name) return -1;
        const target = String(name).toLowerCase();
        return presets.findIndex(p => (p && p.name ? String(p.name).toLowerCase() : '') === target);
    };

    // Load saved preset by name first
    const savedName = localStorage.getItem(STORAGE_KEY_NAME);
    let idxByName = findIndexByName(savedName);
    
    // Migrate legacy index if needed
    if (idxByName < 0) {
        const legacyIndex = localStorage.getItem(LEGACY_STORAGE_KEY_INDEX);
        if (legacyIndex !== null && !isNaN(legacyIndex)) {
            const parsed = parseInt(legacyIndex, 10) % presets.length;
            if (!Number.isNaN(parsed) && parsed >= 0 && parsed < presets.length) {
                currentPresetIndex = parsed;
                // Save by name for future stability
                const name = presets[currentPresetIndex]?.name;
                if (name) localStorage.setItem(STORAGE_KEY_NAME, name);
                // Optional: remove legacy key
                try { localStorage.removeItem(LEGACY_STORAGE_KEY_INDEX); } catch (_) {}
            }
        }
    } else {
        currentPresetIndex = idxByName;
    }

    function applyPreset(index) {
        const preset = presets[index];
        if (!preset || !preset.stops) return;

        const stops = preset.stops.join(', ');

    // Single path: update the shared CSS variable used by base styles
    document.documentElement.style.setProperty('--logo-gradient-stops', stops);

    // Persist stops for early paint on next load
    try { localStorage.setItem('logoGradientStops', stops); } catch (_) {}

    // Update tooltip for all presets
        const label = `Switch logo gradient. Current: ${preset.name}`;
        triggerEl.setAttribute('aria-label', label);
        triggerEl.setAttribute('data-tooltip', label);

        // Ensure animation is enabled and visibly restarts
        logo.classList.remove('no-animate');
        try {
            // Restart animation to ensure immediate motion after switch
            logo.style.animation = 'none';
            // Force reflow
            // eslint-disable-next-line no-unused-expressions
            logo.offsetHeight;
            logo.style.animation = '';
        } catch (_) {}
    }

    // Always call applyPreset for the initial preset, but the function now handles default differently
    applyPreset(currentPresetIndex);
    
    // Mark tooltip ready only after first application to avoid flash
    triggerEl.setAttribute('data-ready', '1');

    // Handle trigger click
    const advance = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        currentPresetIndex = (currentPresetIndex + 1) % presets.length;
        applyPreset(currentPresetIndex);
        const name = presets[currentPresetIndex]?.name;
        if (name) {
            localStorage.setItem(STORAGE_KEY_NAME, name);
            try { localStorage.removeItem(LEGACY_STORAGE_KEY_INDEX); } catch (_) {}
        }
    };

    triggerEl.addEventListener('click', advance);
    // Prevent text selection on rapid clicks / double-clicks
    triggerEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });
    // Keyboard accessibility: Enter or Space
    triggerEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            advance(e);
        }
    });
}

// Run the initializer once the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Add a small delay to ensure all CSS is loaded
        setTimeout(initLogoGradientSwitcher, 100);
    });
} else {
    // If DOM is already loaded, wait a bit for CSS to be processed
    setTimeout(initLogoGradientSwitcher, 100);
}
