import React from "react";
import { Button } from "@/components/ui/button";

export const BalanceSection: React.FC = () => {
  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex justify-center">
        <div>
          <div className="text-xs text-gray-500 mb-1">ბალანსი</div>
          <div className="font-bold flex items-center justify-center">0.00 ₾</div>
        </div>
      </div>
      <Button variant="default" size="sm" className="w-full mt-2">
        შევსება
      </Button>
    </div>
  );
};
