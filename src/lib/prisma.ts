// @ts-nocheck
// Prisma client - run `npx prisma generate` after setup to get full types
let prismaInstance: any

try {
  const { PrismaClient } = require("@prisma/client")
  const globalForPrisma = globalThis as any
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance
} catch {
  // Prisma client not generated yet - run `npx prisma generate`
  console.warn("Prisma client not generated. Run: npx prisma generate")
  prismaInstance = null
}

export const prisma = prismaInstance
