import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true }
        });
        
        if (!user || !user.password) {
          return null;
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }
        
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
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  events: {
    async createUser({ user }) {
      // Ensure new OAuth users have a default organization and role
      let org = await prisma.organization.findFirst({
        where: { slug: "default" }
      });
      
      if (!org) {
        org = await prisma.organization.create({
          data: {
            name: "Default Organization",
            slug: "default"
          }
        });
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "FIELD_WORKER",
          organizationId: org.id
        }
      });

      // Create team member record
      await prisma.teamMember.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          jobTitle: "Team Member"
        }
      });
    }
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.avatarUrl = (user as any).avatarUrl;
      }
      // For Google OAuth, fetch user data from database if not present in token
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
  secret: process.env.NEXTAUTH_SECRET
};
