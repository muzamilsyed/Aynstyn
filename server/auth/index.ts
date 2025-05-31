/**
 * Authentication Module Entry Point
 * 
 * This module serves as the main entry point for all authentication-related functionality.
 * It consolidates the various authentication routes and middleware functions
 * for easy import and use throughout the application.
 * 
 * The authentication system supports:
 * - Email-based authentication
 * - JWT token generation and validation
 * - Protected route middleware
 */

import { Router } from 'express';
import authRoutes from './routes';

/**
 * Create a router instance for all authentication routes
 * This will be mounted at /api/auth in the main application
 */
export const authRouter = Router();

/**
 * Register all authentication routes
 * Routes include:
 * - /login - Email/password login
 * - /register - New user registration
 * - /logout - User logout
 * - /refresh - Token refresh
 * - /me - Get current user info
 */
authRouter.use('/', authRoutes);

/**
 * Export middleware for protecting routes
 * This middleware can be used on any route that requires authentication
 * It verifies the JWT token and attaches the user object to the request
 */
export { isAuthenticated } from './email';