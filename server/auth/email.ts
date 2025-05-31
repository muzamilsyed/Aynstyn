import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from '../storage';
import { Request, Response } from 'express';

// This would be set in a .env file in production
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@aynstyn.com';

// Configure nodemailer - this should be replaced with real email credentials
// For development, we'll use a test account (ethereal)
let transporter: nodemailer.Transporter;

async function createTestTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  
  console.log(`Test email account created: ${testAccount.user}`);
  console.log(`Email preview URL: https://ethereal.email/login`);
  console.log(`Credentials: ${testAccount.user} / ${testAccount.pass}`);
  
  return transporter;
}

// Initialize the transporter
createTestTransporter();

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare a password with a hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate a JWT token for a user
export function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Send a magic link to the user's email
export async function sendMagicLink(email: string, token: string, req: Request): Promise<boolean> {
  // Base URL for constructing the magic link
  const baseUrl = `${req.protocol}://${req.hostname}`;
  const magicLink = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Sign in to Aynstyn',
      text: `Click this link to sign in to your Aynstyn account: ${magicLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Sign in to Aynstyn</h2>
          <p>Click the button below to sign in to your Aynstyn account:</p>
          <div style="margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #0f172a; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; font-weight: 500;">
              Sign in to Aynstyn
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });
    
    console.log(`Magic link email sent: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: any) {
  // Check for token in the Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = { id: decoded.id };
      return next();
    }
  }
  
  // Check for token in cookies
  const token = req.cookies?.token;
  
  if (token) {
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = { id: decoded.id };
      return next();
    }
  }
  
  return res.status(401).json({ message: "Unauthorized" });
}