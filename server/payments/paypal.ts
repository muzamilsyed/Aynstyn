import * as paypal from '@paypal/paypal-server-sdk';
import { Request, Response } from 'express';
import { storage } from '../storage';

// Define session properties
declare module 'express-session' {
  interface SessionData {
    paypalOrderId?: string;
    packageId?: string;
  }
}

// PayPal configuration
const clientId = process.env.PAYPAL_CLIENT_ID || '';
const clientSecret = process.env.PAYPAL_SECRET || '';

// Create PayPal environment
let environment;
if (process.env.NODE_ENV === 'production') {
  environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
} else {
  environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

const client = new paypal.core.PayPalHttpClient(environment);

// Credit package options with prices
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // USD
  description: string;
}

export const creditPackages: CreditPackage[] = [
  {
    id: 'basic',
    name: 'Basic Pack',
    credits: 10,
    price: 4.99,
    description: 'Get 10 credits to use for assessments'
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    credits: 25,
    price: 9.99,
    description: 'Get 25 credits to use for assessments (Save 20%)'
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    credits: 60,
    price: 19.99,
    description: 'Get 60 credits to use for assessments (Save 33%)'
  }
];

// Create a PayPal order for a specific credit package
export async function createOrder(req: Request, res: Response) {
  try {
    const { packageId } = req.body;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'PayPal credentials are not configured'
      });
    }
    
    // Find the package
    const creditPackage = creditPackages.find(pkg => pkg.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid package ID'
      });
    }
    
    // Calculate amount
    const amount = {
      currency_code: 'USD',
      value: creditPackage.price.toString()
    };
    
    // Create order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: amount,
          description: `${creditPackage.name} - ${creditPackage.credits} credits`
        }
      ],
      application_context: {
        brand_name: 'Aynstyn Assessment',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${req.protocol}://${req.get('host')}/api/payments/paypal/capture`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing`
      }
    });
    
    // Execute the request
    const order = await client.execute(request);
    
    // Store in session for later reference when capturing payment
    if (req.session) {
      req.session.paypalOrderId = order.result.id;
      req.session.packageId = packageId;
    }
    
    return res.json({
      success: true,
      orderId: order.result.id,
      links: order.result.links
    });
  } catch (error: any) {
    console.error('PayPal create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create PayPal order',
      error: error.message
    });
  }
}

// Capture a payment after approval
export async function capturePayment(req: Request, res: Response) {
  try {
    const orderId = req.query.token || req.session?.paypalOrderId;
    const packageId = req.session?.packageId;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        success: false, 
        message: 'PayPal credentials are not configured'
      });
    }
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID not found'
      });
    }
    
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package information not found'
      });
    }
    
    // Find the package to determine credits to add
    const creditPackage = creditPackages.find(pkg => pkg.id === packageId);
    if (!creditPackage) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package information'
      });
    }
    
    // Create capture request
    const request = new paypal.orders.OrdersCaptureRequest(orderId as string);
    request.requestBody({});
    
    // Execute the request
    const capture = await client.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Payment was successful, add credits to user
      if (req.user) {
        // Get numeric ID from Firebase ID
        const numericId = parseInt(req.user.id); // Adjust based on your ID conversion
        
        // Add credits to user account
        await storage.addUserCredits(numericId, creditPackage.credits);
        
        // Clear payment data from session
        if (req.session) {
          delete req.session.paypalOrderId;
          delete req.session.packageId;
        }
        
        // Redirect to success page
        res.redirect('/payment-success?credits=' + creditPackage.credits);
      } else {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: capture.result.status
      });
    }
  } catch (error: any) {
    console.error('PayPal capture payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture PayPal payment',
      error: error.message
    });
  }
}

// Get all available credit packages
export function getCreditPackages(req: Request, res: Response) {
  return res.json({
    success: true,
    packages: creditPackages
  });
}