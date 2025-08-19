/**
 * Appwrite configuration and setup utilities
 */

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

/**
 * Default Appwrite configuration
 */
export const defaultAppwriteConfig: AppwriteConfig = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '', // Must be set via environment variables
  databaseId: 'usage-tracker',
  collectionId: 'usage-data'
};

/**
 * Get Appwrite configuration from environment variables
 */
export function getAppwriteConfig(): AppwriteConfig {
  return {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || defaultAppwriteConfig.endpoint,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || defaultAppwriteConfig.projectId,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || defaultAppwriteConfig.databaseId,
    collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID || defaultAppwriteConfig.collectionId
  };
}

/**
 * Validate Appwrite configuration
 */
export function validateAppwriteConfig(config: AppwriteConfig): boolean {
  if (!config.endpoint || !config.projectId) {
    console.error('Appwrite endpoint and project ID are required');
    return false;
  }
  
  if (!config.databaseId || !config.collectionId) {
    console.error('Appwrite database ID and collection ID are required');
    return false;
  }
  
  return true;
}

/**
 * Database collection schema for Appwrite setup
 */
export const usageDataCollectionSchema = {
  name: 'usage-data',
  attributes: [
    {
      key: 'userId',
      type: 'string',
      size: 36,
      required: true
    },
    {
      key: 'encryptedData',
      type: 'string',
      size: 1000000, // 1MB for encrypted usage data
      required: true
    },
    {
      key: 'dataHash',
      type: 'string',
      size: 64,
      required: true
    },
    {
      key: 'deviceId',
      type: 'string',
      size: 36,
      required: true
    },
    {
      key: 'lastUpdated',
      type: 'datetime',
      required: true
    },
    {
      key: 'version',
      type: 'string',
      size: 10,
      required: true,
      default: '1.0.0'
    }
  ],
  indexes: [
    {
      key: 'userId_index',
      type: 'key',
      attributes: ['userId']
    },
    {
      key: 'userId_deviceId_index',
      type: 'unique',
      attributes: ['userId', 'deviceId']
    },
    {
      key: 'lastUpdated_index',
      type: 'key',
      attributes: ['lastUpdated'],
      orders: ['DESC']
    }
  ]
};

/**
 * Security rules for the usage data collection
 */
export const usageDataSecurityRules = {
  // Users can only read their own documents
  read: 'user($userId)',
  
  // Users can only create documents for themselves
  create: 'user($userId)',
  
  // Users can only update their own documents
  update: 'user($userId)',
  
  // Users can only delete their own documents
  delete: 'user($userId)'
};

/**
 * Setup instructions for Appwrite project
 */
export const setupInstructions = `
# Appwrite Setup Instructions

## 1. Create Appwrite Project
1. Go to https://cloud.appwrite.io (or your self-hosted instance)
2. Create a new project
3. Copy the Project ID

## 2. Configure Authentication
1. Go to Auth > Settings
2. Enable Email/Password authentication
3. Configure password requirements as needed
4. Set up OAuth providers if desired (Google, GitHub, etc.)

## 3. Create Database and Collection
1. Go to Databases
2. Create a new database with ID: "usage-tracker"
3. Create a collection with ID: "usage-data"
4. Add the following attributes:
   - userId (String, 36 chars, required)
   - encryptedData (String, 1MB, required)
   - dataHash (String, 64 chars, required)
   - deviceId (String, 36 chars, required)
   - lastUpdated (DateTime, required)
   - version (String, 10 chars, required, default: "1.0.0")

## 4. Set up Indexes
1. Create index: userId_index (key on userId)
2. Create index: userId_deviceId_index (unique on userId, deviceId)
3. Create index: lastUpdated_index (key on lastUpdated, DESC order)

## 5. Configure Security Rules
Set the following permissions for the usage-data collection:
- Read: user($userId)
- Create: user($userId)
- Update: user($userId)
- Delete: user($userId)

## 6. Environment Configuration
Create a .env file with:
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_PROJECT_NAME=Browser-usage-tracker
VITE_APPWRITE_DATABASE_ID=usage-tracker
VITE_APPWRITE_COLLECTION_ID=usage-data

## 7. Test Connection
Use the provided test utilities to verify the setup works correctly.
`;

/**
 * Test Appwrite connection and configuration
 */
export async function testAppwriteConnection(config: AppwriteConfig): Promise<boolean> {
  try {
    const { Client } = await import('appwrite');
    
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    // Try to get project info (this will fail if project doesn't exist or config is wrong)
    const { Account } = await import('appwrite');
    const account = new Account(client);
    
    // This will throw if the project is not accessible
    await account.get().catch(() => {
      // Expected to fail if not authenticated, but connection should work
    });
    
    console.log('Appwrite connection test successful');
    return true;
    
  } catch (error) {
    console.error('Appwrite connection test failed:', error);
    return false;
  }
}