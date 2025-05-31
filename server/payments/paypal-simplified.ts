import { Request, Response } from 'express';
import { storage } from '../storage';

// Helper function to convert Firebase ID to numeric ID for database
function getNumericIdFromFirebaseId(firebaseId: string): number {
  // Hash the string to a number that fits in a 32-bit integer
  let hash = 0;
  for (let i = 0; i < firebaseId.length; i++) {
    const char = firebaseId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure it's positive and not too large (positive 32-bit signed integer max)
  return Math.abs(hash) % 2147483647;
}

// Check for environment - use live credentials when available
const USE_LIVE_MODE = process.env.PAYPAL_LIVE_CLIENT_ID && process.env.PAYPAL_LIVE_SECRET;

// Set appropriate credentials based on environment
const PAYPAL_CLIENT_ID = USE_LIVE_MODE 
  ? process.env.PAYPAL_LIVE_CLIENT_ID 
  : process.env.PAYPAL_CLIENT_ID;
  
const PAYPAL_SECRET = USE_LIVE_MODE 
  ? process.env.PAYPAL_LIVE_SECRET 
  : process.env.PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.warn('PayPal credentials are missing or incomplete. Payment processing may not work correctly.');
} else {
  console.log(`PayPal configured in ${USE_LIVE_MODE ? 'LIVE' : 'SANDBOX'} mode`);
}

// Credit package options with prices
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // USD
  description: string;
}

export const creditPackages: CreditPackage[] = [
  {
    id: 'spark',
    name: 'Spark Pack',
    credits: 5,
    price: 0,
    description: 'Free starter plan with 5 credits'
  },
  {
    id: 'explorer',
    name: 'Explorer Pack',
    credits: 25,
    price: 9.99,
    description: 'Get 25 credits to use for assessments (Save 20%)'
  },
  {
    id: 'genius',
    name: 'Genius Pack',
    credits: 60,
    price: 19.99,
    description: 'Get 60 credits to use for assessments (Save 33%)'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 0,
    price: 0,
    description: 'Custom solutions for corporates and academics'
  }
];

// Create order details for PayPal
export function createOrderDetails(req: Request, res: Response) {
  try {
    const { packageId } = req.body;
    
    // Find the package
    const creditPackage = creditPackages.find(pkg => pkg.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid package ID'
      });
    }
    
    // Return package details to client for creating PayPal order
    return res.json({
      success: true,
      packageDetails: {
        id: creditPackage.id,
        name: creditPackage.name,
        price: creditPackage.price,
        credits: creditPackage.credits,
        description: creditPackage.description
      }
    });
  } catch (error: any) {
    console.error('Error creating order details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create order details',
      error: error.message
    });
  }
}

