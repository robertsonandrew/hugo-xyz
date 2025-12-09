/**
 * Screensaver Controls - Arc Menu
 * Expandable radial menu for density, opacity, and parallax controls
 */

(function() {
  'use strict';

  // ============================================
  // Configuration & Presets
  // ============================================
  
  const densityPresets = [
    { name: 'Minimal', stars: 30, speed: 0.04 },
    { name: 'Default', stars: null, speed: null }, // Set from config
    { name: 'Dense', stars: 150, speed: 0.1 },
    { name: 'Hyperdrive', stars: 300, speed: 0.2 }
  ];

  const opacityLevels = [1.0, 0.6, 0.3, 0]; // 100% → 60% → 30% → 0%
  
  const parallaxLevels = [0.3, 0.7, 1.0, 1.5]; // Low → Medium → Default → High

  // State
  let isExpanded = false;
  let autoCollapseTimer = null;
  let currentDensityIndex = 1;
  let currentOpacityIndex = 0;
  let currentParallaxIndex = 2; // Default = 1.0

  // ============================================
  // Initialization
  // ============================================

  function getDefaults() {
    const config = window.screensaverConfig || {};
    return {
      stars: config.starcount || 75,
      speed: config.motionspeed || config.starspeed || 0.08,
      opacity: config.backgroundopacity || 0.75,
      parallax: config.parallaxintensity || 1.0
    };
  }

  function initDefaults() {
    const defaults = getDefaults();
    densityPresets[1].stars = defaults.stars;
    densityPresets[1].speed = defaults.speed;
    
    // Find closest opacity level
    currentOpacityIndex = findClosestIndex(opacityLevels, defaults.opacity);
    
    // Find closest parallax level
    currentParallaxIndex = findClosestIndex(parallaxLevels, defaults.parallax);
  }

  function findClosestIndex(arr, value) {
    let closest = 0;
    let minDiff = Math.abs(arr[0] - value);
    arr.forEach((v, i) => {
      const diff = Math.abs(v - value);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });
    return closest;
  }

  // ============================================
  // Menu Toggle
  // ============================================

  function expand() {
    const container = document.getElementById('screensaver-controls');
    const trigger = document.getElementById('screensaver-trigger');
    if (!container) return;
    
    isExpanded = true;
    container.classList.add('expanded');
    trigger?.classList.add('expanded');
    
    resetAutoCollapse();
  }

  function collapse() {
    const container = document.getElementById('screensaver-controls');
    const trigger = document.getElementById('screensaver-trigger');
    if (!container) return;
    
    isExpanded = false;
    container.classList.remove('expanded');
    trigger?.classList.remove('expanded');
    
    clearAutoCollapse();
  }

  function toggle() {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  }

  function resetAutoCollapse() {
    clearAutoCollapse();
    autoCollapseTimer = setTimeout(collapse, 5000);
  }

  function clearAutoCollapse() {
    if (autoCollapseTimer) {
      clearTimeout(autoCollapseTimer);
      autoCollapseTimer = null;
    }
  }

  // ============================================
  // Tooltip Management
  // ============================================

  function updateTooltip(text) {
    const tooltip = document.getElementById('arc-tooltip');
    if (tooltip) {
      tooltip.textContent = text;
      tooltip.classList.add('visible');
    }
  }

  function hideTooltip() {
    const tooltip = document.getElementById('arc-tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  // ============================================
  // Control Actions
  // ============================================

  function cycleDensity() {
    currentDensityIndex = (currentDensityIndex + 1) % densityPresets.length;
    const preset = densityPresets[currentDensityIndex];
    
    // Update visual
    const dot = document.getElementById('arc-density');
    if (dot) {
      dot.dataset.level = currentDensityIndex;
      dot.dataset.tooltip = preset.name;
    }
    
    // Dispatch event for screensaver
    window.dispatchEvent(new CustomEvent('screensaver-density-change', {
      detail: { 
        stars: preset.stars, 
        speed: preset.speed, 
        presetIndex: currentDensityIndex,
        smooth: true // Request smooth transition
      }
    }));
    
    resetAutoCollapse();
  }

  function cycleOpacity() {
    currentOpacityIndex = (currentOpacityIndex + 1) % opacityLevels.length;
    const opacity = opacityLevels[currentOpacityIndex];
    
    // Update visual
    const dot = document.getElementById('arc-opacity');
    if (dot) {
      dot.dataset.level = 3 - currentOpacityIndex; // Reverse for visual
      const labels = ['100%', '60%', '30%', '0%'];
      dot.dataset.tooltip = `Opacity: ${labels[currentOpacityIndex]}`;
    }
    
    // Dispatch event for screensaver
    window.dispatchEvent(new CustomEvent('screensaver-opacity-change', {
      detail: { opacity: opacity }
    }));
    
    resetAutoCollapse();
  }

  function cycleParallax() {
    currentParallaxIndex = (currentParallaxIndex + 1) % parallaxLevels.length;
    const intensity = parallaxLevels[currentParallaxIndex];
    
    // Update visual
    const dot = document.getElementById('arc-parallax');
    if (dot) {
      dot.dataset.level = currentParallaxIndex;
      const labels = ['Low', 'Medium', 'Default', 'High'];
      dot.dataset.tooltip = `Parallax: ${labels[currentParallaxIndex]}`;
    }
    
    // Dispatch event for screensaver
    window.dispatchEvent(new CustomEvent('screensaver-parallax-change', {
      detail: { intensity: intensity }
    }));
    
    resetAutoCollapse();
  }

  // ============================================
  // Reset (called when screensaver shows)
  // ============================================

  function reset() {
    collapse();
    initDefaults();
    currentDensityIndex = 1;
    currentOpacityIndex = findClosestIndex(opacityLevels, getDefaults().opacity);
    currentParallaxIndex = findClosestIndex(parallaxLevels, getDefaults().parallax);
    
    // Update visuals
    const densityDot = document.getElementById('arc-density');
    const opacityDot = document.getElementById('arc-opacity');
    const parallaxDot = document.getElementById('arc-parallax');
    
    if (densityDot) {
      densityDot.dataset.level = currentDensityIndex;
      densityDot.dataset.tooltip = densityPresets[currentDensityIndex].name;
    }
    if (opacityDot) {
      opacityDot.dataset.level = 3 - currentOpacityIndex;
      opacityDot.dataset.tooltip = `Opacity: ${['100%', '60%', '30%', '0%'][currentOpacityIndex]}`;
    }
    if (parallaxDot) {
      parallaxDot.dataset.level = currentParallaxIndex;
      parallaxDot.dataset.tooltip = `Parallax: ${['Low', 'Medium', 'Default', 'High'][currentParallaxIndex]}`;
    }
  }

  // ============================================
  // Event Binding
  // ============================================

  function init() {
    initDefaults();

    const container = document.getElementById('screensaver-controls');
    const trigger = document.getElementById('screensaver-trigger');
    const densityDot = document.getElementById('arc-density');
    const opacityDot = document.getElementById('arc-opacity');
    const parallaxDot = document.getElementById('arc-parallax');

    if (!container || !trigger) return;

    // Initial state
    container.style.display = 'none';
    
    // Set initial tooltips
    if (densityDot) densityDot.dataset.tooltip = densityPresets[currentDensityIndex].name;
    if (opacityDot) opacityDot.dataset.tooltip = `Opacity: ${['100%', '60%', '30%', '0%'][currentOpacityIndex]}`;
    if (parallaxDot) parallaxDot.dataset.tooltip = `Parallax: ${['Low', 'Medium', 'Default', 'High'][currentParallaxIndex]}`;

    // Trigger click
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    // Keep menu open while hovering over container (desktop)
    container.addEventListener('mouseenter', () => {
      if (isExpanded) {
        clearAutoCollapse();
      }
    });

    container.addEventListener('mouseleave', () => {
      if (isExpanded) {
        resetAutoCollapse();
      }
      hideTooltip();
    });

    // Control clicks and hover tooltips
    if (densityDot) {
      densityDot.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleDensity();
        updateTooltip(`Density: ${densityPresets[currentDensityIndex].name}`);
      });
      densityDot.addEventListener('mouseenter', () => {
        updateTooltip(`Density: ${densityPresets[currentDensityIndex].name}`);
        clearAutoCollapse();
      });
    }

    if (opacityDot) {
      opacityDot.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleOpacity();
        updateTooltip(`Opacity: ${['100%', '60%', '30%', '0%'][currentOpacityIndex]}`);
      });
      opacityDot.addEventListener('mouseenter', () => {
        updateTooltip(`Opacity: ${['100%', '60%', '30%', '0%'][currentOpacityIndex]}`);
        clearAutoCollapse();
      });
    }

    if (parallaxDot) {
      parallaxDot.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleParallax();
        updateTooltip(`Parallax: ${['Low', 'Medium', 'Default', 'High'][currentParallaxIndex]}`);
      });
      parallaxDot.addEventListener('mouseenter', () => {
        updateTooltip(`Parallax: ${['Low', 'Medium', 'Default', 'High'][currentParallaxIndex]}`);
        clearAutoCollapse();
      });
    }

    // Prevent all clicks from bubbling to screensaver overlay
    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('mousedown', (e) => e.stopPropagation());
    container.addEventListener('touchstart', (e) => e.stopPropagation());

    // Collapse when clicking outside (on the screensaver overlay)
    document.getElementById('screensaver')?.addEventListener('click', () => {
      if (isExpanded) {
        collapse();
      }
    });

    // Expose API
    window.screensaverControls = {
      expand,
      collapse,
      toggle,
      reset,
      isExpanded: () => isExpanded
    };
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
