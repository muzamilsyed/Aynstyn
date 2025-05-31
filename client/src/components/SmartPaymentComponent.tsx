import { useIsIndianUser } from "@/hooks/useGeolocation";
import PayPalButton from "@/components/PayPalButton";
import RazorpayInlineCheckout from "@/components/RazorpayInlineCheckout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Globe } from "lucide-react";

interface SmartPaymentComponentProps {
  amount: string;
  currency: string;
  intent: string;
  packageId?: string;
  onSuccess?: () => void;
}

export default function SmartPaymentComponent({
  amount,
  currency,
  intent,
  packageId = "Premium Package",
  onSuccess
}: SmartPaymentComponentProps) {
  // Always show PayPal for all users (Razorpay temporarily disabled)
  // const { isFromIndia, isLoading, error, location } = useIsIndianUser();

  // Show PayPal for all users
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Complete your payment</span>
        </CardTitle>

      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Secure payment via PayPal:
            </p>
            <PayPalButton 
              amount={amount}
              currency={currency}
              intent={intent}
            />
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              Need help with payment? <a href="/contact-us" className="text-blue-600 hover:text-blue-800">Contact our support team</a>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}