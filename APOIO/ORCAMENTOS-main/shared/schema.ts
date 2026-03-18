import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// --- Clients ---

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  birthday: text("birthday"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// --- Budgets ---

export type BudgetStatus = "rascunho" | "enviado" | "aprovado" | "rejeitado" | "vencido";

export const budgetStatusEnum = ["rascunho", "enviado", "aprovado", "rejeitado", "vencido"] as const;

export type BudgetItem = {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
  warranty: string;
};

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proposalId: integer("proposal_id"), // Sequential ID for visual display
  clientId: varchar("client_id"),
  clientName: text("client_name").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("rascunho"),
  totalValue: integer("total_value").notNull().default(0),
  currency: text("currency").notNull().default("BRL"),
  validityDate: text("validity_date"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  items: jsonb("items").$type<BudgetItem[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// --- Finances ---

export type FinanceType = "receita" | "despesa";

export const finances = pgTable("finances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  description: text("description").notNull(),
  type: text("type").notNull().default("receita"), // receita | despesa
  category: text("category").notNull().default("geral"),
  amount: integer("amount").notNull().default(0), // in cents
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFinanceSchema = createInsertSchema(finances).omit({ id: true, createdAt: true });
export type InsertFinance = z.infer<typeof insertFinanceSchema>;
export type Finance = typeof finances.$inferSelect;

// --- Meetings ---

export type MeetingStatus = "agendada" | "concluida" | "cancelada";

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: text("duration").default("60 min"),
  participants: text("participants"),
  location: text("location"),
  status: text("status").notNull().default("agendada"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, createdAt: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// --- Marketing ---

export type MarketingStatus = "planejada" | "ativa" | "pausada" | "concluida";

export const marketing = pgTable("marketing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull().default("email"), // email, social, ads, evento, conteudo
  status: text("status").notNull().default("planejada"),
  budget: integer("budget").default(0),
  spent: integer("spent").default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarketingSchema = createInsertSchema(marketing).omit({ id: true, createdAt: true });
export type InsertMarketing = z.infer<typeof insertMarketingSchema>;
export type Marketing = typeof marketing.$inferSelect;

// --- Notes ---

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category").default("geral"),
  pinned: text("pinned").default("false"),
  color: text("color").default("default"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// --- Texts ---

export const texts = pgTable("texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTextSchema = createInsertSchema(texts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertText = z.infer<typeof insertTextSchema>;
export type Text = typeof texts.$inferSelect;
