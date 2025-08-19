export const systemState = {
    activeTab: {
        tabId: null,
        url: null,
        domain: null,
        startTime: null,
        isIdle: false
    },
};

export function resetActiveTab() {
    systemState.activeTab = {
        tabId: null,
        url: null,
        domain: null,
        startTime: null,
        isIdle: false
    };
}

export function setActiveTab(tabId, url, domain) {
    systemState.activeTab = {
        tabId: tabId,
        url: url,
        domain: domain,
        startTime: Date.now(),
        isIdle: false
    };
}

export function setTabIdle(isIdle) {
    if (systemState.activeTab) {
        systemState.activeTab.isIdle = isIdle;
    }
}
