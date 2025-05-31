import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Simple middleware to extract Firebase user ID from auth token
// This is a simplified version without full verification for development purposes
export function extractFirebaseUserId(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  console.log("Auth header present:", !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue as anonymous user
    console.log("No auth token found, proceeding as anonymous user");
    return next();
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  console.log("Token received, length:", idToken.length);
  
  try {
    // Just extract the user ID from the token without full verification
    // In production, you would use firebase-admin to verify the token properly
    const decodedToken = jwt.decode(idToken);
    console.log("Token decoded structure:", Object.keys(decodedToken || {}));
    
    if (decodedToken && typeof decodedToken === 'object') {
      // Firebase tokens can have different structures, so we try to find the user ID in various places
      // Firebase tokens typically have the user ID in one of these fields
      const userId = decodedToken.sub || decodedToken.uid || decodedToken.user_id || 
                    (decodedToken.claims ? decodedToken.claims.sub : null) ||
                    decodedToken.aud || // Sometimes used in Firebase JWT tokens
                    (typeof decodedToken.iss === 'string' ? decodedToken.iss.split('/').pop() : null);
      
      // Try alternate locations in the token
      if (!userId && decodedToken.user_id) {
        console.log("Found user_id in token:", decodedToken.user_id);
      }
      
      if (userId) {
        // Set the user ID on the request object
        req.user = {
          claims: {
            sub: userId,
            email: decodedToken.email || (decodedToken.claims ? decodedToken.claims.email : null)
          }
        };
        
        console.log("Firebase user ID extracted:", userId);
      } else {
        console.log("Could not find userId in token, structure:", JSON.stringify(decodedToken).substring(0, 200) + "...");
      }
    }
    
    next();
  } catch (error) {
    console.error("Error extracting Firebase user ID:", error);
    // Continue as anonymous user if token extraction fails
    next();
  }
}