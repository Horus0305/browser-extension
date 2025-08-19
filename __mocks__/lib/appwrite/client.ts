// Mock Appwrite client for tests
import { Client, Account, Databases } from 'appwrite';

const mockClient = {
  setEndpoint: jest.fn().mockReturnThis(),
  setProject: jest.fn().mockReturnThis(),
} as unknown as Client;

export const client = mockClient;

export const account = {
  get: jest.fn().mockRejectedValue(new Error('Not authenticated')),
  createEmailPasswordSession: jest.fn(),
  create: jest.fn(),
  deleteSession: jest.fn(),
} as unknown as Account;

export const databases = {
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  getDocument: jest.fn(),
  listDocuments: jest.fn(),
  deleteDocument: jest.fn(),
} as unknown as Databases;

export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'test-project',
  databaseId: 'usage-tracker',
  collectionId: 'usage-data',
};