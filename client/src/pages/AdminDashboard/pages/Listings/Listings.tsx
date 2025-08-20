import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApartmentCard } from './components/ApartmentCard';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';

// Test apartment data for admin panel
const testApartments = [
  {
    id: 1001,
    title: "ლუქსუსური ბინა ვაკეში",
    price: 250000,
    address: "ვაკე, თბილისი",
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=500&h=300&fit=crop",
    featured: true,
    status: "active" as const,
    createdBy: {
      id: 2001,
      name: "გიორგი მელაძე",
      email: "giorgi.meladze@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    createdDate: "2024-01-15"
  },
  {
    id: 1002,
    title: "კომფორტული სახლი საბურთალოში",
    price: 180000,
    address: "საბურთალო, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    type: "სახლები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1527576539890-dfa815648363?w=500&h=300&fit=crop",
    featured: false,
    status: "pending" as const,
    createdBy: {
      id: 2003,
      name: "დავით ლომიძე",
      email: "davit.lomidze@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    createdDate: "2024-01-20"
  },
  {
    id: 1003,
    title: "ახალი ბინა ისანში",
    price: 95000,
    address: "ისანი, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 75,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=500&h=300&fit=crop",
    featured: false,
    status: "active" as const,
    createdBy: {
      id: 2004,
      name: "მარიამ წიწკიშვილი",
      email: "mariam.tsitskishvili@example.com"
    },
    createdDate: "2024-01-18"
  },
  {
    id: 1004,
    title: "პენტჰაუსი ვაკეში",
    price: 380000,
    address: "ვაკე, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 180,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&h=300&fit=crop",
    featured: true,
    status: "sold" as const,
    createdBy: {
      id: 2008,
      name: "ეკატერინე ნოდია",
      email: "ekaterine.nodia@example.com",
      avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face"
    },
    createdDate: "2023-12-28"
  },
  {
    id: 1005,
    title: "კოტეჯი დიდ დიღომში",
    price: 220000,
    address: "დიდი დიღომი, თბილისი",
    bedrooms: 3,
    bathrooms: 2,
    area: 160,
    type: "სახლები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop",
    featured: false,
    status: "inactive" as const,
    createdBy: {
      id: 2005,
      name: "ლევან გელაშვილი",
      email: "levan.gelashvili@example.com",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    },
    createdDate: "2024-01-10"
  },
  {
    id: 1006,
    title: "სტუდია თბილისის ცენტრში",
    price: 85000,
    address: "ლიბერტი ბანკის მახლობლად",
    bedrooms: 1,
    bathrooms: 1,
    area: 38,
    type: "ბინები",
    transactionType: "იყიდება",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop",
    featured: false,
    status: "active" as const,
    createdBy: {
      id: 2007,
      name: "გრიგოლ ბერიძე",
      email: "grigol.beridze@example.com"
    },
    createdDate: "2024-01-22"
  }
];

const Listings = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">განცხადებების მართვა</h1>
        <p className="text-gray-600">ყველა განცხადების ნახვა და მართვა</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>განცხადებების სია</CardTitle>
              <CardDescription>ყველა განცხადების ნახვა, დამტკიცება და უარყოფა</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                ფილტრი
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                ახალი განცხადება
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testApartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                {...apartment}
              />
            ))}
          </div>
          
          {testApartments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">განცხადებები ვერ მოიძებნა</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                პირველი განცხადების დამატება
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Listings;