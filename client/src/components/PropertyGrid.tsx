
import { PropertyCard } from "@/components/PropertyCard";
import type { Property } from "@/pages/Index";

interface PropertyGridProps {
  properties: Property[];
}

export const PropertyGrid = ({ properties }: PropertyGridProps) => {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold mb-2">ქონება ვერ მოიძებნა</h3>
        <p className="text-muted-foreground">სცადეთ ფილტრების შეცვლა ან ძებნის პარამეტრების მოდიფიცირება</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          ნაპოვნია {properties.length} ქონება
        </h2>
        <div className="text-sm text-muted-foreground">
          დალაგება: ფასის მიხედვით
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};
