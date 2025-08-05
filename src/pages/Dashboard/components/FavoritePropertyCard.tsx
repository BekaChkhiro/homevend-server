import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, Phone, MapPin, Bed, Bath, Square, Calendar } from "lucide-react";

interface FavoritePropertyCardProps {
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
  addedDate: string;
  ownerName: string;
  ownerPhone: string;
  status: "available" | "sold" | "reserved";
}

export const FavoritePropertyCard = ({ 
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
  addedDate, 
  ownerName, 
  ownerPhone, 
  status 
}: FavoritePropertyCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "sold": return "bg-red-100 text-red-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "ხელმისაწვდომი";
      case "sold": return "გაყიდული";
      case "reserved": return "დაჯავშნული";
      default: return status;
    }
  };

  const handleRemoveFromFavorites = () => {
    // Handle removing from favorites
    console.log("Remove from favorites:", id);
  };

  const handleContactOwner = () => {
    // Handle contacting property owner
    console.log("Contact owner:", ownerPhone);
  };

  const handleViewProperty = () => {
    // Handle viewing property details
    console.log("View property:", id);
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
            {status !== "available" && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Badge className={getStatusColor(status)}>
                  {getStatusText(status)}
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

            {/* Owner and Date Info */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <span>მფლობელი: {ownerName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>დამატებული: {addedDate}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            {status === "available" && (
              <Badge className="bg-green-100 text-green-800 px-3 py-1">
                {getStatusText(status)}
              </Badge>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewProperty}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                ნახვა
              </Button>
              
              {status === "available" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleContactOwner}
                  className="flex items-center"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  დარეკვა
                </Button>
              )}
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRemoveFromFavorites}
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Heart className="h-4 w-4 mr-1 fill-current" />
              ამოშლა
            </Button>
            
            <span className="text-sm text-gray-500">ID: {id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};