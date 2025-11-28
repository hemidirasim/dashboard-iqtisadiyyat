import { compare } from "bcryptjs";
import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { prisma, withRetry } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/constants";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Əlaqə məlumatları",
      credentials: {
        email: { label: "E-poçt", type: "email", placeholder: "editor@site.az" },
        password: { label: "Şifrə", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("🔐 Authorize called");
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("❌ Invalid credentials format:", parsed.error);
            return null;
          }

          const { email, password } = parsed.data;
          console.log("🔐 Looking up user:", email);
          
          // Prisma connection problemi üçün retry logic ilə istifadəçini tap
          const user = await withRetry(async () => {
            return await prisma.users.findFirst({
              where: {
                email,
                status: true,
                deleted_at: null,
              },
            });
          });

          console.log("🔐 User found:", user ? "Yes" : "No");

          if (!user || !user.password) {
            console.error("❌ User not found or no password");
            return null;
          }

          console.log("🔐 Comparing password...");
          const isValid = await compare(password, user.password);
          if (!isValid) {
            console.error("❌ Password invalid");
            return null;
          }

          console.log("✅ Authorize successful for:", email);
          return {
            id: user.id.toString(),
            name: `${user.name ?? ""} ${user.surname ?? ""}`.trim() || user.email,
            email: user.email ?? undefined,
            role: user.role ?? 0,
          };
        } catch (error: any) {
          console.error("❌ Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = typeof (user as any).role === "number" ? (user as any).role : 0;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = typeof token.role === "number" ? token.role : 0;
        session.user.roleName = ROLE_LABEL[session.user.role] ?? "reporter";
      }
      return session;
    },
  },
};

export async function getCurrentSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("getCurrentSession error:", error);
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export function isAdmin(role?: number | null) {
  return (role ?? 0) >= 1;
}

