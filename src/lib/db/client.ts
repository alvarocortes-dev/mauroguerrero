import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let client: postgres.Sql | null = null;

export const getDb = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return null;
  }

  if (!client) {
    client = postgres(url, { prepare: false });
  }

  return drizzle(client);
};
