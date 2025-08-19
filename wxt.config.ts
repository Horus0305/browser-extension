import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    resolve: {
      alias: {
        '@': new URL('.', import.meta.url).pathname,
      },
    },
  }),
  // Explicitly support both Chrome and Firefox
  browser: 'chrome', // Default build target
  manifest: {
    name: 'Browser Usage Tracker',
    description: 'Track and analyze your browsing habits with detailed analytics and privacy controls',
    version: '1.0.0',
    // Fixed key for consistent extension ID during development
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi1Wmo9X7ucrbwNJjEIkEahkCymmDExW9ZhSovkyUQH992mXz1Xn/HBxHGHeIIeWsdGIJ4nWIY452aF+poqw7UsPI9xMEuoo4IWh0ZtCN5V8a0Ml85glTtVcXtRfSUG7mtPVaUJPbMYKtenQ/RjjC6F1g7Gd4SiQ89K5kG9UIUlMsZDPvz/8WFvHwTz+6lYK5MJIZqM+YlPBPjpQX+OYxwBZ6Z1WVVmhH',
    permissions: [
      'tabs', 
      'storage', 
      'activeTab',
      'identity'
    ],
    host_permissions: [
      'https://cloud.appwrite.io/*',
      'https://*.cloud.appwrite.io/*',
      'https://fra.cloud.appwrite.io/*',
      'https://accounts.google.com/*',
      'https://*.accounts.google.com/*',
      'https://*/*',
      'http://*/*'
    ],
    // OAuth web accessible resources
    web_accessible_resources: [
      {
        resources: ['oauth-callback.html'],
        matches: ['<all_urls>']
      }
    ],
    // Cross-browser compatibility settings
    browser_specific_settings: {
      gecko: {
        id: 'browser-usage-tracker@example.com',
        strict_min_version: '109.0'
      }
    },
    // Add content security policy for network requests
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' ws://localhost:3000 https://cloud.appwrite.io https://*.cloud.appwrite.io https://fra.cloud.appwrite.io https://accounts.google.com https://*.accounts.google.com https://oauth2.googleapis.com https://*.googleapis.com;"
    }
  },
});
