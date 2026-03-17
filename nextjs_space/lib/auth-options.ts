import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isTestMode } from "@/lib/test-auth-bypass";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true }
        });

        if (!user || !user.password) {
          console.log("User not found or no password:", user?.email);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          console.log("Invalid password for:", user.email);
          return null;
        }
        console.log("Auth successful for:", user.email);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          avatarUrl: user.avatarUrl
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  events: {
    async createUser({ user }) {
      const userName = user.name || user.email?.split("@")[0] || "User";
      const orgName = `${userName}'s Company`;
      const baseSlug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 60);
      let slug = baseSlug;
      let attempt = 1;
      while (await prisma.organization.findFirst({ where: { slug } })) {
        slug = `${baseSlug}-${attempt++}`;
      }

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug,
          entitlements: {
            modules: {
              projects: true, tasks: true, team: true, documents: true,
              safety: true, reports: true, rfis: true, submittals: true,
              changeOrders: true, dailyReports: true
            },
            limits: { maxUsers: 50, maxProjects: 100, storageGB: 10 }
          }
        }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "COMPANY_OWNER",
          organizationId: org.id
        }
      });

      await prisma.teamMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          jobTitle: "Owner"
        }
      });
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (isTestMode()) {
        return {
          id: 'test-user-001',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN',
          organizationId: 'test-org-001',
        };
      }
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.avatarUrl = (user as any).avatarUrl;
      }
      if (account?.provider === "google" && token.email && !token.organizationId) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, organizationId: true, avatarUrl: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
          token.avatarUrl = dbUser.avatarUrl;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (isTestMode()) {
        return {
          user: {
            id: 'test-user-001',
            email: 'test@example.com',
            name: 'Test User',
            role: 'ADMIN',
            organizationId: 'test-org-001',
          },
        };
      }
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: false,
  // Fix for Next.js 16 + NextAuth v4 CSRF issues
  // Allow localhost without strict CSRF checking
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  }
};
