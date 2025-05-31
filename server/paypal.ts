/**
 * PayPal Integration Module
 * 
 * This module handles all PayPal-related functionality including:
 * - Client initialization with the PayPal API
 * - Order creation and management
 * - Payment processing
 * - Authentication with PayPal services
 */

// Import the required SDK components
import fetch from "node-fetch";
import { Request, Response } from "express";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_LIVE_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_LIVE_SECRET || '';
const PAYPAL_API_BASE = 'https://api.paypal.com'; // Use 'https://api.sandbox.paypal.com' for sandbox

/**
 * Get OAuth access token from PayPal
 */
export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || 'Failed to get PayPal access token');
  return data.access_token;
}

/**
 * Create a PayPal order
 */
export async function createPayPalOrder(amount: string, currency: string): Promise<{ id: string, approveUrl: string }> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: parseFloat(amount).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Your Brand',
        user_action: 'PAY_NOW',
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create PayPal order');
  const approveUrl = data.links?.find((l: any) => l.rel === 'approve')?.href;
  return { id: data.id, approveUrl };
}

/**
 * Capture a PayPal order
 */
export async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to capture PayPal order');
  return data;
}

/**
 * Express handler: Create Order
 */
export async function createPaypalOrder(req: Request, res: Response) {
  try {
    const { amount, currency } = req.body;
    if (!amount || !currency) return res.status(400).json({ success: false, error: 'Missing amount or currency' });
    const { id, approveUrl } = await createPayPalOrder(amount, currency);
    res.json({ success: true, orderId: id, approveUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Express handler: Capture Order
 */
export async function capturePaypalOrder(req: Request, res: Response) {
  try {
    const { orderID } = req.params;
    if (!orderID) return res.status(400).json({ success: false, error: 'Missing order ID' });
    const data = await capturePayPalOrder(orderID);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Express handler: Get Client Token (for JS SDK)
 */
export async function getClientToken(req: Request, res: Response) {
  try {
    const token = await getPayPalAccessToken();
    res.json({ success: true, clientToken: token });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}