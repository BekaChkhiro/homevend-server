import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserPropertyCard } from "./UserPropertyCard";

// Test user properties data
const testUserProperties = [
  {
    id: 3001,
    title: "ლუქსუსური ბინა ვაკეში",
    price: 250000,
    address: "ვაკე, თბილისი",
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=500&h=300&fit=crop",
    status: "active" as const,
    views: 245,
    favorites: 12,
    publishDate: "2024-01-15",
    featured: true
  },
  {
    id: 3002,
    title: "კომფორტული ბინა საბურთალოში",
    price: 180000,
    address: "საბურთალო, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=500&h=300&fit=crop",
    status: "active" as const,
    views: 189,
    favorites: 8,
    publishDate: "2024-01-20",
    featured: false
  },
  {
    id: 3003,
    title: "ახალი ბინა ისანში",
    price: 95000,
    address: "ისანი, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=500&h=300&fit=crop",
    status: "pending" as const,
    views: 67,
    favorites: 3,
    publishDate: "2024-01-25",
    featured: false
  },
  {
    id: 3004,
    title: "პენტჰაუსი ვაკეში",
    price: 380000,
    address: "ვაკე, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&h=300&fit=crop",
    status: "sold" as const,
    views: 412,
    favorites: 28,
    publishDate: "2023-12-10",
    featured: true
  },
  {
    id: 3005,
    title: "სტუდია ცენტრში",
    price: 85000,
    address: "ძველი თბილისი",
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    status: "inactive" as const,
    views: 123,
    favorites: 5,
    publishDate: "2023-11-28",
    featured: false
  }
];

type FilterType = "all" | "active" | "pending" | "sold" | "inactive";

export const MyProperties: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  
  const getFilteredProperties = () => {
    if (activeFilter === "all") return testUserProperties;
    return testUserProperties.filter(property => property.status === activeFilter);
  };

  const getCountByStatus = (status: FilterType) => {
    if (status === "all") return testUserProperties.length;
    return testUserProperties.filter(property => property.status === status).length;
  };

  const filteredProperties = getFilteredProperties();
  const hasProperties = testUserProperties.length > 0;
  
  return (
    <>
      <h2 className="text-xl font-medium mb-4">ჩემი განცხადებები</h2>
      
      {hasProperties && (
        <div className="bg-white mb-4 p-4 rounded-lg border">
          <div className="flex gap-2 overflow-auto pb-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setActiveFilter("all")}
            >
              ყველა <span className="ml-1 text-gray-500">{getCountByStatus("all")}</span>
            </Button>
            <Button 
              variant={activeFilter === "active" ? "default" : "outline"} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setActiveFilter("active")}
            >
              აქტიური <span className="ml-1 text-gray-500">{getCountByStatus("active")}</span>
            </Button>
            <Button 
              variant={activeFilter === "pending" ? "default" : "outline"} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setActiveFilter("pending")}
            >
              მოლოდინში <span className="ml-1 text-gray-500">{getCountByStatus("pending")}</span>
            </Button>
            <Button 
              variant={activeFilter === "sold" ? "default" : "outline"} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setActiveFilter("sold")}
            >
              გაყიდული <span className="ml-1 text-gray-500">{getCountByStatus("sold")}</span>
            </Button>
            <Button 
              variant={activeFilter === "inactive" ? "default" : "outline"} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setActiveFilter("inactive")}
            >
              არააქტიური <span className="ml-1 text-gray-500">{getCountByStatus("inactive")}</span>
            </Button>
          </div>
        </div>
      )}

      {hasProperties ? (
        <div className="space-y-4">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((property) => (
              <UserPropertyCard
                key={property.id}
                {...property}
              />
            ))
          ) : (
            <div className="bg-white p-8 rounded-lg border text-center">
              <div className="max-w-xs mx-auto">
                <h3 className="text-lg font-medium mb-2">ამ კატეგორიაში განცხადებები არ მოიძებნა</h3>
                <p className="text-sm text-gray-500 mb-4">
                  სცადეთ სხვა ფილტრი ან დაამატეთ ახალი განცხადება
                </p>
                <Button 
                  className="flex items-center mx-auto"
                  onClick={() => navigate('/dashboard/add-property')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  განცხადების დამატება
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="max-w-xs mx-auto">
            <div className="mb-4">
              <img 
                src="/placeholder.svg" 
                alt="No properties" 
                className="mx-auto w-32 h-32 opacity-50"
              />
            </div>
            <h3 className="text-lg font-medium mb-2">თქვენ არ გაქვთ განცხადებები დამატებული</h3>
            <p className="text-sm text-gray-500 mb-4">
              დაამატეთ თქვენი პირველი განცხადება და გაზარდეთ გაყიდვების შანსები
            </p>
            <Button 
              className="flex items-center mx-auto"
              onClick={() => navigate('/dashboard/add-property')}
            >
              <Plus className="h-4 w-4 mr-1" />
              განცხადების დამატება
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
