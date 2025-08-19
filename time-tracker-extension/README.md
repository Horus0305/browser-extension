# Website Time Tracker Browser Extension

This is a browser extension that tracks the time you spend on different websites. It's built to be cross-browser compatible (Chrome and Firefox) and uses local storage to save your data.

## How to Install and Test

### For Google Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" using the toggle switch in the top-right corner.
3.  Click on the "Load unpacked" button.
4.  Select the `time-tracker-extension` directory.
5.  The extension should now be loaded. You'll see its icon in the toolbar.

### For Mozilla Firefox

1.  Open Firefox and navigate to `about:debugging`.
2.  Click on "This Firefox".
3.  Click on "Load Temporary Add-on...".
4.  Select the `manifest.json` file inside the `time-tracker-extension` directory.
5.  The extension will be loaded temporarily.

**Note**: To make it fully compatible with Firefox without modifications, the `manifest.json` might need slight adjustments (e.g., using `browser_specific_settings`). The current `manifest.json` is optimized for Chrome's Manifest V3. The `background.service_worker` key would need to be changed to `background.scripts` for Firefox.

## How It Works

-   The extension runs a script in the background to monitor your tab activity.
-   When you visit a website, it starts a timer.
-   It tracks your activity on the page (mouse movements, clicks, scrolling, typing). If you're inactive for 30 seconds, it pauses the timer.
-   The timer resumes when you become active again.
-   When you switch tabs or close the browser, it saves the time spent on the last active site.
-   Clicking the extension's icon in your browser toolbar will show you a list of websites you've visited today and the time spent on each.

## File Structure

-   `manifest.json`: The configuration file for the extension.
-   `background.js`: The core script that manages time tracking and data storage.
-   `content.js`: A script injected into every webpage to detect user activity.
-   `popup/`: This directory contains the files for the popup UI.
    -   `popup.html`: The HTML structure of the popup.
    -   `popup.js`: The script that fetches and displays your tracking data.
    -   `popup.css`: The stylesheet for the popup.
-   `icons/`: This directory is intended for the extension's icons.
-   `README.md`: This file.
-   `APPWRITE_INTEGRATION.md`: A guide on how to adapt the extension to use Appwrite for data storage.

## Icon Files

This project includes references to icon files in `manifest.json` but the actual `.png` files are not included. You should place your desired icons in the `icons/` directory with the following names:
-   `icon16.png` (16x16)
-   `icon48.png` (48x48)
-   `icon128.png` (128x128)
