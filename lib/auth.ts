import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyImpersonateToken } from "@/lib/impersonate";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:            { label: "Email",             type: "email" },
        password:         { label: "Senha",             type: "password" },
        impersonateToken: { label: "Impersonate Token", type: "text" },
      },
      async authorize(credentials) {
        // Fluxo de impersonação
        if (credentials?.impersonateToken) {
          const payload = verifyImpersonateToken(credentials.impersonateToken);
          if (!payload) return null;

          const user = await prisma.user.findUnique({
            where: { id: payload.targetUserId },
          });
          if (!user) return null;

          return {
            id:             user.id,
            email:          user.email,
            name:           user.name,
            image:          user.image,
            // passa para o JWT callback
            _adminId:       payload.isRestore ? undefined : payload.adminId,
            _isRestore:     payload.isRestore ?? false,
          };
        }

        // Fluxo normal de login
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as typeof user & { _adminId?: string; _isRestore?: boolean };

        if (u._isRestore) {
          // restaurando admin — limpa qualquer impersonação anterior
          delete token.originalAdminId;
        } else if (u._adminId) {
          // entrando como outro usuário — guarda quem é o admin real
          token.originalAdminId = u._adminId;
        }

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id              = token.id as string;
        session.user.role            = token.role as string;
        session.user.originalAdminId = token.originalAdminId as string | undefined;
      }
      return session;
    },
  },
};
