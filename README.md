# ⚡ Udemy Superlearner

Master your learning pace with granular video speed controls on Udemy. Find the perfect tempo for any instructor.

![Udemy Superlearner](screenshots/udemy_superlearner.png)

## Features

- 🎚️ **Granular Speed Control** - 5% increments (0.05x) from 0.5x to 3.0x
- ⌨️ **Keyboard Shortcuts** - Quick adjustments while watching
- 💾 **Persistent Settings** - Your speed syncs across devices
- 🎯 **Quick Presets** - Jump to common speeds instantly
- 🖥️ **Popup UI** - Easy access to all controls
- 🔧 **Customizable** - Adjust increment sizes, min/max speeds

## Why Granular Controls?

Different instructors speak at different paces. The standard 0.25x jumps (1x → 1.25x → 1.5x) are often too coarse:

- **1.25x** might be too slow for a fast speaker
- **1.5x** might be too fast to comprehend

With **5% increments**, you can find your "sweet spot" - like **1.35x** or **1.45x** - maximizing learning speed while retaining comprehension.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift` + `→` | Increase speed (+5%) |
| `Shift` + `←` | Decrease speed (-5%) |
| `Ctrl` + `Shift` + `→` | Coarse increase (+25%) |
| `Ctrl` + `Shift` + `←` | Coarse decrease (-25%) |
| `Shift` + `1-9` | Quick presets (0.5x to 3x) |

## Installation

### From Source (Developer Mode)

1. Clone this repository
2. Run `npm install` then `npm run build`
3. Open Chrome and go to `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the `dist` folder

### From Chrome Web Store

*Coming soon*

## Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Watch for changes (auto-rebuild)
npm run watch

# Package for Chrome Web Store
npm run package
```

## Project Structure

```
extension/
├── manifest.json        # Extension manifest (V3)
├── content/
│   ├── playbackRate.js  # Main content script
│   └── styles.css       # Injected styles
├── popup/
│   ├── popup.html       # Popup UI
│   ├── popup.css        # Popup styles
│   └── popup.js         # Popup logic
└── icons/               # Extension icons
```

## Configuration

Click the extension icon to access settings:

- **Fine increment**: 1%, 5%, or 10% steps
- **Coarse increment**: 10%, 25%, or 50% jumps
- **Min/Max speed**: Customize your speed range

## License

MIT

---

*Learn smarter, not longer.* ⚡
