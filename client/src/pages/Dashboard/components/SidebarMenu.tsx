import React from "react";
import { Heart, Home, User, Plus, DollarSign } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  category?: string; // Optional category for grouping
}

export const SidebarMenu: React.FC = () => {
  const location = useLocation();
  
  // Define menu items with categories
  const menuItems: MenuItem[] = [
    { 
      id: "add-property", 
      path: "/dashboard/add-property", 
      label: "დამატება", 
      icon: <Plus className="h-5 w-5" />,
      category: "properties"
    },
    { 
      id: "my-properties", 
      path: "/dashboard/my-properties", 
      label: "ჩემი განცხადებები", 
      icon: <Home className="h-5 w-5" />,
      category: "properties"
    },
    { 
      id: "favorites", 
      path: "/dashboard/favorites", 
      label: "ფავორიტები", 
      icon: <Heart className="h-5 w-5" />,
      category: "properties"
    },
    { 
      id: "profile", 
      path: "/dashboard/profile", 
      label: "პროფილი", 
      icon: <User className="h-5 w-5" />,
      category: "account"
    },
    { 
      id: "balance", 
      path: "/dashboard/balance", 
      label: "შევსება", 
      icon: <DollarSign className="h-5 w-5" />,
      category: "account"
    },
  ];

  // Group menu items by category
  const propertyItems = menuItems.filter(item => item.category === "properties");
  const accountItems = menuItems.filter(item => item.category === "account");
  const uncategorizedItems = menuItems.filter(item => !item.category);

  // Check if path is active or is a sub-path
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Render a single menu item with animations
  const renderMenuItem = (item: MenuItem) => (
    <motion.div
      key={item.id}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="mb-1"
    >
      <Link
        to={item.path}
        className={cn(
          "flex items-center w-full px-4 py-3 text-sm rounded-lg transition-all duration-200 border border-transparent",
          isActive(item.path)
            ? "bg-primary/10 text-primary font-medium shadow-sm border-primary/20"
            : "text-gray-700 hover:bg-gray-100 hover:border-gray-200"
        )}
      >
        <div className={cn(
          "flex items-center justify-center w-8 h-8 rounded-md mr-3",
          isActive(item.path) 
            ? "bg-primary/20 text-primary" 
            : "bg-gray-100 text-gray-600"
        )}>
          {item.icon}
        </div>
        <span className="font-medium">{item.label}</span>
        
        {/* Active indicator */}
        {isActive(item.path) && (
          <motion.div 
            layoutId="activeIndicator"
            className="ml-auto w-1.5 h-6 bg-primary rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </Link>
    </motion.div>
  );

  // Render a category section with title
  const renderCategory = (title: string, items: MenuItem[]) => (
    <div className="mb-3">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      {items.map(renderMenuItem)}
    </div>
  );

  return (
    <div className="p-3">
      {propertyItems.length > 0 && renderCategory("განცხადებები", propertyItems)}
      {accountItems.length > 0 && renderCategory("ანგარიში", accountItems)}
      {uncategorizedItems.length > 0 && uncategorizedItems.map(renderMenuItem)}
    </div>
  );
};
