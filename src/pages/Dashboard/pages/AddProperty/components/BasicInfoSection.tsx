import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Home, Building2, Tent, Hotel, Briefcase, CreditCard, MapPin, BookOpen } from "lucide-react";
import type { PropertyFormData } from "../types/propertyForm";

export const BasicInfoSection = () => {
  const form = useFormContext<PropertyFormData>();

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3 border-b border-border/50 pb-4 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">ძირითადი ინფორმაცია</h3>
          <p className="text-sm text-muted-foreground">შეავსეთ ქონების ძირითადი მონაცემები</p>
        </div>
      </div>
      
      {/* Property Type */}
      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Label className="text-base font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span>უძრავი ქონების ტიპი</span>
            <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1 ml-11">აირჩიეთ ქონების ტიპი</p>
        </div>
        <FormField
          control={form.control}
          name="propertyType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {[
                    { value: "apartment", label: "ბინა", icon: <Building2 className="h-5 w-5" />, desc: "მრავალსართულიან შენობაში" },
                    { value: "house", label: "კერძო სახლი", icon: <Home className="h-5 w-5" />, desc: "ცალკე მდგომი სახლი" },
                    { value: "cottage", label: "აგარაკი", icon: <Tent className="h-5 w-5" />, desc: "დასასვენებლად განკუთვნილი" },
                    { value: "land", label: "მიწის ნაკვეთი", icon: <MapPin className="h-5 w-5" />, desc: "სამშენებლო ან სასოფლო-სამეურნეო" },
                    { value: "commercial", label: "კომერციული ფართი", icon: <Briefcase className="h-5 w-5" />, desc: "ოფისი, მაღაზია, საწყობი" },
                    { value: "hotel", label: "სასტუმრო", icon: <Hotel className="h-5 w-5" />, desc: "სასტუმრო ან გესტჰაუსი" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`property-type-${option.value}`}
                      className="group relative flex flex-col items-start gap-3 border-2 border-border bg-background rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:bg-accent/50 transition-all duration-200 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:shadow-md"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <RadioGroupItem 
                          value={option.value} 
                          id={`property-type-${option.value}`} 
                          className="data-[state=checked]:border-primary data-[state=checked]:text-primary" 
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg group-hover:bg-primary/10 group-data-[state=checked]:bg-primary/10 transition-colors">
                            <span className="text-muted-foreground group-hover:text-primary group-data-[state=checked]:text-primary transition-colors">
                              {option.icon}
                            </span>
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-foreground group-data-[state=checked]:text-primary group-data-[state=checked]:font-semibold transition-all">
                              {option.label}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage className="mt-2" />
            </FormItem>
          )}
        />
      </div>
      
      {/* Deal Type */}
      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Label className="text-base font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <span>გარიგების ტიპი</span>
            <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1 ml-11">როგორი გარიგება გსურთ</p>
        </div>
        <FormField
          control={form.control}
          name="dealType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {[
                    { value: "sale", label: "იყიდება", desc: "სრული გაყიდვა" },
                    { value: "rent", label: "ქირავდება", desc: "გრძელვადიანი ქირა" },
                    { value: "mortgage", label: "გირავდება", desc: "გირავით გადაცემა" },
                    { value: "daily", label: "ქირავდება დღიურად", desc: "მოკლევადიანი ქირა" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`deal-type-${option.value}`}
                      className="group flex items-center gap-3 border-2 border-border bg-background rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:bg-accent/50 transition-all duration-200 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:shadow-md"
                    >
                      <RadioGroupItem 
                        value={option.value} 
                        id={`deal-type-${option.value}`} 
                        className="data-[state=checked]:border-primary data-[state=checked]:text-primary flex-shrink-0" 
                      />
                      <div className="flex-1">
                        <span className="font-medium text-foreground group-data-[state=checked]:text-primary group-data-[state=checked]:font-semibold transition-all block">
                          {option.label}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage className="mt-2" />
            </FormItem>
          )}
        />
      </div>
      
      {/* Location */}
      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Label className="text-base font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <span>მდებარეობა</span>
            <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1 ml-11">ქონების ზუსტი მისამართი</p>
        </div>
        
        <div className="space-y-6">
          {/* City */}
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-foreground mb-3 block">აირჩიე ქალაქი</Label>
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="city" className="h-12 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors">
                        <SelectValue placeholder="აირჩიეთ ქალაქი" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {[
                          { value: "tbilisi", label: "თბილისი" },
                          { value: "batumi", label: "ბათუმი" },
                          { value: "kutaisi", label: "ქუთაისი" },
                          { value: "rustavi", label: "რუსთავი" },
                          { value: "zugdidi", label: "ზუგდიდი" },
                          { value: "telavi", label: "თელავი" },
                          { value: "gori", label: "გორი" },
                          { value: "bakuriani", label: "ბაკურიანი" },
                          { value: "borjomi", label: "ბორჯომი" },
                          { value: "gudauri", label: "გუდაური" }
                        ].map((city) => (
                          <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Street and Number - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="street" className="text-sm font-medium text-foreground mb-3 block">ჩაწერეთ ქუჩა</Label>
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        id="street" 
                        placeholder="ქუჩის დასახელება" 
                        className="h-12 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <Label htmlFor="street-number" className="text-sm font-medium text-foreground mb-3 block">ჩაწერეთ ქუჩის ნომერი</Label>
              <FormField
                control={form.control}
                name="streetNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        id="street-number" 
                        placeholder="ქუჩის ნომერი" 
                        className="h-12 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Cadastral Code */}
      <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-6">
          <Label htmlFor="cadastral-code" className="text-base font-semibold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span>საკადასტრო კოდი</span>
            <span className="text-sm font-normal text-muted-foreground">(არასავალდებულო)</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1 ml-11">ქონების საკადასტრო კოდი თუ ცნობილია</p>
        </div>
        <div>
          <FormField
            control={form.control}
            name="cadastralCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    id="cadastral-code" 
                    placeholder="მაგ: 01.10.14.009.088" 
                    className="h-12 border-border/50 bg-background hover:border-primary/30 focus:border-primary transition-colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 საკადასტრო კოდი არის უნიკალური იდენტიფიკატორი, რომელიც გამოიყენება ქონების იურიდიული სტატუსის დასადგენად
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};