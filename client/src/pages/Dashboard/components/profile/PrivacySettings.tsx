import React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Trash2 } from "lucide-react";

export const PrivacySettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-medium">კონფიდენციალურობა</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="profile-public">საჯარო პროფილი</Label>
              <p className="text-sm text-gray-500">თქვენი პროფილი ხილული იქნება სხვა მომხმარებლებისთვის</p>
            </div>
            <Switch id="profile-public" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="contact-visible">კონტაქტის ინფორმაცია</Label>
              <p className="text-sm text-gray-500">ტელეფონის ნომრის ჩვენება განცხადებებში</p>
            </div>
            <Switch id="contact-visible" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="online-status">ონლაინ სტატუსი</Label>
              <p className="text-sm text-gray-500">ბოლო აქტივობის დროის ჩვენება</p>
            </div>
            <Switch id="online-status" />
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5" />
          <h3 className="text-lg font-medium">მონაცემთა გამოყენება</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="analytics">ანალიტიკა</Label>
              <p className="text-sm text-gray-500">მონაცემების გამოყენება სერვისის გაუმჯობესებისთვის</p>
            </div>
            <Switch id="analytics" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing">მარკეტინგი</Label>
              <p className="text-sm text-gray-500">პერსონალიზებული რეკლამა და შეთავაზებები</p>
            </div>
            <Switch id="marketing" />
          </div>
        </div>
      </Card>
      
      <Card className="p-6 border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-red-700">ანგარიშის წაშლა</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>გაფრთხილება:</strong> ანგარიშის წაშლა არ შეიძლება გაუქმდეს. ყველა თქვენი მონაცემი, 
              განცხადება და შეტყობინება სამუდამოდ წაიშლება.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">სტატუსი:</Badge>
            <span className="text-sm text-green-600">აქტიური</span>
          </div>
          
          <Button variant="destructive" size="sm">
            ანგარიშის წაშლა
          </Button>
        </div>
      </Card>
    </div>
  );
};