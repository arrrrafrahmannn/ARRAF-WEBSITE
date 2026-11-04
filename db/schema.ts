import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), email: text("email").notNull(), country: text("country").notNull(),
  service: text("service").notNull(), level: text("level").notNull(), deadline: text("deadline").notNull(),
  wordCount: integer("word_count"), brief: text("brief").notNull(),
  status: text("status", { enum: ["new", "reviewing", "contacted", "closed"] }).notNull().default("new"),
  fileKey: text("file_key"), fileName: text("file_name"), fileType: text("file_type"), fileSize: integer("file_size"),
  rateKey: text("rate_key").notNull(), createdAt: integer("created_at").notNull(),
}, (table) => [index("inquiries_rate_created_idx").on(table.rateKey, table.createdAt)]);
