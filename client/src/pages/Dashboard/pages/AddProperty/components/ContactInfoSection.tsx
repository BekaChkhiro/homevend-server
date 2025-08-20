import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { User, Phone } from "lucide-react";
import type { PropertyFormData } from "../types/propertyForm";

export const ContactInfoSection = () => {
  const form = useFormContext<PropertyFormData>();
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 border-b pb-3 mb-2">
        <User className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">საკონტაქტო ინფორმაცია</h3>
      </div>

      <div className="rounded-md border border-border p-5 space-y-6">
        {/* Name */}
        <div>
          <Label htmlFor="contact-name" className="block mb-3 font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>სახელი</span>
          </Label>
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    id="contact-name" 
                    type="text" 
                    placeholder="თქვენი სახელი" 
                    className="border-input focus:ring-ring focus:ring-1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone Number */}
        <div>
          <Label htmlFor="contact-phone" className="block mb-3 font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>ტელეფონის ნომერი</span>
          </Label>
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    id="contact-phone" 
                    type="tel" 
                    placeholder="+995 XXX XXX XXX" 
                    className="border-input focus:ring-ring focus:ring-1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            მაგალითი: +995 555 123 456
          </div>
        </div>
      </div>
    </div>
  );
};