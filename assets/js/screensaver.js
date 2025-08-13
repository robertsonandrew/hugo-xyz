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
if (!Object.keys(config).length) {
	const cfgTag = document.getElementById('screensaver-config');
	if (cfgTag) {
		try { config = JSON.parse(cfgTag.textContent.trim()); } catch (e) { /* ignore */ }
	}
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
const STAR_COUNT = config.starcount !== undefined ? config.starcount : 25;
const STAR_MIN_SIZE = config.starminsize !== undefined ? config.starminsize : 2;
const STAR_MAX_SIZE = config.starmaxsize !== undefined ? config.starmaxsize : 5;
const STAR_SPEED = config.starspeed !== undefined ? config.starspeed : 0.1;
const PAUSE_ON_BLUR = config.pauseonblur !== undefined ? !!config.pauseonblur : true;
// Gravity removed in simplified version; legacy param ignored if present
const GRAVITY_STRENGTH = 0;
const SHOW_HINT = config.showhint !== undefined ? !!config.showhint : true;
const ENABLED = config.enabled !== undefined ? !!config.enabled : true;
// spawn fade removed for simplicity

let effectiveStarCount = ENABLED ? STAR_COUNT : 0;

let idleTimer = null;
let screensaverActive = false;
let fadeStart = null;
let fadeAlpha = 0;
let animationFrame = null;
let stars = [];
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
	// Uniform spawn in viewport
	const screenWidth = centerX * 2;
	const screenHeight = centerY * 2;
	const x = Math.random() * screenWidth;
	const y = Math.random() * screenHeight;
	const angle = randomBetween(0, 2 * Math.PI);

	// Depth: 1 (far) to 8 (close)
	const depth = Math.round(randomBetween(1, 8));
	const depthFactor = depth / 8;

	// Bias toward smaller/fainter stars for realism
	const size = randomBetween(STAR_MIN_SIZE, STAR_MAX_SIZE) * (0.5 + depthFactor * 0.8);
	const opacity = randomBetween(0.2, 1.0) * (0.4 + depthFactor * 0.7);

	// Speed and direction
	const speed = STAR_SPEED * randomBetween(0.7, 1.3);
	const vx = Math.cos(angle) * speed;
	const vy = Math.sin(angle) * speed;

	// Parallax strength scales with depth
	const parallaxStrength = 0.01 + depthFactor * 0.02;

	return {
		x, y, angle, speed, vx, vy,
		size,
		baseSize: size,
		opacity,
		baseOpacity: opacity,
		depth,
		parallaxStrength,
		originalX: x,
		originalY: y
	};
}

function resetStars(centerX, centerY) {
	stars = [];
	const count = effectiveStarCount;
	for (let i = 0; i < count; i++) {
		stars.push(createStar(centerX, centerY));
	}
}

function reconcileStarCount(centerX, centerY) {
	const target = effectiveStarCount;
	if (stars.length < target) {
		const toAdd = Math.min(5, target - stars.length); // add a few per frame to avoid sudden pop
		for (let i = 0; i < toAdd; i++) stars.push(createStar(centerX, centerY));
	} else if (stars.length > target) {
		stars.length = target; // trim extras
	}
	window.__stars = stars;
}

function drawStarfield(ctx, width, height, centerX, centerY) {
	// Clear using CSS pixel dimensions (context already scaled for DPR)
	ctx.clearRect(0, 0, width, height);
	ctx.save();
	ctx.globalAlpha = 1;
	
	// Smooth mouse interpolation for fluid parallax
	mouseX += (targetMouseX - mouseX) * 0.05;
	mouseY += (targetMouseY - mouseY) * 0.05;
	
	for (const star of stars) {
		// Simple straight-line drift
		star.x += star.vx;
		star.y += star.vy;

		// Static appearance (twinkle removed)
		star.size = star.baseSize;
		star.opacity = star.baseOpacity;

		// Update original position for wrapping
		star.originalX += star.vx;
		star.originalY += star.vy;

		// Apply parallax offset based on mouse position and star depth
		const parallaxX = mouseX * star.parallaxStrength * width * 0.1;
		const parallaxY = mouseY * star.parallaxStrength * height * 0.1;
		
		// Calculate final render position
		const renderX = star.x + parallaxX;
		const renderY = star.y + parallaxY;

		// If out of bounds, wrap around (torus) for continuous flow
		if (star.x < -STAR_MAX_SIZE) star.x = width + STAR_MAX_SIZE;
		else if (star.x > width + STAR_MAX_SIZE) star.x = -STAR_MAX_SIZE;
		if (star.y < -STAR_MAX_SIZE) star.y = height + STAR_MAX_SIZE;
		else if (star.y > height + STAR_MAX_SIZE) star.y = -STAR_MAX_SIZE;

	// Enhanced depth-based visual effects
	// More levels: far stars (depth 1) are smallest/dimmest, close (depth 8) are largest/brightest
	const depthAlpha = star.opacity * (0.25 + (star.depth / 8) * 0.75);
	const depthSize = star.size * (0.4 + (star.depth / 8) * 0.6);

	ctx.save();
	ctx.globalAlpha = depthAlpha;
	const gradient = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, depthSize);
	gradient.addColorStop(0, '#FFF');
	gradient.addColorStop(0.6, '#EEE');
	gradient.addColorStop(0.9, 'rgba(200, 200, 200, 0.18)');
	ctx.beginPath();
	ctx.arc(renderX, renderY, depthSize / 2, 0, 2 * Math.PI);
	ctx.fillStyle = gradient;
	ctx.shadowColor = '#FFF';
	ctx.shadowBlur = depthSize * 1.5;
	ctx.fill();
	ctx.restore();
	}
	ctx.restore();
}

