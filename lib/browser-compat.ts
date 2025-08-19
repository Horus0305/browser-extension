/**
 * Cross-browser compatibility utilities
 * Handles differences between Chrome and Firefox APIs
 */

/**
 * Get the browser-specific WINDOW_ID_NONE constant
 */
export function getWindowIdNone(): number {
  // Chrome uses chrome.windows.WINDOW_ID_NONE, Firefox uses -1
  if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.windows) {
    return (globalThis as any).browser.windows.WINDOW_ID_NONE ?? -1;
  }
  return -1;
}

/**
 * Check if we're running in Chrome
 */
export function isChrome(): boolean {
  return typeof (globalThis as any).chrome !== 'undefined' && !!(globalThis as any).chrome.runtime;
}

/**
 * Check if we're running in Firefox
 */
export function isFirefox(): boolean {
  return typeof (globalThis as any).browser !== 'undefined' && 
         navigator.userAgent.toLowerCase().includes('firefox');
}

/**
 * Get browser name for logging/debugging
 */
export function getBrowserName(): string {
  if (isFirefox()) return 'Firefox';
  if (isChrome()) return 'Chrome';
  return 'Unknown';
}

/**
 * Handle browser-specific memory API differences
 */
export function getMemoryUsage(): number {
  try {
    // Chrome has performance.memory, Firefox doesn't
    if (performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    
    // Fallback for Firefox - estimate based on other metrics
    return 0;
  } catch (error) {
    console.warn('Could not get memory usage:', error);
    return 0;
  }
}

/**
 * Handle browser-specific storage differences
 */
export async function getStorageData(keys: string[]): Promise<any> {
  try {
    // Try browser.storage first (Firefox/WebExtensions standard)
    if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.storage) {
      return await (globalThis as any).browser.storage.local.get(keys);
    }
    // Fallback to chrome.storage (Chrome)
    if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.storage) {
      return await (globalThis as any).chrome.storage.local.get(keys);
    }
    console.error('No storage API available');
    return {};
  } catch (error) {
    console.error('Storage access error:', error);
    return {};
  }
}

/**
 * Handle browser-specific storage differences
 */
export async function setStorageData(data: Record<string, any>): Promise<void> {
  try {
    // Try browser.storage first (Firefox/WebExtensions standard)
    if (typeof (globalThis as any).browser !== 'undefined' && (globalThis as any).browser.storage) {
      await (globalThis as any).browser.storage.local.set(data);
      return;
    }
    // Fallback to chrome.storage (Chrome)
    if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.storage) {
      await (globalThis as any).chrome.storage.local.set(data);
      return;
    }
    console.error('No storage API available');
  } catch (error) {
    console.error('Storage write error:', error);
  }
}

/**
 * Cross-browser tab query
 */
export async function queryTabs(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<any[]> {
  try {
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (!browserAPI || !browserAPI.tabs) {
      console.error('Browser tabs API not available');
      return [];
    }
    return await browserAPI.tabs.query(queryInfo);
  } catch (error) {
    console.error('Tab query error:', error);
    return [];
  }
}

/**
 * Cross-browser tab get
 */
export async function getTab(tabId: number): Promise<any> {
  try {
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (!browserAPI || !browserAPI.tabs) {
      console.error('Browser tabs API not available');
      return null;
    }
    return await browserAPI.tabs.get(tabId);
  } catch (error) {
    // Tab might have been closed
    return null;
  }
}

/**
 * Cross-browser window query
 */
export async function getAllWindows(): Promise<any[]> {
  try {
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (!browserAPI || !browserAPI.windows) {
      console.error('Browser windows API not available');
      return [];
    }
    return await browserAPI.windows.getAll();
  } catch (error) {
    console.error('Window query error:', error);
    return [];
  }
}

/**
 * Log browser compatibility info
 */
export function logBrowserInfo(): void {
  console.log('Browser compatibility info:', {
    browser: getBrowserName(),
    isChrome: isChrome(),
    isFirefox: isFirefox(),
    hasMemoryAPI: !!(performance && (performance as any).memory),
    windowIdNone: getWindowIdNone(),
    userAgent: navigator.userAgent
  });
}