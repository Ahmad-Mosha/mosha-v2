import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Turso-ready LibSQL connection: defaults to local file:mosha.db,
// but effortlessly swaps to Turso cloud simply by setting DATABASE_URL and DATABASE_AUTH_TOKEN!
const url = process.env.DATABASE_URL || "file:mosha.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
});

export const db = drizzle(client, { schema });
export { schema };
