import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Settings, 
  User, 
  FileText,
  Clock,
  TrendingUp
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Overview and insights'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'Detailed analytics'
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: Clock,
    description: 'Time tracking'
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: TrendingUp,
    description: 'Usage patterns'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Preferences'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Account settings'
  }
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3 text-left",
                  isActive 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
