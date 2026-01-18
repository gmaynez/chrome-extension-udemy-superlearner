/**
 * Simple build script for Udemy Superlearner
 * No bundler needed - just copies and validates files
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = path.join(__dirname, '..', 'extension');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function copyDir(src, dest) {
	ensureDir(dest);
	const entries = fs.readdirSync(src, { withFileTypes: true });
	
	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);
		
		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

function validateManifest() {
	const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	
	console.log(`📦 Building ${manifest.name} v${manifest.version}`);
	
	// Check required fields
	const required = ['name', 'version', 'manifest_version', 'content_scripts'];
	for (const field of required) {
		if (!manifest[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}
	
	if (manifest.manifest_version !== 3) {
		console.warn('⚠️  Warning: Using Manifest V2. Chrome Web Store requires V3.');
	}
	
	return manifest;
}

function build() {
	console.log('🔨 Building extension...\n');
	
	// Validate
	const manifest = validateManifest();
	
	// Clean dist
	if (fs.existsSync(DIST_DIR)) {
		fs.rmSync(DIST_DIR, { recursive: true });
	}
	
	// Copy extension files to dist
	copyDir(EXTENSION_DIR, DIST_DIR);
	
	console.log('✅ Build complete!');
	console.log(`   Output: ${DIST_DIR}`);
	console.log(`\n💡 Load the extension in Chrome:`);
	console.log('   1. Go to chrome://extensions');
	console.log('   2. Enable "Developer mode"');
	console.log('   3. Click "Load unpacked"');
	console.log(`   4. Select the "dist" folder`);
}

// Watch mode
if (process.argv.includes('--watch')) {
	try {
		const chokidar = require('chokidar');
		
		build();
		console.log('\n👀 Watching for changes...\n');
		
		chokidar.watch(EXTENSION_DIR, {
			ignored: /node_modules/,
			persistent: true
		}).on('change', (filePath) => {
			console.log(`\n📝 Changed: ${path.relative(EXTENSION_DIR, filePath)}`);
			build();
		});
	} catch (e) {
		console.error('chokidar not installed. Run: npm install');
		process.exit(1);
	}
} else {
	build();
}
