// Jest setup file
global.browser = {
  tabs: {
    query: jest.fn(),
    onActivated: { addListener: jest.fn(), removeListener: jest.fn() },
    onUpdated: { addListener: jest.fn(), removeListener: jest.fn() },
    onRemoved: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  windows: {
    WINDOW_ID_NONE: -1,
    getCurrent: jest.fn(),
    onFocusChanged: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    onConnect: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  permissions: {
    contains: jest.fn(),
    request: jest.fn(),
    getAll: jest.fn(),
    onAdded: { addListener: jest.fn(), removeListener: jest.fn() },
    onRemoved: { addListener: jest.fn(), removeListener: jest.fn() },
  },
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock import.meta.env for Vite environment variables
global.importMeta = {
  env: {
    VITE_APPWRITE_ENDPOINT: 'https://cloud.appwrite.io/v1',
    VITE_APPWRITE_PROJECT_ID: 'test-project',
    VITE_APPWRITE_DATABASE_ID: 'usage-tracker',
    VITE_APPWRITE_COLLECTION_ID: 'usage-data',
  }
};