<p align="center">
  <a href="https://github.com/librecap/librecap">
      <picture>
          <source height="128" media="(prefers-color-scheme: dark)" srcset="https://github.com/librecap/librecap/releases/download/v0.1.0-img/LibreCap-dark.webp">
          <source height="128" media="(prefers-color-scheme: light)" srcset="https://github.com/librecap/librecap/releases/download/v0.1.0-img/LibreCap-light.webp">
          <img height="128" alt="LibreCap Logo" src="https://github.com/librecap/librecap/releases/download/v0.1.0-img/LibreCap-light.webp">
      </picture>
  </a>
</p>

<p align="center">
  An open-source CAPTCHA Box alternative designed with privacy and data protection in mind.
</p>

<p align="center">
  <a href="https://github.com/librecap/librecap">
    <img src="https://img.shields.io/badge/JS_Library-blue?style=for-the-badge&logo=javascript" alt="JS Library">
  </a>
  <a href="https://github.com/librecap/librecap-server">
    <img src="https://img.shields.io/badge/Server-green?style=for-the-badge&logo=rust" alt="Server">
  </a>
  <a href="https://github.com/librecap/librecap-gateway">
    <img src="https://img.shields.io/badge/Gateway-red?style=for-the-badge&logo=linux" alt="Gateway">
  </a>
</p>

## 🚀 Quick Start

Add the script tag to your HTML file:

```html
<script
	src="https://cdn.jsdelivr.net/npm/librecap@0.3.0/dist/librecap-min.js"
	integrity="sha512-pqO+2Ak+quI0tTIZ7x3lFutY4tpYX2pgS05lT0eVFey0EIyloFOpLyoeF8LP33FkA8LFkB0Zw6OXUO6tnZ6hkw=="
	crossorigin="anonymous"
></script>
```

Add a CAPTCHA box to your website by inserting this div wherever you need verification:

```html
<div class="librecap"></div>
```

That's it! The default configuration works out of the box using your own server implementation that can be found [here](https://github.com/librecap/librecap-server).

## 📸 Screenshots

![LibreCap Widget Light Theme](https://github.com/librecap/librecap/releases/download/v0.2.8-img/widget-light.png)
![LibreCap Widget Dark Theme](https://github.com/librecap/librecap/releases/download/v0.2.8-img/widget-dark.png)

<br>

![LibreCap Image Popup Light Theme](https://github.com/librecap/librecap/releases/download/v0.3.0-img/image-popup-light.png)
![LibreCap Image Popup Dark Theme](https://github.com/librecap/librecap/releases/download/v0.3.0-img/image-popup-dark.png)

<br>

![LibreCap Audio Popup Light Theme](https://github.com/librecap/librecap/releases/download/v0.3.0-img/audio-popup-light.png)
![LibreCap Audio Popup Dark Theme](https://github.com/librecap/librecap/releases/download/v0.3.0-img/audio-popup-dark.png)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Screenshots](#-screenshots)
- [Overview](#-overview)
- [Features](#-features)
- [Installation](#-installation)
- [Advanced Configuration](#-advanced-configuration)
- [Development](#-development)
- [Browser Compatibility](#-browser-compatibility)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

LibreCap offers a privacy-friendly CAPTCHA solution that respects your users' data. Unlike other CAPTCHA services, LibreCap operates without tracking, cookies, or analytics, making it an excellent choice for websites that prioritize user privacy.

## ✨ Features

- **Privacy-First Design**: No tracking, no cookies, no analytics, no third-party services
- **Adaptive Theming**: Dark, light, and automatic theme support to match your website
- **Internationalization**: Translations for 107 languages with automatic language detection
- **Mobile-Friendly**: Works seamlessly on all devices, including mobile
- **Customizable**: Easily style with CSS to match your website's design
- **Dual Verification Methods**: Supports both Proof of Work (PoW) and traditional CAPTCHA challenges

## 📦 Installation

### Run the demo server (Recommended for testing)

```bash
git clone https://github.com/librecap/librecap.git
cd librecap
npm install
npm run demo
```

### Using CDN (Recommended)

Add the script tag to your HTML file:

```html
<script
	src="https://cdn.jsdelivr.net/npm/librecap@0.3.0/dist/librecap-min.js"
	integrity="sha512-pqO+2Ak+quI0tTIZ7x3lFutY4tpYX2pgS05lT0eVFey0EIyloFOpLyoeF8LP33FkA8LFkB0Zw6OXUO6tnZ6hkw=="
	crossorigin="anonymous"
></script>
```

Add a CAPTCHA box to your website by inserting this div wherever you need verification:

```html
<div class="librecap"></div>
```

### Using npm

```bash
npm install librecap
```

Then import it in your project:

```javascript
import 'librecap'
```

## ⚙️ Advanced Configuration

LibreCap can be customized by adding data attributes to your div:

```html
<div class="librecap" data-theme="dark" data-language="en"></div>
```

Available configuration options:

- `data-theme`: Set to `"light"`, `"dark"`, or `"auto"` (default)
- `data-language`: NOT IMPLEMENTED YET, Set a specific language code after ISO 639-1 or `"auto"` (default)
- `data-sitekey`: Set your LibreCap site key when using a third party gateway server (optional, only when using a third party gateway server)
- `data-endpoint`: Set the URL of your LibreCap endpoint, this could be an gateway server or your own server address (default: `https://librecap.tn3w.dev/librecap/v1` when an site key is provided, otherwise `/librecap/v1`)
- `data-brand-title`: Set the title of the brand (default: `"LibreCap"`)
- `data-brand-url`: Set the URL of the brand (default: `"https://github.com/librecap/librecap"`)
- `data-brand-logo`: Set the logo of the brand (default: `base64 encoded logo of LibreCap`)
- `data-brand-description`: Set the description of the brand (default: `"LibreCap is a privacy-friendly CAPTCHA solution that respects your users' data."`)
- `data-brand-github`: Set the GitHub URL of the brand (default: `"https://github.com/librecap/librecap"`)
- `data-brand-terms`: Set the terms URL of the brand (default: `"https://github.com/librecap/librecap/blob/main/TERMS.md"`)
- `data-brand-privacy`: Set the privacy URL of the brand (default: `"https://github.com/librecap/librecap/blob/main/PRIVACY.md"`)

## 💻 Development

Clone the repository:

```bash
git clone https://github.com/librecap/librecap.git
cd librecap
```

Install the dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Start the demo server:

Install express and cors before running the demo server.

```bash
npm install express cors
```

```bash
npm run demo
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Copyright 2025 LibreCap Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
