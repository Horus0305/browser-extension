import { startNewSession, endCurrentSession, handleIdleStateChange } from './session.js';
import { systemState } from './state.js';
import { getTodaySessions } from './storage.js';

export function setupEventHandlers() {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab && tab.url) {
                await startNewSession(tab.id, tab.url);
            }
        } catch (error) {
            console.error("Error in onActivated handler:", error);
        }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (tab.active && changeInfo.url) {
            await startNewSession(tabId, changeInfo.url);
        }
    });

    chrome.tabs.onRemoved.addListener(async (tabId) => {
        if (systemState.activeTab.tabId === tabId) {
            await endCurrentSession();
        }
    });

    chrome.windows.onFocusChanged.addListener(async (windowId) => {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            await endCurrentSession();
        } else {
            const [activeTab] = await chrome.tabs.query({ active: true, windowId: windowId });
            if (activeTab) {
                await startNewSession(activeTab.id, activeTab.url);
            }
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        const tabId = sender.tab?.id;
        if (tabId && tabId !== systemState.activeTab.tabId) return true;

        switch (message.type) {
            case 'userActive':
                handleIdleStateChange(false);
                break;
            case 'userInactive':
                handleIdleStateChange(true);
                break;
            case 'pageHidden':
            case 'windowBlur':
            case 'pageUnload':
                endCurrentSession();
                break;
            case 'pageVisible':
            case 'windowFocus':
                if (systemState.activeTab.isIdle) {
                    handleIdleStateChange(false);
                } else if (!systemState.activeTab.startTime) {
                    startNewSession(tabId, sender.tab.url);
                }
                break;
            case 'fetchTodaySessions':
                 getTodaySessions().then(sessions => {
                     sendResponse({ data: sessions });
                 }).catch(error => {
                    sendResponse({error: error.message})
                 });
                 return true; // async response
        }
        return true;
    });
}
