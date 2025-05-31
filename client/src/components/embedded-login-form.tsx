import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface EmbeddedLoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function EmbeddedLoginForm({ 
  onSuccess, 
  onSwitchToRegister 
}: EmbeddedLoginFormProps) {
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
      
      // Sign in user with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Login Successful",
        description: "You've successfully logged in!",
      });
      
      // Call the success callback to continue the assessment
      onSuccess();
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Display user-friendly error message
      toast({
        title: "Login Failed",
        description: error.message || "There was an error logging in. Please check your credentials and try again.",
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
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-9"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-black hover:bg-black/90 text-white h-9"
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Sign In"}
      </Button>
      
      <div className="text-center mt-2">
        <p className="text-xs text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-blue-600 hover:underline font-medium"
            onClick={onSwitchToRegister}
          >
            Register
          </button>
        </p>
      </div>
    </form>
  );
}