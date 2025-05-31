import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

// Secret key for JWT signing (in production this would be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Generate a JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Check for token in cookies
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Set user ID on request object
    req.user = { id: decoded.id };
    
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Check assessment limits
export async function checkAssessmentLimit(req: Request, res: Response, next: NextFunction) {
  // If authenticated, no limit
  if (req.user?.id) {
    return next();
  }
  
  // For anonymous users, check session
  const sessionId = req.sessionID;
  
  try {
    const count = await storage.getAnonymousAssessmentCount(sessionId);
    
    if (count >= 3) {
      return res.status(402).json({ 
        message: "Assessment limit reached",
        assessmentCount: count,
        maxFreeAssessments: 3,
        unlimited: false,
        requiresRegistration: true
      });
    }
    
    next();
  } catch (error) {
    console.error("Error checking assessment limit:", error);
    next(); // Continue if we can't check the limit
  }
}

// Dummy user creation - for demonstration purposes
export async function createDummyUser(email: string, provider: string) {
  const userId = `${provider}-${Date.now()}`;
  
  const user = await storage.upsertUser({
    id: userId,
    email,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return user;
}

// Mock authentication providers - in a real app you would integrate with these services
export async function mockProviderAuth(provider: string, email?: string) {
  // In a real application, this would redirect to the provider's OAuth flow
  // For demo purposes, we'll just create a dummy user
  const userEmail = email || `user-${Date.now()}@example.com`;
  const user = await createDummyUser(userEmail, provider);
  
  return {
    user,
    token: generateToken(user.id)
  };
}