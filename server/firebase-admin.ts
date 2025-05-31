import admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

// Initialize Firebase Admin with credentials
// In production, you would use environment variables for these values
const firebaseConfig = {
  projectId: "aynstyn-30772",
  // This uses the default application credentials for Firebase Admin 
  // in environments like Google Cloud or when running on Firebase itself
};

// Initialize the app if it hasn't been initialized yet
try {
  if (admin.apps.length === 0) {
    admin.initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Middleware to verify Firebase tokens and set user data
export async function verifyFirebaseToken(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue as anonymous user
    return next();
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Set the verified user information on the request object
    req.user = {
      claims: {
        sub: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      }
    };
    
    console.log("Firebase token verified for user:", decodedToken.uid);
    
    next();
  } catch (error: any) {
    console.error("Firebase token verification failed:", error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        message: 'Authentication token has expired. Please sign in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        message: 'Invalid authentication token. Please sign in again.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.code === 'auth/revoked-id-token') {
      return res.status(401).json({ 
        message: 'Authentication token has been revoked. Please sign in again.',
        code: 'TOKEN_REVOKED'
      });
    }
    
    // For other errors, continue as anonymous user but log the error
    console.error("Unhandled Firebase auth error:", error.code, error.message);
    next();
  }
}

export default admin;