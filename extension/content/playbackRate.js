/**
 * Udemy Superlearner - Content Script
 * Provides granular playback speed controls for Udemy videos
 * 
 * Uses stable selectors that don't rely on hash-based class names
 */

const DEFAULT_CONFIG = {
	minRate: 0.5,
	maxRate: 3.0,
	fineIncrement: 0.05,
	coarseIncrement: 0.25,
	defaultRate: 1.0,
	decimals: 2
};

const state = {
	currentVideo: null,
	keyListenerAdded: false,
	config: { ...DEFAULT_CONFIG },
	customPresets: [0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
	initialized: false
};

// ============ Storage Functions ============

async function loadConfig() {
	return new Promise((resolve) => {
		chrome.storage.sync.get({
			udemy_config: DEFAULT_CONFIG,
			udemy_presets: state.customPresets,
			udemy_playback_rate: 1.0
		}, (data) => {
			state.config = { ...DEFAULT_CONFIG, ...data.udemy_config };
			state.customPresets = data.udemy_presets;
			resolve(data);
		});
	});
}

function savePlaybackRate(rate) {
	chrome.storage.sync.set({ udemy_playback_rate: rate });
}

async function getStoredRate() {
	return new Promise((resolve) => {
		chrome.storage.sync.get({ udemy_playback_rate: state.config.defaultRate }, (data) => {
			resolve(data.udemy_playback_rate);
		});
	});
}

// ============ Utility Functions ============

function formatRate(rate) {
	const rounded = Math.round(rate * 100) / 100;
	return rounded % 0.1 === 0 ? rounded.toFixed(1) : rounded.toFixed(2);
}

function log(...args) {
	console.log('⚡ Superlearner:', ...args);
}

// ============ Video Detection ============

/**
 * Find the video element using multiple strategies
 * Udemy uses Video.js, so we look for common patterns
 */
function findVideoElement() {
	// Strategy 1: Look for video with vjs-tech class (Video.js)
	let video = document.querySelector('video.vjs-tech');
	if (video) return video;
	
	// Strategy 2: Look for any video element in the main content area
	video = document.querySelector('[data-purpose="video-player"] video');
	if (video) return video;
	
	// Strategy 3: Look for video with specific Udemy patterns
	video = document.querySelector('video[preload="auto"]');
	if (video) return video;
	
	// Strategy 4: Just find any video on the page
	const videos = document.querySelectorAll('video');
	if (videos.length === 1) return videos[0];
	
	// If multiple videos, prefer the one that's visible/playing
	for (const v of videos) {
		if (v.readyState > 0 || v.currentTime > 0 || !v.paused) {
			return v;
		}
	}
	
	return videos[0] || null;
}

// ============ Speed Control ============

async function setPlaybackRate(rate, options = {}) {
	const { config } = state;
	const video = state.currentVideo || findVideoElement();
	
	if (!video) {
		log('No video found');
		return;
	}
	
	state.currentVideo = video;
	
	// Handle increment/decrement
	if (rate === 'increase' || rate === 'decrease') {
		const currentRate = video.playbackRate;
		const increment = options.coarse ? config.coarseIncrement : config.fineIncrement;
		
		let newRate = rate === 'increase' 
			? currentRate + increment 
			: currentRate - increment;
		
		// Clamp to bounds
		if (newRate > config.maxRate) {
			newRate = options.wrap ? config.minRate : config.maxRate;
		}
		if (newRate < config.minRate) {
			newRate = options.wrap ? config.maxRate : config.minRate;
		}
		
		rate = Math.round(newRate * 100) / 100;
	}
	
	// Apply the rate
	video.playbackRate = rate;
	savePlaybackRate(rate);
	
	// Update any visible rate display
	updateRateDisplay(rate);
	
	// Show toast
	showSpeedToast(rate);
	
	log(`Speed set to ${formatRate(rate)}x`);
}

/**
 * Update Udemy's playback rate display
 * Uses data-purpose attribute which is more stable than class names
 */
function updateRateDisplay(rate) {
	// Try data-purpose selector (most reliable)
	const rateButton = document.querySelector('[data-purpose="playback-rate-button"]');
	if (rateButton) {
		// Find the text element inside (might be nested)
		const textEl = rateButton.querySelector('span') || rateButton;
		if (textEl.childNodes.length > 0) {
			// Update text content while preserving structure
			for (const node of textEl.childNodes) {
				if (node.nodeType === Node.TEXT_NODE || node.tagName === 'SPAN') {
					node.textContent = formatRate(rate) + 'x';
					break;
				}
			}
		} else {
			textEl.textContent = formatRate(rate) + 'x';
		}
	}
}

// ============ Toast Notification ============

function showSpeedToast(rate) {
	// Remove existing toast
	const existingToast = document.querySelector('.superlearner-toast');
	if (existingToast) existingToast.remove();
	
	const toast = document.createElement('div');
	toast.className = 'superlearner-toast';
	toast.innerHTML = `<span class="toast-icon">⚡</span> ${formatRate(rate)}x`;
	
	document.body.appendChild(toast);
	
	// Trigger animation
	requestAnimationFrame(() => {
		toast.classList.add('show');
	});
	
	// Remove after animation
	setTimeout(() => {
		toast.classList.add('hide');
		setTimeout(() => toast.remove(), 300);
	}, 1000);
}

// ============ Keyboard Shortcuts ============

function addKeyboardListeners() {
	if (state.keyListenerAdded) return;
	
	document.addEventListener('keydown', (event) => {
		// Ignore if typing in an input
		const tag = event.target.tagName;
		const isEditable = event.target.isContentEditable;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) {
			return;
		}
		
		// Shift + Arrow Right: Increase speed (fine)
		if (event.code === 'ArrowRight' && event.shiftKey && !event.ctrlKey && !event.altKey) {
			event.preventDefault();
			event.stopPropagation();
			setPlaybackRate('increase', { coarse: false, wrap: true });
		}
		
		// Shift + Arrow Left: Decrease speed (fine)
		if (event.code === 'ArrowLeft' && event.shiftKey && !event.ctrlKey && !event.altKey) {
			event.preventDefault();
			event.stopPropagation();
			setPlaybackRate('decrease', { coarse: false, wrap: true });
		}
		
		// Ctrl + Shift + Arrow Right: Coarse increase
		if (event.code === 'ArrowRight' && event.shiftKey && event.ctrlKey) {
			event.preventDefault();
			event.stopPropagation();
			setPlaybackRate('increase', { coarse: true, wrap: false });
		}
		
		// Ctrl + Shift + Arrow Left: Coarse decrease
		if (event.code === 'ArrowLeft' && event.shiftKey && event.ctrlKey) {
			event.preventDefault();
			event.stopPropagation();
			setPlaybackRate('decrease', { coarse: true, wrap: false });
		}
		
		// Shift + Number keys for presets
		if (event.shiftKey && event.code.startsWith('Digit') && !event.ctrlKey && !event.altKey) {
			const num = parseInt(event.code.replace('Digit', ''));
			if (num >= 1 && num <= 9) {
				const speedMap = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
				const speed = speedMap[num - 1];
				if (speed) {
					event.preventDefault();
					event.stopPropagation();
					setPlaybackRate(speed);
				}
			}
		}
	}, true); // Use capture phase to intercept before Udemy's handlers
	
	state.keyListenerAdded = true;
	log('Keyboard shortcuts active');
}

