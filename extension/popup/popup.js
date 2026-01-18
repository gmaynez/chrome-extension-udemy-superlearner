/**
 * Udemy Superlearner - Popup Script
 */

const DEFAULT_CONFIG = {
	minRate: 0.5,
	maxRate: 3.0,
	fineIncrement: 0.05,
	coarseIncrement: 0.25,
	defaultRate: 1.0
};

let currentConfig = { ...DEFAULT_CONFIG };
let currentRate = 1.0;

// DOM Elements
const elements = {
	currentSpeed: document.getElementById('currentSpeed'),
	speedSlider: document.getElementById('speedSlider'),
	decreaseBtn: document.getElementById('decreaseBtn'),
	increaseBtn: document.getElementById('increaseBtn'),
	presetGrid: document.getElementById('presetGrid'),
	settingsToggle: document.getElementById('settingsToggle'),
	settingsSection: document.getElementById('settingsSection'),
	fineIncrement: document.getElementById('fineIncrement'),
	coarseIncrement: document.getElementById('coarseIncrement'),
	minRate: document.getElementById('minRate'),
	maxRate: document.getElementById('maxRate')
};

/**
 * Format rate for display
 */
function formatRate(rate) {
	const rounded = Math.round(rate * 100) / 100;
	return rounded % 0.1 === 0 ? rounded.toFixed(1) : rounded.toFixed(2);
}

/**
 * Update the UI to reflect current speed
 */
function updateSpeedDisplay(rate, animate = true) {
	currentRate = rate;
	
	// Update display
	elements.currentSpeed.textContent = `${formatRate(rate)}x`;
	if (animate) {
		elements.currentSpeed.classList.add('updating');
		setTimeout(() => elements.currentSpeed.classList.remove('updating'), 300);
	}
	
	// Update slider
	elements.speedSlider.value = rate;
	
	// Update preset buttons
	document.querySelectorAll('.preset-btn').forEach(btn => {
		const btnRate = parseFloat(btn.dataset.speed);
		btn.classList.toggle('active', Math.abs(btnRate - rate) < 0.001);
	});
}

/**
 * Send rate to content script
 */
async function setRate(rate) {
	// Clamp rate
	rate = Math.max(currentConfig.minRate, Math.min(currentConfig.maxRate, rate));
	rate = Math.round(rate * 100) / 100;
	
	// Save to storage
	await chrome.storage.sync.set({ udemy_playback_rate: rate });
	
	// Update UI
	updateSpeedDisplay(rate);
	
	// Send to active tab
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.url?.includes('udemy.com')) {
			chrome.tabs.sendMessage(tab.id, { type: 'SET_RATE', rate });
		}
	} catch (e) {
		// Tab might not have content script loaded
		console.log('Could not send to tab:', e);
	}
}

/**
 * Load configuration from storage
 */
async function loadConfig() {
	return new Promise((resolve) => {
		chrome.storage.sync.get({
			udemy_config: DEFAULT_CONFIG,
			udemy_playback_rate: 1.0
		}, (data) => {
			currentConfig = { ...DEFAULT_CONFIG, ...data.udemy_config };
			currentRate = data.udemy_playback_rate;
			resolve();
		});
	});
}

/**
 * Save configuration to storage
 */
async function saveConfig() {
	await chrome.storage.sync.set({ udemy_config: currentConfig });
	
	// Notify content script
	try {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.url?.includes('udemy.com')) {
			chrome.tabs.sendMessage(tab.id, { type: 'CONFIG_UPDATED' });
		}
	} catch (e) {
		console.log('Could not notify tab:', e);
	}
}

/**
 * Initialize settings form with current values
 */
function initializeSettings() {
	elements.fineIncrement.value = currentConfig.fineIncrement;
	elements.coarseIncrement.value = currentConfig.coarseIncrement;
	elements.minRate.value = currentConfig.minRate;
	elements.maxRate.value = currentConfig.maxRate;
	
	// Update slider bounds
	elements.speedSlider.min = currentConfig.minRate;
	elements.speedSlider.max = currentConfig.maxRate;
	elements.speedSlider.step = currentConfig.fineIncrement;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
	// Decrease button
	elements.decreaseBtn.addEventListener('click', () => {
		setRate(currentRate - currentConfig.fineIncrement);
	});
	
	// Increase button
	elements.increaseBtn.addEventListener('click', () => {
		setRate(currentRate + currentConfig.fineIncrement);
	});
	
	// Slider
	elements.speedSlider.addEventListener('input', (e) => {
		const rate = parseFloat(e.target.value);
		updateSpeedDisplay(rate, false);
	});
	
	elements.speedSlider.addEventListener('change', (e) => {
		const rate = parseFloat(e.target.value);
		setRate(rate);
	});
	
	// Preset buttons
	elements.presetGrid.addEventListener('click', (e) => {
		const btn = e.target.closest('.preset-btn');
		if (btn) {
			const speed = parseFloat(btn.dataset.speed);
			setRate(speed);
		}
	});
	
	// Settings toggle
	elements.settingsToggle.addEventListener('click', () => {
		elements.settingsSection.classList.toggle('collapsed');
	});
	
	// Settings changes
	elements.fineIncrement.addEventListener('change', (e) => {
		currentConfig.fineIncrement = parseFloat(e.target.value);
		elements.speedSlider.step = currentConfig.fineIncrement;
		saveConfig();
	});
	
	elements.coarseIncrement.addEventListener('change', (e) => {
		currentConfig.coarseIncrement = parseFloat(e.target.value);
		saveConfig();
	});
	
	elements.minRate.addEventListener('change', (e) => {
		currentConfig.minRate = parseFloat(e.target.value);
		elements.speedSlider.min = currentConfig.minRate;
		saveConfig();
	});
	
	elements.maxRate.addEventListener('change', (e) => {
		currentConfig.maxRate = parseFloat(e.target.value);
		elements.speedSlider.max = currentConfig.maxRate;
		saveConfig();
	});
	
	// Keyboard shortcuts in popup
	document.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			const increment = e.ctrlKey ? currentConfig.coarseIncrement : currentConfig.fineIncrement;
			setRate(currentRate + increment);
		}
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			const increment = e.ctrlKey ? currentConfig.coarseIncrement : currentConfig.fineIncrement;
			setRate(currentRate - increment);
		}
	});
}

/**
 * Initialize popup
 */
async function init() {
	await loadConfig();
	initializeSettings();
	updateSpeedDisplay(currentRate, false);
	setupEventListeners();
}

// Start
init();
