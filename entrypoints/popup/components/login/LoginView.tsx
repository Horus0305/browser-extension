import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Globe, AlertCircle, LogOut } from "lucide-react";
import { LoginForm } from "./LoginForm";

interface LoginViewProps {
  authError: string | null;
  onLoginSuccess: () => void;
}

export function LoginView({ authError, onLoginSuccess }: LoginViewProps) {
  return (
    <div className="w-96 bg-white p-4 min-h-[500px] flex flex-col">
      {/* Minimal Header for Login */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Usage Tracker
          </h1>
        </div>
      </div>

      {/* Error Alert */}
      {authError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {authError}
          </AlertDescription>
        </Alert>
      )}

      {/* Login Form - Takes full space */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <LoginForm 
            onSuccess={onLoginSuccess}
            onCancel={() => {}} // No cancel action needed since this is the default view
            showCancel={false}
          />
        </div>
      </div>
    </div>
  );
}
