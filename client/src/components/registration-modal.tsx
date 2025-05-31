import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SocialAuthButtons from "./social-auth-buttons";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegistrationModal({ 
  isOpen, 
  onClose,
  onSuccess
}: RegistrationModalProps) {
  // Don't render anything if not open to prevent flash
  if (!isOpen) return null;

  const handleSuccess = () => {
    // Force close the modal first
    onClose();
    // Delay the success callback slightly to ensure UI updates first
    setTimeout(() => {
      // Call the parent's success handler to continue the analysis
      onSuccess();
    }, 100);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg md:text-xl text-center">
            Create an Account
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Sign in or sign up to get started
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="px-2 py-1">
          <p className="text-sm text-gray-600 mb-2">
            Benefits:
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm mb-3">
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full p-1 mr-1 text-xs">✓</span>
              <span>5 FREE credits</span>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full p-1 mr-1 text-xs">✓</span>
              <span>Personalized assessments</span>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full p-1 mr-1 text-xs">✓</span>
              <span>Progress tracking</span>
            </div>
            <div className="flex items-center">
              <span className="bg-green-100 text-green-800 rounded-full p-1 mr-1 text-xs">✓</span>
              <span>Study recommendations</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <SocialAuthButtons 
            onSuccess={handleSuccess}
            mode="register"
          />
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a 
              href="/privacy-policy" 
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
        
        <div className="flex justify-center mt-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}