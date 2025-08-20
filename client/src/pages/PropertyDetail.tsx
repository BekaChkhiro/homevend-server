
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Bed, Bath, Square, Phone, Mail, Share2, Calendar } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";

// Sample property data
const propertyData = {
  1: {
    id: 1,
    title: "ლუქსუსური ბინა ვაკეში",
    price: 250000,
    address: "ვაკე, თბილისი",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    type: "ბინები",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
    ],
    description: "ვაკეში მდებარე ლუქსუსური ბინა ყველა საჭირო ინფრასტრუქტურით. ბინა განთავსებულია ახალ საცხოვრებელ კომპლექსში, სადაც არის ყველა საჭირო ინფრასტრუქტურა. ახალი რემონტით, ავეჯით და ტექნიკით. ბინა მდებარეობს მე-8 სართულზე, აქვს აივანი და ხედი ქალაქზე.",
    features: ["პარკინგი", "ლიფტი", "უსაფრთხოება", "ცენტრალური გათბობა", "ინტერნეტი", "კონდიციონერი", "ბუნებრივი აირი"],
    agent: {
      name: "ნინო ხუცისვილი",
      phone: "+995 555 123 456",
      email: "nino@homevend.ge"
    },
    dateAdded: "2024-01-15"
  },
  2: {
    id: 2,
    title: "კომფორტული ბინა საბურთალოზე",
    price: 180000,
    address: "საბურთალო, თბილისი",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    type: "ბინები",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop"
    ],
    description: "საბურთალოზე მდებარე კომფორტული ბინა ახალ აშენებულ კორპუსში. ბინა არის სუფთა რემონტით, ავეჯით და ტექნიკით. მდებარეობს მე-5 სართულზე, აქვს აივანი და ხედი ქალაქზე.",
    features: ["პარკინგი", "ლიფტი", "უსაფრთხოება", "ცენტრალური გათბობა", "ინტერნეტი"],
    agent: {
      name: "გიორგი მაისურაძე",
      phone: "+995 555 789 012",
      email: "giorgi@homevend.ge"
    },
    dateAdded: "2024-01-20"
  },
  3: {
    id: 3,
    title: "სახლი დიდ დიღომში",
    price: 320000,
    address: "დიდი დიღომი, თბილისი",
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    type: "სახლები",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop"
    ],
    description: "დიდ დიღომში მდებარე კერძო სახლი დიდი ეზოთი. სახლი არის ახალი აშენებული, სუფთა რემონტით. აქვს დიდი ეზო, სადაც შესაძლებელია ბაღის მოწყობა და ავტომობილის პარკირება.",
    features: ["ეზო", "პარკინგი", "ბუხარი", "ცენტრალური გათბობა", "ინტერნეტი", "კონდიციონერი", "ბუნებრივი აირი"],
    agent: {
      name: "ნინო ხუცისვილი",
      phone: "+995 555 123 456",
      email: "nino@homevend.ge"
    },
    dateAdded: "2024-01-10"
  }
};

const PropertyDetail = () => {
  const { id } = useParams();
  const propertyId = Number(id) || 1; // Default to property ID 1 if no ID is provided
  const property = propertyData[propertyId as keyof typeof propertyData];

  // Always show property ID 1 if the requested property doesn't exist
  const displayProperty = property || propertyData[1];
  
  // Auto-scroll to top when component mounts or ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  // Get similar properties (same type, different ID)
  const similarProperties = Object.values(propertyData)
    .filter(prop => prop.type === displayProperty.type && prop.id !== displayProperty.id)
    .slice(0, 3);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ka-GE', {
      style: 'currency',
      currency: 'GEL',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
      
      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 pt-4">
        <AdBanner type="horizontal" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Images */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <img
                    src={displayProperty.images[0]}
                    alt={displayProperty.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                {displayProperty.images.slice(1).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${displayProperty.title} ${index + 2}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>

            {/* Property Info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{displayProperty.title}</h1>
                    <div className="flex items-center text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {displayProperty.address}
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">{displayProperty.type}</Badge>
                      <Badge className="bg-primary text-primary-foreground">ტოპ ქონება</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-4xl font-bold text-primary mb-6">
                  {formatPrice(displayProperty.price)}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center">
                    <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-semibold">{displayProperty.bedrooms}</span>
                    <span className="text-muted-foreground ml-1">საძინებელი</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-semibold">{displayProperty.bathrooms}</span>
                    <span className="text-muted-foreground ml-1">აბაზანა</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-semibold">{displayProperty.area}</span>
                    <span className="text-muted-foreground ml-1">მ²</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">აღწერა</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {displayProperty.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">თავისებურებები</h3>
                  <div className="flex flex-wrap gap-2">
                    {displayProperty.features.map((feature, index) => (
                      <Badge key={index} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ad Banner */}
            <AdBanner type="horizontal" />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Agent Info */}
            <Card className="mb-6 overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-white">
                <h3 className="text-xl font-bold text-center">დაუკავშირდით აგენტს</h3>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-md ring-4 ring-white">
                    <span className="text-white text-2xl font-bold">
                      {displayProperty.agent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{displayProperty.agent.name}</h4>
                    <p className="text-sm text-gray-500">უძრავი აგენტი</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-200 py-5 font-medium" variant="default">
                    <Phone className="h-5 w-5 mr-3" />
                    {displayProperty.agent.phone}
                  </Button>
                  <Button className="w-full border-primary text-primary hover:bg-primary/5 transition-all duration-200 py-5 font-medium" variant="outline">
                    <Mail className="h-5 w-5 mr-3" />
                    ელფოსტა
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">დეტალები</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span>{displayProperty.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">დაემატა:</span>
                    <span>{new Date(displayProperty.dateAdded).toLocaleDateString('ka-GE')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ტიპი:</span>
                    <span>{displayProperty.type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ad Banner Vertical */}
            <AdBanner type="vertical" />
          </div>
        </div>
      </div>

      {/* Similar Properties Section */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">მსგავსი განცხადებები</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative h-48">
                <img 
                  src={property.images[0]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Button variant="ghost" size="sm" className="bg-white/80 rounded-full h-8 w-8 p-0">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold truncate mb-1">{property.title}</h3>
                <div className="flex items-center text-muted-foreground text-sm mb-2">
                  <MapPin className="h-3 w-3 mr-1" />
                  {property.address}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Bed className="h-3 w-3 mr-1" />
                    {property.bedrooms}
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-3 w-3 mr-1" />
                    {property.bathrooms}
                  </div>
                  <div className="flex items-center">
                    <Square className="h-3 w-3 mr-1" />
                    {property.area} მ²
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-primary">
                    {formatPrice(property.price)}
                  </div>
                  <Badge variant="secondary">{property.type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Footer />
      </div>
    </div>
  );
};

export default PropertyDetail;
