/*
 * Minimal Starfield Screensaver
 * Features:
 *  - Idle timeout triggers fade-in overlay (FADE_DURATION) to BACKGROUND_OPACITY
 *  - Stars spawn uniformly; constant size & opacity; wrap at edges (no gravity, twinkle, or FPS caps)
 *  - Config params (lowercased): enabled, idletimeout, starcount, starminsize, starmaxsize, starspeed, fadeduration, backgroundopacity, pauseonblur, showhint
 *  - Tiny opacity slider (bottom-right) lets user adjust background darkness live (not persisted)
 *  - Simple, dependency-free; future toggling via ENABLED param
 */
// Simple custom starfield screensaver
const SCREENSAVER_ID = 'screensaver';
const CANVAS_ID = 'screensaver-canvas';

let config = window.screensaverConfig || {};

// Defensive config parser: reads #screensaver-config and handles double-encoded JSON
function parseScreensaverConfigFromTag() {
	const cfgTag = document.getElementById('screensaver-config');
	if (!cfgTag) return {};
	try {
		const raw = cfgTag.textContent.trim();
		let parsed = JSON.parse(raw);
		if (typeof parsed === 'string') {
			try { parsed = JSON.parse(parsed); } catch (e) { /* keep string */ }
		}
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch (e) {
		return {};
	}
}

// Expose helper for other modules
window.parseScreensaverConfig = parseScreensaverConfigFromTag;

if (!Object.keys(config).length) {
	const parsed = parseScreensaverConfigFromTag();
	if (parsed && Object.keys(parsed).length) config = parsed;
}
// Normalize keys to lowercase (Hugo params can vary in case)
if (config && typeof config === 'object') {
	const lower = {};
	for (const k in config) {
		lower[k.toLowerCase()] = config[k];
	}
	config = lower;
}

// Parse config if it's a JSON string (from Hugo template)
if (typeof config === 'string') {
	try {
		config = JSON.parse(config);
	} catch (e) {
		console.error('Failed to parse screensaver config:', e);
		config = {};
	}
}



// Config values (keys lowercased by Hugo)
const IDLE_TIMEOUT = config.idletimeout !== undefined ? config.idletimeout : 15000;
const FADE_DURATION = config.fadeduration !== undefined ? config.fadeduration : 10000;
const BACKGROUND_OPACITY = config.backgroundopacity !== undefined ? config.backgroundopacity : 0.95;
const DEFAULT_STAR_COUNT = config.starcount !== undefined ? config.starcount : 25;
let STAR_COUNT = DEFAULT_STAR_COUNT; // Now mutable for presets
const STAR_MIN_SIZE = config.starminsize !== undefined ? config.starminsize : 2;
const STAR_MAX_SIZE = config.starmaxsize !== undefined ? config.starmaxsize : 5;
// Unified rotation speed (radians/second). Support legacy starspeed and new motionspeed.
const DEFAULT_MOTION_SPEED = (
	config.motionspeed !== undefined ? config.motionspeed :
	(config.starspeed !== undefined ? config.starspeed : 0.05)
);
let ROTATION_SPEED = DEFAULT_MOTION_SPEED; // Now mutable for presets
// Parallax intensity (0-2.0 range, default 1.0)
const DEFAULT_PARALLAX_INTENSITY = config.parallaxintensity !== undefined ? Math.max(0.1, Math.min(2.0, config.parallaxintensity)) : 1.0;
let parallaxIntensity = DEFAULT_PARALLAX_INTENSITY;
const PAUSE_ON_BLUR = config.pauseonblur !== undefined ? !!config.pauseonblur : true;
const SHOW_HINT = config.showhint !== undefined ? !!config.showhint : true;

// Function to get the current enabled state (checks live config)
function getCurrentEnabledState() {
	// Check window.screensaverConfig first (may be modified by toggle)
	if (window.screensaverConfig && typeof window.screensaverConfig.enabled === 'boolean') {
		return window.screensaverConfig.enabled;
	}

	// Fallback to sessionStorage toggle (session-only preference)
	const userDisabled = sessionStorage.getItem('screensaverDisabled') === 'true';
	if (userDisabled) return false;

	// Finally check original config setting
	return config.enabled !== undefined ? Boolean(config.enabled) : true;
}

// Function to check if screensaver is actually enabled (respects both config and localStorage)
function isScreensaverEnabled() {
	return getCurrentEnabledState();
}
// Legacy constant for backward compatibility
const PARALLAX_INTENSITY = DEFAULT_PARALLAX_INTENSITY;
// Gravity removed in simplified version; legacy param ignored if present
const GRAVITY_STRENGTH = 0;
// spawn fade removed for simplicity

// Function to update effective star count based on current enabled state
function updateEffectiveStarCount() {
	effectiveStarCount = getCurrentEnabledState() ? STAR_COUNT : 0;
}

let effectiveStarCount = 0;
let idleTimer = null;
let screensaverActive = false;
let fadeStart = null;
let fadeAlpha = 0;
let animationFrame = null;
let stars = [];
// Global rotation state
let globalRotation = 0;
let lastTimestamp = null;
// Parallax mouse tracking
let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;
// No frame skipping logic (maxFPS removed)
// Gravity-related state removed

function randomBetween(a, b) {
	return a + Math.random() * (b - a);
}

function createStar(centerX, centerY) {
	// Spawn within a circle large enough to cover the full viewport when rotated
	const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
	const theta = randomBetween(0, 2 * Math.PI);
	// sqrt for uniform distribution over area
	const radius = Math.sqrt(Math.random()) * maxRadius;
	const baseX = centerX + Math.cos(theta) * radius;
	const baseY = centerY + Math.sin(theta) * radius;

	// Depth: 1 (far) to 8 (close)
	const depth = Math.round(randomBetween(1, 8));
	const depthFactor = depth / 8;

	// Base size strictly within [STAR_MIN_SIZE, STAR_MAX_SIZE]
	const size = Math.min(
		STAR_MAX_SIZE,
		Math.max(STAR_MIN_SIZE, randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE))
	);
	const opacity = randomBetween(0.2, 1.0) * (0.4 + depthFactor * 0.7);

	// Parallax strength varies with depth
	const parallaxStrength = 0.005 + depthFactor * 0.025;

	// Fade-in timing: stagger stars over 2 seconds
	const fadeInDelay = randomBetween(0, 2000); // 0-2 seconds
	const fadeInDuration = 1000; // 1 second fade

	return {
		// Static base position; rendering applies a global rotation each frame
		baseX,
		baseY,
		size,
		baseSize: size,
		opacity,
		baseOpacity: opacity,
		depth,
		parallaxStrength,
		fadeInDelay,
		fadeInDuration
	};
}

