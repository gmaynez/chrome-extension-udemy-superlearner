/**
 * Package extension as .zip for Chrome Web Store upload
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_DIR = path.join(__dirname, '..', 'releases');

async function packageExtension() {
	// Ensure dist exists
	if (!fs.existsSync(DIST_DIR)) {
		console.error('❌ dist folder not found. Run "npm run build" first.');
		process.exit(1);
	}
	
	// Get version from manifest
	const manifest = JSON.parse(
		fs.readFileSync(path.join(DIST_DIR, 'manifest.json'), 'utf8')
	);
	
	// Create output directory
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}
	
	const filename = `udemy-superlearner-v${manifest.version}.zip`;
	const outputPath = path.join(OUTPUT_DIR, filename);
	
	// Remove existing zip if present
	if (fs.existsSync(outputPath)) {
		fs.unlinkSync(outputPath);
	}
	
	console.log(`📦 Packaging ${manifest.name} v${manifest.version}...`);
	
	const output = fs.createWriteStream(outputPath);
	const archive = archiver('zip', { zlib: { level: 9 } });
	
	return new Promise((resolve, reject) => {
		output.on('close', () => {
			const size = (archive.pointer() / 1024).toFixed(2);
			console.log(`✅ Package created: ${filename} (${size} KB)`);
			console.log(`   Location: ${outputPath}`);
			resolve();
		});
		
		archive.on('error', reject);
		archive.pipe(output);
		archive.directory(DIST_DIR, false);
		archive.finalize();
	});
}

packageExtension().catch(console.error);
