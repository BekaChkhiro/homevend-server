
import { Home, Phone, Mail, LogIn, LogOut, User, Shield, ChevronDown, Building, Home as HomeIcon, Building2, Construction, Info, Contact, LayoutGrid, PlusCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-border shadow-sm fixed top-0 left-0 right-0 z-50">
      {/* Top row: Logo and contact info */}
      <div className="container mx-auto px-4 border-b border-gray-100">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-primary text-white p-2 rounded-md group-hover:bg-primary/90 transition-colors">
              <Home className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-primary group-hover:text-primary/90 transition-colors">HOMEVEND.ge</span>
          </Link>
          
          {/* Empty space where buttons were previously */}
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hover:bg-primary/5 hover:text-primary relative" asChild>
              <Link to="/wishlist" className="flex items-center gap-1.5">
                <Heart className="h-5 w-5" />
                <span className="sr-only">ვიშლისთი</span>
                <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </div>
              </Link>
            </Button>
            
            <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5 hover:text-primary" asChild>
              <Link to="/add-property" className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>განცხადების დამატება</span>
              </Link>
            </Button>
            
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                    <User className="h-4 w-4" />
                    <span>{user.fullName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4" />
                          <span>ადმინ პანელი</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>ჩემი კაბინეტი</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>გამოსვლა</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" className="border-primary/20 hover:bg-primary/5 hover:text-primary" asChild>
                <Link to="/login" className="flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>შესვლა</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom row: Navigation */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <nav className="hidden lg:flex items-center space-x-5">
            <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
              <HomeIcon className="h-4 w-4" />
              <span>მთავარი</span>
            </Link>
            
            <Link to="/about" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
              <Info className="h-4 w-4" />
              <span>ჩვენ შესახებ</span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
                <Building className="h-4 w-4" />
                <span>უძრავი ქონება</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/properties" className="flex items-center gap-2 cursor-pointer">
                    <Building className="h-4 w-4" />
                    <span>უძრავი ქონება</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/agencies" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    <span>სააგენტოები</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
                <Construction className="h-4 w-4" />
                <span>პროექტები</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                <DropdownMenuItem asChild>
                  <Link to="/new-projects" className="flex items-center gap-2 cursor-pointer">
                    <LayoutGrid className="h-4 w-4" />
                    <span>ახალი პროექტები</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/developer-apartments" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4" />
                    <span>ბინები დეველოპერებისგან</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/construction-projects" className="flex items-center gap-2 cursor-pointer">
                    <Construction className="h-4 w-4" />
                    <span>მშენებარე პროექტები</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* რეკლამა and კონტაქტი moved to the right side */}
          </nav>
          
          <div className="ml-auto flex items-center space-x-5">
            <Link to="/advertise" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
              <LayoutGrid className="h-4 w-4" />
              <span>რეკლამა</span>
            </Link>
            
            <Link to="/contact" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-50 text-foreground hover:text-primary transition-all">
              <Contact className="h-4 w-4" />
              <span>კონტაქტი</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
