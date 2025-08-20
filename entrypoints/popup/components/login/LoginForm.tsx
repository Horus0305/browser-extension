import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useLoginForm } from "./useLoginForm";
import { GoogleIcon } from "./GoogleIcon";

interface LoginFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  showCancel?: boolean;
}

export function LoginForm({ onSuccess, onCancel, showCancel = true }: LoginFormProps) {
  const {
    isSignUp,
    email,
    password,
    name,
    showPassword,
    formError,
    isGoogleLoading,
    isLoading,
    setIsSignUp,
    setEmail,
    setPassword,
    setName,
    setShowPassword,
    handleSubmit,
    handleGoogleSignIn
  } = useLoginForm(onSuccess);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900" role="heading">
          {isSignUp ? "Create Account" : "Sign In"}
        </h3>
        {showCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </Button>
        )}
      </div>

      {formError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500 font-medium">OR CONTINUE WITH</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 py-2.5"
          >
            {isGoogleLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                <GoogleIcon />
                <span className="text-gray-700 font-medium">Continue with Google</span>
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={isLoading}
            className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-sm text-gray-500 text-center">
        {isSignUp 
          ? "Create an account to sync your data across devices"
          : "Sign in to access your data from any device"
        }
      </div>
    </div>
  );
}