function resetStars(centerX, centerY) {
	stars = [];
	const count = effectiveStarCount;
	for (let i = 0; i < count; i++) {
		stars.push(createStar(centerX, centerY));
	}
}

// Smooth star transition support
let smoothTransitionEnabled = false;
const STAR_FADE_DURATION = 500; // ms for fade in/out

function reconcileStarCount(centerX, centerY) {
	const target = effectiveStarCount;
	const currentTime = performance.now();
	
	if (stars.length < target) {
		// Add stars gradually with fade-in
		const toAdd = smoothTransitionEnabled ? Math.min(3, target - stars.length) : Math.min(5, target - stars.length);
		for (let i = 0; i < toAdd; i++) {
			const star = createStar(centerX, centerY);
			if (smoothTransitionEnabled) {
				star.fadeStartTime = currentTime;
				star.fadeInDelay = 0;
				star.fadeInDuration = STAR_FADE_DURATION;
			}
			stars.push(star);
		}
	} else if (stars.length > target) {
		if (smoothTransitionEnabled) {
			// Mark excess stars for fade-out instead of instant removal
			const toRemove = Math.min(5, stars.length - target);
			for (let i = 0; i < toRemove; i++) {
				const idx = stars.length - 1 - i;
				if (idx >= 0 && !stars[idx].fadingOut) {
					stars[idx].fadingOut = true;
					stars[idx].fadeOutStart = currentTime;
				}
			}
			// Remove fully faded stars
			stars = stars.filter(star => {
				if (!star.fadingOut) return true;
				const fadeProgress = (currentTime - star.fadeOutStart) / STAR_FADE_DURATION;
				return fadeProgress < 1;
			});
		} else {
			stars.length = target; // trim extras instantly
		}
	}
	window.__stars = stars;
}

