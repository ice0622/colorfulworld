import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// 許可する GitHub ログイン名（本人のみ）
const ALLOWED = process.env.ALLOWED_GITHUB_LOGIN;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // AUTH_GITHUB_ID / AUTH_GITHUB_SECRET を自動参照
  providers: [GitHub],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  callbacks: {
    // 許可ログイン以外は一切セッションを作らない（＝真の入口ガード）
    async signIn({ profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      return Boolean(login && ALLOWED && login === ALLOWED);
    },
    async jwt({ token, profile }) {
      const login = (profile as { login?: string } | undefined)?.login;
      if (login) token.login = login;
      return token;
    },
    async session({ session, token }) {
      (session as { login?: string }).login = token.login as string | undefined;
      return session;
    },
  },
});
