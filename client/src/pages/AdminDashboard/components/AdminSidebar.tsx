import React from "react";
import { AdminProfileSection } from "./AdminProfileSection";
import { AdminSidebarMenu } from "./AdminSidebarMenu";
import { User } from "@/contexts/AuthContext";

interface AdminSidebarProps {
  user: User;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user }) => {
  return (
    <div className="w-64 mr-8 h-fit sticky top-0">
      <div className="bg-white rounded-lg border overflow-hidden">
        <AdminProfileSection user={user} />
        <AdminSidebarMenu />
      </div>
    </div>
  );
};