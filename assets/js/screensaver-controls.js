/**
 * Screensaver Controls - Handles opacity slider for the screensaver
 * This file manages the interactive controls for adjusting screensaver opacity
 */

// Inject the opacity slider when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('screensaver');
  if (!overlay) return;

  // Wrapper containing icon + slider (slider reveals on hover)
  const wrap = document.createElement('div');
  wrap.id = 'screensaver-opacity-wrap';
  wrap.style.display = 'none'; // Force hidden initially
  wrap.innerHTML = `
    <div id="screensaver-opacity-icon" aria-label="Adjust background darkness" role="button" tabindex="0"></div>
    <div id="screensaver-opacity-slider-wrap">
      <input id="screensaver-opacity-slider" type="range" min="0" max="100" value="5" aria-label="Screensaver background darkness" />
    </div>`;
  document.body.appendChild(wrap);

  const slider = wrap.querySelector('#screensaver-opacity-slider');
  slider.addEventListener('input', () => {
    // Inverted mapping: slider top (value 100) -> minimum darkness (opacity 0), bottom (0) -> max darkness (1)
    const raw = parseInt(slider.value, 10) / 100;
    const v = 1 - raw;
    overlay.dataset.userOpacity = v.toString();
  });

  // Show controls when screensaver fade completes
  overlay.addEventListener('screensaverfadecomplete', () => {
    if (overlay.classList.contains('active') && overlay.dataset.fadeComplete === '1') {
      wrap.style.display = 'flex';
    }
  });

  // When screensaver first activates, force-hide wrapper until fade completes
  const hideOnActivate = () => {
    wrap.style.display = 'none';
  };

  // Hide immediately when screensaver starts
  overlay.addEventListener('transitionstart', hideOnActivate);
  
  // Also hide when active class is added (backup)
  const hideOnClassChange = new MutationObserver(() => {
    if (overlay.classList.contains('active') && overlay.dataset.fadeComplete !== '1') {
      wrap.style.display = 'none';
    }
  });
  hideOnClassChange.observe(overlay, { attributes: true, attributeFilter: ['class'] });
});
