import { setupEventHandlers } from './handlers.js';
import { endCurrentSession, startNewSession } from './session.js';
import { systemState } from './state.js';

const SAVE_INTERVAL_MINUTES = 1;

// Setup all event listeners
setupEventHandlers();

// Alarms for periodic save
chrome.alarms.create('periodicSave', { periodInMinutes: SAVE_INTERVAL_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'periodicSave') {
        if (!systemState.activeTab.isIdle && systemState.activeTab.startTime) {
            const { tabId, url } = systemState.activeTab;
            await endCurrentSession();
            // After saving, immediately start a new session for the current tab
            if (tabId && url) {
                await startNewSession(tabId, url);
            }
        }
    }
});

// Extension Lifecycle hooks
chrome.runtime.onStartup.addListener(async () => {
    // On browser start, check for active tab and start session
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
        await startNewSession(activeTab.id, activeTab.url);
    }
});

chrome.runtime.onSuspend.addListener(() => {
    endCurrentSession();
});

console.log("Modular background script loaded.");
