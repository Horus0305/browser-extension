import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";

interface PricingProps {
  onUpgrade?: () => void;
}

export function Pricing({ onUpgrade }: PricingProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Go Pro</h1>
        <p className="text-gray-600 mt-1">
          Unlock advanced analytics and cross-device sync.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" /> Pro Plan
          </CardTitle>
          <CardDescription>
            Everything you need to get the most out of your browsing analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-3xl font-bold">$9.99<span className="text-base font-semibold text-gray-500">/month</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5"/> Unlimited history (cloud backup)</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5"/> Cross-device sync</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5"/> Advanced reports and export</li>
                <li className="flex items-start gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5"/> Priority support</li>
              </ul>
            </div>
            <div className="flex items-center">
              <Button className="w-full" size="lg" onClick={onUpgrade}>
                Upgrade to Pro
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Note: Checkout integration will be provided via Stripe. After purchase, your account status will update automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
