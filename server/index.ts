/**
 * Server Entry Point
 * 
 * This is the main entry point for the server application. It sets up:
 * - Environment variables from .env file
 * - Express server and middleware
 * - Session management
 * - API routes
 * - Frontend serving via Vite in development or static files in production
 * - Database connections
 * - Authentication services
 * - Payment processing with PayPal
 */

// Load environment variables from .env file
import 'dotenv/config';
// Log the database URL to verify environment variables are loaded
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Import required dependencies
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";              // API route definitions
import { setupVite, serveStatic, log } from "./vite";    // Frontend serving utilities
import session from "express-session";                   // Session management
import path from "path";                                // File path utilities

// Create Express application instance
const app = express();

/**
 * Special Feedback API Endpoint
 * 
 * This endpoint is registered before any middleware to ensure it's always available.
 * It handles assessment feedback and uses OpenAI to generate summaries.
 * The endpoint is isolated from other middleware to prevent potential interference.
 */
app.post('/api/aynstyn-feedback', express.json(), async (req: any, res: any) => {
  try {
    // Log endpoint call for debugging
    console.log("🤖 aynstyn endpoint called DIRECTLY");
    console.log("Request body:", req.body);
    
    // Extract assessment ID from request body
    const { assessmentId } = req.body;
    
    // Validate that an assessment ID was provided
    if (!assessmentId) {
      console.log("❌ No assessment ID provided");
      return res.status(400).json({ message: "Assessment ID is required" });
    }
    
    console.log("✅ Assessment ID received:", assessmentId);

    // Dynamically import storage and OpenAI modules
    // This allows for lazy loading of these potentially heavy modules
    const { storage } = await import("./storage");                 // Database storage functions
    const { generateAssistantSummary } = await import("./openai");  // OpenAI integration

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
      topicCoverage: [],
      feedback: assessment.feedback
    };

    // Get the language, default to English
    const language = 'en';

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

// Increase size limits for audio file uploads (100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'aynstyn-session-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add support for custom domain
app.use((req, res, next) => {
  // Set cross-origin headers to allow access from different domains
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files explicitly before any routes
const publicPath = path.resolve(import.meta.dirname, "../public");
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    // Ensure proper content types for image files
    if (filePath.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
    
    // Add caching headers for social media crawlers
    res.set('Cache-Control', 'public, max-age=86400');
    // Allow cross-origin resource sharing for images
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // For production, make sure we're properly serving the built files
    const distPublicPath = path.resolve(import.meta.dirname, "../dist/public");
    app.use(express.static(distPublicPath));
    
    // Always return the main index.html for any route not found
    // This is critical for SPA routing to work
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPublicPath, "index.html"));
    });
  }

  // Serve the app on the configured port and host
  // This serves both the API and the client
  const port = parseInt(process.env.PORT || "3000");
  const host = process.env.HOST || "localhost";
  
  server.listen({
    port,
    host,
  }, () => {
    log(`Server is running at http://${host}:${port}`);
  });
})();
