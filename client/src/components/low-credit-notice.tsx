import React, { useEffect, useState } from 'react';
import { useFirebaseAuth } from './firebase-auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface UserCreditsResponse {
  success: boolean;
  credits: number;
}

export default function LowCreditNotice() {
  const { user } = useFirebaseAuth();
  const [, navigate] = useLocation();
  const [shouldShow, setShouldShow] = useState(false);
  
  // Fetch user credit balance if logged in
  const { data: creditsData } = useQuery({
    queryKey: ['/api/payments/credits'],
    enabled: !!user, // Only run if user is logged in
    staleTime: 1000 * 60 * 1, // 1 minute
  });
  
  useEffect(() => {
    if (creditsData && (creditsData as UserCreditsResponse).success) {
      const credits = (creditsData as UserCreditsResponse).credits;
      // Show notice when user has 2 or fewer credits
      setShouldShow(credits <= 2);
    }
  }, [creditsData]);
  
  // Don't show if not logged in or not low on credits
  if (!user || !shouldShow) {
    return null;
  }
  
  return (
    <Card className="bg-amber-50 border-amber-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="text-amber-500 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">Your credits are running low</h3>
            <p className="text-amber-700 mt-1">
              You have {(creditsData as UserCreditsResponse).credits} {(creditsData as UserCreditsResponse).credits === 1 ? 'credit' : 'credits'} remaining. Purchase more credits to continue using assessments without interruption.
            </p>
            <div className="mt-3">
              <Button 
                variant="outline" 
                className="bg-white text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800"
                onClick={() => navigate('/pricing')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Buy More Credits
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}