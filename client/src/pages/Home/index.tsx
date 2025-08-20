import { useState } from "react";
import { sampleProperties, Property } from "./components/PropertyData";
import { FilterState } from "./components/FilterTypes";
import { applyFilters } from "./components/FilterLogic";
import { HomeLayout } from "./components/HomeLayout";

const Home = () => {
  const [properties] = useState<Property[]>(sampleProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(sampleProperties);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priceMin: "",
    priceMax: "",
    location: "",
    propertyType: "all",
    transactionType: "all",
    bedrooms: "",
    areaMin: "",
    areaMax: ""
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    const filtered = applyFilters(properties, newFilters);
    setFilteredProperties(filtered);
  };

  return (
    <HomeLayout
      properties={properties}
      filteredProperties={filteredProperties}
      filters={filters}
      onFilterChange={handleFilterChange}
    />
  );
};

export default Home;