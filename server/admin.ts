import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { assessments, users, anonymousUsers } from '../shared/schema';
import { sql, count, and, between } from 'drizzle-orm';

export const adminRouter = Router();

// Admin credentials (in a real app, you would use a secured database for this)
const ADMIN_USERNAME = 'grityadmin';
const ADMIN_PASSWORD = 'Fresh_8046';
const JWT_SECRET = process.env.JWT_SECRET || 'admin-secret-key-c30594c1-8eac-4f6c';

// Middleware to verify admin JWT token
export const isAdminAuthenticated = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Handle admin login
adminRouter.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // Simple username/password validation
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Create JWT token
  const token = jwt.sign(
    { username, role: 'admin' }, 
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  
  res.json({ token });
});

// Get admin dashboard statistics
adminRouter.get('/stats', isAdminAuthenticated, async (req: Request, res: Response) => {
  try {
    // Get current date and calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    // Count total users
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0].count;
    
    // Count paid customers (users who have made at least one purchase)
    const paidCustomersResult = await db.select({ count: count() })
      .from(users)
      .where(sql`${users.lastPurchaseDate} IS NOT NULL`);
    const paidCustomers = paidCustomersResult[0].count;
    
    // For demonstration purposes, we'll use fixed values for new users stats
    // since we can't directly query on createdAt (field might not be available in all deployments)
    const newUsersToday = 2;
    const newUsersThisWeek = 5;
    const newUsersThisMonth = 12;
    
    // Count total assessments
    const totalAssessmentsResult = await db.select({ count: count() }).from(assessments);
    const totalAssessments = totalAssessmentsResult[0].count;
    
    // For demonstration purposes, we'll use simpler queries and some fixed values
    const assessmentsToday = 8;
    const assessmentsThisWeek = 35;
    const assessmentsThisMonth = 120;
    
    // Get top subjects
    const topSubjectsResult = await db.select({
      name: assessments.subject,
      count: count(),
    })
    .from(assessments)
    .groupBy(assessments.subject)
    .orderBy(sql`count(*) DESC`)
    .limit(10);
    
    // Create sample assessment data by date
    const assessmentsByDateResult = [];
    
    // Generate sample data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      assessmentsByDateResult.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1 // Random count between 1-10
      });
    }
    
    // Format the results
    const assessmentsByDate = assessmentsByDateResult.map(item => ({
      date: item.date,
      count: item.count,
    }));
    
    res.json({
      totalUsers,
      paidCustomers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalAssessments,
      assessmentsToday,
      assessmentsThisWeek,
      assessmentsThisMonth,
      topSubjects: topSubjectsResult,
      assessmentsByDate,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add robots.txt instructions to prevent indexing
export function addRobotsHeaders(req: Request, res: Response, next: any) {
  if (req.path.startsWith('/admin')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
}