function drawStarfield(ctx, width, height, centerX, centerY) {
	// Clear using CSS pixel dimensions (context already scaled for DPR)
	ctx.clearRect(0, 0, width, height);
	ctx.save();
	ctx.globalAlpha = 1;
	
	// Enhanced smooth mouse interpolation with easing
	const ease = 0.08; // Slightly more responsive
	mouseX += (targetMouseX - mouseX) * ease;
	mouseY += (targetMouseY - mouseY) * ease;
	
	// Render all stars rotated as a unified field
	for (const star of stars) {
		const depthFactor = star.depth / 8;
		const size = star.baseSize;
		const opacity = star.baseOpacity;

		// Rotate base position around center
		const dx = star.baseX - centerX;
		const dy = star.baseY - centerY;
		const cosA = Math.cos(globalRotation);
		const sinA = Math.sin(globalRotation);
		const rotatedX = centerX + dx * cosA - dy * sinA;
		const rotatedY = centerY + dx * sinA + dy * cosA;

		// Depth-aware parallax
		const depthParallaxScale = 0.5 + (star.depth / 8) * 1.5;
		const parallaxX = mouseX * star.parallaxStrength * width * depthParallaxScale * parallaxIntensity;
		const parallaxY = mouseY * star.parallaxStrength * height * depthParallaxScale * parallaxIntensity;
		const renderX = rotatedX + parallaxX;
		const renderY = rotatedY + parallaxY;

		// Calculate fade-in progress for this star
		const currentTime = performance.now();
		const elapsedSinceStart = currentTime - star.fadeStartTime;
		let fadeInProgress = Math.max(0, Math.min(1, (elapsedSinceStart - star.fadeInDelay) / star.fadeInDuration));
		
		// Handle fade-out for stars being removed
		let fadeOutMultiplier = 1;
		if (star.fadingOut) {
			const fadeOutProgress = (currentTime - star.fadeOutStart) / STAR_FADE_DURATION;
			fadeOutMultiplier = Math.max(0, 1 - fadeOutProgress);
		}
		
		// Apply fade-in and fade-out to opacity
		const fadeInAlpha = opacity * fadeInProgress * fadeOutMultiplier;
		const depthAlpha = fadeInAlpha * (0.2 + depthFactor * 0.8);
		const renderRadius = Math.min(size * 0.5, STAR_MAX_SIZE * 0.5);

		// Skip rendering if star would be off-screen
		const margin = size * 2;
		if (renderX < -margin || renderX > width + margin || renderY < -margin || renderY > height + margin) continue;

		ctx.save();
		ctx.globalAlpha = depthAlpha;
		const gradient = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, renderRadius);
		if (star.depth > 6) {
			gradient.addColorStop(0, '#FFFFFF');
			gradient.addColorStop(0.3, '#F8F9FA');
			gradient.addColorStop(0.7, '#E9ECEF');
			gradient.addColorStop(1, 'rgba(220, 225, 235, 0.1)');
		} else if (star.depth > 3) {
			gradient.addColorStop(0, '#F8F9FA');
			gradient.addColorStop(0.4, '#E9ECEF');
			gradient.addColorStop(0.8, '#DEE2E6');
			gradient.addColorStop(1, 'rgba(200, 210, 220, 0.05)');
		} else {
			gradient.addColorStop(0, '#E9ECEF');
			gradient.addColorStop(0.5, '#DEE2E6');
			gradient.addColorStop(0.9, 'rgba(180, 190, 200, 0.02)');
		}
		ctx.beginPath();
		ctx.arc(renderX, renderY, renderRadius, 0, 2 * Math.PI);
		ctx.fillStyle = gradient;
		ctx.shadowColor = star.depth > 5 ? '#FFFFFF' : '#F0F0F0';
		ctx.shadowBlur = Math.min(renderRadius, STAR_MAX_SIZE * 0.5);
		ctx.fill();
		ctx.restore();
	}
	ctx.restore();
}function animateScreensaver(timestamp) {

	const overlay = document.getElementById(SCREENSAVER_ID);
	const canvas = document.getElementById(CANVAS_ID);
	if (!overlay || !canvas) return;
	const ctx = canvas.getContext('2d');

	// Only redraw if animation is active or canvas size changes
	const dpr = window.devicePixelRatio || 1;
	const cssWidth = overlay.offsetWidth;
	const cssHeight = overlay.offsetHeight;
	let needsRedraw = false;
	if (canvas.__cssWidth !== cssWidth || canvas.__cssHeight !== cssHeight || canvas.__dpr !== dpr) {
		canvas.__cssWidth = cssWidth;
		canvas.__cssHeight = cssHeight;
		canvas.__dpr = dpr;
		canvas.width = Math.round(cssWidth * dpr);
		canvas.height = Math.round(cssHeight * dpr);
		canvas.style.width = cssWidth + 'px';
		canvas.style.height = cssHeight + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		needsRedraw = true;
	}
	const width = cssWidth;
	const height = cssHeight;
	const centerX = width / 2;
	const centerY = height / 2;

	// Only update stars if animation is running
	if (screensaverActive) {
		reconcileStarCount(centerX, centerY);
		needsRedraw = true;
	}

	// Smooth fade in overlay with easing
	if (fadeStart === null) {
		fadeStart = performance.now();
		overlay.dataset.fadeStartedAt = Date.now().toString();
	}
	const elapsed = performance.now() - fadeStart;
	const progress = Math.min(elapsed / FADE_DURATION, 1);
	const easeInOut = progress < 0.5 
		? 2 * progress * progress 
		: 1 - Math.pow(-2 * progress + 2, 2) / 2;
	fadeAlpha = easeInOut;

	const dynamicOpacity = overlay.dataset.userOpacity ? parseFloat(overlay.dataset.userOpacity) : BACKGROUND_OPACITY;
	overlay.style.background = `rgba(0,0,0,${fadeAlpha * dynamicOpacity})`;
	overlay.style.opacity = fadeAlpha;

	if (progress >= 1 && !overlay.dataset.fadeComplete) {
		overlay.dataset.fadeComplete = '1';
		const evt = new CustomEvent('screensaverfadecomplete');
		overlay.dispatchEvent(evt);
	}

	// Advance global rotation when active
	if (screensaverActive) {
		if (lastTimestamp == null) {
			lastTimestamp = timestamp;
		} else {
			const dt = (timestamp - lastTimestamp) / 1000;
			lastTimestamp = timestamp;
			globalRotation += ROTATION_SPEED * dt;
			if (globalRotation > Math.PI * 2) globalRotation -= Math.PI * 2;
		}
	}

	if (needsRedraw) {
		drawStarfield(ctx, width, height, centerX, centerY);
	}
	animationFrame = requestAnimationFrame(animateScreensaver);
}

