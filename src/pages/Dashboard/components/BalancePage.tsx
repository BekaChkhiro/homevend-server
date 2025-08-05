import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Wallet, Building2, History } from "lucide-react";

export const BalancePage = () => {
  return (
    <div className="w-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">ბალანსის შევსება</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* მიმდინარე ბალანსი */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">მიმდინარე ბალანსი</h3>
              <Wallet className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-primary">0.00 ₾</div>
            <p className="text-sm text-gray-500 mt-2">
              ხელმისაწვდომი თანხა განცხადებების განთავსებისთვის
            </p>
          </Card>
          
          {/* ბოლო ტრანზაქცია */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">ბოლო შევსება</h3>
              <History className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">ჯერ არ გაქვთ შევსებული</p>
          </Card>
        </div>
        
        {/* შევსების ფორმა */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-medium mb-4">აირჩიეთ შევსების მეთოდი</h3>
          
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card">ბარათი</TabsTrigger>
              <TabsTrigger value="bank">ბანკი</TabsTrigger>
              <TabsTrigger value="terminal">ტერმინალი</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">თანხა (₾)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="100" 
                    min="10"
                    step="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">მინ. 10₾ - მაქს. 10,000₾</p>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" type="button">50₾</Button>
                  <Button variant="outline" type="button">100₾</Button>
                  <Button variant="outline" type="button">200₾</Button>
                </div>
                
                <div>
                  <Label htmlFor="card-number">ბარათის ნომერი</Label>
                  <Input 
                    id="card-number" 
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">ვადა</Label>
                    <Input 
                      id="expiry" 
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv" 
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
                </div>
                
                <Button className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  შევსება
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="bank" className="mt-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">საბანკო რეკვიზიტები</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ბანკი:</span> თიბისი ბანკი</p>
                    <p><span className="font-medium">ანგარიში:</span> GE12TB1234567890123456</p>
                    <p><span className="font-medium">მიმღები:</span> შპს Homeland</p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>დანიშნულება:</strong> მიუთითეთ თქვენი მომხმარებლის ID (#1234)
                  </p>
                </div>
                <Button className="w-full" size="lg">
                  <Building2 className="h-4 w-4 mr-2" />
                  კოპირება
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="terminal" className="mt-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">ტერმინალით შევსება</h4>
                  <ol className="space-y-2 text-sm list-decimal list-inside">
                    <li>აირჩიეთ „უძრავი ქონება"</li>
                    <li>აირჩიეთ „Homeland"</li>
                    <li>შეიყვანეთ თქვენი ID: <strong>#1234</strong></li>
                    <li>შეიყვანეთ სასურველი თანხა</li>
                  </ol>
                </div>
                <div className="text-center py-8">
                  <div className="text-6xl font-bold text-primary">#1234</div>
                  <p className="text-sm text-gray-500 mt-2">თქვენი მომხმარებლის ID</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* ტრანზაქციების ისტორია */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-medium mb-4">ტრანზაქციების ისტორია</h3>
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>ჯერ არ გაქვთ ტრანზაქციები</p>
          </div>
        </Card>
      </div>
    </div>
  );
};