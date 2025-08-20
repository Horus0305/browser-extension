import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Shield, 
  Database,
  Settings as SettingsIcon
} from "lucide-react";
import { AccountSettings } from "./AccountSettings";
import { PrivacySettings } from "./PrivacySettings";
import { DataManagement } from "./DataManagement";
import type { WebsiteUsage } from "@/lib/types";

interface SettingsViewProps {
  user: any;
  websites: WebsiteUsage[];
  daily: Array<{ date: string; totalMs: number }>;
}

export function SettingsView({ user, websites, daily }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, privacy, and extension preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-8">
            <TabsTrigger 
              value="account" 
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="privacy"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger 
              value="data"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-0 font-medium text-gray-600 data-[state=active]:text-primary data-[state=active]:shadow-none flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="space-y-6">
          <AccountSettings user={user} websites={websites} daily={daily} />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
