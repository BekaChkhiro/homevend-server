import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye, MapPin, Bed, Bath, Square, User, Calendar } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ApartmentCardProps {
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
  status: "active" | "pending" | "sold" | "inactive";
  createdBy: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  createdDate: string;
}

export const ApartmentCard = ({ 
  id, 
  title, 
  price, 
  address, 
  bedrooms, 
  bathrooms, 
  area, 
  type, 
  transactionType, 
  image, 
  featured, 
  status,
  createdBy,
  createdDate
}: ApartmentCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "sold": return "bg-blue-100 text-blue-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "აქტიური";
      case "pending": return "განხილვაში";
      case "sold": return "გაყიდული";
      case "inactive": return "არააქტიური";
      default: return status;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center gap-6 p-6">
          {/* Image */}
          <div className="relative flex-shrink-0">
            <img 
              src={image} 
              alt={title}
              className="w-32 h-32 object-cover rounded-lg"
            />
            {featured && (
              <div className="absolute -top-2 -right-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                  რჩეული
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-xl truncate pr-4">{title}</h3>
              <span className="text-xl font-bold text-primary whitespace-nowrap">
                {price.toLocaleString()} ₾
              </span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-base truncate">{address}</span>
            </div>
            
            <div className="flex items-center gap-6 text-base text-gray-600 mb-2">
              <div className="flex items-center">
                <Bed className="h-5 w-5 mr-2" />
                <span>{bedrooms}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-5 w-5 mr-2" />
                <span>{bathrooms}</span>
              </div>
              <div className="flex items-center">
                <Square className="h-5 w-5 mr-2" />
                <span>{area} მ²</span>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {type}
              </Badge>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {transactionType}
              </Badge>
            </div>

            {/* User and Date Info */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                {createdBy.avatar ? (
                  <img 
                    src={createdBy.avatar} 
                    alt={createdBy.name}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                <span>შექმნა: {createdBy.name}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{createdDate}</span>
              </div>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <Badge className={`${getStatusColor(status)} px-3 py-1`}>
              {getStatusText(status)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  ნახვა
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  რედაქტირება
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  წაშლა
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <span className="text-sm text-gray-500">ID: {id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};