import { Router } from 'express';
import { createOrderDetails, processPayment, getCreditPackages, getUserCredits } from './paypal-simplified';
import { extractFirebaseUserId } from '../simple-firebase-auth';

// Create router for payment endpoints
export const paymentRouter = Router();

// Get all available credit packages
paymentRouter.get('/packages', getCreditPackages);

// Get package details for creating PayPal order
paymentRouter.post('/create-order', extractFirebaseUserId, createOrderDetails);

// Process payment after completion
paymentRouter.post('/process-payment', extractFirebaseUserId, processPayment);

// Get user credit balance
paymentRouter.get('/credits', extractFirebaseUserId, getUserCredits);