# Appwrite Integration Guide

This document outlines the necessary steps to modify the Website Time Tracker extension to use an Appwrite database for data persistence instead of the browser's local storage.

## 1. Prerequisites

Before you begin, you will need:
- An Appwrite account. You can sign up at [cloud.appwrite.io](https://cloud.appwrite.io).
- An Appwrite project created in your console.
- The Appwrite Web SDK. We will integrate it directly into the extension.
- Node.js and a package manager (npm or yarn) to download the SDK.

## 2. Appwrite Project Setup

### Step 2.1: Get Project Credentials
In your Appwrite project dashboard, go to the **Settings** page. You will need your **Project ID** and your **API Endpoint**.

### Step 2.2: Create a Database and Collection
1.  In your Appwrite project, navigate to the **Database** section.
2.  Create a new Database. Let's call it `time_tracker_db`.
3.  Inside this database, create a new Collection. Let's call it `sessions`.
4.  Go to the **Attributes** tab of your `sessions` collection and add the following attributes, based on the original system design:

| Key                | Type           | Size | Required | Notes                               |
| ------------------ | -------------- | ---- | -------- | ----------------------------------- |
| `url`              | URL            | 2048 | yes      | Full URL of the tracked page        |
| `domain`           | String         | 255  | yes      | The domain name of the URL          |
| `timeSpent`        | Integer        |      | yes      | Time spent in milliseconds          |
| `date`             | String         | 32   | yes      | Date of the session in `YYYY-MM-DD` |
| `userId`           | String         | 255  | yes      | Appwrite user ID (for anonymous session) |
| `lastUpdated`      | DateTime       |      | yes      | Automatically managed by Appwrite   |

### Step 2.3: Configure Collection Permissions
1.  Go to the **Settings** tab of your `sessions` collection.
2.  Set up permissions. For this extension, you'll want to grant **create**, **read**, **update**, and **delete** permissions to "All Users (role:member)". This allows any user of the extension with a valid session to manage their own documents.
3.  For each permission, you can define document-level security. A good practice is to ensure users can only see and edit their own data. When you create a document, you can pass a permissions array that grants access only to the current user.

## 3. Code Modifications

### Step 3.1: Include the Appwrite SDK
The easiest way to include the SDK in a Manifest V3 extension is to download it and bundle it with the extension files.

1.  Download the Appwrite web SDK:
    ```bash
    npm install appwrite
    # The SDK file is at node_modules/appwrite/dist/browser/appwrite.js
    ```
2.  Copy `appwrite.js` into your `time-tracker-extension` directory.
3.  Update `manifest.json` to include the SDK in the background service worker:
    ```json
    "background": {
      "service_worker": "background.js"
    },
    ```
    You'll need to import it within `background.js` using `importScripts('appwrite.js');`.

### Step 3.2: Initialize Appwrite Client in `background.js`
At the top of `background.js`, add the Appwrite initialization code.

```javascript
// At the top of background.js
importScripts('appwrite.js'); // Make sure you've copied the SDK file

const { Client, Account, Databases, ID, Query } = Appwrite;

const client = new Client();
client
    .setEndpoint('YOUR_APPWRITE_ENDPOINT') // Your API Endpoint
    .setProject('YOUR_PROJECT_ID');      // Your project ID

const account = new Account(client);
const databases = new Databases(client);

const DB_ID = 'YOUR_DATABASE_ID';
const COLLECTION_ID = 'YOUR_COLLECTION_ID'; // e.g., 'sessions'

// Function to get or create an anonymous session
async function getOrCreateAnonymousSession() {
    try {
        await account.get();
    } catch (e) {
        await account.createAnonymousSession();
    }
    return account.get();
}
```

### Step 3.3: Modify Session Handling in `background.js`
The `endCurrentSession` function needs to be rewritten to interact with Appwrite instead of local storage.

**New `endCurrentSession` function:**

```javascript
async function endCurrentSession() {
    const { domain, startTime, url } = systemState.activeTab;
    if (!domain || !startTime) {
        return;
    }

    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    if (timeSpent > 1000) { // Only save if more than a second
        try {
            const user = await getOrCreateAnonymousSession();
            const today = new Date().toISOString().split('T')[0];

            // Check if a document for this domain and date already exists
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTION_ID,
                [
                    Query.equal('domain', domain),
                    Query.equal('date', today),
                    Query.equal('userId', user.$id)
                ]
            );

            if (response.total > 0) {
                // Update existing document
                const document = response.documents[0];
                const newTimeSpent = document.timeSpent + timeSpent;
                await databases.updateDocument(
                    DB_ID,
                    COLLECTION_ID,
                    document.$id,
                    { timeSpent: newTimeSpent, url: url }
                );
            } else {
                // Create new document
                await databases.createDocument(
                    DB_ID,
                    COLLECTION_ID,
                    ID.unique(),
                    {
                        url: url,
                        domain: domain,
                        timeSpent: timeSpent,
                        date: today,
                        userId: user.$id
                    },
                    // Set document-level permissions
                    [`read("user:${user.$id}")`, `update("user:${user.$id}")`]
                );
            }
        } catch (error) {
            console.error("Failed to sync session to Appwrite:", error);
            // Implement offline queueing here
            addToOfflineQueue({ domain, url, timeSpent, date: new Date().toISOString().split('T')[0] });
        }
    }

    systemState.activeTab = { tabId: null, url: null, domain: null, startTime: null, isIdle: false };
}
```

### Step 3.4: Modify `popup.js` to Fetch from Appwrite
The popup should request data from the background script, which then queries Appwrite.

**In `popup.js`:**
Replace the `chrome.storage.local.get` logic with a message to the background script.

```javascript
// In popup.js, inside DOMContentLoaded listener
chrome.runtime.sendMessage({ type: 'fetchTodaySessions' }, (response) => {
    if (response.error) {
        console.error("Error fetching sessions:", response.error);
        sessionList.innerHTML = '<p>Error loading data.</p>';
        return;
    }

    const todaySessions = response.data;
    // ... (rest of the rendering logic remains the same)
});
```

**In `background.js`:**
Add a message listener to handle this request.

```javascript
// In background.js, inside the chrome.runtime.onMessage listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // ... (existing switch cases)

    if (message.type === 'fetchTodaySessions') {
        fetchTodaySessionsFromAppwrite().then(data => {
            sendResponse({ data: data });
        }).catch(error => {
            sendResponse({ error: error.message });
        });
        return true; // Indicates async response
    }
});

async function fetchTodaySessionsFromAppwrite() {
    const user = await getOrCreateAnonymousSession();
    const today = new Date().toISOString().split('T')[0];

    const response = await databases.listDocuments(
        DB_ID,
        COLLECTION_ID,
        [
            Query.equal('date', today),
            Query.equal('userId', user.$id),
            Query.limit(100) // Adjust as needed
        ]
    );
    return response.documents;
}
```

## 4. Offline Support and Syncing

As outlined in the new `endCurrentSession` function, you need a strategy for when Appwrite is unreachable.

1.  **Create an Offline Queue**: Use `chrome.storage.local` to store sessions that fail to sync.
    ```javascript
    // In background.js
    async function addToOfflineQueue(sessionData) {
        const { offlineQueue = [] } = await chrome.storage.local.get('offlineQueue');
        offlineQueue.push(sessionData);
        await chrome.storage.local.set({ offlineQueue });
    }
    ```
2.  **Create a Syncing Mechanism**:
    -   Use a recurring `chrome.alarms` to attempt to sync the queue periodically.
    -   Listen for the `navigator.onLine` event to trigger an immediate sync attempt when the network connection is restored.

## 5. Final Steps

- **Review Permissions**: Double-check your collection's read/write permissions in the Appwrite console to ensure data is secure.
- **Testing**: Thoroughly test all scenarios: online, offline, new user, existing user, etc.
- **User Experience**: Consider adding a status indicator in the popup to show the sync status (e.g., "Synced", "Syncing...", "Offline").
