import { useState } from "react";
import { useAppwriteAuth } from "@/lib/hooks/useAppwriteAuth";

export function useLoginForm(onSuccess: () => void) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, isLoading } = useAppwriteAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please fill in all required fields");
      return;
    }

    if (isSignUp && !name) {
      setFormError("Please enter your name");
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      
      setTimeout(() => {
        onSuccess();
      }, 100);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Authentication failed");
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (error) {
      console.error('Google sign in failed:', error);
      setFormError(error instanceof Error ? error.message : 'Google sign in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return {
    // State
    isSignUp,
    email,
    password,
    name,
    showPassword,
    formError,
    isGoogleLoading,
    isLoading,
    
    // Setters
    setIsSignUp,
    setEmail,
    setPassword,
    setName,
    setShowPassword,
    
    // Handlers
    handleSubmit,
    handleGoogleSignIn
  };
}
