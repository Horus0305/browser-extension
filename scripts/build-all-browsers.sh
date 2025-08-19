#!/bin/bash

# Build script for cross-browser compatibility
# Builds the extension for both Chrome and Firefox

echo "🚀 Building Browser Usage Tracker for all supported browsers..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .output

# Build for Chrome (default)
echo "🔧 Building for Chrome..."
npm run build

# Build for Firefox
echo "🦊 Building for Firefox..."
npm run build:firefox

echo "✅ Build complete! Check .output directory for browser-specific builds."
echo ""
echo "📁 Chrome build: .output/chrome-mv3/"
echo "📁 Firefox build: .output/firefox-mv2/"
echo ""
echo "🔍 To test:"
echo "  Chrome: Load unpacked extension from .output/chrome-mv3/"
echo "  Firefox: Load temporary add-on from .output/firefox-mv2/manifest.json"