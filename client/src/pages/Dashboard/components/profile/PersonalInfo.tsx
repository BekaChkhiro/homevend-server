import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User } from "@/contexts/AuthContext";

interface PersonalInfoProps {
  user: User;
}

export const PersonalInfo: React.FC<PersonalInfoProps> = ({ user }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">პირადი ინფორმაცია</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">სახელი</Label>
            <Input id="firstName" placeholder="სახელი" />
          </div>
          <div>
            <Label htmlFor="lastName">გვარი</Label>
            <Input id="lastName" placeholder="გვარი" />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">ელფოსტა</Label>
          <Input id="email" type="email" value={user.email} />
        </div>
        
        <div>
          <Label htmlFor="phone">ტელეფონი</Label>
          <Input id="phone" placeholder="+995 5XX XX XX XX" />
        </div>
        
        <div>
          <Label htmlFor="address">მისამართი</Label>
          <Input id="address" placeholder="ქალაქი, უბანი, ქუჩა" />
        </div>
        
        <div className="flex gap-3">
          <Button>შენახვა</Button>
          <Button variant="outline">გაუქმება</Button>
        </div>
      </div>
    </Card>
  );
};