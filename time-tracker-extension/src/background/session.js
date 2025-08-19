import { systemState, setActiveTab, resetActiveTab, setTabIdle } from './state.js';
import { getDomain } from '../common/utils.js';
import { saveSession } from './storage.js';

export async function endCurrentSession() {
    const { domain, startTime } = systemState.activeTab;
    if (!domain || !startTime) {
        return;
    }

    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    await saveSession(domain, timeSpent);

    resetActiveTab();
}

export async function startNewSession(tabId, url) {
    await endCurrentSession();

    const domain = getDomain(url);
    if (domain) {
        setActiveTab(tabId, url, domain);
    }
}

export function handleIdleStateChange(isIdle) {
    if (isIdle) {
        if (!systemState.activeTab.isIdle) {
            endCurrentSession();
            setTabIdle(true);
        }
    } else {
        if (systemState.activeTab.isIdle) {
            startNewSession(systemState.activeTab.tabId, systemState.activeTab.url);
            setTabIdle(false);
        }
    }
}
