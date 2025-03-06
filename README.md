# WebShield Chrome Extension

A powerful Chrome extension that protects your browsing by blocking malicious and unwanted websites using an actively maintained blocklist.

## Features

- 🛡️ Real-time protection against malicious websites
- 📋 Custom domain blocking
- 📊 Detailed block history
- 🔄 Automatic blocklist updates
- 🎨 Modern, user-friendly interface
- ⚡ Lightweight and fast

## Installation

### From Source
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### From Chrome Web Store
*(Coming soon)*

## Usage

1. Click the WebShield icon in your Chrome toolbar
2. View your protection status and block history
3. Add custom domains to block
4. Configure protection settings

## Development

### Prerequisites
- Chrome browser
- Node.js (for development tools)

### Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/WebShield-extension.git
cd WebShield-extension
```

2. Install dependencies:
```bash
npm install
```

3. Load the extension in Chrome:
- Open `chrome://extensions/`
- Enable Developer mode
- Click "Load unpacked"
- Select the extension directory

### Project Structure
```
WebShield-extension/
├── manifest.json        # Extension configuration
├── background.js        # Background service worker
├── popup/              # Extension popup UI
├── config.html         # Configuration page
├── blocked.html        # Blocked site page
├── rules/             # Blocking rules
└── data/              # Local data storage
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -am 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Projects

- [WebShield-blocklist](https://github.com/yourusername/WebShield-blocklist) - The main blocklist repository

## License

MIT License - See LICENSE file for details
