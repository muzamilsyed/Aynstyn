import { pgTable, text, serial, integer, json, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: integer("id").primaryKey().notNull(),
  username: text("username"),
  password: text("password"),
  credits: integer("credits").notNull().default(5), // Start with 5 free credits
  subscriptionPlan: text("subscription_plan").default("spark").notNull(), // "spark", "explorer", "genius", "mastermind"
  lastPurchaseDate: timestamp("last_purchase_date"),
});

// Anonymous users table to track assessments from non-registered users via session
export const anonymousUsers = pgTable("anonymous_users", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull().unique(),
  assessmentCount: integer("assessment_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  anonymousId: integer("anonymous_id").references(() => anonymousUsers.id),
  subject: text("subject").notNull(),
  input: text("input").notNull(),
  inputType: text("input_type").notNull(), // "text" or "audio"
  score: integer("score").notNull(),
  coveredTopics: json("covered_topics").notNull(),
  missingTopics: json("missing_topics").notNull(),
  feedback: text("feedback").notNull(),
  renderedHtml: text("rendered_html"), // Store the complete rendered assessment HTML
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);

export const upsertUserSchema = createInsertSchema(users);

export const insertAnonymousUserSchema = createInsertSchema(anonymousUsers).pick({
  sessionId: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  userId: true,
  anonymousId: true,
  subject: true,
  input: true,
  inputType: true,
  score: true,
  coveredTopics: true,
  missingTopics: true,
  feedback: true,
});

// API schema for frontend requests
export const assessInputSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  input: z.string().min(1, "Input is required"),
  inputType: z.enum(["text", "audio"]),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnonymousUser = z.infer<typeof insertAnonymousUserSchema>;
export type AnonymousUser = typeof anonymousUsers.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;
export type AssessInput = z.infer<typeof assessInputSchema>;
