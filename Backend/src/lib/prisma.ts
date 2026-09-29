import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Single Prisma client for the whole app, over a pg driver adapter.
 *
 * One pool is shared process-wide: creating a second client would open a second
 * connection pool against the same database.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export default prisma;
