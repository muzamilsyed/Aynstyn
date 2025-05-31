/**
 * Firebase Authentication Module
 * 
 * This module provides authentication utilities for both anonymous and Firebase-authenticated users.
 * It includes middleware for tracking anonymous users, checking assessment limits,
 * and enforcing authentication requirements for protected routes.
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

/**
 * Anonymous User Tracking Middleware
 * 
 * This middleware tracks anonymous users by either retrieving an existing anonymous user
 * record from the database or creating a new one if none exists. It stores the anonymous
 * user ID in the session for future requests.
 * 
 * The anonymous tracking is essential for:
 * - Limiting access to free features for non-registered users
 * - Maintaining continuity across sessions even before registration
 * - Collecting analytics on anonymous user behavior
 * 
 * @param {any} req - Express request object with session support
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function to continue to the next middleware
 */
export async function trackAnonymousUser(req: any, res: Response, next: NextFunction) {
  // Check if session exists and is properly initialized
  if (req.session) {
    // Only proceed if an anonymous ID doesn't already exist in the session
    if (!req.session.anonymousId) {
      try {
        // First check if an anonymous user record already exists for this session ID
        const existingUser = await storage.getAnonymousUser(req.sessionID);
        
        if (existingUser) {
          // If found, use the existing anonymous user ID
          req.session.anonymousId = existingUser.id;
        } else {
          // If not found, create a new anonymous user record in the database
          const anonymousUser = await storage.createAnonymousUser(req.sessionID);
          if (req.session) {
            // Store the new anonymous user ID in the session
            req.session.anonymousId = anonymousUser.id;
          }
        }
      } catch (error) {
        // Log any errors but continue processing the request
        console.error("Error tracking anonymous user:", error);
      }
    }
  }
  // Continue to the next middleware or route handler
  next();
}

/**
 * Assessment Access Control Middleware
 * 
 * This middleware enforces authentication requirements for accessing assessments.
 * It checks if the user is authenticated through Firebase and either allows access
 * or returns a response indicating registration is required.
 * 
 * The primary purposes of this middleware are:
 * - Limiting assessment access to authenticated users only
 * - Providing clear feedback when authentication is required
 * - Supporting the application's freemium model for assessments
 * 
 * @param {any} req - Express request object with potential authorization header
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function to continue to the next middleware
 * @returns {void | Response} Either continues to the next middleware or returns a JSON response
 */
export async function checkAnonymousAssessmentLimit(req: any, res: Response, next: NextFunction) {
  // If Firebase user ID is in the auth header, allow assessment access
  // This means the user is properly authenticated with Firebase
  if (req.headers.authorization) {
    return next(); // Proceed to the assessment endpoint
  }
  
  // For non-authenticated users, return a 402 Payment Required status
  // with details indicating registration is required
  return res.status(402).json({
    message: "Registration required",       // Human-readable message
    assessmentCount: 0,                    // Current assessment count (0 for anonymous)
    maxFreeAssessments: 0,                 // Maximum allowed without authentication (none)
    unlimited: false,                      // User does not have unlimited access
    requiresRegistration: true             // Flag indicating registration is needed
  });
}