/**
 * Tests for the LoginForm component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginForm } from '../components/LoginForm';

// Mock Appwrite client
jest.mock('../../../lib/appwrite/client');

// Mock the auth hook
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('../../../lib/hooks/useAppwriteAuth', () => ({
  useAppwriteAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    signInWithGoogle: mockSignInWithGoogle,
    isLoading: false
  })
}));

describe('LoginForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign in form by default', () => {
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Don't have an account? Sign Up" })).toBeInTheDocument();
  });

  it('switches to sign up form when sign up button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign Up" }));

    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
  });

  it('calls signIn with correct credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('calls signUp with correct credentials', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue(undefined);

    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Switch to sign up
    await user.click(screen.getByRole('button', { name: "Don't have an account? Sign Up" }));

    await user.type(screen.getByPlaceholderText('Your name'), 'Test User');
    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
  });

  it('calls onSuccess after successful authentication', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message on authentication failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const passwordInput = screen.getByPlaceholderText('Password');
    const toggleButton = passwordInput.parentElement?.querySelector('button[type="button"]');

    expect(passwordInput).toHaveAttribute('type', 'password');

    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.click(screen.getByText('×'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('hides cancel button when showCancel is false', () => {
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} showCancel={false} />
    );

    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue(undefined);

    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.click(screen.getByText('Continue with Google'));
    expect(mockSignInWithGoogle).toHaveBeenCalled();
  });

  it('displays Google sign-in button', () => {
    render(
      <LoginForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('OR CONTINUE WITH')).toBeInTheDocument();
  });
});