import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Languages } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const DescriptionSection = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 border-b pb-3 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">აღწერა</h3>
      </div>

      <div className="rounded-md border border-border p-5">
        <Label className="block mb-4 font-medium flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span>აღწერა სხვადასხვა ენაზე</span>
        </Label>

        <Tabs defaultValue="georgian" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="georgian">ქართული</TabsTrigger>
            <TabsTrigger value="english">ინგლისური</TabsTrigger>
            <TabsTrigger value="russian">რუსული</TabsTrigger>
          </TabsList>
          
          <TabsContent value="georgian" className="space-y-4">
            <div>
              <Label htmlFor="description-georgian" className="text-sm mb-2 block">აღწერა ქართულად</Label>
              <Textarea 
                id="description-georgian"
                placeholder="დაწერეთ უძრავი ქონების დეტალური აღწერა ქართულად..."
                className="min-h-[120px] border-input focus:ring-ring focus:ring-1"
                rows={6}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="english" className="space-y-4">
            <div>
              <Label htmlFor="description-english" className="text-sm mb-2 block">Description in English</Label>
              <Textarea 
                id="description-english"
                placeholder="Write a detailed description of the property in English..."
                className="min-h-[120px] border-input focus:ring-ring focus:ring-1"
                rows={6}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="russian" className="space-y-4">
            <div>
              <Label htmlFor="description-russian" className="text-sm mb-2 block">Описание на русском</Label>
              <Textarea 
                id="description-russian"
                placeholder="Напишите подробное описание недвижимости на русском языке..."
                className="min-h-[120px] border-input focus:ring-ring focus:ring-1"
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-muted-foreground">
          დეტალური აღწერა დაგეხმარებათ მეტი ინტერესი გაიღოთ პოტენციური მყიდველების მხრიდან
        </div>
      </div>
    </div>
  );
};