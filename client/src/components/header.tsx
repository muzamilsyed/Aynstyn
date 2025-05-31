import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import aynstynLogo from "../assets/aynstyn-logo.png";
import UserAuthButton from "./user-auth-button";

export default function Header() {
  const [location, navigate] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Assessment", path: "/assessment" },
    { name: "Pricing", path: "/pricing" },
    { name: "About", path: "/about" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
          <img 
            src={aynstynLogo} 
            alt="Aynstyn Logo" 
            className="h-8 w-auto sm:h-10"
          />
          <span className="text-lg sm:text-xl font-bold text-gray-900">Aynstyn</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
              className={`font-medium ${
                location === item.path
                  ? "text-primary-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.name}
            </a>
          ))}
        </nav>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Get Started button - visible on all screen sizes */}
          <Button
            variant="default"
            className="flex bg-black text-white hover:bg-gray-800 border border-gray-300 text-xs sm:text-sm"
            onClick={() => navigate("/assessment")}
          >
            Get Started
          </Button>
          
          {/* User Authentication Button */}
          <UserAuthButton />
          
          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col space-y-4 mt-8">
                {menuItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      closeMenu();
                    }}
                    className={`px-2 py-1 rounded-md ${
                      location === item.path
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
                {/* Get Started button removed from mobile menu */}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
