/**
 * React hooks for browser API abstraction and cross-platform compatibility
 */

import { useEffect, useState, useCallback } from "react";
import { TabInfo } from "../types";

/**
 * Hook for managing browser tabs with cross-platform compatibility
 */
export function useBrowserTabs() {
  const [activeTabs, setActiveTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Get current active tab
  const getCurrentTab = useCallback(async (): Promise<TabInfo | null> => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length > 0) {
        const tab = tabs[0];
        return {
          id: tab.id!,
          url: tab.url || "",
          domain: extractDomainFromUrl(tab.url || ""),
          title: tab.title,
          favicon: tab.favIconUrl,
          isActive: true,
          windowId: tab.windowId!,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting current tab:", error);
      return null;
    }
  }, []);

  // Get all tabs
  const getAllTabs = useCallback(async (): Promise<TabInfo[]> => {
    try {
      const tabs = await browser.tabs.query({});
      return tabs.map((tab) => ({
        id: tab.id!,
        url: tab.url || "",
        domain: extractDomainFromUrl(tab.url || ""),
        title: tab.title,
        favicon: tab.favIconUrl,
        isActive: tab.active || false,
        windowId: tab.windowId!,
      }));
    } catch (error) {
      console.error("Error getting all tabs:", error);
      return [];
    }
  }, []);

  // Listen for tab changes
  useEffect(() => {
    const handleTabActivated = (activeInfo: {
      tabId: number;
      windowId: number;
    }) => {
      setActiveTabId(activeInfo.tabId);
    };

    const handleTabUpdated = (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.status === "complete" && tab.url) {
        // Update tab info when URL changes
        getAllTabs().then(setActiveTabs);
      }
    };

    const handleTabRemoved = (tabId: number) => {
      setActiveTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    };

    // Add listeners
    browser.tabs.onActivated.addListener(handleTabActivated);
    browser.tabs.onUpdated.addListener(handleTabUpdated);
    browser.tabs.onRemoved.addListener(handleTabRemoved);

    // Initial load
    getCurrentTab().then((tab) => {
      if (tab) setActiveTabId(tab.id);
    });
    getAllTabs().then(setActiveTabs);

    // Cleanup
    return () => {
      browser.tabs.onActivated.removeListener(handleTabActivated);
      browser.tabs.onUpdated.removeListener(handleTabUpdated);
      browser.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, [getCurrentTab, getAllTabs]);

  return {
    activeTabs,
    activeTabId,
    getCurrentTab,
    getAllTabs,
  };
}

/**
 * Hook for managing browser windows and focus state
 */
export function useBrowserWindows() {
  const [isFocused, setIsFocused] = useState(true);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

  useEffect(() => {
    const handleWindowFocusChanged = (windowId: number) => {
      setIsFocused(windowId !== browser.windows.WINDOW_ID_NONE);
      setCurrentWindowId(
        windowId !== browser.windows.WINDOW_ID_NONE ? windowId : null
      );
    };

    // Add listener
    browser.windows.onFocusChanged.addListener(handleWindowFocusChanged);

    // Get initial state
    browser.windows.getCurrent().then((window) => {
      setCurrentWindowId(window.id!);
      setIsFocused(window.focused || false);
    });

    // Cleanup
    return () => {
      browser.windows.onFocusChanged.removeListener(handleWindowFocusChanged);
    };
  }, []);

  return {
    isFocused,
    currentWindowId,
  };
}

/**
 * Hook for browser storage operations with cross-platform compatibility
 */
export function useBrowserStorage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStorageData = useCallback(
    async <T>(key: string): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await browser.storage.local.get(key);
        return result[key] || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Storage error";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setStorageData = useCallback(
    async (key: string, value: any): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await browser.storage.local.set({ [key]: value });
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Storage error";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeStorageData = useCallback(
    async (key: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await browser.storage.local.remove(key);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Storage error";
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearStorage = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await browser.storage.local.clear();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Storage error";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getStorageData,
    setStorageData,
    removeStorageData,
    clearStorage,
  };
}

/**
 * Hook for runtime messaging between extension components
 */
export function useRuntimeMessaging() {
  const [isConnected, setIsConnected] = useState(false);

  const sendMessage = useCallback(async (message: any): Promise<any> => {
    try {
      return await browser.runtime.sendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }, []);

  const addMessageListener = useCallback(
    (
      listener: (
        message: any,
        sender: any,
        sendResponse: (response: any) => void
      ) => void
    ) => {
      browser.runtime.onMessage.addListener(listener);

      return () => {
        browser.runtime.onMessage.removeListener(listener);
      };
    },
    []
  );

  useEffect(() => {
    // Check if runtime is connected
    setIsConnected(!!browser.runtime.id);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Listen for connection changes
    browser.runtime.onConnect.addListener(handleConnect);

    return () => {
      browser.runtime.onConnect.removeListener(handleConnect);
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    addMessageListener,
  };
}

/**
 * Hook for managing extension permissions
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  const checkPermission = useCallback(
    async (permission: string): Promise<boolean> => {
      try {
        if (browser.permissions && browser.permissions.contains) {
          const result = await browser.permissions.contains({
            permissions: [permission as any],
          });
          return result;
        }
        return false;
      } catch (error) {
        console.error("Error checking permission:", error);
        return false;
      }
    },
    []
  );

  const requestPermission = useCallback(
    async (permission: string): Promise<boolean> => {
      try {
        if (browser.permissions && browser.permissions.request) {
          const result = await browser.permissions.request({
            permissions: [permission as any],
          });
          return result;
        }
        return false;
      } catch (error) {
        console.error("Error requesting permission:", error);
        return false;
      }
    },
    []
  );

  useEffect(() => {
    // Get current permissions
    if (browser.permissions && browser.permissions.getAll) {
      browser.permissions
        .getAll()
        .then((result) => {
          setPermissions(result.permissions || []);
        })
        .catch((error) => {
          console.error("Error getting permissions:", error);
        });
    }

    const handlePermissionAdded = (permissions: any) => {
      setPermissions((prev) => [...prev, ...(permissions.permissions || [])]);
    };

    const handlePermissionRemoved = (permissions: any) => {
      setPermissions((prev) =>
        prev.filter((p) => !permissions.permissions?.includes(p))
      );
    };

    // Listen for permission changes if available
    if (browser.permissions && browser.permissions.onAdded) {
      browser.permissions.onAdded.addListener(handlePermissionAdded);
      browser.permissions.onRemoved.addListener(handlePermissionRemoved);

      return () => {
        browser.permissions.onAdded.removeListener(handlePermissionAdded);
        browser.permissions.onRemoved.removeListener(handlePermissionRemoved);
      };
    }
  }, []);

  return {
    permissions,
    checkPermission,
    requestPermission,
  };
}

// Helper function to extract domain from URL
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
