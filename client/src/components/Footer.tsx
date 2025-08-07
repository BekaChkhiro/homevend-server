
import { Home, Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/50 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-primary">HOMEVEND.ge</span>
            </div>
            <p className="text-muted-foreground text-sm">
              საქართველოს წამყვანი უძრავი ქონების პლატფორმა. 
              ჩვენ გაგეხმარებით იპოვოთ თქვენი სახლი.
            </p>
            <div className="flex space-x-3">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">სწრაფი ლინკები</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">მთავარი</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">ყიდვა</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">ქირავდება</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">ახალი პროექტები</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">სერვისები</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">სერვისები</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">ქონების შეფასება</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">იურიდიული კონსულტაცია</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">იპოთეკური დაფინანსება</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">ქონების მართვა</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">კონტაქტი</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">+995 555 123 456</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">info@homevend.ge</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">თბილისი, საქართველო<br />რუსთაველის გამზირი 12</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 HOMEVEND.ge. ყველა უფლება დაცულია.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">კონფიდენციალურობა</a>
              <a href="#" className="hover:text-primary transition-colors">გამოყენების წესები</a>
              <a href="#" className="hover:text-primary transition-colors">კუკის პოლიტიკა</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
