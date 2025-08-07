import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Lock, Globe, TrendingUp, Accessibility } from "lucide-react";

export const TagsSection = () => {
  const form = useFormContext();
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 border-b pb-3 mb-2">
        <Lock className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">ბეჯები</h3>
      </div>

      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "code-door", label: "კარი კოდით", icon: <Lock className="h-4 w-4" /> },
                  { id: "airbnb-booking", label: "Airbnb/Booking ექაუნთი", icon: <Globe className="h-4 w-4" /> },
                  { id: "investment", label: "საინვესტიციო", icon: <TrendingUp className="h-4 w-4" /> },
                  { id: "disability-friendly", label: "სსმპ", icon: <Accessibility className="h-4 w-4" /> }
                ].map((tag) => (
                  <FormField
                    key={tag.id}
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center space-x-3 p-4 rounded-lg border border-input hover:bg-accent transition-colors">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                const updatedTags = checked
                                  ? [...(field.value || []), tag.id]
                                  : (field.value || []).filter((value) => value !== tag.id);
                                field.onChange(updatedTags);
                              }}
                            />
                          </FormControl>
                          <Label className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                            <span className="text-muted-foreground">{tag.icon}</span>
                            {tag.label}
                          </Label>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};