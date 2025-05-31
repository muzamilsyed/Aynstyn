import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirebaseAuth } from '@/components/firebase-auth-provider';
import { Shield, Star, Zap, Check, CreditCard, X, Clock, Users, Sparkles, TrendingUp, Award, HeadphonesIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AnimatedSection from '@/components/animated-section';
import SmartPaymentComponent from '@/components/SmartPaymentComponent';
import RegistrationModal from '@/components/registration-modal';

// Define credit package type
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  features: string[];
  badge: string;
  badgeColor: string;
  pricePerCredit: number;
  bestFor: string;

  savings?: string;
}

// User credits response type
interface CreditsResponse {
  success: boolean;
  credits: number;
}

const PricingPage: React.FC = () => {
  const { user } = useFirebaseAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [currentPackageDetails, setCurrentPackageDetails] = useState<CreditPackage | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState<boolean>(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingPackageId, setPendingPackageId] = useState<string | null>(null);
  
  // Fetch credit packages
  const { data: packagesData, isLoading: isPackagesLoading } = useQuery({
    queryKey: ['/api/payments/packages'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch user credit balance if logged in
  const { data: creditsData, isLoading: isCreditsLoading } = useQuery({
    queryKey: ['/api/payments/credits'],
    enabled: !!user, // Only run if user is logged in
    staleTime: 1000 * 60 * 1, // 1 minute
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (packageId: { packageId: string }) => {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ packageId: packageId.packageId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.packageDetails) {
        // Store package details
        setCurrentPackageDetails(data.packageDetails);
        
        // Display payment confirmation
        toast({
          title: 'Proceed to Payment',
          description: `You're purchasing ${data.packageDetails.credits} credits for $${data.packageDetails.price}.`,
          variant: 'default'
        });
        
        // Show PayPal payment options
        setShowPaymentOptions(true);
        
        // Scroll to top to show payment interface
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to initiate payment',
        variant: 'destructive'
      });
      setSelectedPackage(null);
    }
  });
  
  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: { packageId: string, orderId: string, payerId: string }) => {
      const response = await fetch('/api/payments/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({
          packageId: data.packageId,
          orderId: data.orderId,
          payerId: data.payerId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process payment');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Payment Successful',
          description: data.message || `Credits added to your account successfully!`,
          variant: 'default'
        });
        
        // Reset payment flow
        setSelectedPackage(null);
        setCurrentPackageDetails(null);
        
        // Invalidate credits query to refresh balance
        queryClient.invalidateQueries({ queryKey: ['/api/payments/credits'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Processing Error',
        description: error.message,
        variant: 'destructive'
      });
      setSelectedPackage(null);
      setCurrentPackageDetails(null);
    }
  });
  
  // Handle PayPal payment success
  const handlePayPalSuccess = async (orderId: string) => {
    if (currentPackageDetails && user) {
      try {
        await processPaymentMutation.mutate({
          packageId: currentPackageDetails.id,
          orderId: orderId,
          payerId: 'paypal-customer' // PayPal handles payer identification internally
        });
      } catch (error) {
        console.error('PayPal payment processing error:', error);
      }
    }
  };

  // Handle buy click
  const handleBuyClick = (packageId: string) => {
    // Handle Enterprise plan - redirect to contact page
    if (packageId === 'enterprise') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate('/contact-us');
      return;
    }
    
    // Handle Spark plan (free) - assign credits directly
    if (packageId === 'spark') {
      if (!user) {
        setPendingPackageId(packageId);
        setShowRegistrationModal(true);
        return;
      }
      // For free plan, directly assign credits without payment
      processPaymentMutation.mutate({
        packageId: 'spark',
        orderId: 'free-plan-activation',
        payerId: 'free-plan'
      });
      return;
    }
    
    if (!user) {
      // Show registration modal for non-logged-in users
      setPendingPackageId(packageId);
      setShowRegistrationModal(true);
      return;
    }
    
    // Set the selected package and create order for paid plans
    setSelectedPackage(packageId);
    createOrderMutation.mutate({ packageId });
  };

  // Handle successful authentication from modal
  const handleAuthSuccess = () => {
    setShowRegistrationModal(false);
    
    toast({
      title: "Authentication Successful",
      description: "Proceeding to purchase...",
      duration: 3000,
    });

    // Proceed with the pending purchase
    if (pendingPackageId) {
      setSelectedPackage(pendingPackageId);
      createOrderMutation.mutate({ packageId: pendingPackageId });
      setPendingPackageId(null);
    }
  };
  
  // Simulate a successful payment (for development/testing)
  const simulateSuccessfulPayment = (packageId: string) => {
    // In a real implementation, this would be triggered by a payment gateway callback
    setTimeout(() => {
      processPaymentMutation.mutate({ 
        packageId,
        orderId: 'simulated-order-id', 
        payerId: 'simulated-payer-id' 
      });
    }, 2000);
  };
  
  // Get formatted credit packages with enhanced value propositions
  const apiPackages = (packagesData as any)?.packages || [];
  const creditPackages: CreditPackage[] = apiPackages.length > 0 ? apiPackages.map((pkg: any) => ({
    ...pkg,
    description: pkg.id === 'spark' 
      ? 'Free starter plan with 5 credits'
      : pkg.id === 'explorer'
      ? '25 credits for assessments (Save 20%)'
      : pkg.id === 'genius'
      ? '60 credits for assessments (Save 33%)'
      : 'Custom solutions for corporates and academics',
    bestFor: pkg.id === 'spark' 
      ? 'Kickstart your journey by exploring foundational topics and warming up your analytical thinking.'
      : pkg.id === 'explorer'
      ? 'Dive deeper to assess and strengthen your understanding on various subjects.'
      : pkg.id === 'genius'
      ? 'Take a focused leap toward mastery—build deep insights and develop expertise in your subject. Be competent in your domain.'
      : 'Perfect for organizations and educational institutions requiring custom solutions.',
    features: pkg.id === 'spark' 
      ? ['5 FREE credits', 'Good for exploration', 'Topic explanation']
      : pkg.id === 'explorer'
      ? ['Get competent', 'Lay solid foundation', 'Topic explanations']
      : pkg.id === 'genius'
      ? ['Be a genius', 'Achieve mastery in subjects', 'Topic explanations']
      : ['For corporates', 'For academics', 'Custom solutions', 'Dedicated support'],
    badge: pkg.id === 'spark' ? 'FREE' : pkg.id === 'explorer' ? 'BEST VALUE' : pkg.id === 'genius' ? 'PREMIUM' : 'ENTERPRISE',
    badgeColor: pkg.id === 'spark' ? 'bg-green-100 text-green-800' : pkg.id === 'explorer' ? 'bg-blue-100 text-blue-800' : pkg.id === 'genius' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800',
    pricePerCredit: pkg.price > 0 ? pkg.price / pkg.credits : 0,
    savings: pkg.id === 'explorer' ? '20%' : pkg.id === 'genius' ? '33%' : undefined
  })) : [
    {
      id: 'spark',
      name: 'Spark Pack',
      credits: 5,
      price: 0,
      description: 'Free starter plan with 5 credits',
      features: [
        '5 FREE credits',
        'Good for exploration',
        'Topic explanation'
      ],
      badge: 'FREE',
      badgeColor: 'bg-green-100 text-green-800',
      pricePerCredit: 0,
      bestFor: 'Kickstart your journey by exploring foundational topics and warming up your analytical thinking.'
    },
    {
      id: 'explorer',
      name: 'Explorer Pack',
      credits: 25,
      price: 9.99,
      description: '25 credits for assessments (Save 20%)',
      features: [
        'Get competent',
        'Lay solid foundation',
        'Topic explanations'
      ],
      badge: 'BEST VALUE',
      badgeColor: 'bg-blue-100 text-blue-800',
      pricePerCredit: 9.99 / 25,
      bestFor: 'Dive deeper to assess and strengthen your understanding on various subjects.',
      savings: '20%'
    },
    {
      id: 'genius',
      name: 'Genius Pack',
      credits: 60,
      price: 19.99,
      description: '60 credits for assessments (Save 33%)',
      features: [
        'Be a genius',
        'Achieve mastery in subjects',
        'Topic explanations'
      ],
      badge: 'PREMIUM',
      badgeColor: 'bg-purple-100 text-purple-800',
      pricePerCredit: 19.99 / 60,
      bestFor: 'Take a focused leap toward mastery—build deep insights and develop expertise in your subject. Be competent in your domain.',
      savings: '33%'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 0,
      price: 0,
      description: 'Custom solutions for corporates and academics',
      features: [
        'For corporates',
        'For academics',
        'Custom solutions',
        'Dedicated support'
      ],
      badge: 'ENTERPRISE',
      badgeColor: 'bg-gray-100 text-gray-800',
      pricePerCredit: 0,
      bestFor: 'Perfect for organizations and educational institutions requiring custom solutions.'
    }
  ];
  
  // Get user credits
  const userCredits = (creditsData as CreditsResponse)?.credits || 0;

  return (
    <div className="container px-4 py-10 mx-auto max-w-7xl">
      <AnimatedSection>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Pricing &amp; Credits</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Purchase credits to use for assessments. 1 credit = 1 assessment.
            {user && (
              <span className="font-semibold block mt-2">
                You currently have <span className="text-primary">{userCredits} credits</span> available.
              </span>
            )}
          </p>
        </div>
      </AnimatedSection>
      
      {showPaymentOptions && currentPackageDetails ? (
        <div className="max-w-md mx-auto mb-8 p-6 border rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Complete Your Purchase</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setShowPaymentOptions(false);
                setSelectedPackage(null);
                setCurrentPackageDetails(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center mb-4">
            <p className="font-medium">{currentPackageDetails.name}</p>
            <p className="text-2xl font-bold text-primary">${currentPackageDetails.price}</p>
            <p className="text-sm text-gray-600 mb-6">{currentPackageDetails.credits} credits</p>
            
            <div className="space-y-4">
              <SmartPaymentComponent
                amount={currentPackageDetails.price.toString()}
                currency="USD"
                intent="capture"
                packageId={currentPackageDetails.name}
                onSuccess={() => handlePayPalSuccess('smart-payment-success')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-1 place-items-start">
          {creditPackages.map((pkg) => (
            <AnimatedSection key={pkg.id} delay={pkg.id === 'spark' ? 0.1 : pkg.id === 'explorer' ? 0.2 : 0.3}>
              <Card className={`w-full h-full flex flex-col relative ${
                pkg.id === 'explorer' 
                  ? 'border-primary shadow-xl scale-105 bg-gradient-to-br from-green-50 to-blue-50' 
                  : pkg.id === 'genius'
                  ? 'border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50'
                  : 'border-gray-200 shadow-md'
              }`}>
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                </div>

                <CardHeader className="pt-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {pkg.id === 'spark' && <Shield className="h-6 w-6 text-blue-500" />}
                        {pkg.id === 'explorer' && <Star className="h-6 w-6 text-amber-500" />}
                        {pkg.id === 'genius' && <Zap className="h-6 w-6 text-purple-500" />}
                        {pkg.name}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">{pkg.description}</CardDescription>
                    </div>
                  </div>
                  
                  {/* Price section with value proposition */}
                  <div className="mt-4">
                    {pkg.id === 'enterprise' ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-600">Contact Us</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                          {pkg.price === 0 ? 'FREE' : `$${pkg.price}`}
                        </span>
                        {pkg.savings && (
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                            Save {pkg.savings}
                          </span>
                        )}
                      </div>
                    )}
                    {pkg.id !== 'enterprise' && (
                      <p className="text-sm text-gray-600 mt-1">
                        {pkg.price === 0 ? 'No cost' : `$${pkg.pricePerCredit?.toFixed(2) || '0.50'} per assessment`}
                      </p>
                    )}
                  </div>

                  {/* Best for section */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-semibold text-gray-800 block mb-1">Perfect for:</span>
                        <span className="text-sm text-gray-700 leading-relaxed">{pkg.bestFor}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow">
                  {/* Features list */}
                  <ul className="space-y-3">
                    {(pkg.features || []).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>


                </CardContent>

                <CardFooter className="pt-4">
                  {selectedPackage === pkg.id && createOrderMutation.isPending ? (
                    <div className="w-full py-3 text-center bg-gray-100 rounded-lg">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className={`w-full font-semibold ${
                        pkg.id === 'explorer' 
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg' 
                          : pkg.id === 'genius'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                          : pkg.id === 'enterprise'
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                      }`}
                      onClick={() => handleBuyClick(pkg.id)}
                      disabled={createOrderMutation.isPending || processPaymentMutation.isPending || showPaymentOptions}
                      variant={pkg.id === 'spark' ? 'default' : 'default'}
                      size="lg"
                    >
                      {pkg.id === 'spark' ? '🎯 Get Free Credits' : 
                       pkg.id === 'explorer' ? '🚀 Get Started Now' : 
                       pkg.id === 'genius' ? '⭐ Go Premium' : 
                       '📞 Contact Us'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      )}

      {/* Social Proof & Statistics */}
      {!showPaymentOptions && (
        <AnimatedSection delay={0.4}>
          <div className="mt-16 max-w-6xl mx-auto">
            {/* Social Proof & Urgency */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">10,000+ Assessments</h3>
                <p className="text-sm text-gray-600">Completed by students and professionals</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">98% Satisfaction</h3>
                <p className="text-sm text-gray-600">Everyone love our analysis</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-2">Advanced Algorithms</h3>
                <p className="text-sm text-gray-600">Powered by cutting-edge technology</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingPackageId(null);
        }}
        onSuccess={handleAuthSuccess}
      />
      
      <AnimatedSection delay={0.4} className="mt-16">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">How do credits work?</h3>
              <p className="text-gray-600">Each credit allows you to perform one assessment. Credits never expire and can be used at any time.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Do I get any free credits?</h3>
              <p className="text-gray-600">Yes! When you sign up, you receive 5 free credits to get started with the platform.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">What payment methods are accepted?</h3>
              <p className="text-gray-600">We accept all major credit cards and PayPal payments for your convenience.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Can I get a refund?</h3>
              <p className="text-gray-600">Credits are non-refundable once purchased, but they never expire so you can use them anytime.</p>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default PricingPage;