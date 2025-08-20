import React from "react";
import { ProfileSection } from "./ProfileSection";
import { BalanceSection } from "./BalanceSection";
import { SidebarMenu } from "./SidebarMenu";
import { User } from "@/contexts/AuthContext";

interface SidebarProps {
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  return (
    <div className="w-64 mr-8 h-fit sticky top-0">
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* პროფილის მონაცემები */}
        <ProfileSection user={user} />
        
        {/* ბალანსი */}
        <BalanceSection />
        
        {/* მენიუს ელემენტები */}
        <SidebarMenu />
      </div>
    </div>
  );
};
