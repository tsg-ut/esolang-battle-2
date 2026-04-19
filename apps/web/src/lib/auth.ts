import { DefaultSession, NextAuthOptions } from 'next-auth';
import type { AdapterAccount } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import SlackProvider from 'next-auth/providers/slack';

import { PrismaAdapter } from '@auth/prisma-adapter';

import { TeamInfo } from '@esolang-battle/common';
import { prisma, verifyUserLogin } from '@esolang-battle/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      teams: TeamInfo[];
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    isAdmin: boolean;
    teams: TeamInfo[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    teams: TeamInfo[];
  }
}

const adapter = PrismaAdapter(prisma);
const authAdapter = (() => {
  const linkAccount = adapter.linkAccount;

  if (linkAccount === undefined) {
    return adapter;
  }

  return {
    ...adapter,
    linkAccount: (account: AdapterAccount) => {
      // Slack 等が送ってくる、DBスキーマにない不要なフィールドを削除
      const { ok: _ok, state: _state, ...cleanAccount } = account;
      return linkAccount(cleanAccount as Parameters<typeof linkAccount>[0]);
    },
  };
})() as NextAuthOptions['adapter'];

export const authOptions: NextAuthOptions = {
  adapter: authAdapter,
  providers: [
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await verifyUserLogin(prisma, credentials.email, credentials.password);
          if (user) {
            return {
              id: user.id,
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
  session: {
    strategy: 'jwt', // Credentials を使うために JWT に戻す
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // 初回サインイン時のみ user オブジェクトが渡される
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }

      // 常に DB から最新のチーム情報を取得 (または適宜キャッシュを考慮)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true, teams: true },
        });
        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.teams = dbUser.teams;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // トークンからセッションへ情報を移す
        session.user.id = token.id as string;
        session.user.isAdmin = (token as any).isAdmin;
        session.user.teams = (token as any).teams || [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    async signIn({ user, account, profile }) {
      // OAuth ログイン時にプロバイダの画像を providerImage に同期
      if (account?.provider !== 'credentials' && profile && profile.image) {
        const imageUrl = profile.image;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            providerImage: imageUrl,
            // 初回ログイン時などで image が空なら image も埋める
            image: user.image || imageUrl,
          },
        });
      }
    },
  },
};
