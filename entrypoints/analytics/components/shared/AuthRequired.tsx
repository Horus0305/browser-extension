import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, ExternalLink } from "lucide-react";

export function AuthRequired() {
  const handleOpenPopup = () => {
    // Open the extension popup for authentication
    const browserAPI = (globalThis as any).browser || (globalThis as any).chrome;
    if (browserAPI?.action?.openPopup) {
      browserAPI.action.openPopup();
    } else {
      // Fallback: try to open popup URL
      window.open(browserAPI?.runtime?.getURL('popup.html'), '_blank', 'width=400,height=600');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please sign in to access your detailed analytics and settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleOpenPopup}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Login
          </Button>
          <p className="text-xs text-center text-gray-500">
            You'll be redirected to the login page to authenticate your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
