import { Client, Account, Databases } from "appwrite";

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

const account = new Account(client);
const databases = new Databases(client);

export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'usage-tracker',
  collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID || 'usage-data',
};

export { client, account, databases };