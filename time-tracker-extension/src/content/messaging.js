function sendMessage(type, data = {}) {
    try {
        chrome.runtime.sendMessage({ type, ...data });
    } catch (e) {
        // This can happen if the extension is reloaded or the background script is not ready.
        console.warn("Time Tracker: Could not send message to background script.", e);
    }
}
