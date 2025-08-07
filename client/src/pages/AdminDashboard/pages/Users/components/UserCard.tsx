import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Eye, Mail, Phone, Calendar, Shield, User, Crown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface UserCardProps {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "moderator";
  status: "active" | "inactive" | "suspended" | "pending";
  avatar?: string;
  joinDate: string;
  lastActive: string;
  propertiesCount: number;
  verified: boolean;
}

export const UserCard = ({ 
  id, 
  name, 
  email, 
  phone, 
  role, 
  status, 
  avatar, 
  joinDate, 
  lastActive, 
  propertiesCount, 
  verified 
}: UserCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "აქტიური";
      case "inactive": return "არააქტიური";
      case "suspended": return "შეჩერებული";
      case "pending": return "მოლოდინში";
      default: return status;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "moderator": return "bg-blue-100 text-blue-800";
      case "user": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin": return "ადმინი";
      case "moderator": return "მოდერატორი";
      case "user": return "მომხმარებელი";
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4" />;
      case "moderator": return <Shield className="h-4 w-4" />;
      case "user": return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center gap-6 p-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name}
                className="w-16 h-16 object-cover rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
            {verified && (
              <div className="absolute -bottom-1 -right-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full">
                  ✓
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-xl truncate pr-4">{name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${getRoleColor(role)} px-2 py-1 text-xs flex items-center gap-1`}>
                    {getRoleIcon(role)}
                    {getRoleText(role)}
                  </Badge>
                  {verified && (
                    <Badge variant="outline" className="text-xs px-2 py-1 text-blue-600 border-blue-200">
                      დამოწმებული
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">განცხადებები</div>
                <div className="text-lg font-semibold text-primary">{propertiesCount}</div>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm truncate">{email}</span>
            </div>
            
            {phone && (
              <div className="flex items-center text-gray-600 mb-3">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>გაწევრიანება: {joinDate}</span>
              </div>
              <div className="flex items-center">
                <span>ბოლო აქტივობა: {lastActive}</span>
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
                <DropdownMenuItem>
                  <Mail className="mr-2 h-4 w-4" />
                  შეტყობინება
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