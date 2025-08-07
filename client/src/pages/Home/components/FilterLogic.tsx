import { Property } from "./PropertyData";
import { FilterState } from "./FilterTypes";

export const applyFilters = (properties: Property[], filters: FilterState): Property[] => {
  return properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                        property.address.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesPriceMin = !filters.priceMin || property.price >= parseInt(filters.priceMin);
    const matchesPriceMax = !filters.priceMax || property.price <= parseInt(filters.priceMax);
    
    const matchesLocation = !filters.location || 
                          property.address.toLowerCase().includes(filters.location.toLowerCase());
    
    const matchesType = !filters.propertyType || filters.propertyType === 'all' || property.type === filters.propertyType;
    
    const matchesTransactionType = !filters.transactionType || filters.transactionType === 'all' || property.transactionType === filters.transactionType;
    
    const matchesBedrooms = !filters.bedrooms || property.bedrooms === parseInt(filters.bedrooms);
    
    const matchesAreaMin = !filters.areaMin || property.area >= parseInt(filters.areaMin);
    const matchesAreaMax = !filters.areaMax || property.area <= parseInt(filters.areaMax);
    
    return matchesSearch && matchesPriceMin && matchesPriceMax && matchesLocation && 
           matchesType && matchesTransactionType && matchesBedrooms && matchesAreaMin && matchesAreaMax;
  });
};