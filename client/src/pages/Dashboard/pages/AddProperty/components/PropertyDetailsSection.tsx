import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { Home, Thermometer, Car, Droplets, Building, Waves, Sofa, TreePine, Warehouse, Sailboat, Tally4, Landmark } from "lucide-react";

export const PropertyDetailsSection = () => {
  const form = useFormContext();

  // Watch form values for conditional rendering
  const hasBalcony = form.watch("hasBalcony");
  const hasPool = form.watch("hasPool");
  const hasLivingRoom = form.watch("hasLivingRoom");
  const hasLoggia = form.watch("hasLoggia");
  const hasVeranda = form.watch("hasVeranda");
  const hasYard = form.watch("hasYard");
  const hasStorage = form.watch("hasStorage");

  console.log(form.getValues());


  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 border-b pb-3 mb-2">
        <Home className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">განცხადების დეტალები</h3>
      </div>

      {/* Rooms */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">ოთახები</Label>
        <FormField
          control={form.control}
          name="rooms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-5 md:grid-cols-10 gap-3"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "10+"].map((num) => {
                    const isSelected = field.value === num.toString();
                    return (
                      <div key={num} className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => field.onChange(num.toString())}
                          className={`flex items-center justify-center border rounded-md p-3 cursor-pointer transition-colors min-w-[45px] ${isSelected
                            ? 'border-primary bg-accent font-medium'
                            : 'border-input bg-background hover:bg-accent hover:border-ring'
                            }`}
                        >
                          {num}
                        </button>
                      </div>
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Bedrooms */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">საძინებელი</Label>
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-5 md:grid-cols-10 gap-3"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "10+"].map((num) => {
                    const isSelected = field.value === num.toString();
                    return (
                      <div key={num} className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => field.onChange(num.toString())}
                          className={`flex items-center justify-center border rounded-md p-3 cursor-pointer transition-colors min-w-[45px] ${isSelected
                            ? 'border-primary bg-accent font-medium'
                            : 'border-input bg-background hover:bg-accent hover:border-ring'
                            }`}
                        >
                          {num}
                        </button>
                      </div>
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Bathrooms */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium flex items-center gap-2">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span>სველი წერტილი</span>
        </Label>
        <FormField
          control={form.control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {[
                    { value: "1", label: "1" },
                    { value: "2", label: "2" },
                    { value: "3", label: "3+" },
                    { value: "shared", label: "საერთო" }
                  ].map((option) => {
                    const isSelected = field.value === option.value;
                    return (
                      <div key={option.value} className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`flex items-center justify-center border rounded-md p-3 cursor-pointer transition-colors min-w-[60px] ${isSelected
                            ? 'border-primary bg-accent font-medium'
                            : 'border-input bg-background hover:bg-accent hover:border-ring'
                            }`}
                        >
                          {option.label}
                        </button>
                      </div>
                    );
                  })}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Total Floors */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">სართულები სულ</Label>
        <FormField
          control={form.control}
          name="totalFloors"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="მთლიანი სართულების რაოდენობა"
                  className="border-input focus:ring-ring focus:ring-1"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Building Status */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span>სტატუსი</span>
        </Label>
        <FormField
          control={form.control}
          name="buildingStatus"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: "old-built", label: "ძველი აშენებული" },
                    { value: "new-built", label: "ახალი აშენებული" },
                    { value: "under-construction", label: "მშენებარე" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`status-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`status-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Construction Year */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">აშენების წელი</Label>
        <FormField
          control={form.control}
          name="constructionYear"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: "before-1955", label: "<1955" },
                    { value: "1955-2000", label: "1955-2000" },
                    { value: "after-2000", label: ">2000" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`year-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`year-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Condition */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">მდგომარეობა</Label>
        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-2 md:grid-cols-4 gap-3"
                >
                  {[
                    { value: "newly-renovated", label: "ახალი გარემონტებული" },
                    { value: "old-renovated", label: "ძველი გარემონტებული" },
                    { value: "ongoing-renovation", label: "მიმდინარე რემონტი" },
                    { value: "needs-renovation", label: "სარემონტო" },
                    { value: "white-frame", label: "თეთრი კარკასი" },
                    { value: "black-frame", label: "შავი კარკასი" },
                    { value: "green-frame", label: "მწვანე კარკასი" },
                    { value: "white-plus", label: "თეთრი პლიუსი" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`condition-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`condition-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Project Type */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">პროექტის ტიპი</Label>
        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {[
                    { value: "non-standard", label: "არასტანდარტული" },
                    { value: "villa", label: "ვილა" },
                    { value: "townhouse", label: "თაუნჰაუსი" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`project-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`project-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Ceiling Height */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">ჭერის სიმაღლე</Label>
        <FormField
          control={form.control}
          name="ceilingHeight"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.1"
                  placeholder="მეტრი"
                  className="border-input focus:ring-ring focus:ring-1"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Heating */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span>გათბობა</span>
        </Label>
        <FormField
          control={form.control}
          name="heating"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {[
                    { value: "central-heating", label: "ცენტრალური გათბობა" },
                    { value: "gas-heater", label: "გაზის გამათბობელი" },
                    { value: "electric-heater", label: "დენის გამათბობელი" },
                    { value: "central-floor", label: "ცენტრალური+იატაკის გათბობა" },
                    { value: "no-heating", label: "გათბობის გარეშე" },
                    { value: "individual", label: "ინდივიდუალური" },
                    { value: "floor-heating", label: "იატაკის გათბობა" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`heating-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`heating-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Parking */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium flex items-center gap-2">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span>პარკირება</span>
        </Label>
        <FormField
          control={form.control}
          name="parking"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {[
                    { value: "garage", label: "ავტოფარეხი" },
                    { value: "parking-space", label: "პარკინგის ადგილი" },
                    { value: "yard-parking", label: "ეზოს პარკინგი" },
                    { value: "underground-parking", label: "მიწისქვეშა პარკინგი" },
                    { value: "paid-parking", label: "ფასიანი ავტოსადგომი" },
                    { value: "no-parking", label: "პარკინგის გარეშე" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`parking-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`parking-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Hot Water */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium flex items-center gap-2">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span>ცხელი წყალი</span>
        </Label>
        <FormField
          control={form.control}
          name="hotWater"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {[
                    { value: "gas-water-heater", label: "გაზის გამაცხელებელი" },
                    { value: "boiler", label: "ავზი" },
                    { value: "electric-water-heater", label: "დენის გამაცხელებელი" },
                    { value: "solar-heater", label: "მზის გამაცხელებელი" },
                    { value: "no-hot-water", label: "ცხელი წყლის გარეშე" },
                    { value: "central-hot-water", label: "ცენტრალური ცხელი წყალი" },
                    { value: "natural-hot-water", label: "ბუნებრივი ცხელი წყალი" },
                    { value: "individual", label: "ინდივიდუალური" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`hot-water-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`hot-water-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium text-sm">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Building Material */}
      <div className="rounded-md border border-border p-5">
        <Label className="block mb-3 font-medium">სამშენებლო მასალა</Label>
        <FormField
          control={form.control}
          name="buildingMaterial"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  {[
                    { value: "block", label: "ბლოკი" },
                    { value: "brick", label: "აგური" },
                    { value: "wood", label: "ხის მასალა" },
                    { value: "reinforced-concrete", label: "რკინა-ბეტონი" },
                    { value: "combined", label: "კომბინირებული" }
                  ].map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`material-${option.value}`}
                      className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                    >
                      <RadioGroupItem value={option.value} id={`material-${option.value}`} />
                      <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* Balcony */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasBalcony"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-balcony"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Tally4 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="has-balcony" className="font-medium">აივანი</Label>
              </div>
            </FormItem>
          )}
        />
        {hasBalcony && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="balconyCount"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">აივნის რაოდენობა</Label>
                  <FormControl>
                    <Input {...field} type="number" placeholder="რაოდენობა" className="border-input focus:ring-ring focus:ring-1" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balconyArea"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">აივნის ფართობი (მ²)</Label>
                  <FormControl>
                    <Input {...field} type="number" step="0.1" placeholder="ფართობი" className="border-input focus:ring-ring focus:ring-1" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Pool */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasPool"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-pool"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label htmlFor="has-pool" className="font-medium flex items-center gap-2">
                  <Waves className="h-4 w-4 text-muted-foreground" />
                  <span>აუზი</span>
                </Label>
              </div>
            </FormItem>
          )}
        />
        {hasPool && (
          <FormField
            control={form.control}
            name="poolType"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm mb-2 block">აუზის ტიპი</Label>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    {[
                      { value: "outdoor", label: "ღია" },
                      { value: "indoor", label: "დახურული" }
                    ].map((option) => (
                      <label
                        key={option.value}
                        htmlFor={`pool-type-${option.value}`}
                        className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                      >
                        <RadioGroupItem value={option.value} id={`pool-type-${option.value}`} />
                        <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Living Room */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasLivingRoom"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-living-room"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label htmlFor="has-living-room" className="font-medium flex items-center gap-2">
                  <Sofa className="h-4 w-4 text-muted-foreground" />
                  <span>მისაღები</span>
                </Label>
              </div>
            </FormItem>
          )}
        />
        {hasLivingRoom && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="livingRoomArea"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">მისაღების ფართი (მ²)</Label>
                  <FormControl>
                    <Input {...field} type="number" step="0.1" placeholder="ფართი" className="border-input focus:ring-ring focus:ring-1" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="livingRoomType"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">მისაღების ტიპი</Label>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {[
                        { value: "separate", label: "გამოყოფილი" },
                        { value: "studio", label: "სტუდიო" }
                      ].map((option) => (
                        <label
                          key={option.value}
                          htmlFor={`living-room-type-${option.value}`}
                          className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                        >
                          <RadioGroupItem value={option.value} id={`living-room-type-${option.value}`} />
                          <span className="group-data-[state=checked]:font-medium">{option.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Loggia */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasLoggia"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-loggia"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Landmark className="h-4 w-4 text-muted-foreground"/>
                <Label htmlFor="has-loggia" className="font-medium">ლოჯი</Label>
              </div>
            </FormItem>
          )}
        />
        {hasLoggia && (
          <FormField
            control={form.control}
            name="loggiaArea"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm mb-2 block">ლოჯის ფართი (მ²)</Label>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="ფართი" className="border-input focus:ring-ring focus:ring-1" />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Veranda */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasVeranda"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-veranda"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Sailboat className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="has-veranda" className="font-medium">ვერანდა</Label>
              </div>
            </FormItem>
          )}
        />
        {hasVeranda && (
          <FormField
            control={form.control}
            name="verandaArea"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm mb-2 block">ვერანდის ფართი (მ²)</Label>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="ფართი" className="border-input focus:ring-ring focus:ring-1" />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Yard */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasYard"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-yard"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label htmlFor="has-yard" className="font-medium flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-muted-foreground" />
                  <span>აქვს ეზო</span>
                </Label>
              </div>
            </FormItem>
          )}
        />
        {hasYard && (
          <FormField
            control={form.control}
            name="yardArea"
            render={({ field }) => (
              <FormItem>
                <Label className="text-sm mb-2 block">ეზოს ფართი (მ²)</Label>
                <FormControl>
                  <Input {...field} type="number" step="0.1" placeholder="ფართი" className="border-input focus:ring-ring focus:ring-1" />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Storage */}
      <div className="rounded-md border border-border p-5">
        <FormField
          control={form.control}
          name="hasStorage"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2 mb-4">
                <FormControl>
                  <Checkbox
                    id="has-storage"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label htmlFor="has-storage" className="font-medium flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <span>სათავსოს ტიპი</span>
                </Label>
              </div>
            </FormItem>
          )}
        />
        {hasStorage && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="storageArea"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">სათავსოს ფართი (მ²)</Label>
                  <FormControl>
                    <Input {...field} type="number" step="0.1" placeholder="ფართი" className="border-input focus:ring-ring focus:ring-1" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="storageType"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-sm mb-2 block">სათავსოს ტიპი</Label>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {[
                        { value: "basement", label: "სარდაფი" },
                        { value: "attic", label: "სხვენი" },
                        { value: "pantry", label: "საკუჭნაო" },
                        { value: "external-storage", label: "გარე სათავსო" },
                        { value: "shared-storage", label: "საერთო სათავსო" },
                        { value: "basement-attic", label: "სარდაფი + სხვენი" }
                      ].map((option) => (
                        <label
                          key={option.value}
                          htmlFor={`storage-type-${option.value}`}
                          className="flex items-center space-x-2 border border-input bg-background rounded-md p-4 cursor-pointer hover:bg-accent hover:border-ring transition-colors group data-[state=checked]:border-primary data-[state=checked]:bg-accent"
                        >
                          <RadioGroupItem value={option.value} id={`storage-type-${option.value}`} />
                          <span className="group-data-[state=checked]:font-medium text-sm">{option.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};