import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { 
  comparePassword, 
  hashPassword, 
  generateToken, 
  sendMagicLink, 
  verifyToken,
  isAuthenticated
} from './email';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Schema for email-only login request
const emailLoginSchema = z.object({
  email: z.string().email(),
});

// Schema for password-based login request
const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Schema for registration request
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// Email login route (magic link)
router.post('/email-login', async (req: Request, res: Response) => {
  try {
    const { email } = emailLoginSchema.parse(req.body);
    
    // Check if user exists
    let user = await storage.getUserByEmail(email);
    
    // If user doesn't exist, create a new one
    if (!user) {
      // Generate a random ID
      const id = crypto.randomUUID();
      
      user = await storage.upsertUser({
        id,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Generate a token for the magic link
    const token = generateToken(user.id);
    
    // Send the magic link
    const emailSent = await sendMagicLink(email, token, req);
    
    if (emailSent) {
      return res.status(200).json({ 
        message: "Magic link sent to your email",
        // For development, you'd see the email preview link in the server logs
      });
    } else {
      return res.status(500).json({ message: "Failed to send magic link" });
    }
  } catch (error) {
    console.error('Email login error:', error);
    return res.status(400).json({ message: "Invalid email address" });
  }
});

// Password login route
router.post('/password-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = passwordLoginSchema.parse(req.body);
    
    // Find the user
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Set token in cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user data without sensitive information
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Password login error:', error);
    return res.status(400).json({ message: "Invalid login data" });
  }
});

// Register route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Generate a random ID
    const id = crypto.randomUUID();
    
    // Create the user
    const user = await storage.upsertUser({
      id,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    // Set token in cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(400).json({ message: "Invalid registration data" });
  }
});

// Verify email link route
router.get('/verify-email', (req: Request, res: Response) => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return res.redirect('/auth?error=invalid-token');
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.redirect('/auth?error=invalid-token');
  }
  
  // Set token in cookies
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  // Redirect to the app
  return res.redirect('/');
});

// Get current user route
router.get('/user', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return user data without password
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({ message: "Logged out successfully" });
});

export default router;