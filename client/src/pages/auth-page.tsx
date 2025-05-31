import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useFirebaseAuth } from '@/components/firebase-auth-provider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SocialAuthButtons from '@/components/social-auth-buttons';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { 
    user, 
    error,
  } = useFirebaseAuth();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  const handleSuccess = () => {
    setLocation('/');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Auth form - Displays first on mobile */}
      <div className="bg-white flex items-center justify-center p-6 order-first md:order-last">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <img src="/favicon.png" alt="Aynstyn Logo" className="w-16 h-16" />
            </div>
            <CardTitle className="text-2xl text-center">Welcome to Aynstyn</CardTitle>
            <CardDescription className="text-center">
              Sign in or sign up to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            <SocialAuthButtons 
              onSuccess={handleSuccess}
              mode="register"
            />
            
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground mb-1">
                By continuing, you agree to our{" "}
                <a 
                  href="/privacy-policy" 
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Info section - Displays second on mobile */}
      <div className="bg-gray-50 flex flex-col items-center justify-center p-6 md:p-10 order-last md:order-first">
        <h2 className="text-3xl font-bold mb-4 text-center">Enhance your knowledge with AI-powered assessments</h2>
        <p className="text-gray-600 mb-8 max-w-md text-center">
          Aynstyn helps you identify knowledge gaps and provides personalized recommendations to improve your understanding across various subjects.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-1">Comprehensive Analysis</h3>
            <p className="text-sm text-gray-500">Get detailed feedback on your strengths and areas for improvement.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-1">Multi-modal Input</h3>
            <p className="text-sm text-gray-500">Share your knowledge through text or voice recordings.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-1">Learning Resources</h3>
            <p className="text-sm text-gray-500">Access curated resources tailored to your learning needs.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-1">Progress Tracking</h3>
            <p className="text-sm text-gray-500">Monitor your improvement over time with detailed analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}