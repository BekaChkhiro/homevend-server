import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Calculator, DollarSign, Square, TrendingUp } from "lucide-react";
import type { PropertyFormData } from "../types/propertyForm";

export const PriceAreaSection = () => {
  const form = useFormContext<PropertyFormData>();
  const area = form.watch("area");
  const totalPrice = form.watch("totalPrice");

  useEffect(() => {
    const areaNum = parseFloat(area || "0");
    const totalPriceNum = parseFloat(totalPrice || "0");
    
    if (areaNum > 0 && totalPriceNum > 0) {
      const pricePerSqmValue = (totalPriceNum / areaNum).toFixed(2);
      form.setValue("pricePerSqm", pricePerSqmValue);
    } else {
      form.setValue("pricePerSqm", "");
    }
  }, [area, totalPrice, form]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 border-b border-border/50 pb-4 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">ფასი და ფართი</h3>
          <p className="text-sm text-muted-foreground">მიუთითეთ ქონების ფასი და ფართი</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                <Square className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="property-area" className="text-base font-semibold text-foreground">
                  ფართი (მ²)
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">ქონების საერთო ფართი</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        id="property-area" 
                        type="number" 
                        step="0.1"
                        placeholder="ფართი კვადრატულ მეტრში" 
                        className="h-14 text-lg pl-4 pr-12 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors"
                        {...field}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        მ²
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Total Price */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="total-price" className="text-base font-semibold text-foreground">
                  სრული ფასი ($)
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <p className="text-sm text-muted-foreground">ქონების საერთო ღირებულება</p>
              </div>
            </div>
            <FormField
              control={form.control}
              name="totalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        id="total-price" 
                        type="number" 
                        placeholder="სრული ფასი დოლარში" 
                        className="h-14 text-lg pl-12 pr-4 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors"
                        {...field}
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                        $
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Price per Square Meter - Full Width */}
        <div className="mt-8 pt-6 border-t border-border/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
              <Calculator className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <Label htmlFor="price-per-sqm" className="text-base font-semibold text-foreground">
                კვ. ფასი ($/მ²)
              </Label>
              <p className="text-sm text-muted-foreground">ავტომატურად გამოითვლება</p>
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="pricePerSqm"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Input 
                      id="price-per-sqm" 
                      type="number" 
                      step="0.01"
                      placeholder="გამოითვლება ავტომატურად" 
                      className="h-14 text-lg pl-4 pr-16 bg-green-50/50 border-green-200 text-green-800 font-semibold cursor-not-allowed" 
                      readOnly
                      {...field}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 font-medium">
                      $/მ²
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">ფასის გამოთვლა</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  კვადრატული მეტრის ფასი გამოითვლება ავტომატურად სრული ფასისა და ფართის მიხედვით. 
                  ეს დაგეხმარებათ შეადაროთ სხვა ქონებებთან და განსაზღვროთ ბაზრის ღირებულება.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};