import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { BasicInfoSection } from "./components/BasicInfoSection";
import { PropertyDetailsSection } from "./components/PropertyDetailsSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { AdvantagesSection } from "./components/AdvantagesSection";
import { FurnitureAppliancesSection } from "./components/FurnitureAppliancesSection";
import { TagsSection } from "./components/TagsSection";
import { PriceAreaSection } from "./components/PriceAreaSection";
import { ContactInfoSection } from "./components/ContactInfoSection";
import { DescriptionSection } from "./components/DescriptionSection";
import { PhotoGallerySection } from "./components/PhotoGallerySection";
import { FormActions } from "./components/FormActions";
import { propertyFormSchema, type PropertyFormData } from "./types/propertyForm";

export const AddProperty = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      features: [],
      advantages: [],
      furnitureAppliances: [],
      tags: [],
      photos: [],
      hasBalcony: false,
      hasPool: false,
      hasLivingRoom: false,
      hasLoggia: false,
      hasVeranda: false,
      hasYard: false,
      hasStorage: false,
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      console.log("Form submitted:", data);
      // TODO: Implement actual submission logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("განცხადება წარმატებით დაემატა!");
    } catch (error) {
      console.error("Submission error:", error);
      alert("შეცდომა მოხდა განცხადების დამატებისას");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    try {
      const formData = form.getValues();
      console.log("Draft saved:", formData);
      // TODO: Implement draft saving logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("დრაფთი შენახულია!");
    } catch (error) {
      console.error("Draft save error:", error);
      alert("შეცდომა მოხდა დრაფთის შენახვისას");
    } finally {
      setIsDraftSaving(false);
    }
  };
  
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col relative">
      <div className="flex-1 overflow-auto p-6">
        <h2 className="text-2xl font-bold mb-6">განცხადების დამატება</h2>
      
      <Card className="p-6 mb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <BasicInfoSection />
          
          {/* Property Details Section */}
          <PropertyDetailsSection />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* Advantages Section */}
          <AdvantagesSection />
          
          {/* Furniture & Appliances Section */}
          <FurnitureAppliancesSection />
          
          {/* Tags Section */}
          <TagsSection />
          
          {/* Price & Area Section */}
          <PriceAreaSection />
          
          {/* Contact Info Section */}
          <ContactInfoSection />
          
          {/* Description Section */}
          <DescriptionSection />
          
          {/* Photo Gallery Section */}
          <PhotoGallerySection />
          
          
          </form>
        </Form>
      </Card>
      </div>
      
      <FormActions
        onSaveDraft={handleSaveDraft}
        onSubmit={form.handleSubmit(onSubmit)}
        isLoading={isLoading}
        isDraftSaving={isDraftSaving}
      />
    </div>
  );
};
