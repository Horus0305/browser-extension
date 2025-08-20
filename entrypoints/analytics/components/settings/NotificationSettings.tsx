import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock,
  TrendingUp,
  AlertTriangle,
  Settings
} from "lucide-react";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [dailyReports, setDailyReports] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(false);
  const [breakReminders, setBreakReminders] = useState(true);

  const handleTestNotification = () => {
    // TODO: Send test notification
    console.log('Sending test notification...');
  };

  return (
    <div className="space-y-6">
      {/* Notification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Customize how and when you receive updates about your usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Notification Status</h4>
              <p className="text-sm text-gray-600">
                {pushNotifications ? 'Push notifications enabled' : 'Push notifications disabled'}
              </p>
            </div>
            <Button onClick={handleTestNotification} variant="outline">
              Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-xs text-gray-500">Receive updates via email</p>
              </div>
            </div>
            <Switch
              id="email"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="push">Browser Push Notifications</Label>
                <p className="text-xs text-gray-500">Real-time notifications in your browser</p>
              </div>
            </div>
            <Switch
              id="push"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Reports</CardTitle>
          <CardDescription>
            Schedule regular reports about your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="daily">Daily Summary</Label>
                <p className="text-xs text-gray-500">Get a daily recap of your browsing activity</p>
              </div>
            </div>
            <Switch
              id="daily"
              checked={dailyReports}
              onCheckedChange={setDailyReports}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="weekly">Weekly Report</Label>
                <p className="text-xs text-gray-500">Comprehensive weekly analysis and insights</p>
              </div>
            </div>
            <Switch
              id="weekly"
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>
        </CardContent>
      </Card>

      {/* Smart Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Alerts</CardTitle>
          <CardDescription>
            Intelligent notifications based on your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="usage-alerts">Usage Limit Alerts</Label>
                <p className="text-xs text-gray-500">Get notified when you exceed time limits</p>
              </div>
            </div>
            <Switch
              id="usage-alerts"
              checked={usageAlerts}
              onCheckedChange={setUsageAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <Label htmlFor="break-reminders">Break Reminders</Label>
                <p className="text-xs text-gray-500">Gentle reminders to take breaks</p>
              </div>
            </div>
            <Switch
              id="break-reminders"
              checked={breakReminders}
              onCheckedChange={setBreakReminders}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Schedule</CardTitle>
          <CardDescription>
            Set quiet hours and frequency preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">From:</span>
                  <Button variant="outline" size="sm">10:00 PM</Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">To:</span>
                  <Button variant="outline" size="sm">8:00 AM</Button>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Report Frequency</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm">Daily</Button>
                <Button variant="default" size="sm">Weekly</Button>
                <Button variant="outline" size="sm">Monthly</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
