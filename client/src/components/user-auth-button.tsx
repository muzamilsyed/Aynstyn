import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirebaseAuth } from "@/components/firebase-auth-provider";
import { LogIn, User, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function UserAuthButton() {
  const { user, loading, logOut } = useFirebaseAuth();
  const [, navigate] = useLocation();
  
  // Show loading state if authentication is being checked
  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin"></div>
        <span className="ml-2">Loading...</span>
      </Button>
    );
  }
  
  // If user is authenticated, show user menu
  if (user) {
    const userInitials = user.displayName
      ? `${user.displayName[0]}`.toUpperCase()
      : user.email
        ? user.email[0].toUpperCase()
        : "U";
        
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 h-auto">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={userInitials} />
              ) : null}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm font-medium">
              {user.displayName || user.email?.split('@')[0] || "User"}
            </span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2"
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer flex items-center gap-2"
            onClick={async () => {
              await logOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // If user is not authenticated, show login button
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 h-auto" 
      onClick={() => navigate("/auth")}
    >
      <LogIn className="h-4 w-4" />
      <span className="text-xs sm:text-sm">Sign In</span>
    </Button>
  );
}