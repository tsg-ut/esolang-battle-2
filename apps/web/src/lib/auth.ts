import { DefaultSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { TeamInfo } from '@esolang-battle/common';
import { prisma, verifyUserLogin } from '@esolang-battle/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: number;
      isAdmin: boolean;
      teams: TeamInfo[];
    } & DefaultSession['user'];
  }

  interface User {
    isAdmin: boolean;
    teams: TeamInfo[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number;
    isAdmin: boolean;
    teams: TeamInfo[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        name: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;

        try {
          const user = await verifyUserLogin(prisma, credentials.name, credentials.password);
          if (user) {
            return {
              id: user.id.toString(),
              name: user.name,
              isAdmin: user.isAdmin,
              teams: user.teams,
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.isAdmin = user.isAdmin;
        token.teams = user.teams;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.teams = token.teams || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/user',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
