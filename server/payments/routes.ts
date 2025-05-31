/**
 * Payment Routes Module
 * 
 * This module defines all the API routes related to payments and credit management.
 * It includes endpoints for PayPal integration, credit package retrieval,
 * and user credit balance management.
 * 
 * Key functionalities:
 * - PayPal order creation and capture
 * - Credit package listing
 * - User credit balance retrieval
 */

import { Router, Request, Response } from 'express';
import { createPaypalOrder, capturePaypalOrder, getClientToken } from '../paypal';
import { getCreditPackages } from './paypal';
import { isAuthenticated } from '../auth/email';

// Define extended request type that includes the authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // Add other user properties as needed
  };
}

/**
 * Create Express Router for payment-related endpoints
 * This router will be mounted at /api/payments in the main application
 */
export const paymentRouter = Router();

/**
 * GET /api/payments/packages
 * Retrieves all available credit packages that users can purchase
 * This endpoint is public and doesn't require authentication
 */
paymentRouter.get('/packages', getCreditPackages);

/**
 * POST /api/payments/paypal/create-order
 * Creates a new PayPal order for credit purchase
 * Requires user authentication to associate the order with a user account
 * Request body should include package ID or custom amount details
 */
paymentRouter.post('/paypal/create-order', isAuthenticated, createPaypalOrder);

/**
 * POST /api/payments/paypal/capture
 * Captures (finalizes) a PayPal payment after user approval
 * This is called after the user approves the payment on PayPal's site/interface
 * The order ID should be provided in the request body or params
 */
paymentRouter.post('/paypal/capture/:orderID', capturePaypalOrder);

/**
 * GET /api/payments/paypal/client-token
 * Returns a client token for the PayPal JS SDK
 */
paymentRouter.get('/paypal/client-token', getClientToken);

/**
 * GET /api/payments/credits
 * Retrieves the current user's credit balance
 * Requires authentication to identify the user
 * Returns the credit amount and success status
 */
paymentRouter.get('/credits', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Ensure user is authenticated and has an ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated or missing ID'
      });
    }
    
    // Extract the authenticated user's ID from the request
    const userId = parseInt(req.user.id);
    
    // Query the database to get the user's current credit balance
    const credits = await req.app.locals.storage.getUserCredits(userId);
    
    // Return the credits information in JSON format
    return res.json({
      success: true,
      credits
    });
  } catch (error: any) {
    // Log and handle any errors that occur during credit retrieval
    console.error('Error fetching user credits:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user credits',
      error: error.message
    });
  }
});