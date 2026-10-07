import { defineConfig } from "drizzle-kit";

/**
 * One schema, two databases: chopdeck and rhemascry each run their own Turso
 * database with these same tables. Point TURSO_DATABASE_URL at the one you mean.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_DATABASE_SECRET,
  },
});
