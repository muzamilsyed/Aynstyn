/**
 * 🚀 AYNSTYN API ROUTES CONFIGURATION
 * 
 * This file contains all API route definitions for the Aynstyn application.
 * It handles:
 * - Knowledge assessment endpoints
 * - User authentication and management
 * - Payment processing (PayPal, Razorpay)
 * - AI-powered features (OpenAI integration)
 * - Admin panel routes
 * - Email contact form
 * 
 * ARCHITECTURE:
 * - Express.js REST API
 * - Firebase Authentication integration
 * - Database operations via Drizzle ORM
 * - OpenAI API for knowledge analysis
 * - Payment gateway integrations
 */

// Core Express and HTTP server imports
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

// Database and storage layer
import { storage } from "./storage";

// AI and OpenAI integration modules
import { 
  analyzeKnowledge, 
  transcribeAudio, 
  explainTopic, 
  generateSubjectTimeline, 
  generateAssistantSummary, 
  TimelineEvent, 
  openai 
} from "./openai";

// Schema validation and database models
import { assessInputSchema, assessments } from "@shared/schema";
import { z } from "zod";

// Middleware and authentication
import cookieParser from "cookie-parser";
import { trackAnonymousUser, checkAnonymousAssessmentLimit } from "./firebase-auth";
import { extractFirebaseUserId } from "./simple-firebase-auth";

// Database connection and ORM
import { db } from "./db";
import { sql, desc } from "drizzle-orm";

// Admin panel and specialized routes
import { adminRouter, addRobotsHeaders } from "./admin";
import { paymentRouter } from "./payments/routes-simplified";

// Payment processing integrations
import { createPaypalOrder, capturePaypalOrder, getClientToken } from "./paypal";
import Razorpay from "razorpay";

// Utility libraries
import crypto from "crypto";
import jwt from 'jsonwebtoken';

/**
 * 🔧 UTILITY FUNCTIONS
 */

/**
 * Converts Firebase string ID to a numeric ID for database compatibility
 * 
 * Firebase uses string-based UIDs, but our database schema expects numeric IDs.
 * This function creates a deterministic hash of the Firebase ID that fits
 * within a 32-bit signed integer range.
 * 
 * @param firebaseId - The Firebase UID string
 * @returns A positive 32-bit integer derived from the Firebase ID
 */
