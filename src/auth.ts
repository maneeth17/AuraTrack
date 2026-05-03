import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, sessions, accounts, verificationTokens } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/streak';

const isServer = typeof window === 'undefined';

let adapter = undefined;
if (isServer && db) {
  try {
    adapter = DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    });
  } catch (e) {
    console.warn('Failed to initialize Drizzle adapter:', e);
  }
}

export const authOptions: NextAuthConfig = {
  adapter,
  providers: [
    Credentials({
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const action = credentials.action as string;

        if (action === 'signup') {
          const existing = await db!.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing.length > 0) {
            return null;
          }

          const hashedPassword = await bcrypt.hash(password, 12);
          const userId = generateId();

          const newUser = await db!.insert(users).values({
            id: userId,
            email,
            name: (credentials.name as string) || email.split('@')[0],
            password: hashedPassword,
          }).returning();

          return { id: newUser[0].id, email: newUser[0].email, name: newUser[0].name || null, xp: 0, level: 1 };
        }

        const existingUser = await db!.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser.length === 0) {
          return null;
        }

        const user = existingUser[0];
        if (!user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name || null, xp: user.xp || 0, level: user.level || 1 };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.xp = user.xp || 0;
        token.level = user.level || 1;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
        session.user.xp = token.xp;
        session.user.level = token.level;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log('[auth] Sign in event, user:', user?.id, 'xp:', user?.xp, 'level:', user?.level);
    },
  },
};

export default authOptions;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
