import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileContent } from "./ProfileContent";

export const ProfilePage = () => {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return <ProfileContent user={user} />;
};