function showScreensaver() {
	// Don't show screensaver if it's disabled
	if (!isScreensaverEnabled()) {
		return;
	}

	const overlay = document.getElementById(SCREENSAVER_ID);
	const canvas = document.getElementById(CANVAS_ID);
	if (!overlay || !canvas) return;

	// Initialize overlay state for smooth fade
	overlay.style.opacity = '0';
	overlay.style.background = 'transparent';
	overlay.classList.add('active');
	if (overlay.dataset.fadeComplete) delete overlay.dataset.fadeComplete;
	const existingHint = overlay.querySelector('.screensaver-hint');
	if (existingHint) {
		existingHint.classList.remove('visible');
	}
	canvas.style.display = 'block';

	// Show arc menu controls and reset
	const controls = document.getElementById('screensaver-controls');
	if (controls) {
		controls.style.display = 'block';
		controls.classList.add('visible');
		// Reset controls via screensaver-controls.js
		if (window.screensaverControls && window.screensaverControls.reset) {
			window.screensaverControls.reset();
		}
	}
	
	// Reset config values to defaults
	STAR_COUNT = DEFAULT_STAR_COUNT;
	ROTATION_SPEED = DEFAULT_MOTION_SPEED;
	parallaxIntensity = DEFAULT_PARALLAX_INTENSITY;
	overlay.dataset.userOpacity = BACKGROUND_OPACITY;

	// Reset and initialize parallax mouse position smoothly
	mouseX = 0;
	mouseY = 0;
	targetMouseX = 0;
	targetMouseY = 0;

	screensaverActive = true;
	animationPaused = false;
	fadeStart = null;
	fadeAlpha = 0;
	globalRotation = 0;
	lastTimestamp = null;
	
	// Record start time for star fade-in
	const starFadeStartTime = performance.now();
	
	// Initialize stars with better distribution
	resetStars(overlay.offsetWidth / 2, overlay.offsetHeight / 2);
	
	// Store fade start time for stars
	stars.forEach(star => {
		star.fadeStartTime = starFadeStartTime;
	});
	
	// Start animation loop
	animationFrame = requestAnimationFrame(animateScreensaver);
}

