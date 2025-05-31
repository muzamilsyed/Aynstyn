import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import About from "@/pages/about";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import PricingPage from "@/pages/pricing-page";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsAndConditions from "@/pages/terms-and-conditions";
import HelpCenter from "@/pages/help-center";
import CancellationRefund from "@/pages/cancellation-refund";
import ShippingDelivery from "@/pages/shipping-delivery";
import ContactUs from "@/pages/contact-us";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { FirebaseAuthProvider } from "@/components/firebase-auth-provider";
import MetadataProvider from "@/components/metadata-provider";
import { useEffect } from "react";

function Router() {
  const [location] = useLocation();
  
  // Define paths that need cache invalidation
  const pathsToInvalidate: Record<string, string[]> = {
    '/profile': ['/api/payments/credits', '/api/user/assessments'],
    '/assessment': ['/api/payments/credits'],
    '/pricing': ['/api/payments/credits', '/api/payments/packages'],
    '/auth': ['/api/payments/credits', '/api/user/assessments']
  };
  
  // Refresh data when navigating between certain pages
  useEffect(() => {
    const queriesToInvalidate = pathsToInvalidate[location] || [];
    queriesToInvalidate.forEach((queryKey: string) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  }, [location]);
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow w-full">
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route path="/auth/:tab">
              {(params) => <AuthPage />}
            </Route>
            <Route path="/admin/login" component={AdminLoginPage} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Home />
              </div>
            </Route>
            <Route path="/assessment/:id">
              {(params) => (
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Assessment id={params.id} />
                </div>
              )}
            </Route>
            <Route path="/assessment">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Assessment />
              </div>
            </Route>
            <Route path="/about">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <About />
              </div>
            </Route>
            <Route path="/profile">
              <ProfilePage />
            </Route>
            <Route path="/pricing">
              <PricingPage />
            </Route>
            <Route path="/privacy-policy">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PrivacyPolicy />
              </div>
            </Route>
            <Route path="/terms-and-conditions">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <TermsAndConditions />
              </div>
            </Route>
            <Route path="/help-center">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <HelpCenter />
              </div>
            </Route>
            <Route path="/cancellation-refund">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <CancellationRefund />
              </div>
            </Route>
            <Route path="/shipping-delivery">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ShippingDelivery />
              </div>
            </Route>
            <Route path="/contact-us">
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ContactUs />
              </div>
            </Route>
            <Route>
              <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <NotFound />
              </div>
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FirebaseAuthProvider>
          <MetadataProvider>
            <Router />
            <Toaster />
          </MetadataProvider>
        </FirebaseAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