function animateScreensaver(timestamp) {

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

	if (needsRedraw) {
		drawStarfield(ctx, width, height, centerX, centerY);
	}
	animationFrame = requestAnimationFrame(animateScreensaver);
}

function showScreensaver() {
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

	// Reset parallax mouse position
	mouseX = 0;
	mouseY = 0;
	targetMouseX = 0;
	targetMouseY = 0;

	screensaverActive = true;
	fadeStart = null;
	fadeAlpha = 0;
	resetStars(overlay.offsetWidth / 2, overlay.offsetHeight / 2);
	if (effectiveStarCount === 0) {
		animationFrame = requestAnimationFrame(animateScreensaver);
	} else {
		animationFrame = requestAnimationFrame(animateScreensaver);
	}
}

function hideScreensaver() {
	const overlay = document.getElementById(SCREENSAVER_ID);
	const canvas = document.getElementById(CANVAS_ID);
	if (!overlay || !canvas) return;
	overlay.classList.remove('active');
	canvas.style.display = 'none';
	screensaverActive = false;
	fadeStart = null;
	fadeAlpha = 0;
	if (animationFrame) cancelAnimationFrame(animationFrame);
}

function resetIdleTimer() {
	if (idleTimer) clearTimeout(idleTimer);
	if (screensaverActive) return; // Don't hide on mousemove/keydown
	idleTimer = setTimeout(showScreensaver, IDLE_TIMEOUT);
}

window.addEventListener('mousemove', (e) => {
	resetIdleTimer();
	// Update mouse position for parallax effect
	if (screensaverActive) {
		const rect = document.getElementById(SCREENSAVER_ID)?.getBoundingClientRect();
		if (rect) {
			// Normalize mouse position to -1 to 1 range
			targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			targetMouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
		}
	}
});
window.addEventListener('keydown', resetIdleTimer);
window.addEventListener('mousedown', resetIdleTimer);
window.addEventListener('touchstart', resetIdleTimer);

// Mouse tracking for gravity removed

// Visibility / blur handling
document.addEventListener('visibilitychange', () => {
	if (!PAUSE_ON_BLUR) return;
	if (document.hidden) {
		if (animationFrame) cancelAnimationFrame(animationFrame);
		animationFrame = null;
	} else if (screensaverActive && !animationFrame) {
		// (maxFPS removed)
		animationFrame = requestAnimationFrame(animateScreensaver);
	}
});

window.addEventListener('blur', () => {
	if (!PAUSE_ON_BLUR) return;
	if (screensaverActive && animationFrame) {
		cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}
});
window.addEventListener('focus', () => {
	if (!PAUSE_ON_BLUR) return;
	if (screensaverActive && !animationFrame) {
		// (maxFPS removed)
		animationFrame = requestAnimationFrame(animateScreensaver);
	}
});

document.addEventListener('DOMContentLoaded', () => {
	resetIdleTimer();
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
		}
		overlay.addEventListener('click', () => {
			if (screensaverActive) hideScreensaver();
		});

		// Accessibility: Keyboard exit (Escape key)
		window.addEventListener('keydown', function escHandler(e) {
			if (screensaverActive && e.key === 'Escape') {
				hideScreensaver();
			}
		});
	}
});
