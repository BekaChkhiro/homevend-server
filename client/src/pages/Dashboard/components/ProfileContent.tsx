import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Settings, Bell, Shield } from "lucide-react";
import { PersonalInfo } from "./profile/PersonalInfo";
import { PasswordChange } from "./profile/PasswordChange";
import { NotificationSettings } from "./profile/NotificationSettings";
import { PrivacySettings } from "./profile/PrivacySettings";
import { User as UserType } from "@/contexts/AuthContext";

interface ProfileContentProps {
  user: UserType;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({ user }) => {
  return (
    <div className="w-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">პროფილის პარამეტრები</h2>
        
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              პირადი
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              პაროლი
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              შეტყობინებები
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              კონფიდენციალურობა
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="personal">
              <PersonalInfo user={user} />
            </TabsContent>
            
            <TabsContent value="password">
              <PasswordChange />
            </TabsContent>
            
            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
            
            <TabsContent value="privacy">
              <PrivacySettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