// ============ Video Event Handlers ============

function attachVideoListeners(video) {
	if (video._superlearnerAttached) return;
	video._superlearnerAttached = true;
	
	const applyStoredRate = async () => {
		const rate = await getStoredRate();
		if (video.playbackRate !== rate) {
			video.playbackRate = rate;
			log(`Applied stored rate: ${formatRate(rate)}x`);
		}
		updateRateDisplay(rate);
	};
	
	// Apply rate on various events (Udemy may reset it)
	video.addEventListener('loadedmetadata', applyStoredRate);
	video.addEventListener('loadeddata', applyStoredRate);
	video.addEventListener('canplay', applyStoredRate);
	video.addEventListener('play', applyStoredRate);
	video.addEventListener('playing', applyStoredRate);
	
	// Monitor for external rate changes (e.g., Udemy's own controls)
	video.addEventListener('ratechange', () => {
		const currentRate = video.playbackRate;
		// Only save if it seems intentional (not a reset to 1.0)
		if (currentRate !== 1.0 || state.currentVideo?.playbackRate === 1.0) {
			// Don't save - might be Udemy resetting it
		}
	});
	
	// Apply immediately if video is ready
	if (video.readyState >= 1) {
		applyStoredRate();
	}
}

// ============ Initialization ============

async function initialize() {
	if (state.initialized) return;
	
	await loadConfig();
	addKeyboardListeners();
	
	// Try to find video immediately
	const video = findVideoElement();
	if (video) {
		state.currentVideo = video;
		attachVideoListeners(video);
		log('Video found immediately');
	}
	
	// Set up observer to detect dynamically loaded videos
	const observer = new MutationObserver((mutations) => {
		// Debounce - don't check on every tiny mutation
		if (observer._timeout) return;
		
		observer._timeout = setTimeout(() => {
			observer._timeout = null;
			
			const video = findVideoElement();
			if (video && video !== state.currentVideo) {
				state.currentVideo = video;
				attachVideoListeners(video);
				log('New video detected');
			}
		}, 100);
	});
	
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	
	// Also poll periodically as a fallback (some SPAs are tricky)
	setInterval(() => {
		const video = findVideoElement();
		if (video && video !== state.currentVideo) {
			state.currentVideo = video;
			attachVideoListeners(video);
			log('Video found via polling');
		}
	}, 2000);
	
	state.initialized = true;
	log('Initialized - Find your perfect pace!');
}

// ============ Message Handling ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === 'SET_RATE') {
		setPlaybackRate(message.rate);
		sendResponse({ success: true });
	}
	if (message.type === 'GET_RATE') {
		const video = state.currentVideo || findVideoElement();
		sendResponse({ rate: video?.playbackRate || 1.0 });
	}
	if (message.type === 'CONFIG_UPDATED') {
		loadConfig();
		sendResponse({ success: true });
	}
	return true;
});

// ============ Start ============

// Wait for DOM to be ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialize);
} else {
	initialize();
}

// Also try again after a delay (for slow-loading SPAs)
setTimeout(initialize, 1000);
setTimeout(initialize, 3000);
