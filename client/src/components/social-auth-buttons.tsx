import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FaGoogle } from "react-icons/fa";
import { useFirebaseAuth } from "./firebase-auth-provider";

interface SocialAuthButtonsProps {
  onSuccess: () => void;
  mode: "register" | "login";
}

export default function SocialAuthButtons({ 
  onSuccess, 
  mode 
}: SocialAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { signInWithGoogle, user } = useFirebaseAuth();
  const actionText = mode === "register" ? "Continue with" : "Continue with";
  
  // Watch for successful authentication and trigger assessment processing
  useEffect(() => {
    if (user && !isLoading) {
      console.log("User detected in SocialAuthButtons, auto-processing assessment");
      // Ensure modal closes and assessment processing starts
      onSuccess();
    }
  }, [user, isLoading, onSuccess]);
  
  const handleSocialAuth = async (provider: "google") => {
    setIsLoading(provider);
    try {
      // Use the centralized auth functions from the auth provider
      switch (provider) {
        case "google":
          await signInWithGoogle();
          break;
      }
      
      // Note: We no longer call onSuccess() here directly
      // The useEffect hook above will handle it when user state changes
      
      toast({
        title: "Authentication Successful",
        description: "Processing your assessment now...",
        duration: 3000,
      });
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      // Toast is already handled in the auth provider functions
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => handleSocialAuth("google")}
        disabled={!!isLoading}
        className="w-full flex items-center justify-center gap-2 h-10 border-gray-300"
      >
        {isLoading === "google" ? (
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-primary" />
        ) : (
          <FaGoogle className="h-5 w-5 text-red-500" />
        )}
        <span>{actionText} Google</span>
      </Button>
    </div>
  );
}