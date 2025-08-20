import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Home, 
  FileText, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const Overview = () => {
  const stats = [
    { title: 'სულ მომხმარებლები', value: '1,234', icon: Users, change: '+12%' },
    { title: 'აქტიური განცხადებები', value: '456', icon: Home, change: '+23%' },
    { title: 'ამ თვის ტრანზაქციები', value: '89', icon: DollarSign, change: '+5%' },
    { title: 'ახალი განაცხადები', value: '32', icon: FileText, change: '+8%' },
  ];

  const pendingListings = [
    { id: 1, title: '3 ოთახიანი ბინა ვაკეში', price: '$120,000', status: 'pending', user: 'გიორგი ბერიძე' },
    { id: 2, title: '2 ოთახიანი ბინა საბურთალოზე', price: '$85,000', status: 'pending', user: 'მარიამ ჯავახიშვილი' },
    { id: 3, title: 'საკუთარი სახლი დიღომში', price: '$250,000', status: 'pending', user: 'დავით კაპანაძე' },
  ];

  const recentUsers = [
    { id: 1, name: 'ნინო გელაშვილი', email: 'nino@example.com', registeredAt: '2024-01-15', status: 'active' },
    { id: 2, name: 'ლევან ხარაზიშვილი', email: 'levan@example.com', registeredAt: '2024-01-14', status: 'active' },
    { id: 3, name: 'თამარ სალუქვაძე', email: 'tamar@example.com', registeredAt: '2024-01-13', status: 'inactive' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ადმინისტრატორის პანელი</h1>
        <p className="text-gray-600">მართეთ პლატფორმა და მონიტორინგი გაუწიეთ აქტივობებს</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                {stat.change} წინა თვესთან შედარებით
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>დასამტკიცებელი განცხადებები</CardTitle>
            <CardDescription>განცხადებები, რომლებიც საჭიროებენ თქვენს დამტკიცებას</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingListings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{listing.title}</h4>
                    <p className="text-sm text-gray-600">მომხმარებელი: {listing.user}</p>
                    <p className="text-sm font-medium mt-1">{listing.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      დამტკიცება
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      უარყოფა
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ახალი მომხმარებლები</CardTitle>
            <CardDescription>ბოლოს დარეგისტრირებული მომხმარებლები</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{user.registeredAt}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? 'აქტიური' : 'არააქტიური'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;