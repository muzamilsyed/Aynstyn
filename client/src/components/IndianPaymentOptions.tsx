import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, Building, Copy } from "lucide-react";

interface IndianPaymentOptionsProps {
  amount: string;
  currency: string;
  packageId: string;
  onSuccess?: () => void;
}

export default function IndianPaymentOptions({ 
  amount, 
  currency, 
  packageId, 
  onSuccess 
}: IndianPaymentOptionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const { toast } = useToast();

  // Convert USD to INR (approximate rate - in production, use real-time rates)
  const inrAmount = Math.round(parseFloat(amount) * 83); // Approximate USD to INR rate

  const handleUPIPayment = () => {
    // Generate UPI payment link or show QR code
    const upiId = "aynstyn@paytm"; // Replace with your actual UPI ID
    const upiLink = `upi://pay?pa=${upiId}&pn=Aynstyn&am=${inrAmount}&cu=INR&tn=Aynstyn Premium Package`;
    
    // Open UPI app or show instructions
    window.open(upiLink, '_blank');
    
    toast({
      title: "UPI Payment Initiated",
      description: "Please complete the payment in your UPI app and contact us for confirmation.",
    });
  };

  const handleBankTransfer = () => {
    toast({
      title: "Bank Transfer Details",
      description: "Bank details have been displayed below. Please contact us after transfer.",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const contactSupport = () => {
    const whatsappNumber = "+919876543210"; // Replace with actual WhatsApp number
    const message = `Hi, I would like to purchase the ${packageId} package for ₹${inrAmount}. Please help me with the payment process.`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🇮🇳</span>
            <span>Payment Options for India</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method for ₹{inrAmount}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upi" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upi" className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <span>UPI</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Bank Transfer</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Contact Us</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upi" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Pay with UPI</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Quick and secure payment through any UPI app
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border">
                      <Label className="text-sm font-medium">UPI ID:</Label>
                      <div className="flex items-center justify-between mt-1">
                        <code className="text-blue-600">aynstyn@paytm</code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard("aynstyn@paytm", "UPI ID")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <Label className="text-sm font-medium">Amount:</Label>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-semibold text-green-600">₹{inrAmount}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(inrAmount.toString(), "Amount")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleUPIPayment} 
                    className="w-full mt-4"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Pay with UPI"}
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  After payment, please contact us with the transaction ID for instant activation.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Bank Transfer Details</h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border">
                    <Label className="text-sm font-medium">Account Name:</Label>
                    <div className="flex items-center justify-between mt-1">
                      <span>Aynstyn Technologies</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard("Aynstyn Technologies", "Account Name")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="text-sm font-medium">Account Number:</Label>
                    <div className="flex items-center justify-between mt-1">
                      <code>1234567890123456</code>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard("1234567890123456", "Account Number")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="text-sm font-medium">IFSC Code:</Label>
                    <div className="flex items-center justify-between mt-1">
                      <code>HDFC0001234</code>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard("HDFC0001234", "IFSC Code")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border">
                    <Label className="text-sm font-medium">Amount:</Label>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-green-600">₹{inrAmount}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(inrAmount.toString(), "Amount")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleBankTransfer} className="w-full mt-4">
                  I've Made the Transfer
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                Please contact us with the transaction reference number after completing the transfer.
              </p>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Contact Our Support Team</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Our team will help you with the payment process and provide personalized assistance.
                </p>
                
                <div className="space-y-3">
                  <Button onClick={contactSupport} className="w-full" variant="outline">
                    💬 WhatsApp Support
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = 'mailto:muzamil@aynstyn.com?subject=Payment Help - Indian User&body=Hi, I would like to purchase the premium package for ₹' + inrAmount + '. Please help me with the payment process.'}
                    className="w-full" 
                    variant="outline"
                  >
                    📧 Email Support
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Email: <a href="mailto:muzamil@aynstyn.com" className="text-blue-600">muzamil@aynstyn.com</a>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Package Details:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Package: {packageId}</li>
              <li>• Amount: ₹{inrAmount} (${amount})</li>
              <li>• Instant activation after payment confirmation</li>
              <li>• 24/7 customer support</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}