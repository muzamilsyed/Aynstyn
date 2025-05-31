import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface EmbeddedRegistrationFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function EmbeddedRegistrationForm({ 
  onSuccess, 
  onSwitchToLogin 
}: EmbeddedRegistrationFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      // Create user with Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Account Created",
        description: "Your account has been created successfully!",
      });
      
      // Call the success callback to continue the assessment
      onSuccess();
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Display user-friendly error message
      toast({
        title: "Registration Failed",
        description: error.message || "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-9"
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-9"
        />
        <p className="text-xs text-gray-500">Minimum 6 characters</p>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        By registering, you agree to our{" "}
        <a 
          href="/terms-and-conditions" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Terms & Conditions
        </a>{" "}
        and{" "}
        <a 
          href="/privacy-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Privacy Policy
        </a>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-black hover:bg-black/90 text-white h-9"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Register Now"}
      </Button>
      

    </form>
  );
}