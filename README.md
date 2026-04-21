# Intercept AI

A browser extension that automatically redacts sensitive data (PII, credentials, API keys) before it leaves your browser to AI chatbots.

## Supported Sites

- chatgpt.com
- claude.ai

## What It Redacts

- **Email addresses**
- **Phone numbers**
- **Social Security Numbers (SSN)**
- **Credit card numbers** (with Luhn validation)
- **API keys** (including generic, AWS, and Google AI/Gemini keys)
- **Bearer tokens**
- **IP addresses** (IPv4 and IPv6)

https://github.com/user-attachments/assets/5c0ee6fb-236f-48d3-89f4-f3ea0bf1f8b5

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `simple-interceptor-ext` folder

## Usage

The extension runs automatically on supported sites. Click the extension icon to:

- Toggle protection on/off
- View total redaction count
- See recent activity log

## Architecture

- `manifest.json` - Extension configuration
- `background.js` - Service worker for initialization
- `content.js` - Content script that loads the injector
- `inject.js` - Core interception engine (fetch/XHR interceptors)
- `popup.html/js` - Extension popup UI

## Permissions

- `storage` - For saving settings and logs
- `activeTab` - For accessing the current tab
