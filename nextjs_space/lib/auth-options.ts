import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

// Build providers array conditionally
const providers = [
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

      if (!user) {
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
];

// Add Google OAuth provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "FIELD_WORKER", // Default role for Google-authenticated users
        };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google sign-ins, we need to handle user creation/updating
      if (account?.provider === "google" && profile?.email) {
        // Check if user already exists
        let existingUser = await prisma.user.findUnique({
          where: { email: profile.email as string }
        });

        if (!existingUser) {
          // Create new user with Google profile info
          existingUser = await prisma.user.create({
            data: {
              email: profile.email as string,
              name: profile.name as string,
              avatarUrl: profile.picture as string,
              password: "", // No password for Google auth
              organizationId: null, // Will be set later when joining org
              role: "FIELD_WORKER", // Default role
            }
          });
        }

        // Update user with latest profile info
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: profile.name as string,
            avatarUrl: profile.picture as string,
            lastLogin: new Date()
          }
        });

        // Update the user object with the database user info
        user.id = existingUser.id;
        user.role = existingUser.role;
        user.organizationId = existingUser.organizationId;
        user.avatarUrl = existingUser.avatarUrl;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.avatarUrl = (user as any).avatarUrl;
      }

      // Handle Google OAuth tokens
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).avatarUrl = token.avatarUrl;

        // Add Google access token to session if available
        if (token.accessToken) {
          (session.user as any).accessToken = token.accessToken;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
};
