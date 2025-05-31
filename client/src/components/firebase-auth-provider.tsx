/**
 * 🔐 FIREBASE AUTHENTICATION PROVIDER
 * 
 * This component provides Firebase authentication functionality throughout the app.
 * It supports multiple authentication methods:
 * - Google OAuth
 * - GitHub OAuth  
 * - Twitter OAuth
 * - Apple OAuth
 * - Email/Password authentication
 * - Password reset functionality
 * 
 * FEATURES:
 * - Real-time authentication state management
 * - Error handling with toast notifications
 * - Loading states for better UX
 * - Automatic user session persistence
 * - Multiple OAuth provider support
 */

// React and Firebase imports
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  TwitterAuthProvider, 
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User
} from 'firebase/auth';

// Local Firebase configuration and providers
import { auth, googleProvider, githubProvider, twitterProvider, appleProvider } from '../lib/firebase';

// UI notification hook
import { useToast } from '@/hooks/use-toast';

/**
 * 📝 AUTHENTICATION CONTEXT TYPE DEFINITION
 * 
 * Defines the shape of the authentication context that will be
 * available to all components wrapped by the AuthProvider.
 */
interface AuthContextType {
  // Authentication state
  user: User | null;           // Current authenticated user or null
  loading: boolean;            // Loading state during auth operations
  error: string | null;        // Error message if authentication fails
  
  // OAuth authentication methods
  signInWithGoogle: () => Promise<void>;    // Google OAuth sign-in
  signInWithGithub: () => Promise<void>;    // GitHub OAuth sign-in
  signInWithTwitter: () => Promise<void>;   // Twitter OAuth sign-in
  signInWithApple: () => Promise<void>;     // Apple OAuth sign-in
  
  // Email/password authentication methods
  signInWithEmail: (email: string, password: string) => Promise<void>;    // Email sign-in
  signUpWithEmail: (email: string, password: string) => Promise<void>;    // Email registration
  resetPassword: (email: string) => Promise<void>;                        // Password reset
  
  // Session management
  logOut: () => Promise<void>;              // Sign out current user
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within an AuthProvider');
  }
  return context;
};

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      // If user just signed in, initialize their account to ensure they get 5 credits
      if (user) {
        try {
          const token = await user.getIdToken();
          await fetch('/api/user/initialize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('User account initialized successfully');
        } catch (error) {
          console.error('Failed to initialize user account:', error);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      toast({
        title: "Authentication successful",
        description: "You are now signed in with Google",
      });
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, githubProvider);
      toast({
        title: "Authentication successful",
        description: "You are now signed in with GitHub",
      });
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      setError(error.message);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Twitter (X)
  const signInWithTwitter = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, twitterProvider);
      toast({
        title: "Authentication successful",
        description: "You are now signed in with X",
      });
    } catch (error: any) {
      console.error('Twitter sign in error:', error);
      setError(error.message);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, appleProvider);
      toast({
        title: "Authentication successful",
        description: "You are now signed in with Apple",
      });
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      setError(error.message);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Authentication successful",
        description: "You are now signed in",
      });
    } catch (error: any) {
      console.error('Email sign in error:', error);
      setError(error.message);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    } catch (error: any) {
      console.error('Email sign up error:', error);
      setError(error.message);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Check your email for further instructions",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message);
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "You have been signed out",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithTwitter,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}