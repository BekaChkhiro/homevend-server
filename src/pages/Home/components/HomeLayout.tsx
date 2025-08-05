import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { FeaturedPropertiesCarousel } from "@/components/FeaturedPropertiesCarousel";
import { FilterPanel } from "@/components/FilterPanel";
import { PropertyGrid } from "@/components/PropertyGrid";
import { AdBanner } from "@/components/AdBanner";
import { Property } from "./PropertyData";
import { FilterState } from "./FilterTypes";

interface HomeLayoutProps {
  properties: Property[];
  filteredProperties: Property[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export const HomeLayout = ({ 
  properties, 
  filteredProperties, 
  filters, 
  onFilterChange 
}: HomeLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
      <HeroSection onSearch={(heroFilters) => onFilterChange({
        ...filters, 
        search: heroFilters.search,
        transactionType: heroFilters.transactionType,
        propertyType: heroFilters.propertyType
      })} />
      
      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 py-4">
        <AdBanner type="horizontal" />
      </div>
      
      <FeaturedPropertiesCarousel properties={properties} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <FilterPanel filters={filters} onFilterChange={onFilterChange} />
            
            {/* Sidebar Ad Banner */}
            <div className="mt-6">
              <AdBanner type="vertical" />
            </div>
          </div>
          <div className="lg:col-span-3">
            <PropertyGrid properties={filteredProperties} />
            
            {/* Bottom Ad Banner */}
            <div className="mt-8">
              <AdBanner type="horizontal" />
            </div>
          </div>
        </div>
      </div>
      <Footer />
      </div>
    </div>
  );
};