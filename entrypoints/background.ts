/**
 * Simplified background service for OAuth handling only
 * All tracking functionality removed
 */

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
  
  // Expose service for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    (globalThis as any).backgroundService = backgroundService;
  }
});
