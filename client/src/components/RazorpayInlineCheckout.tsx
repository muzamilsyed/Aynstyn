import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, Wallet, Building, ArrowLeft, Shield, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RazorpayInlineCheckoutProps {
  amount: string;
  currency: string;
  packageId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: any) => void;
}

export default function RazorpayInlineCheckout({
  amount,
  currency,
  packageId,
  onSuccess,
  onError
}: RazorpayInlineCheckoutProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // Payment form states
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

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

  const processPayment = async () => {
    if (!currentOrder) return;

    setIsProcessing(true);
    
    // Simulate payment processing since we're doing inline checkout
    try {
      // In a real implementation, you'd send payment details to your backend
      // which would then process them with Razorpay's Payment API
      
      const mockPaymentResponse = {
        razorpay_order_id: currentOrder.id,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: 'mock_signature_' + Date.now()
      };

      // Verify payment on backend
      const verifyResponse = await fetch('/api/payments/razorpay/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...mockPaymentResponse,
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
          onSuccess?.(mockPaymentResponse.razorpay_payment_id);
          setShowPaymentForm(false);
        } else {
          throw new Error('Payment verification failed');
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Processing Failed",
        description: "Please check your details and try again.",
        variant: "destructive",
      });
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const inrAmount = Math.round(parseFloat(amount) * 83);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      description: 'Pay using Google Pay, PhonePe, Paytm',
      icon: Smartphone,
      popular: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Rupay',
      icon: CreditCard,
      popular: true
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'All major banks supported',
      icon: Building,
      popular: false
    }
  ];

  if (!showPaymentForm) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card className="mb-4">
          <CardHeader className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">₹{inrAmount}</div>
            <CardDescription className="text-sm text-gray-500 mb-3">
              ${amount} USD converted at ₹83 per USD
            </CardDescription>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
              <Shield className="h-3 w-3 text-green-600" />
              <span>Secured by</span>
              <span className="font-semibold text-blue-600">Razorpay</span>
            </div>
          </CardHeader>
        </Card>

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

          <div className="text-3xl font-bold text-green-600">₹{inrAmount}</div>
          <CardDescription className="text-sm text-gray-500">
            {packageId} • Inline secure payment
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Payment Method Selection */}
      <Card className="mb-4">
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
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <method.icon className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{method.name}</span>
                      {method.popular && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedMethod === method.id && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMethod === 'upi' && (
            <div>
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                type="text"
                placeholder="mobile no@paytm / mobile no@gpay"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID (Google Pay, PhonePe, Paytm, etc.)
              </p>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  type="text"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-expiry">Expiry Date</Label>
                  <Input
                    id="card-expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="card-cvv">CVV</Label>
                  <Input
                    id="card-cvv"
                    type="text"
                    placeholder="123"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div>
              <Label htmlFor="bank">Select Your Bank</Label>
              <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                <option value="">Choose your bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="kotak">Kotak Mahindra Bank</option>
                <option value="others">Other Banks</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button 
        onClick={processPayment}
        disabled={isProcessing || !currentOrder}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing Payment...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Pay ₹{inrAmount} Now
          </>
        )}
      </Button>
      
      <p className="text-xs text-gray-500 text-center mt-3">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Secured by</span>
          <img 
            src="https://razorpay.com/assets/razorpay-logo.svg" 
            alt="Razorpay" 
            className="h-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'inline';
            }}
          />
          <span style={{display: 'none'}} className="font-semibold text-blue-600">Razorpay</span>
        </div>
      </p>
    </div>
  );
}