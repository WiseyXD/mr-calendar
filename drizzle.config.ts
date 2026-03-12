import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";

config({ path: '.env' });

console.log("DATABASE_URL loaded:", process.env.DATABASE_URL)

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

