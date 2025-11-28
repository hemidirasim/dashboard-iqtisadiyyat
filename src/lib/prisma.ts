import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prisma Client yalnız server tərəfdə işləyir
const globalForPrisma = typeof global !== "undefined" ? global : ({} as typeof global);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Reconnect Prisma connection
 */
export async function reconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore disconnect errors
  }
  await prisma.$connect();
}

/**
 * Execute Prisma query with retry logic for connection issues
 */
export async function withRetry<T>(
  query: () => Promise<T>,
  retries = 1,
): Promise<T> {
  try {
    return await query();
  } catch (error: any) {
    const errorMessage = String(error.message || "");
    const errorCode = String(error.code || "");

    const isConnectionIssue =
      errorCode === "P1017" || errorMessage.includes("Server has closed the connection");

    if (isConnectionIssue && retries > 0) {
      console.warn("⚠️  Prisma connection closed (P1017). Yenidən qoşulmağa çalışıram...");
      try {
        await reconnectPrisma();
        return await withRetry(query, retries - 1);
      } catch (retryError) {
        console.error("❌ Prisma reconnect sonrası da alınmadı:", retryError);
        throw retryError;
      }
    }

    throw error;
  }
}

