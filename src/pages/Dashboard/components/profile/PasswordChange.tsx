import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

export const PasswordChange: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-5 w-5" />
        <h3 className="text-lg font-medium">პაროლის შეცვლა</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">მიმდინარე პაროლი</Label>
          <Input id="currentPassword" type="password" placeholder="შეიყვანეთ მიმდინარე პაროლი" />
        </div>
        
        <div>
          <Label htmlFor="newPassword">ახალი პაროლი</Label>
          <Input id="newPassword" type="password" placeholder="შეიყვანეთ ახალი პაროლი" />
          <p className="text-xs text-gray-500 mt-1">მინ. 8 სიმბოლო, ერთი დიდი და პატარა ასო</p>
        </div>
        
        <div>
          <Label htmlFor="confirmPassword">გაიმეორეთ ახალი პაროლი</Label>
          <Input id="confirmPassword" type="password" placeholder="გაიმეორეთ ახალი პაროლი" />
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>შენიშვნა:</strong> პაროლის შეცვლის შემდეგ თქვენ ავტომატურად გამოვალთ სისტემიდან
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button>პაროლის შეცვლა</Button>
          <Button variant="outline">გაუქმება</Button>
        </div>
      </div>
    </Card>
  );
};