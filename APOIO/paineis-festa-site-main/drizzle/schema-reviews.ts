import { int, mysqlTable, text, timestamp, varchar, decimal, tinyint } from "drizzle-orm/mysql-core";

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  rating: tinyint("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }).notNull(),
  comment: text("comment"),
  helpful: int("helpful").default(0), // número de pessoas que acharam útil
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
