import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, Wallet, Building, ChevronRight, Shield, Check, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  amount: string;
  currency: string;
  packageId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: any) => void;
}

export default function RazorpayCheckout({
  amount,
  currency,
  packageId,
  onSuccess,
  onError
}: RazorpayCheckoutProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const paymentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const createOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount) * 83,
          currency: 'INR',
          packageId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      setCurrentOrder(order);
      setShowPaymentForm(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Error",
        description: "Unable to create payment order. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      onError?.(error);
    }
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    if (!currentOrder || !window.Razorpay) {
      toast({
        title: "Error",
        description: "Payment system not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const options = {
      key: currentOrder.keyId,
      amount: currentOrder.amount,
      currency: currentOrder.currency,
      name: 'Aynstyn',
      description: `${packageId} - AI Assessment Credits`,
      order_id: currentOrder.id,
      method: methodId === 'all' ? {} : { [methodId]: true },
      handler: async (response: any) => {
        try {
          const verifyResponse = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId
            }),
          });

          if (verifyResponse.ok) {
            const result = await verifyResponse.json();
            if (result.success) {
              toast({
                title: "Payment Successful! 🎉",
                description: "Your credits have been added to your account.",
              });
              onSuccess?.(response.razorpay_payment_id);
              setShowPaymentForm(false);
            } else {
              throw new Error('Payment verification failed');
            }
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support with your payment ID.",
            variant: "destructive",
          });
          onError?.(error);
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#3b82f6'
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Convert USD to INR for display
  const inrAmount = Math.round(parseFloat(amount) * 83);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Cards',
      description: 'Visa, Mastercard, Rupay',
      icon: CreditCard,
      popular: true
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'GPay, PhonePe, Paytm',
      icon: Smartphone,
      popular: true
    },
    {
      id: 'wallet',
      name: 'Wallets',
      description: 'Paytm, Mobikwik, etc',
      icon: Wallet,
      popular: false
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks',
      icon: Building,
      popular: false
    }
  ];

  if (!showPaymentForm) {
    return (
      <div className="w-full max-w-md mx-auto">
        {/* Payment Amount Header */}
        <Card className="mb-4">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">🇮🇳</span>
              <CardTitle className="text-lg">Pay in India</CardTitle>
            </div>
            <div className="text-3xl font-bold text-green-600">₹{inrAmount}</div>
            <CardDescription className="text-sm text-gray-500">
              (${amount} USD) • Secure payment by Razorpay
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Start Payment Button */}
        <Button 
          onClick={createOrder}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Preparing Payment...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Continue to Payment
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center mt-3">
          🔒 Choose from Cards, UPI, Wallets & Net Banking
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => setShowPaymentForm(false)}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Package
        </Button>
      </div>

      {/* Payment Amount Header */}
      <Card className="mb-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">🇮🇳</span>
            <CardTitle className="text-lg">Complete Payment</CardTitle>
          </div>
          <div className="text-3xl font-bold text-green-600">₹{inrAmount}</div>
          <CardDescription className="text-sm text-gray-500">
            {packageId} • Secure payment by Razorpay
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Shield className="h-4 w-4 mr-2 text-green-600" />
            Choose Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handlePaymentMethodSelect(method.id)}
              disabled={isProcessing}
              className="w-full p-4 rounded-lg border-2 transition-all hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <method.icon className="h-6 w-6 text-gray-600" />
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-lg">{method.name}</span>
                      {method.popular && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}

          {/* All Methods Option */}
          <button
            onClick={() => handlePaymentMethodSelect('all')}
            disabled={isProcessing}
            className="w-full p-4 rounded-lg border-2 transition-all hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="text-left">
                  <div className="font-medium text-lg">All Payment Methods</div>
                  <div className="text-sm text-gray-500">Choose from all available options</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </button>
        </CardContent>
      </Card>

      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-700">Processing your payment...</span>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 text-center mt-4">
        🔒 256-bit SSL encryption • Money-back guarantee • Instant credit addition
      </p>
    </div>
  );
}