// Process payment after completion
export async function processPayment(req: Request, res: Response) {
  console.log('Payment processing started', req.body);
  
  try {
    const { packageId, orderId, payerId } = req.body;
    
    if (!packageId) {
      console.log('Missing package ID in request');
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      });
    }
    
    // In live mode, we require orderID and payerID from PayPal
    if (USE_LIVE_MODE && (!orderId || !payerId)) {
      console.log('Missing order ID or payer ID in live mode');
      return res.status(400).json({
        success: false,
        message: 'Order ID and Payer ID are required for live payments'
      });
    }
    
    console.log(`Processing payment for package ID: ${packageId}`);
    
    // Find the package to determine credits to add
    const creditPackage = creditPackages.find(pkg => pkg.id === packageId);
    if (!creditPackage) {
      console.log(`Invalid package ID: ${packageId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid package information'
      });
    }
    
    console.log(`Found credit package: ${creditPackage.name}, ${creditPackage.credits} credits`);
    
    // For development and testing without a user, we'll use a default ID
    // In production, we properly validate the user authentication
    let userId = 1; // Default test user
    
    if (req.user) {
      console.log('User authenticated during payment:', JSON.stringify(req.user));
      // If we have a user, try to get their ID from various possible places
      if (req.user.claims && req.user.claims.sub) {
        userId = getNumericIdFromFirebaseId(req.user.claims.sub);
      } else if (req.user.id) {
        userId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;
      }
      console.log(`Using authenticated user ID: ${userId}`);
    } else {
      console.log('No authenticated user found for payment');
      return res.status(401).json({
        success: false,
        message: 'Authentication required for payments'
      });
    }
    
    // In live mode, verify the PayPal order ID and payer ID
    if (USE_LIVE_MODE && orderId && payerId) {
      console.log(`Processing live PayPal payment with order ID: ${orderId} from payer ID: ${payerId}`);
      // In a complete implementation, we would verify the order with PayPal API
      // and check that the payment amount matches the expected value
    }
    
    try {
      // Add credits to user account
      console.log(`Adding ${creditPackage.credits} credits to user ${userId}`);
      const updatedUser = await storage.addUserCredits(userId, creditPackage.credits);
      console.log('Credits updated successfully, new total:', updatedUser.credits);
      
      // Record transaction details in logs (in a full implementation, we would store this in a database)
      const transactionDetails = {
        userId,
        packageId,
        orderId: orderId || 'direct-credit-add',
        payerId: payerId || 'system',
        amount: creditPackage.price,
        credits: creditPackage.credits,
        date: new Date().toISOString(),
        environment: USE_LIVE_MODE ? 'LIVE' : 'SANDBOX'
      };
      console.log('Payment transaction recorded:', transactionDetails);
      
      // Return success
      return res.json({
        success: true,
        message: `Successfully added ${creditPackage.credits} credits to your account`,
        credits: updatedUser.credits
      });
    } catch (creditError) {
      console.error('Error adding credits to user account:', creditError);
      
      if (USE_LIVE_MODE) {
        // In live mode, we don't want to simulate success if there was an actual error
        return res.status(500).json({
          success: false,
          message: 'Failed to add credits to your account. Please contact support.',
          error: 'Database update failed'
        });
      } else {
        // For sandbox testing, still return success to simulate payment completion
        console.log('Sandbox mode: Returning simulated success response despite error');
        return res.json({
          success: true,
          message: `Successfully added ${creditPackage.credits} credits to your account (simulated)`,
          credits: creditPackage.credits
        });
      }
    }
  } catch (error: any) {
    console.error('Error in payment processing:', error);
    
    if (USE_LIVE_MODE) {
      // In live mode, return an actual error so the user knows to try again
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed. Please try again or contact support.',
        error: error.message
      });
    } else {
      // In sandbox mode, simulate success for testing purposes
      console.log('Sandbox mode: Simulating success despite payment error');
      return res.json({
        success: true,
        message: `Payment processed successfully (simulated)`,
        credits: 10 // Default amount for error case
      });
    }
  }
}

// Get all available credit packages
export function getCreditPackages(req: Request, res: Response) {
  return res.json({
    success: true,
    packages: creditPackages
  });
}

// Get user credit balance
export async function getUserCredits(req: Request, res: Response) {
  try {
    console.log('=== CREDIT CHECK DEBUG START ===');
    console.log('Request user object:', req.user);
    console.log('Request headers authorization:', req.headers.authorization ? 'Present' : 'Missing');
    
    // Extract Firebase ID directly from authorization header like other endpoints do
    let userId = 1; // Default test user
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Extract and decode the Firebase token like other endpoints
        const token = authHeader.split('Bearer ')[1];
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        console.log('Decoded token for credit check:', decoded);
        
        if (decoded.sub && decoded.email) {
          // First try to find user by email since that's more reliable
          try {
            const userByEmail = await storage.getUserByEmail(decoded.email);
            if (userByEmail) {
              userId = userByEmail.id;
              console.log(`Credit check: Found user by email ${decoded.email} -> User ID ${userId}`);
            } else {
              // Fallback to Firebase ID calculation
              const firebaseId = decoded.sub;
              userId = getNumericIdFromFirebaseId(firebaseId);
              console.log(`Credit check: No user found by email, using Firebase ID ${firebaseId} -> Numeric ID ${userId}`);
            }
          } catch (emailError) {
            console.error('Error looking up user by email:', emailError);
            const firebaseId = decoded.sub;
            userId = getNumericIdFromFirebaseId(firebaseId);
            console.log(`Credit check: Email lookup failed, using Firebase ID ${firebaseId} -> Numeric ID ${userId}`);
          }
        }
      } catch (tokenError) {
        console.error('Error decoding token for credit check:', tokenError);
      }
    }
    
    // Fallback to req.user if available
    if (userId === 1 && req.user) {
      console.log('User authenticated during credit check:', req.user);
      // If we have a user, try to get their ID from various possible places
      if ((req.user as any).claims && (req.user as any).claims.sub) {
        const firebaseId = (req.user as any).claims.sub;
        userId = getNumericIdFromFirebaseId(firebaseId);
        console.log(`Credit check: Firebase ID ${firebaseId} -> Numeric ID ${userId}`);
      } else if ((req.user as any).id) {
        userId = typeof (req.user as any).id === 'string' ? parseInt((req.user as any).id) : (req.user as any).id;
        console.log(`Credit check: Using direct user ID ${userId}`);
      }
    }
    
    if (userId === 1) {
      console.log('NO USER FOUND - Using default test user ID for credit check');
    }
    
    console.log(`Final userId for credit lookup: ${userId}`);
    
    // Get the user's credits
    const credits = await storage.getUserCredits(userId);
    console.log(`Credits found for user ${userId}: ${credits}`);
    console.log('=== CREDIT CHECK DEBUG END ===');
    
    return res.json({
      success: true,
      credits
    });
  } catch (error: any) {
    console.error('Error fetching user credits:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user credits',
      error: error.message
    });
  }
}