function hideScreensaver() {
	const overlay = document.getElementById(SCREENSAVER_ID);
	const canvas = document.getElementById(CANVAS_ID);
	if (!overlay || !canvas) return;
	overlay.classList.remove('active');
	// Reset overlay styles and state to ensure nothing lingers
	overlay.style.opacity = '0';
	overlay.style.background = 'transparent';
	if (overlay.dataset.fadeComplete) delete overlay.dataset.fadeComplete;
	const hint = overlay.querySelector('.screensaver-hint');
	if (hint) hint.classList.remove('visible');
	canvas.style.display = 'none';
	screensaverActive = false;
	animationPaused = false;
	fadeStart = null;
	fadeAlpha = 0;
	if (animationFrame) cancelAnimationFrame(animationFrame);

	// Hide arc menu controls
	const controls = document.getElementById('screensaver-controls');
	if (controls) {
		controls.style.display = 'none';
		controls.classList.remove('visible');
	}
	if (overlay.dataset.userOpacity) delete overlay.dataset.userOpacity;
}

function resetIdleTimer() {
	if (idleTimer) clearTimeout(idleTimer);
	if (screensaverActive) return; // Don't hide on mousemove/keydown
	idleTimer = setTimeout(showScreensaver, IDLE_TIMEOUT);
}

// Function to dynamically update screensaver state (called by toggle)
function updateScreensaverState() {
	const wasEnabled = effectiveStarCount > 0;
	updateEffectiveStarCount(); // Update based on current config
	const nowEnabled = getCurrentEnabledState();

	if (wasEnabled !== nowEnabled) {
		if (nowEnabled) {
			// If newly enabled, start the idle timer
			resetIdleTimer();
		} else {
			// If newly disabled, clear any existing timer and hide if active
			if (idleTimer) {
				clearTimeout(idleTimer);
				idleTimer = null;
			}
			if (screensaverActive) {
				hideScreensaver();
			}
		}
	}
}

// Make updateScreensaverState available globally for the toggle script
window.updateScreensaverState = updateScreensaverState;

window.addEventListener('mousemove', (e) => {
	resetIdleTimer();
	// Enhanced mouse position tracking for parallax effect
	if (screensaverActive) {
		const rect = document.getElementById(SCREENSAVER_ID)?.getBoundingClientRect();
		if (rect) {
			// Normalize mouse position to -1 to 1 range with enhanced sensitivity
			const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const rawY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
			
			// Apply subtle dampening to prevent excessive movement, adjusted by intensity
			const damping = 0.7 * parallaxIntensity;
			targetMouseX = rawX * damping;
			targetMouseY = rawY * damping;
		}
	}
});
window.addEventListener('keydown', resetIdleTimer);
window.addEventListener('mousedown', resetIdleTimer);
window.addEventListener('touchstart', resetIdleTimer);

