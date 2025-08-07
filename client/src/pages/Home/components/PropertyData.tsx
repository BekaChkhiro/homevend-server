// Sample property data with real images - now 6 featured properties
export const sampleProperties = [
  {
    id: 1,
    title: "ლუქსუსური ბინა ვაკეში",
    price: 250000,
    address: "ვაკე, თბილისი",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=500&h=300&fit=crop",
    featured: true
  },
  {
    id: 2,
    title: "კომფორტული სახლი საბურთალოში",
    price: 180000,
    address: "საბურთალო, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    type: "სახლები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=500&h=300&fit=crop",
    featured: false
  },
  {
    id: 3,
    title: "ახალი ბინა ისანში",
    price: 95000,
    address: "ისანი, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    type: "ბინები",
    transactionType: "ქირავდება",
    image: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=500&h=300&fit=crop",
    featured: false
  },
  {
    id: 4,
    title: "სასტუმრო ოფისი ვერაში",
    price: 45000,
    address: "ვერა, თბილისი",
    bedrooms: 1,
    bathrooms: 1,
    area: 40,
    type: "კომერციული ფართები",
    transactionType: "გაიცემა იჯარით",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=500&h=300&fit=crop",
    featured: true
  },
  {
    id: 5,
    title: "ვილა მთაწმინდაზე",
    price: 450000,
    address: "მთაწმინდა, თბილისი",
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    type: "აგარაკები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=500&h=300&fit=crop",
    featured: true
  },
  {
    id: 6,
    title: "თანამედროვე სტუდია ცენტრში",
    price: 65000,
    address: "ძველი თბილისი",
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    type: "ბინები",
    transactionType: "ქირავდება დღიურად",
    image: "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=500&h=300&fit=crop",
    featured: true
  },
  {
    id: 7,
    title: "ბინა ნაძალადევში",
    price: 120000,
    address: "ნაძალადევი, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 80,
    type: "ბინები",
    transactionType: "გირავდება",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    featured: true
  },
  {
    id: 8,
    title: "პენტჰაუსი ვაკეში",
    price: 380000,
    address: "ვაკე, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    type: "ბინები",
    transactionType: "ქირავდება",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&h=300&fit=crop",
    featured: true
  }
];

export interface Property {
  id: number;
  title: string;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  transactionType: string;
  image: string;
  featured: boolean;
}