/**
 * Tests for the popup App component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { AppProvider } from '../../../lib/contexts/AppContext';
import { AppwriteProvider } from '../../../lib/contexts/AppwriteContext';

// Mock Appwrite client
jest.mock('../../../lib/appwrite/client');

// Mock browser APIs
const mockBrowser = {
  tabs: {
    create: jest.fn()
  },
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test/${path}`)
  }
};

(globalThis as any).browser = mockBrowser;
(globalThis as any).chrome = mockBrowser;

// Mock hooks
jest.mock('../../../lib/hooks/useAppwriteAuth', () => ({
  useAppwriteAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    signOut: jest.fn(),
    clearError: jest.fn()
  })
}));

jest.mock('../../../lib/hooks/useUsageData', () => ({
  useUsageData: () => ({
    getTodayWebsites: () => [
      {
        domain: 'github.com',
        timeSpent: 7200000, // 2 hours
        visitCount: 5,
        lastVisited: new Date()
      },
      {
        domain: 'stackoverflow.com',
        timeSpent: 3600000, // 1 hour
        visitCount: 3,
        lastVisited: new Date()
      }
    ],
    getTodayTotalTime: () => 10800000, // 3 hours
    getUsageStats: () => ({
      averageDailyTime: 7200000 // 2 hours
    }),
    isLoading: false,
    error: null
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppwriteProvider>
    <AppProvider>
      {children}
    </AppProvider>
  </AppwriteProvider>
);

describe('Popup App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form when not authenticated', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    expect(screen.getByText('Usage Tracker')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('does not show stats when not authenticated', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // These elements should NOT be present when not authenticated
    expect(screen.queryByText('Today')).not.toBeInTheDocument();
    expect(screen.queryByText('This Week')).not.toBeInTheDocument();
    expect(screen.queryByText('Top Websites')).not.toBeInTheDocument();
    expect(screen.queryByText('View Detailed Report')).not.toBeInTheDocument();
    expect(screen.queryByText('github.com')).not.toBeInTheDocument();
  });

  it('shows centered login form layout', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // The login form should be centered and be the main content
    const loginForm = screen.getByText('Sign In').closest('form');
    expect(loginForm).toBeInTheDocument();
    
    // Should have email and password fields
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});

// Test authenticated state - needs separate test with different mock
describe('Popup App Component - Authenticated', () => {
  beforeEach(() => {
    // Mock authenticated state
    jest.doMock('../../../lib/hooks/useAppwriteAuth', () => ({
      useAppwriteAuth: () => ({
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        signOut: jest.fn(),
        clearError: jest.fn()
      })
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  // Note: These tests would need to be implemented separately with proper mocking
  // since Jest module mocking is complex for dynamic changes
});