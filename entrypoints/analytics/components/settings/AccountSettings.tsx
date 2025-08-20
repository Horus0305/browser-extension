import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Calendar,
  Edit,
  Crown,
  Shield
} from "lucide-react";

interface AccountSettingsProps {
  user: any;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile save
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">{user?.name || 'User'}</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Pro
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date().getFullYear()}</span>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleEditProfile}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>
            Your usage and activity overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">145</div>
              <div className="text-sm text-gray-600">Total Hours Tracked</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">1,234</div>
              <div className="text-sm text-gray-600">Websites Visited</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">28</div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">Pro Plan</h4>
                <p className="text-sm text-gray-600">Advanced analytics and unlimited tracking</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-semibold">$9.99/month</div>
              <div className="text-sm text-gray-600">Next billing: Jan 1, 2025</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Change Plan
              </Button>
              <Button variant="outline" size="sm">
                Billing History
              </Button>
              <Button variant="outline" size="sm">
                Cancel Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
