import React from "react";
import { User } from "@/contexts/AuthContext";

interface ProfileSectionProps {
  user: User;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user }) => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-center mb-2">
        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          {user.fullName.substring(0, 1).toUpperCase()}
        </div>
      </div>
      <div className="text-center mb-1">
        <h3 className="font-medium">{user.fullName}</h3>
        <p className="text-xs text-gray-500">ID: {user.id}/2023</p>
      </div>
    </div>
  );
};
