/**
 * Background service with OAuth handling and usage tracking
 */
import { categorizeDomain } from '@/lib/categories';

class BackgroundService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the background service
   */
  private async initialize(): Promise<void> {
    try {
      console.log("Initializing simplified BackgroundService...");
      this.isInitialized = true;
      console.log("BackgroundService initialized successfully");
    } catch (error) {
      console.error("Failed to initialize BackgroundService:", error);
    }
  }

  /**
   * Get current service status (for debugging)
   */
  public getStatus(): { isInitialized: boolean } {
    return { isInitialized: this.isInitialized };
  }
}

// Initialize the background service
export default defineBackground(() => {
  const runtime = (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
  const extensionId = runtime?.id || 'unknown';
  
  console.log('Browser Usage Tracker background service starting...', {
    id: extensionId,
    timestamp: new Date().toISOString()
  });
  
  // Create and initialize the background service
  const backgroundService = new BackgroundService();
  
  // Handle OAuth callback messages
  if (runtime?.onMessage?.addListener) {
    runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
      if (message.type === 'OAUTH_SUCCESS') {
        console.log('OAuth success received in background');
        // Send message to all tabs/popups that might be listening
        runtime.sendMessage({ type: 'OAUTH_SUCCESS' }).catch(() => {
          // Ignore errors if no listeners
        });
        if (sendResponse) sendResponse({ success: true });
        return true;
      } else if (message.type === 'OAUTH_ERROR') {
        console.error('OAuth error received in background:', message.error);
        // Send message to all tabs/popups that might be listening
        runtime.sendMessage({ type: 'OAUTH_ERROR', error: message.error }).catch(() => {
          // Ignore errors if no listeners
        });
        if (sendResponse) sendResponse({ success: false, error: message.error });
        return true;
      }
      return false;
    });
  }

  // ========= Usage Tracking (Focus-only mode) =========
  const api = (globalThis as any).browser || (globalThis as any).chrome;

  type DomainStats = { totalMs: number; visitCount: number; lastVisited: number };
  type UsageDay = { domains: Record<string, DomainStats>; totals?: { totalMsAll: number } };
  type ActiveSession = { tabId: number; windowId: number; domain: string; lastTickAt: number } | null;

  let active: ActiveSession = null;
  let windowFocused = true;
  const RETENTION_DAYS = 180; // as agreed

  const storage = api?.storage?.local;

  // Exclusions management
  const EXCLUSIONS_KEY = 'settings:exclusions';
  let exclusionsSet = new Set<string>();

  function normalizeHost(host?: string | null): string | null {
    try {
      if (!host) return null;
      let h = host.toLowerCase();
      if (h.startsWith('www.')) h = h.slice(4);
      return h;
    } catch {
      return null;
    }
  }

  async function readExclusions(): Promise<string[]> {
    try {
      if (!storage) return [];
      const res = await promisify<any>(storage.get, storage, [EXCLUSIONS_KEY]);
      const arr = res?.[EXCLUSIONS_KEY];
      if (Array.isArray(arr)) return arr.filter(Boolean).map((d) => normalizeHost(d)!).filter(Boolean) as string[];
      return [];
    } catch {
      return [];
    }
  }

  function setExclusionsInMemory(list: string[]): void {
    exclusionsSet = new Set((list || []).map((d) => normalizeHost(d)!).filter(Boolean) as string[]);
  }

  async function loadExclusions(): Promise<void> {
    const list = await readExclusions();
    setExclusionsInMemory(list);
  }

  function domainMatchesExclusion(domain: string, exclusion: string): boolean {
    if (domain === exclusion) return true;
    return domain.endsWith('.' + exclusion);
  }

  function isDomainExcluded(domain?: string | null): boolean {
    const d = normalizeHost(domain || '');
    if (!d) return false;
    for (const ex of exclusionsSet) {
      if (domainMatchesExclusion(d, ex)) return true;
    }
    return false;
  }

  function toDateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isExcludedUrl(url?: string | null): boolean {
    if (!url) return true;
    if (url.startsWith('chrome://')) return true;
    if (url.startsWith('edge://')) return true;
    if (url.startsWith('about:')) return true;
    if (url.startsWith('chrome-extension://')) return true;
    if (url.startsWith('moz-extension://')) return true;
    if (url.startsWith('file://')) return true;
    return false;
  }

  function isHttpUrl(url?: string | null): boolean {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  }

  function normalizeDomainFromUrl(url?: string | null): string | null {
    try {
      if (!url || !isHttpUrl(url) || isExcludedUrl(url)) return null;
      const u = new URL(url);
      let host = u.hostname.toLowerCase();
      if (host.startsWith('www.')) host = host.slice(4);
      return host || null;
    } catch {
      return null;
    }
  }

  function promisify<T>(fn: any, thisArg: any, ...args: any[]): Promise<T> {
    const isPromiseApi = !!(globalThis as any).browser;
    if (isPromiseApi) {
      return fn.call(thisArg, ...args) as Promise<T>;
    }
    return new Promise((resolve) => fn.call(thisArg, ...args, (cbRes: any) => resolve(cbRes)));
  }

  async function getTab(tabId: number): Promise<any | null> {
    try {
      if (!api?.tabs?.get) return null;
      const tab = await promisify<any>(api.tabs.get, api.tabs, tabId);
      return tab || null;
    } catch {
      return null;
    }
  }

  async function getActiveTabInWindow(windowId: number): Promise<any | null> {
    try {
      if (!api?.tabs?.query) return null;
      const tabs = await promisify<any[]>(api.tabs.query, api.tabs, { active: true, windowId });
      return tabs && tabs[0] ? tabs[0] : null;
    } catch {
      return null;
    }
  }

  async function isWindowFocusedAndNormal(windowId: number): Promise<boolean> {
    try {
      if (!api?.windows?.get) return windowFocused;
      const win = await promisify<any>(api.windows.get, api.windows, windowId);
      if (!win) return false;
      if (win.type && win.type !== 'normal') return false;
      if (typeof win.focused === 'boolean' && !win.focused) return false;
      if (win.state === 'minimized') return false;
      return true;
    } catch {
      return windowFocused;
    }
  }

  async function readDay(key: string): Promise<UsageDay> {
    try {
      if (!storage) return { domains: {}, totals: { totalMsAll: 0 } };
      const res = await promisify<any>(storage.get, storage, [key]);
      const data = res?.[key];
      if (data && data.domains) return data as UsageDay;
      return { domains: {}, totals: { totalMsAll: 0 } };
    } catch {
      return { domains: {}, totals: { totalMsAll: 0 } };
    }
  }

  async function writeDay(key: string, day: UsageDay): Promise<void> {
    if (!storage) return;
    await promisify<void>(storage.set, storage, { [key]: day });
  }

  async function addDelta(dayKey: string, domain: string, deltaMs: number, nowTs: number, incVisit: boolean): Promise<void> {
    if (!domain || deltaMs < 0) return;
    const day = await readDay(dayKey);
    const existing = day.domains[domain] || { totalMs: 0, visitCount: 0, lastVisited: 0 };
    const updated: DomainStats = {
      totalMs: existing.totalMs + (deltaMs > 0 ? deltaMs : 0),
      visitCount: existing.visitCount + (incVisit ? 1 : 0),
      lastVisited: Math.max(existing.lastVisited || 0, nowTs),
    };
    day.domains[domain] = updated;
    const totalMsAll = Object.values(day.domains).reduce((acc, d) => acc + (d.totalMs || 0), 0);
    day.totals = { totalMsAll };
    await writeDay(dayKey, day);
  }

  async function flushActive(nowTs: number = Date.now(), opts?: { includeIfUnfocused?: boolean }): Promise<void> {
    const sess = active;
    if (!sess) return;
    const delta = nowTs - sess.lastTickAt;
    if (delta <= 0) return;
    // If window is not truly focused/normal, don't accrue; just move the lastTickAt forward to now
    if (!opts?.includeIfUnfocused) {
      let accrue = windowFocused;
      if (accrue) {
        accrue = await isWindowFocusedAndNormal(sess.windowId);
      }
      if (!accrue) {
        if (active && active.tabId === sess.tabId && active.domain === sess.domain) {
          active.lastTickAt = nowTs;
        }
        return;
      }
    }
    const dayKey = `usage:${toDateKey(new Date(nowTs))}`;
    await addDelta(dayKey, sess.domain, delta, nowTs, false);
    // Guard against races where active was cleared/changed while awaiting
    if (active && active.tabId === sess.tabId && active.domain === sess.domain) {
      active.lastTickAt = nowTs;
    }
  }

  async function clearActive(): Promise<void> {
    active = null;
  }

  async function startForTab(tabId: number, windowId: number, incVisit: boolean = true): Promise<void> {
    const tab = await getTab(tabId);
    if (!tab) return;
    if (tab.incognito) return; // skip incognito by default
    const domain = normalizeDomainFromUrl(tab.url);
    if (!domain) return;
    if (isDomainExcluded(domain)) return;
    const nowTs = Date.now();
    // count a visit only when desired (tab activation or navigation),
    // not on window refocus to avoid inflating on popup open
    if (incVisit) {
      const dayKey = `usage:${toDateKey(new Date(nowTs))}`;
      await addDelta(dayKey, domain, 0, nowTs, true);
    } else {
      // Seed visit count = 1 if first time seen today without inflating on refocus
      const dayKey = `usage:${toDateKey(new Date(nowTs))}`;
      const day = await readDay(dayKey);
      if (!day.domains[domain]) {
        await addDelta(dayKey, domain, 0, nowTs, true);
      }
    }
    active = { tabId, windowId, domain, lastTickAt: nowTs };
  }

  async function onNavigationCommitted(tabId: number, url?: string | null): Promise<void> {
    const domain = normalizeDomainFromUrl(url);
    const nowTs = Date.now();
    if (active && tabId === active.tabId) {
      if (!domain) {
        await flushActive(nowTs);
        await clearActive();
        return;
      }
      if (domain !== active.domain) {
        await flushActive(nowTs);
        // If new domain is excluded, do not start tracking
        if (isDomainExcluded(domain)) {
          await clearActive();
          return;
        }
        // Start tracking new domain and count a visit (navigation)
        const dayKey = `usage:${toDateKey(new Date(nowTs))}`;
        await addDelta(dayKey, domain, 0, nowTs, true);
        active = { tabId, windowId: active.windowId, domain, lastTickAt: nowTs };
      }
      return;
    }

    // If there is no active session for this tab (e.g., navigating from New Tab),
    // start tracking if this tab is the active one in a focused/normal window.
    if (!domain) return;
    const tab = await getTab(tabId);
    if (!tab) return;
    const focusedOk = windowFocused || (await isWindowFocusedAndNormal(tab.windowId));
    if (focusedOk && tab.active) {
      // Flush any lingering active session from another tab before switching
      await flushActive(nowTs);
      if (!isDomainExcluded(domain)) {
        await startForTab(tabId, tab.windowId, true);
      } else {
        await clearActive();
      }
    }
  }

  async function initFocusedWindowAndActiveTab(): Promise<void> {
    try {
      if (!api?.windows?.getLastFocused) return;
      const win = await promisify<any>(api.windows.getLastFocused, api.windows, {});
      windowFocused = !!win?.focused;
      if (windowFocused && win && typeof win.id === 'number') {
        const activeTab = await getActiveTabInWindow(win.id);
        if (activeTab?.id) {
          await startForTab(activeTab.id, win.id, false);
        }
      }
    } catch {
      // ignore
    }
  }

  // Tabs activated
  if (api?.tabs?.onActivated?.addListener) {
    api.tabs.onActivated.addListener(async (activeInfo: any) => {
      try {
        if (!windowFocused) return;
        await flushActive(Date.now());
        await startForTab(activeInfo.tabId, activeInfo.windowId, true);
      } catch (e) {
        console.warn('onActivated handler error', e);
      }
    });
  }

  // Windows focus changes
  if (api?.windows?.onFocusChanged?.addListener) {
    api.windows.onFocusChanged.addListener(async (winId: number) => {
      try {
        if (winId === api.windows.WINDOW_ID_NONE) {
          windowFocused = false;
          // Count time up to the blur moment
          await flushActive(Date.now(), { includeIfUnfocused: true });
          await clearActive();
          return;
        }
        // Verify the window is truly focused and not minimized
        const focusedOk = await isWindowFocusedAndNormal(winId);
        if (!focusedOk) {
          windowFocused = false;
          await flushActive(Date.now(), { includeIfUnfocused: true });
          await clearActive();
          return;
        }
        windowFocused = true;
        const tab = await getActiveTabInWindow(winId);
        await flushActive(Date.now());
        if (tab?.id) await startForTab(tab.id, winId, false);
      } catch (e) {
        console.warn('onFocusChanged handler error', e);
      }
    });
  }

  // Web navigation events (captures normal navigations + SPA)
  if (api?.webNavigation?.onCommitted?.addListener) {
    api.webNavigation.onCommitted.addListener(async (details: any) => {
      try {
        if (details.frameId !== 0) return;
        const url = details.url as string | undefined;
        await onNavigationCommitted(details.tabId, url);
      } catch (e) {
        console.warn('onCommitted handler error', e);
      }
    });
  }
  if (api?.webNavigation?.onHistoryStateUpdated?.addListener) {
    api.webNavigation.onHistoryStateUpdated.addListener(async (details: any) => {
      try {
        if (details.frameId !== 0) return;
        const url = details.url as string | undefined;
        await onNavigationCommitted(details.tabId, url);
      } catch (e) {
        console.warn('onHistoryStateUpdated handler error', e);
      }
    });
  }

  // Fallback: sometimes typed URL or certain navigations are more reliably caught via tabs.onUpdated
  if (api?.tabs?.onUpdated?.addListener) {
    api.tabs.onUpdated.addListener(async (tabId: number, changeInfo: any, tab: any) => {
      try {
        // Only react when we have a meaningful navigation state
        if (!changeInfo?.status && !changeInfo?.url) return;
        const url = (changeInfo?.url || tab?.url) as string | undefined;
        if (!url) return;
        await onNavigationCommitted(tabId, url);
      } catch (e) {
        console.warn('onUpdated handler error', e);
      }
    });
  }

  // Tab removal / replacement cleanup
  if (api?.tabs?.onRemoved?.addListener) {
    api.tabs.onRemoved.addListener(async (tabId: number) => {
      try {
        if (active && active.tabId === tabId) {
          await flushActive(Date.now());
          await clearActive();
        }
      } catch (e) {
        console.warn('onRemoved handler error', e);
      }
    });
  }
  if (api?.tabs?.onReplaced?.addListener) {
    api.tabs.onReplaced.addListener(async (addedTabId: number, removedTabId: number) => {
      try {
        if (active && active.tabId === removedTabId) {
          active.tabId = addedTabId;
          active.lastTickAt = Date.now();
        }
      } catch (e) {
        console.warn('onReplaced handler error', e);
      }
    });
  }

  // Periodic flush and retention cleanup
  if (api?.alarms?.create) {
    try {
      api.alarms.create('usage-flush', { periodInMinutes: 1 });
      api.alarms.create('usage-cleanup', { periodInMinutes: 720 }); // 12h
    } catch {
      // ignore
    }
  }
  if (api?.alarms?.onAlarm?.addListener) {
    api.alarms.onAlarm.addListener(async (alarm: any) => {
      try {
        if (alarm?.name === 'usage-flush') {
          await flushActive(Date.now());
        } else if (alarm?.name === 'usage-cleanup') {
          await cleanupOldData();
        }
      } catch (e) {
        console.warn('onAlarm handler error', e);
      }
    });
  }

  async function cleanupOldData(): Promise<void> {
    if (!storage) return;
    try {
      const all = await promisify<any>(storage.get, storage, null);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
      const cutoffKey = toDateKey(cutoff);
      const toRemove: string[] = [];
      for (const k of Object.keys(all || {})) {
        if (k.startsWith('usage:')) {
          const datePart = k.split(':')[1] || '';
          if (datePart < cutoffKey) toRemove.push(k);
        }
      }
      if (toRemove.length) await promisify<void>(storage.remove, storage, toRemove);
    } catch {
      // ignore
    }
  }

  // Data Messaging API
  if (runtime?.onMessage?.addListener) {
    runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
      const type = message?.type;
      if (type === 'GET_TODAY_USAGE') {
        (async () => {
          await flushActive(Date.now());
          const now = new Date();
          const key = `usage:${toDateKey(now)}`;
          const day = await readDay(key);
          const websites = Object.entries(day.domains).map(([domain, s]) => ({
            domain,
            timeSpent: s.totalMs,
            lastVisited: s.lastVisited,
            visitCount: s.visitCount,
            category: categorizeDomain(domain),
          }));
          const totalMs = day.totals?.totalMsAll || websites.reduce((a, b) => a + b.timeSpent, 0);
          sendResponse({ date: toDateKey(now), totalMs, websites });
        })();
        return true;
      }
      if (type === 'GET_RANGE_USAGE') {
        (async () => {
          await flushActive(Date.now());
          const start = new Date(message.startDate);
          const end = new Date(message.endDate);
          // Normalize to local date boundaries
          start.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          const aggDomains: Record<string, DomainStats> = {};
          const daily: Array<{ date: string; totalMs: number }> = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = `usage:${toDateKey(d)}`;
            const day = await readDay(key);
            const total = day.totals?.totalMsAll || Object.values(day.domains).reduce((a, s) => a + s.totalMs, 0);
            daily.push({ date: toDateKey(new Date(d)), totalMs: total });
            for (const [domain, s] of Object.entries(day.domains)) {
              const cur = aggDomains[domain] || { totalMs: 0, visitCount: 0, lastVisited: 0 };
              aggDomains[domain] = {
                totalMs: cur.totalMs + s.totalMs,
                visitCount: cur.visitCount + s.visitCount,
                lastVisited: Math.max(cur.lastVisited, s.lastVisited),
              };
            }
          }
          const totalMs = daily.reduce((a, d) => a + d.totalMs, 0);
          const domains = Object.entries(aggDomains).map(([domain, s]) => ({ domain, timeSpent: s.totalMs, lastVisited: s.lastVisited, visitCount: s.visitCount, category: categorizeDomain(domain) }));
          sendResponse({ totalMs, daily, domains });
        })();
        return true;
      }
      if (type === 'GET_EXCLUSIONS') {
        (async () => {
          try {
            const list = await readExclusions();
            setExclusionsInMemory(list);
            sendResponse({ exclusions: list });
          } catch (e) {
            sendResponse({ exclusions: [] });
          }
        })();
        return true;
      }
      if (type === 'ADD_EXCLUSION') {
        (async () => {
          try {
            const domain: string = normalizeHost(message.domain) || '';
            if (!domain) {
              sendResponse({ success: false, error: 'invalid domain' });
              return;
            }
            const list = await readExclusions();
            if (!list.includes(domain)) list.unshift(domain);
            if (storage) await promisify<void>(storage.set, storage, { [EXCLUSIONS_KEY]: list });
            setExclusionsInMemory(list);
            sendResponse({ success: true, exclusions: list });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }
      if (type === 'REMOVE_EXCLUSION') {
        (async () => {
          try {
            const domain: string = normalizeHost(message.domain) || '';
            const list = (await readExclusions()).filter((d) => d !== domain);
            if (storage) await promisify<void>(storage.set, storage, { [EXCLUSIONS_KEY]: list });
            setExclusionsInMemory(list);
            sendResponse({ success: true, exclusions: list });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }
      if (type === 'GET_STORAGE_USAGE') {
        (async () => {
          try {
            if (!storage) {
              sendResponse({ totalBytes: 0, websiteBytes: 0, settingsBytes: 0, cacheBytes: 0, quotaBytes: 0 });
              return;
            }
            const all = await promisify<any>(storage.get, storage, null);
            const keys = Object.keys(all || {});
            const usageKeys = keys.filter((k) => k.startsWith('usage:'));
            const settingsKeys = keys.filter((k) => k.startsWith('settings:'));
            const cacheKeys = keys.filter((k) => k.startsWith('cache:'));

            async function getBytes(keysOrNull: any): Promise<number> {
              try {
                if (typeof storage.getBytesInUse === 'function') {
                  const v = await promisify<number>(storage.getBytesInUse, storage, keysOrNull);
                  return typeof v === 'number' ? v : 0;
                }
              } catch {
                // fall through to estimate
              }
              // Fallback: estimate using JSON size
              if (!keysOrNull) return new Blob([JSON.stringify(all || {})]).size;
              const obj: any = {};
              for (const k of keysOrNull as string[]) obj[k] = all[k];
              return new Blob([JSON.stringify(obj)]).size;
            }

            const [totalBytes, websiteBytes, settingsBytes, cacheBytes] = await Promise.all([
              getBytes(null),
              getBytes(usageKeys),
              getBytes(settingsKeys),
              getBytes(cacheKeys),
            ]);

            const quotaBytes = (api?.storage?.local && (api.storage.local as any).QUOTA_BYTES) || 0;
            sendResponse({ totalBytes, websiteBytes, settingsBytes, cacheBytes, quotaBytes });
          } catch (e) {
            sendResponse({ totalBytes: 0, websiteBytes: 0, settingsBytes: 0, cacheBytes: 0, quotaBytes: 0 });
          }
        })();
        return true;
      }
      if (type === 'EXPORT_DATA') {
        (async () => {
          try {
            if (!storage) {
              sendResponse({ success: true, data: { exportVersion: 1, exportedAt: new Date().toISOString(), days: {} } });
              return;
            }
            const all = await promisify<any>(storage.get, storage, null);
            const days: Record<string, any> = {};
            for (const [k, v] of Object.entries(all || {})) {
              if (k.startsWith('usage:')) days[k] = v;
            }
            sendResponse({ success: true, data: { exportVersion: 1, exportedAt: new Date().toISOString(), days } });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }
      if (type === 'RESET_DATA') {
        (async () => {
          try {
            const all = await promisify<any>(storage.get, storage, null);
            const keys = Object.keys(all || {}).filter((k) => k.startsWith('usage:'));
            if (keys.length) await promisify<void>(storage.remove, storage, keys);
            sendResponse({ success: true });
          } catch (e) {
            sendResponse({ success: false, error: String(e) });
          }
        })();
        return true;
      }
      return false;
    });
  }

  // Initialize current focus/tab and schedule cleanup on startup
  (async () => {
    await initFocusedWindowAndActiveTab();
    await cleanupOldData();
    await loadExclusions();
  })();

  // Expose service for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    (globalThis as any).backgroundService = backgroundService;
  }
});
