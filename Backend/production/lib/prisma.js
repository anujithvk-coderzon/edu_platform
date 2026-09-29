"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../generated/prisma/client");
/**
 * Single Prisma client for the whole app, over a pg driver adapter.
 *
 * One pool is shared process-wide: creating a second client would open a second
 * connection pool against the same database.
 */
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({ adapter });
exports.default = exports.prisma;
