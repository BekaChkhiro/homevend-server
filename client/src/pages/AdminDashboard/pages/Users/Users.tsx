import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCard } from './components/UserCard';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Users as UsersIcon } from 'lucide-react';

// Test user data for admin panel
const testUsers = [
  {
    id: 2001,
    name: "გიორგი მელაძე",
    email: "giorgi.meladze@example.com",
    phone: "+995 599 123 456",
    role: "admin" as const,
    status: "active" as const,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    joinDate: "2023-01-15",
    lastActive: "2 წუთის წინ",
    propertiesCount: 0,
    verified: true
  },
  {
    id: 2002,
    name: "ნინო ხარაძე",
    email: "nino.kharadze@example.com",
    phone: "+995 555 987 654",
    role: "moderator" as const,
    status: "active" as const,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    joinDate: "2023-03-22",
    lastActive: "1 საათის წინ",
    propertiesCount: 3,
    verified: true
  },
  {
    id: 2003,
    name: "დავით ლომიძე",
    email: "davit.lomidze@example.com",
    phone: "+995 577 456 789",
    role: "user" as const,
    status: "active" as const,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    joinDate: "2023-06-10",
    lastActive: "3 საათის წინ",
    propertiesCount: 12,
    verified: true
  },
  {
    id: 2004,
    name: "მარიამ წიწკიშვილი",
    email: "mariam.tsitskishvili@example.com",
    phone: "+995 593 321 654",
    role: "user" as const,
    status: "active" as const,
    joinDate: "2023-08-05",
    lastActive: "1 დღის წინ",
    propertiesCount: 7,
    verified: false
  },
  {
    id: 2005,
    name: "ლევან გელაშვილი",
    email: "levan.gelashvili@example.com",
    phone: "+995 568 147 258",
    role: "user" as const,
    status: "suspended" as const,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    joinDate: "2023-02-28",
    lastActive: "1 კვირის წინ",
    propertiesCount: 2,
    verified: true
  },
  {
    id: 2006,
    name: "ანა ჯავახიშვილი",
    email: "ana.javakhishvili@example.com",
    role: "user" as const,
    status: "pending" as const,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    joinDate: "2024-01-20",
    lastActive: "არასდროს",
    propertiesCount: 0,
    verified: false
  },
  {
    id: 2007,
    name: "გრიგოლ ბერიძე",
    email: "grigol.beridze@example.com",
    phone: "+995 591 789 456",
    role: "user" as const,
    status: "inactive" as const,
    joinDate: "2022-11-12",
    lastActive: "2 თვის წინ",
    propertiesCount: 5,
    verified: true
  },
  {
    id: 2008,
    name: "ეკატერინე ნოდია",
    email: "ekaterine.nodia@example.com",
    phone: "+995 579 852 741",
    role: "user" as const,
    status: "active" as const,
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=100&h=100&fit=crop&crop=face",
    joinDate: "2023-09-18",
    lastActive: "5 საათის წინ",
    propertiesCount: 15,
    verified: true
  }
];

const Users = () => {
  const activeUsers = testUsers.filter(user => user.status === 'active').length;
  const totalProperties = testUsers.reduce((sum, user) => sum + user.propertiesCount, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">მომხმარებლების მართვა</h1>
        <p className="text-gray-600">მომხმარებლების სია და მართვა</p>
        
        {/* Quick Stats */}
        <div className="flex gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-600">სულ მომხმარებლები</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{testUsers.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600">აქტიური მომხმარებლები</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{activeUsers}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-purple-600">სულ განცხადებები</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{totalProperties}</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>მომხმარებლების სია</CardTitle>
              <CardDescription>ყველა რეგისტრირებული მომხმარებლის ნახვა და მართვა</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                ფილტრი
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                ახალი მომხმარებელი
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testUsers.map((user) => (
              <UserCard
                key={user.id}
                {...user}
              />
            ))}
          </div>
          
          {testUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">მომხმარებლები ვერ მოიძებნა</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                პირველი მომხმარებლის დამატება
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;