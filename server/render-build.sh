#!/usr/bin/env bash
# exit on error
set -o errexit

# Optionally install required apt packages for Puppeteer if root, but Render blocks apt-get in normal build scripts.
# Instead, we will rely on downloading the Chrome binary via Puppeteer and setting PUPPETEER_SKIP_CHROMIUM_DOWNLOAD.
# Wait, Render provides Puppeteer on Node environments if you use the native chrome. We don't have apt access in the build script without root. 
# It is better to use Render's built-in Playwright/Puppeteer support by setting PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# and using PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome. We will just document this in the README or Render settings.
# For now, let's just make the build script install dependencies.
npm install
npx puppeteer browsers install chrome
