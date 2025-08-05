import React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const NotificationSettings: React.FC = () => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h3 className="text-lg font-medium">შეტყობინებების პარამეტრები</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">ელფოსტის შეტყობინებები</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-new">ახალი განცხადებები</Label>
                <p className="text-sm text-gray-500">შეტყობინება ახალი განცხადების შესახებ</p>
              </div>
              <Switch id="email-new" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-favorites">ფავორიტები</Label>
                <p className="text-sm text-gray-500">ფავორიტებში დამატებული ობიექტების განახლებები</p>
              </div>
              <Switch id="email-favorites" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-messages">შეტყობინებები</Label>
                <p className="text-sm text-gray-500">ახალი პირადი შეტყობინებები</p>
              </div>
              <Switch id="email-messages" defaultChecked />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">SMS შეტყობინებები</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-security">უსაფრთხოება</Label>
                <p className="text-sm text-gray-500">შესვლა და უსაფრთხოების ღონისძიებები</p>
              </div>
              <Switch id="sms-security" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sms-payments">გადახდები</Label>
                <p className="text-sm text-gray-500">ბალანსის შევსება და გადახდები</p>
              </div>
              <Switch id="sms-payments" defaultChecked />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">ბრაუზერის შეტყობინებები</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="browser-instant">მყისი შეტყობინებები</Label>
                <p className="text-sm text-gray-500">მყისი შეტყობინებები ბრაუზერში</p>
              </div>
              <Switch id="browser-instant" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button>შენახვა</Button>
          <Button variant="outline">განულება</Button>
        </div>
      </div>
    </Card>
  );
};