import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import memoize from "memoizee";

// Declare module augmentation for express-session
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
    anonymousId?: number;
    lastDetectedLanguage?: string; // Track the detected language from the last assessment
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("Environment variable SESSION_SECRET not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true, // We want to track anonymous users
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Custom login route that serves our branded login page
  app.get("/api/login", (req, res) => {
    // Store the return URL in the session if provided
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
    }
    
    // Serve our custom login page
    res.sendFile('custom-login.html', { root: './client/public' });
  });
  
  // Direct login route that uses the default Replit Auth
  app.get("/api/login-direct", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};

// Middleware to track anonymous users and ensure they're assigned an ID
export const trackAnonymousUser: RequestHandler = async (req, res, next) => {
  // Skip for authenticated users
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For anonymous users, ensure we have a session and track them
  if (req.session && req.sessionID) {
    try {
      // Check if this anonymous user already exists
      let anonUser = await storage.getAnonymousUser(req.sessionID);
      
      // If not, create a new anonymous user
      if (!anonUser) {
        anonUser = await storage.createAnonymousUser(req.sessionID);
      }
      
      // Store the anonymous user ID in the session for convenience
      req.session.anonymousId = anonUser.id;
    } catch (error) {
      console.error("Error tracking anonymous user:", error);
    }
  }
  
  next();
};

// Middleware to check if anonymous user has exceeded free assessment limit
export const checkAnonymousAssessmentLimit: RequestHandler = async (req, res, next) => {
  // Skip for authenticated users
  if (req.isAuthenticated()) {
    return next();
  }
  
  if (req.session && req.sessionID) {
    try {
      // Get assessment count for this anonymous user
      const assessmentCount = await storage.getAnonymousAssessmentCount(req.sessionID);
      
      // Allow if under the limit (3 free assessments)
      if (assessmentCount < 3) {
        return next();
      }
      
      // Otherwise, send a response indicating they need to register
      return res.status(403).json({
        error: "Free assessment limit reached",
        message: "You've used all 3 free assessments. Please register to continue.",
        assessmentCount,
        maxFreeAssessments: 3,
        requiresRegistration: true
      });
    } catch (error) {
      console.error("Error checking assessment limit:", error);
      return next(); // Allow through on error for better UX
    }
  }
  
  next();
};