// Enhanced touch support for mobile parallax
window.addEventListener('touchmove', (e) => {
	if (screensaverActive && e.touches.length === 1) {
		e.preventDefault(); // Prevent scrolling during touch
		const touch = e.touches[0];
		const rect = document.getElementById(SCREENSAVER_ID)?.getBoundingClientRect();
		if (rect) {
			const rawX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
			const rawY = ((touch.clientY - rect.top) / rect.height) * 2 - 1;
			
			const damping = 0.6 * parallaxIntensity; // Slightly more dampening for touch, adjusted by intensity
			targetMouseX = rawX * damping;
			targetMouseY = rawY * damping;
		}
	}
}, { passive: false });

// Mouse tracking for gravity removed

// Paused state for animation
let animationPaused = false;

// Detect if device is mobile/touch
function isMobileDevice() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
		|| (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

function pauseAnimation() {
	if (!animationPaused && screensaverActive) {
		animationPaused = true;
		lastTimestamp = null; // Reset timestamp so dt doesn't spike on resume
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	}
}

function resumeAnimation() {
	if (animationPaused && screensaverActive) {
		animationPaused = false;
		lastTimestamp = null; // Reset to prevent jump
		if (!animationFrame) {
			animationFrame = requestAnimationFrame(animateScreensaver);
		}
	}
}

// Visibility change - only pause on mobile (tab switch)
document.addEventListener('visibilitychange', () => {
	if (!PAUSE_ON_BLUR) return;
	if (!isMobileDevice()) return; // Desktop: don't pause
	
	if (document.hidden) {
		pauseAnimation();
	} else {
		resumeAnimation();
	}
});

document.addEventListener('DOMContentLoaded', () => {
	// Initialize effective star count and only start idle timer if enabled
	updateEffectiveStarCount();
	if (getCurrentEnabledState()) {
		resetIdleTimer();
	}

	// Listen for density changes from screensaver-controls.js
	window.addEventListener('screensaver-density-change', (e) => {
		if (e.detail) {
			STAR_COUNT = e.detail.stars;
			ROTATION_SPEED = e.detail.speed;
			effectiveStarCount = STAR_COUNT;
			// Enable smooth transitions if requested
			smoothTransitionEnabled = !!e.detail.smooth;
		}
	});

	// Listen for opacity changes from screensaver-controls.js
	window.addEventListener('screensaver-opacity-change', (e) => {
		if (e.detail && screensaverActive) {
			const opacity = e.detail.opacity;
			const overlay = document.getElementById(SCREENSAVER_ID);
			if (overlay) {
				overlay.dataset.userOpacity = opacity;
				// Apply immediately if fully faded in
				if (fadeAlpha >= 1) {
					overlay.style.background = `rgba(0,0,0,${opacity})`;
				}
			}
		}
	});

	// Listen for parallax changes from screensaver-controls.js
	window.addEventListener('screensaver-parallax-change', (e) => {
		if (e.detail) {
			parallaxIntensity = e.detail.intensity;
		}
	});

	const overlay = document.getElementById(SCREENSAVER_ID);
	if (overlay) {
		// Inject hint element if configured
		if (SHOW_HINT && !overlay.querySelector('.screensaver-hint')) {
			const hint = document.createElement('div');
			hint.className = 'screensaver-hint';
			hint.textContent = 'Click to exit';
			overlay.appendChild(hint);
			const reveal = () => {
				if (overlay.dataset.fadeComplete === '1') {
					hint.classList.add('visible');
					overlay.removeEventListener('screensaverfadecomplete', reveal);
				}
			};
			if (overlay.dataset.fadeComplete === '1') {
				reveal();
			} else {
				overlay.addEventListener('screensaverfadecomplete', reveal);
			}
			
			// Only the hint is clickable to exit
			hint.addEventListener('click', (e) => {
				e.stopPropagation();
				if (screensaverActive) hideScreensaver();
			});
		}

		// Accessibility: Keyboard exit (Escape key)
		window.addEventListener('keydown', function escHandler(e) {
			if (screensaverActive && e.key === 'Escape') {
				hideScreensaver();
			}
		});

	}
});