function getNumericIdFromFirebaseId(firebaseId: string): number {
  // Create a hash using a simple string hashing algorithm
  let hash = 0;
  for (let i = 0; i < firebaseId.length; i++) {
    const char = firebaseId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure it's positive and within safe integer range
  return Math.abs(hash) % 2147483647;
}

/**
 * 📝 TYPE DEFINITIONS
 */

/**
 * Extended Request interface with session and user properties
 * 
 * This extends the standard Express Request to include:
 * - Session data for anonymous user tracking
 * - User authentication claims from Firebase
 */
interface ExtendedRequest extends Omit<Request, 'session'> {
  session: {
    anonymousId?: number;
    lastDetectedLanguage?: string;
    [key: string]: any;
  };
  user?: {
    claims?: {
      sub: string;
      email?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

/**
 * Decoded JWT token structure from Firebase
 */
interface DecodedToken {
  email?: string;
  sub?: string;
  user_id?: string;
  [key: string]: any;
}

/**
 * 🚀 MAIN ROUTE REGISTRATION FUNCTION
 * 
 * This function registers all API routes and middleware for the Aynstyn application.
 * It sets up the complete routing infrastructure including:
 * - Authentication middleware
 * - AI-powered assessment endpoints
 * - Payment processing routes
 * - User management APIs
 * - Admin panel routes
 * - Email contact form
 * 
 * @param app - Express application instance
 * @returns HTTP server instance
 */
export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * 🍪 MIDDLEWARE SETUP
   */
  
  // Enable cookie parsing for session management
  app.use(cookieParser());
  
  /**
   * 🤖 AI-POWERED FEEDBACK ENDPOINTS
   * 
   * These endpoints handle AI-generated feedback and summaries for assessments.
   * They use OpenAI's API to provide enhanced learning insights.
   */
  
  // Aynstyn feedback endpoint with unique path to avoid Vite conflicts
  app.post('/aynstyn-api/feedback', async (req: ExtendedRequest, res) => {
    try {
      console.log("🤖 aynstyn feedback endpoint called successfully!");
      console.log("Request body:", req.body);
      
      const { assessmentId } = req.body;
      
      if (!assessmentId) {
        console.log("❌ No assessment ID provided");
        return res.status(400).json({ message: "Assessment ID is required" });
      }
      
      console.log("✅ Assessment ID received:", assessmentId);

      // Get the assessment data
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Parse the stored JSON data
      const coveredTopics = typeof assessment.coveredTopics === 'string' 
        ? JSON.parse(assessment.coveredTopics) 
        : assessment.coveredTopics;
      const missingTopics = typeof assessment.missingTopics === 'string'
        ? JSON.parse(assessment.missingTopics)
        : assessment.missingTopics;

      // Create the assessment result object for aynstyn
      const assessmentResult = {
        score: assessment.score,
        coveredTopics,
        missingTopics,
        topicCoverage: [],
        feedback: assessment.feedback
      };

      // Get the language from session, default to English
      const language = req.session?.lastDetectedLanguage || 'en';

      console.log("🔄 Starting aynstyn generation for assessment:", assessmentId);
      
      // Generate the enhanced summary using aynstyn
      const assistantSummary = await generateAssistantSummary(
        assessment.subject,
        assessment.input,
        assessmentResult,
        language
      );

      console.log("✅ aynstyn summary generated successfully");
      
      res.json({
        success: true,
        assistantSummary
      });

    } catch (error: any) {
      console.error("❌ Error generating aynstyn summary:", error);
      res.status(500).json({ 
        success: false,
        message: `Failed to generate aynstyn summary: ${error.message}` 
      });
    }
  });
  
  // Enhanced AI Assistant feedback endpoint - Register FIRST to avoid routing conflicts
  app.post('/api/assistant-summary', async (req: ExtendedRequest, res) => {
    try {
      console.log("🤖 Assistant summary endpoint called");
      console.log("Request body:", req.body);
      
      const { assessmentId } = req.body;
      
      if (!assessmentId) {
        console.log("❌ No assessment ID provided");
        return res.status(400).json({ message: "Assessment ID is required" });
      }
      
      console.log("✅ Assessment ID received:", assessmentId);

      // Get the assessment data
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Parse the stored JSON data
      const coveredTopics = typeof assessment.coveredTopics === 'string' 
        ? JSON.parse(assessment.coveredTopics) 
        : assessment.coveredTopics;
      const missingTopics = typeof assessment.missingTopics === 'string'
        ? JSON.parse(assessment.missingTopics)
        : assessment.missingTopics;

      // Create the assessment result object for the assistant
      const assessmentResult = {
        score: assessment.score,
        coveredTopics,
        missingTopics,
        topicCoverage: [], // Not needed for assistant summary
        feedback: assessment.feedback
      };

      // Get the language from session, default to English
      const language = req.session?.lastDetectedLanguage || 'en';

      console.log("Starting assistant summary generation for assessment:", assessmentId);
      
      // Generate the enhanced summary using OpenAI Assistant
      const assistantSummary = await generateAssistantSummary(
        assessment.subject,
        assessment.input,
        assessmentResult,
        language
      );

      console.log("Assistant summary generated successfully");
      
      res.json({
        success: true,
        assistantSummary
      });

    } catch (error: any) {
      console.error("Error generating assistant summary:", error);
      res.status(500).json({ 
        success: false,
        message: `Failed to generate assistant summary: ${error.message}` 
      });
    }
  });
  
  // Handle domain-level redirects if needed
  app.use((req, res, next) => {
    // Handle requests to the domain root
    if (req.hostname === 'aynstyn.com' && req.path === '/') {
      return res.redirect('https://www.aynstyn.com/');
    }
    next();
  });
  
  // PayPal API routes for frontend compatibility
  app.post("/paypal/order", createPaypalOrder);
  app.post("/paypal/order/:orderId/capture", capturePaypalOrder);
  app.get("/paypal/setup", getClientToken);

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });
  
  // Add Firebase user ID extraction middleware BEFORE all API routes
  app.use('/api', extractFirebaseUserId);
  
  // Use the trackAnonymousUser middleware to track anonymous users
  app.use('/api', trackAnonymousUser);
  
  // User info route
  app.get('/api/user', async (req: any, res) => {
    try {
      // For Firebase auth, we'll check the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Extract Firebase ID token
      const idToken = authHeader.split('Bearer ')[1];
      
      // In a real implementation, we would verify the Firebase token
      // We're simplifying for now since Firebase auth will be client-side
      // The client will send the Firebase user ID in the header
      
      return res.json({ 
        message: "User authenticated", 
        // We'll integrate with Firebase properly in the client side
        authenticated: true 
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // API endpoint to ensure user account is created with credits
  app.post('/api/user/initialize', extractFirebaseUserId, async (req: ExtendedRequest, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const firebaseId = req.user.claims.sub;
      const numericId = getNumericIdFromFirebaseId(firebaseId);
      
      // First check if user exists by email (most reliable)
      const email = req.user.claims.email || 'firebase-user';
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        console.log(`Found existing user by email ${email}: ID ${user.id} with ${user.credits} credits`);
      } else {
        // Check if user exists by calculated ID
        user = await storage.getUser(numericId);
        if (!user) {
          console.log("Creating new user account with 5 default credits");
          user = await storage.upsertUser({
            id: numericId,
            username: email,
            password: 'firebase-auth-user'
          });
          console.log("New user created with ID:", user.id, "and credits:", user.credits);
        }
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          credits: user.credits,
          email: req.user.claims.email
        }
      });
    } catch (error: any) {
      console.error("Error initializing user:", error);
      res.status(500).json({ message: "Failed to initialize user account" });
    }
  });

  // API route to check assessment limit status
  app.get('/api/assessment-limit', async (req: ExtendedRequest, res) => {
    try {
      // For authenticated users with Firebase Auth, there is no limit
      if (req.user) {
        return res.json({
          assessmentCount: 0,
          maxFreeAssessments: 0,
          unlimited: true,
          requiresRegistration: false
        });
      }
      
      // For anonymous users, always require registration
      return res.json({
        assessmentCount: 0,
        maxFreeAssessments: 0,
        unlimited: false,
        requiresRegistration: true
      });
    } catch (error) {
      console.error("Error checking assessment limit:", error);
      res.status(500).json({ message: "Failed to check assessment limit" });
    }
  });
  
  // API routes for knowledge assessment

  // Analyze knowledge based on text input
  app.post("/api/assess", extractFirebaseUserId, checkAnonymousAssessmentLimit, async (req: ExtendedRequest, res) => {
    console.log("🚀 ASSESSMENT ENDPOINT CALLED");
    console.log("User object:", req.user);
    console.log("Has user claims?", !!req.user?.claims);
    console.log("Has email?", !!req.user?.claims?.email);
    console.log("Authorization header:", req.headers.authorization?.substring(0, 20) + "...");
    
    // Check if authenticated user has enough credits - first try Firebase token directly
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = jwt.decode(idToken) as DecodedToken;
        
        if (decodedToken && decodedToken.email) {
          console.log("DIRECT TOKEN DECODE - Email found:", decodedToken.email);
          
          // Use the email directly from the token
          const email = decodedToken.email;
          const userByEmail = await storage.getUserByEmail(email);
          
          if (userByEmail) {
            console.log("DIRECT CREDIT CHECK - Found user:", userByEmail.id, "Credits:", userByEmail.credits);
            
            if (userByEmail.credits <= 0) {
              return res.status(402).json({
                error: "No credits remaining",
                message: "You've used all your credits. Please purchase more to continue.",
                requiresPurchase: true
              });
            }
            
            // Set the user object properly for the rest of the function
            req.user = {
              claims: {
                sub: decodedToken.sub || decodedToken.user_id,
                email: email
              }
            };
          }
        }
      } catch (error) {
        console.error("Direct token decode error:", error);
      }
    }
    
    // Check if authenticated user has enough credits
    if (req.user?.claims?.sub && req.user?.claims?.email) {
      console.log("=== ASSESSMENT CREDIT CHECK DEBUG START ===");
      // First try to get user by email (unified approach)
      const email = req.user.claims.email;
      console.log("Assessment credit check: email =", email);
      
      const userByEmail = await storage.getUserByEmail(email);
      let numericId;
      
      if (userByEmail) {
        numericId = userByEmail.id;
        console.log("Assessment credit check: Found user by email, ID =", numericId);
      } else {
        // Fallback to Firebase ID calculation
        const firebaseId = req.user.claims.sub;
        numericId = getNumericIdFromFirebaseId(firebaseId);
        console.log("Assessment credit check: Fallback to Firebase ID, ID =", numericId);
      }
      
      // Check user's credit balance
      const userCredits = await storage.getUserCredits(numericId);
      console.log("Assessment credit check: Credits found =", userCredits);
      console.log("=== ASSESSMENT CREDIT CHECK DEBUG END ===");
      
      // If user has no credits, return a payment required response
      if (userCredits <= 0) {
        return res.status(402).json({
          error: "No credits remaining",
          message: "You've used all your credits. Please purchase more to continue.",
          requiresPurchase: true
        });
      }
    }
    console.log("📋 API Assess called - starting assessment process");
    try {
      // Validate request body
      const validatedData = assessInputSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        console.log("❌ Input validation failed:", validatedData.error.format());
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validatedData.error.format() 
        });
      }
      
      const { subject, input, inputType } = validatedData.data;
      console.log(`✅ Validated input - Subject: ${subject}, Input Type: ${inputType}, Input Length: ${input.length}`);
      
      // Process text directly or transcribe audio if needed
      let textToAnalyze = input;
      let transcribedText = null;
      
      if (inputType === "audio") {
        try {
          console.log("🎤 Processing audio input for transcription");
          textToAnalyze = await transcribeAudio(input);
          transcribedText = textToAnalyze; // Store the transcribed text separately
          console.log("✅ Audio transcription successful, text length:", textToAnalyze.length);
        } catch (error: any) {
          console.log("❌ Audio transcription failed:", error.message);
          return res.status(500).json({ message: `Audio transcription failed: ${error.message}` });
        }
      }
      
      // Analyze the text with OpenAI
      let analysis;
      let detectedLanguage = 'en'; // Default to English
      
      try {
        console.log("🔍 Starting OpenAI knowledge analysis");
        analysis = await analyzeKnowledge(subject, textToAnalyze);
        console.log("✅ OpenAI analysis completed successfully with score:", analysis?.score);
        
        // Detect language from the OpenAI API call
        // We'll get the language ID from a separate detection call to make sure
        const languageDetectionResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a language detection expert. Detect the language of the following text and respond with only the ISO language code (e.g., 'en' for English, 'hi' for Hindi, 'es' for Spanish, etc.).`
            },
            {
              role: "user",
              content: textToAnalyze
            }
          ],
          temperature: 0.1,
        });
        
        detectedLanguage = languageDetectionResponse.choices[0]?.message?.content?.trim() || 'en';
        console.log(`Detected language for user input: ${detectedLanguage}`);
        
        // Store the detected language in the session for use in other components
        if (req.session) {
          req.session.lastDetectedLanguage = detectedLanguage;
          console.log(`Stored detected language in session: ${detectedLanguage}`);
        }
        
      } catch (error: any) {
        console.error("❌ OpenAI analysis failed:", error.message);
        console.error("Error details:", error);
        if (error.response) {
          console.error("API Response error:", error.response.data);
          console.error("API Response status:", error.response.status);
        }
        return res.status(500).json({ 
          message: `Analysis failed: ${error.message}`, 
          details: error.stack 
        });
      }
      
      // For each missing topic, generate an overview and key points in the detected language
      const enhancedMissingTopics = await Promise.all(
        analysis.missingTopics.map(async (topic: { name: string; description: string; [key: string]: any }) => {
          try {
            const { overview, keyPoints } = await explainTopic(
              subject, 
              topic.name, 
              topic.description,
              detectedLanguage // Pass the detected language to maintain linguistic consistency
            );
            return {
              ...topic,
              overview,
              keyPoints
            };
          } catch (error) {
            console.error(`Failed to generate explanation for topic ${topic.name}:`, error);
            return {
              ...topic,
              overview: "Overview unavailable",
              keyPoints: ["Explanation could not be generated"]
            };
          }
        })
      );
      
      // Store the assessment result
      let assessment;
      
      // Determine if we're storing for an authenticated user or anonymous user
      if (req.user?.claims?.sub && req.user?.claims?.email) {
        // Authenticated user - use unified approach
        try {
          console.log("Authenticated user detected, using unified account approach");
          
          // First try to get user by email (unified approach)
          const email = req.user.claims.email;
          const userByEmail = await storage.getUserByEmail(email);
          let numericId;
          
          if (userByEmail) {
            numericId = userByEmail.id;
            console.log("Using existing unified account ID:", numericId);
          } else {
            // Fallback to Firebase ID calculation
            const firebaseId = req.user.claims.sub;
            numericId = getNumericIdFromFirebaseId(firebaseId);
            console.log("Creating new account with Firebase ID:", numericId);
          }
          
          // Check if user exists, create if not
          let user = await storage.getUser(numericId);
          if (!user) {
            console.log("User not found in database, creating user record with 5 default credits");
            // Create minimal user record with numeric ID and 5 default credits
            user = await storage.upsertUser({
              id: numericId,
              username: email,
              password: 'firebase-auth-user' // Providing a default password since the field is NOT NULL
            });
            console.log("New user created with ID:", user.id, "and credits:", user.credits);
          }
          
          // Create assessment with the numeric ID (which matches the users table primary key)
          // Convert any complex objects to JSON strings first
          try {
            console.log("Creating assessment with user ID:", numericId);
            assessment = await storage.createAssessment({
              userId: numericId,
              subject,
              input: textToAnalyze,
              inputType,
              score: analysis.score,
              coveredTopics: analysis.coveredTopics,
              missingTopics: enhancedMissingTopics,
              feedback: analysis.feedback
            });
            console.log("Assessment created successfully with ID:", assessment.id);
            
            // Deduct one credit from the user's account for using the assessment
            await storage.deductUserCredit(numericId);
            console.log("Deducted 1 credit from user ID:", numericId);
          } catch (error) {
            console.error("Assessment creation error details:", error);
            throw error;
          }
        } catch (error) {
          console.error("Error creating user or assessment:", error);
          throw error;
        }
      } else if (req.session.anonymousId) {
        // Anonymous user
        assessment = await storage.createAssessment({
          anonymousId: req.session.anonymousId,
          subject,
          input: textToAnalyze,
          inputType,
          score: analysis.score,
          coveredTopics: analysis.coveredTopics,
          missingTopics: enhancedMissingTopics,
          feedback: analysis.feedback
        });
        
        // Increment the assessment count for this anonymous user
        if (req.session.anonymousId) {
          await storage.incrementAnonymousAssessmentCount(req.session.anonymousId);
        }
      } else {
        // This shouldn't happen due to the trackAnonymousUser middleware
        throw new Error("Failed to identify user for assessment storage");
      }
      
      console.log("📝 Assessment storage completed, now starting aynstyn generation...");
      
      // Generate aynstyn's enhanced feedback directly in the assessment response
      console.log("🔄 Generating aynstyn enhanced feedback for assessment:", assessment.id);
      let aynstynSummary = null;
      
      try {
        aynstynSummary = await generateAssistantSummary(
          subject,
          textToAnalyze,
          analysis,
          detectedLanguage
        );
        console.log("✅ aynstyn enhanced feedback generated successfully");
      } catch (error: any) {
        console.error("❌ Error generating aynstyn feedback:", error);
        // Continue without aynstyn feedback if it fails
      }

      // Create complete response data that includes all components
      const completeResponseData = {
        assessmentId: assessment.id,
        subject,
        score: analysis.score,
        coveredTopics: analysis.coveredTopics,
        missingTopics: enhancedMissingTopics,
        topicCoverage: analysis.topicCoverage,
        feedback: analysis.feedback,
        aynstynSummary: aynstynSummary,
        createdAt: assessment.createdAt?.toISOString(),
        userInput: textToAnalyze,
        transcribedText: inputType === "audio" ? transcribedText : null,
        inputType: inputType,
        detectedLanguage: detectedLanguage
      };

      // Store the complete response data as structured feedback for future retrieval
      try {
        console.log("Updating assessment with complete structured data...");
        await storage.updateAssessmentFeedback(assessment.id, JSON.stringify(completeResponseData));
        console.log("Assessment updated with complete data successfully");
      } catch (updateError) {
        console.error("Failed to update assessment with complete data:", updateError);
        // Continue anyway - don't fail the request
      }

      // Return the complete analysis results
      res.status(200).json(completeResponseData);
      
    } catch (error: any) {
      console.error("Assessment error:", error);
      return res.status(500).json({ message: `Assessment failed: ${error.message}` });
    }
  });

  // Simple test endpoint to verify routing


  // Get a specific assessment by ID
  app.get('/api/assessment/:id', async (req: any, res) => {
    console.log("🚀 BACKEND: Assessment request received for ID:", req.params.id);
    console.log("🚀 BACKEND: Request method:", req.method);
    console.log("🚀 BACKEND: Request headers auth present:", !!req.headers.authorization);
    
    try {
      console.log("=== INDIVIDUAL ASSESSMENT REQUEST START ===");
      const assessmentId = parseInt(req.params.id);
      console.log("Assessment ID parsed:", assessmentId);
      
      if (isNaN(assessmentId)) {
        console.log("Invalid assessment ID, returning 400");
        return res.status(400).json({ message: "Invalid assessment ID" });
      }
      
      console.log("Fetching assessment from storage...");
      const assessment = await storage.getAssessment(assessmentId);
      console.log("Assessment retrieved:", !!assessment);
      
      if (!assessment) {
        console.log("Assessment not found, returning 404");
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Check authentication and authorization BEFORE processing
      let hasAccess = false;
      
      // Check if user is authenticated with Firebase
      if (req.user?.claims?.sub && req.user?.claims?.email) {
        console.log("Checking Firebase user access...");
        const email = req.user.claims.email;
        const userByEmail = await storage.getUserByEmail(email);
        
        console.log("Assessment user ID:", assessment.userId, "User found by email:", userByEmail?.id);
        
        if (userByEmail && assessment.userId === userByEmail.id) {
          hasAccess = true;
          console.log("Access granted - user owns this assessment");
        }
      } 
      // Check anonymous user access
      else if (req.session?.anonymousId && assessment.anonymousId === req.session.anonymousId) {
        hasAccess = true;
        console.log("Access granted - anonymous user owns this assessment");
      }
      
      if (!hasAccess) {
        console.log("Access denied - user doesn't own this assessment");
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Parse the complete structured data from the feedback field
      try {
        const completeData = JSON.parse(assessment.feedback);
        console.log("Successfully parsed complete structured data from feedback");
        console.log("Complete data structure:", Object.keys(completeData));
        console.log("Has aynstynSummary:", !!completeData.aynstynSummary);
        if (completeData.aynstynSummary) {
          console.log("Enhanced feedback found:", completeData.aynstynSummary.enhancedFeedback?.substring(0, 100) + "...");
        } else {
          console.log("NO aynstynSummary found in completeData!");
          console.log("Available keys in completeData:", Object.keys(completeData));
        }
        
        // Return the complete structured data exactly as stored
        if (completeData.assessmentId || completeData.subject) {
          console.log("Returning complete structured assessment data with enhanced format");
          
          // Ensure the data has the right structure for the frontend
          const formattedData = {
            ...completeData,
            // Ensure we have the enhanced feedback properly structured
            aynstynSummary: completeData.aynstynSummary || null,
            // Keep original properties for compatibility
            userInput: completeData.userInput || completeData.input,
            input: completeData.userInput || completeData.input
          };
          
          return res.json(formattedData);
        }
      } catch (e) {
        console.log("Failed to parse feedback as JSON, falling back to field parsing");
      }
      
      // Fall back to parsing individual fields
      console.log("Raw feedback content:", assessment.feedback);
      console.log("Covered topics from DB:", assessment.coveredTopics);
      console.log("Missing topics from DB:", assessment.missingTopics);
      
      // Parse the JSON fields for topics
      let coveredTopics = [];
      let missingTopics = [];
      
      try {
        coveredTopics = Array.isArray(assessment.coveredTopics) 
          ? assessment.coveredTopics 
          : (typeof assessment.coveredTopics === 'string' 
              ? JSON.parse(assessment.coveredTopics) 
              : []);
        console.log("Parsed covered topics:", coveredTopics.length, "topics");
      } catch (e) {
        console.error("Error parsing covered topics:", e);
        coveredTopics = [];
      }
      
      try {
        missingTopics = Array.isArray(assessment.missingTopics) 
          ? assessment.missingTopics 
          : (typeof assessment.missingTopics === 'string' 
              ? JSON.parse(assessment.missingTopics) 
              : []);
        console.log("Parsed missing topics:", missingTopics.length, "topics");
      } catch (e) {
        console.error("Error parsing missing topics:", e);
        missingTopics = [];
      }
      
      // Generate topic coverage based on covered topics
      const topicCoverage = coveredTopics.map((topic: any, index: number) => ({
        name: topic.name || `Topic ${index + 1}`,
        percentage: Math.min(95, 75 + (index * 3))
      }));

      // Extract aynstynSummary from the feedback field if it exists
      let aynstynSummary = null;
      try {
        const feedbackData = JSON.parse(assessment.feedback);
        aynstynSummary = feedbackData.aynstynSummary || null;
        console.log("Extracted aynstynSummary:", !!aynstynSummary);
        if (aynstynSummary && aynstynSummary.enhancedFeedback) {
          console.log("Enhanced feedback found:", aynstynSummary.enhancedFeedback.substring(0, 100) + "...");
        }
      } catch (e) {
        console.log("Could not extract aynstynSummary from feedback");
      }

      console.log("Returning reconstructed assessment data...");
      return res.json({
        id: assessment.id,
        assessmentId: assessment.id,
        subject: assessment.subject,
        score: assessment.score,
        input: assessment.input,
        feedback: assessment.feedback,
        coveredTopics: coveredTopics,
        missingTopics: missingTopics,
        topicCoverage: topicCoverage,
        aynstynSummary: aynstynSummary,
        createdAt: assessment.createdAt,
        inputType: assessment.inputType || 'text'
      });
      
    } catch (error: any) {
      console.error("Error fetching assessment:", error);
      return res.status(500).json({ message: `Failed to fetch assessment: ${error.message}` });
    }
  });

  // Razorpay order creation endpoint
  app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
    try {
      const { amount, currency, packageId } = req.body;
      
      console.log('Razorpay order request:', { amount, currency, packageId });
      console.log('Razorpay credentials check:', {
        keyIdExists: !!process.env.RAZORPAY_KEY_ID,
        keySecretExists: !!process.env.RAZORPAY_KEY_SECRET
      });
      
      if (!amount || !currency || !packageId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({
          success: false,
          error: 'Razorpay credentials not configured'
        });
      }

      // Create order with Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const options = {
        amount: Math.round(amount * 100), // Amount in paise, ensure it's an integer
        currency: currency,
        receipt: `order_${Date.now()}`,
        payment_capture: 1
      };

      console.log('Creating Razorpay order with options:', options);
      const order = await razorpay.orders.create(options);
      console.log('Razorpay order created:', order);
      
      res.json({
        success: true,
        ...order,
        keyId: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create Razorpay order',
        details: error.message
      });
    }
  });

  // Razorpay payment verification endpoint
  app.post('/api/payments/razorpay/verify', async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packageId } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing payment verification data'
        });
      }

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        // Payment verified successfully
        console.log('Razorpay payment verified successfully:', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          packageId: packageId
        });

        res.json({
          success: true,
          message: 'Payment verified successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Payment verification failed'
        });
      }
    } catch (error: unknown) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Contact form submission endpoint
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Log the contact form submission for support@aynstyn.com
      console.log('Contact form submission for support@aynstyn.com:', {
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString()
      });

      // In a real implementation, you would send an email here
      // using a service like nodemailer to support@aynstyn.com
      
      res.json({
        success: true,
        message: 'Contact form submitted successfully'
      });
    } catch (error) {
      console.error('Contact form submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit contact form'
      });
    }
  });

  // Get a specific assessment by ID (restored original working version)
  app.get('/api/assessment/:id', async (req, res) => {
    console.log("Assessment endpoint hit for ID:", req.params.id);
    
    try {
      const assessmentId = parseInt(req.params.id);
      
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }

      const assessment = await storage.getAssessment(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Parse feedback if it's a string
      let parsedFeedback;
      try {
        parsedFeedback = typeof assessment.feedback === 'string' 
          ? JSON.parse(assessment.feedback) 
          : assessment.feedback;
      } catch (e) {
        parsedFeedback = {
          summary: assessment.feedback || "No feedback available",
          coveredTopics: [],
          missingTopics: []
        };
      }

      return res.json({
        id: assessment.id,
        assessmentId: assessment.id,
        subject: assessment.subject,
        score: assessment.score,
        input: assessment.input,
        feedback: parsedFeedback.summary || assessment.feedback,
        coveredTopics: parsedFeedback.coveredTopics || assessment.coveredTopics || [],
        missingTopics: parsedFeedback.missingTopics || assessment.missingTopics || [],
        createdAt: assessment.createdAt,
        inputType: assessment.inputType || 'text'
      });
      
    } catch (error) {
      console.error("Assessment endpoint error:", error);
      return res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  // Get user assessments history
  app.get('/api/user/assessments', async (req: ExtendedRequest, res) => {
    try {
      // Check if user is authenticated with Firebase auth
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        
        // In a real implementation, verify the Firebase token
        // For now, we'll trust the token and extract the user ID
        // This will be replaced with proper Firebase authentication verification
        
        // If we have a user in the request object from middleware
        if (req.user?.claims?.sub && req.user?.claims?.email) {
          console.log("Fetching user-specific assessments for display in user profile");
          
          // First try to get assessments by email (unified approach)
          const email = req.user.claims.email;
          const userByEmail = await storage.getUserByEmail(email);
          
          if (userByEmail) {
            // Get assessments for the main account found by email
            const userAssessments = await storage.getUserAssessments(userByEmail.id);
            console.log(`Found ${userAssessments.length} assessments for user ${email}`);
            return res.json({ assessments: userAssessments });
          } else {
            // Fallback to Firebase ID method if no user found by email
            const numericId = getNumericIdFromFirebaseId(req.user.claims.sub);
            const userAssessments = await storage.getUserAssessments(numericId);
            console.log(`Fallback: Found ${userAssessments.length} assessments for Firebase ID`);
            return res.json({ assessments: userAssessments });
          }
        }
      }
      
      // For anonymous users, check if they have an anonymous ID
      if (req.session && req.session.anonymousId) {
        const anonymousAssessments = await storage.getAnonymousUserAssessments(req.session.anonymousId);
        return res.json(anonymousAssessments);
      }
      
      // If no authentication, return empty array
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      console.error("Error fetching user assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });
  
  // Get available subjects
  app.get("/api/subjects", (req, res) => {
    const subjects = [
      "Cryptocurrency",
      "Blockchain",
      "Economy",
      "Biology",
      "Physics",
      "History",
      "Literature",
      "Computer Science",
      "Mathematics",
      "Psychology",
      "Climate Change",
      "Artificial Intelligence",
      "Sustainable Energy",
      "Global Health"
    ];
    
    return res.status(200).json({ subjects });
  });
  
  // Generate a timeline for a specific subject
  app.get("/api/timeline/:subject", async (req, res) => {
    try {
      const subject = req.params.subject;
      
      if (!subject) {
        return res.status(400).json({ message: "Subject parameter is required" });
      }
      
      console.log(`Timeline requested for subject: ${subject}`);
      
      // Enhanced language detection system
      // 1. Check query parameter (from URL)
      // 2. Check session state (from previous assessment)
      // 3. Check request headers (from browser)
      // 4. Default to English
      
      let detectedLanguage = 'en';
      
      // 1. First priority: Query parameter explicitly passed
      if (req.query.language) {
        detectedLanguage = req.query.language as string;
        console.log(`Using language from query parameter: ${detectedLanguage}`);
      } 
      // 2. Second priority: Session storage from previous assessment
      else if (req.session?.lastDetectedLanguage) {
        detectedLanguage = req.session.lastDetectedLanguage;
        console.log(`Using language from session storage: ${detectedLanguage}`);
      }
      // 3. Third priority: Browser accept-language header
      else if (req.headers["accept-language"]) {
        const acceptLanguage = req.headers["accept-language"].split(',')[0].trim().substring(0, 2);
        // Only use languages we support
        if (["en", "hi", "ar"].includes(acceptLanguage)) {
          detectedLanguage = acceptLanguage;
          console.log(`Using language from browser headers: ${detectedLanguage}`);
        }
      }
      
      // Always store the current language in session for future requests
      if (req.session) {
        req.session.lastDetectedLanguage = detectedLanguage;
      }
      
      console.log(`Generating timeline for subject: ${subject} in language: ${detectedLanguage}`);
      
      // Generate a dynamic timeline for the requested subject in the detected language
      const timeline = await generateSubjectTimeline(subject, detectedLanguage);
      
      return res.status(200).json({ timeline });
    } catch (error: any) {
      console.error("Error generating timeline:", error);
      return res.status(500).json({ message: `Error generating timeline: ${error.message}` });
    }
  });
  
  // Save assessment to PDF or JSON file
  app.post("/api/save-assessment", async (req, res) => {
    try {
      // Define and validate the request schema
      const saveAssessmentSchema = z.object({
        assessmentId: z.number().positive(),
        subject: z.string().min(1),
        score: z.number(),
        coveredTopics: z.array(z.object({
          name: z.string(),
          description: z.string()
        })),
        missingTopics: z.array(z.object({
          name: z.string(),
          description: z.string(),
          overview: z.string().optional(),
          keyPoints: z.array(z.string()).optional()
        })),
        topicCoverage: z.array(z.object({
          name: z.string(),
          percentage: z.number()
        })),
        feedback: z.string(),
        format: z.enum(["json", "pdf"])
      });
      
      // Validate request body
      const validatedData = saveAssessmentSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid assessment data", 
          errors: validatedData.error.format() 
        });
      }
      
      const { format, ...assessmentData } = validatedData.data;
      
      // Generate a filename based on subject and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${assessmentData.subject.replace(/\s+/g, '_')}_Assessment_${timestamp}`;
      
      // For now, just return a success response with the data that would be saved
      return res.status(200).json({
        message: "Assessment saved successfully",
        filename: `${filename}.${format}`,
        format,
        // In a real implementation, this would be a download URL
        downloadUrl: `/downloads/${filename}.${format}`
      });
      
    } catch (error: any) {
      console.error("Save assessment error:", error);
      return res.status(500).json({ message: `Failed to save assessment: ${error.message}` });
    }
  });
  
  // Generate detailed explanations for topics
  app.post("/api/explain-topic", async (req, res) => {
    try {
      // Define and validate the request schema
      const explainTopicSchema = z.object({
        subject: z.string().min(1, "Subject is required"),
        topicName: z.string().min(1, "Topic name is required"),
        topicDescription: z.string().min(1, "Topic description is required")
      });
      
      // Validate request body
      const validatedData = explainTopicSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: validatedData.error.format() 
        });
      }
      
      const { subject, topicName, topicDescription } = validatedData.data;
      
      // Generate overview and key points using OpenAI
      const { overview, keyPoints } = await explainTopic(subject, topicName, topicDescription);
      
      // Return the overview and key points to the client
      return res.status(200).json({
        subject,
        topicName,
        overview,
        keyPoints
      });
      
    } catch (error: any) {
      console.error("Explanation generation error:", error);
      return res.status(500).json({ message: `Failed to generate explanation: ${error.message}` });
    }
  });
  
  // New route to get stored HTML assessment
  app.get("/api/assessment-html/:id", async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log("📄 HTML Request for assessment:", assessmentId);
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      console.log("📄 Found assessment, checking for rendered HTML...");
      console.log("📄 Has rendered HTML:", !!assessment.renderedHtml);
      
      if (assessment.renderedHtml) {
        return res.json({ html: assessment.renderedHtml });
      } else {
        return res.status(404).json({ message: "No rendered HTML found for this assessment" });
      }
      
    } catch (error: any) {
      console.error("Error fetching assessment HTML:", error);
      return res.status(500).json({ message: `Failed to fetch assessment HTML: ${error.message}` });
    }
  });

  // Payment and credit system routes
  app.use('/api/payments', paymentRouter);
  
  // Admin routes
  app.use('/api/admin', adminRouter);
  
  // Add robots.txt headers to prevent indexing of admin pages
  app.use(addRobotsHeaders);

  const httpServer = createServer(app);
  return httpServer;
}
