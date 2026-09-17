import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDataSource } from "@/db/data-source";
import { User } from "@/entities";
import { permissionCatalog, type PermissionSet } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleId: number;
      roleCode: string;
      roleName: string;
      permissions: PermissionSet;
      name: string;
      email: string;
    };
  }
}

type AppJwt = JWT & {
  id?: string;
  roleId?: number;
  roleCode?: string;
  roleName?: string;
  permissions?: PermissionSet;
  permsRefreshedAt?: number;
};

type SignInUser = { id: string; email: string; name: string; roleId: number; roleCode: string; roleName: string; permissions: PermissionSet };

const PERMISSIONS_TTL_MS = 5 * 60_000;

function toPermissionSet(keys: string[]): PermissionSet {
  return keys.length >= permissionCatalog.length ? "*" : (keys as PermissionSet & string[]);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const dataSource = await getDataSource();
        const user = await dataSource.getRepository(User).findOne({ where: { email }, relations: { role: { permissions: true } } });
        if (!user || !user.active) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        const permissions = toPermissionSet(user.role.permissions.map((permission) => permission.key));
        const result: SignInUser = { id: String(user.id), email: user.email, name: user.fullName, roleId: user.roleId, roleCode: user.role.code, roleName: user.role.name, permissions };
        return result;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const appToken = token as AppJwt;

      if (user) {
        const signInUser = user as SignInUser;
        appToken.id = signInUser.id;
        appToken.roleId = signInUser.roleId;
        appToken.roleCode = signInUser.roleCode;
        appToken.roleName = signInUser.roleName;
        appToken.permissions = signInUser.permissions;
        appToken.permsRefreshedAt = Date.now();
      }

      if (trigger === "update" && session) {
        const update = session as { name?: string; email?: string; forceRefresh?: boolean };
        if (typeof update.name === "string") appToken.name = update.name;
        if (typeof update.email === "string") appToken.email = update.email;
        if (update.forceRefresh) appToken.permsRefreshedAt = 0;
      }

      const isStale = !appToken.permsRefreshedAt || Date.now() - appToken.permsRefreshedAt > PERMISSIONS_TTL_MS;
      if (!user && appToken.id && isStale) {
        const dataSource = await getDataSource();
        const dbUser = await dataSource.getRepository(User).findOne({ where: { id: Number(appToken.id) }, relations: { role: { permissions: true } } });
        if (dbUser) {
          appToken.roleId = dbUser.roleId;
          appToken.roleCode = dbUser.role.code;
          appToken.roleName = dbUser.role.name;
          appToken.permissions = toPermissionSet(dbUser.role.permissions.map((permission) => permission.key));
        }
        appToken.permsRefreshedAt = Date.now();
      }

      return appToken;
    },
    async session({ session, token }) {
      const appToken = token as AppJwt;
      if (appToken.id) session.user.id = appToken.id;
      if (appToken.roleId) session.user.roleId = appToken.roleId;
      if (appToken.roleCode) session.user.roleCode = appToken.roleCode;
      if (appToken.roleName) session.user.roleName = appToken.roleName;
      if (appToken.permissions) session.user.permissions = appToken.permissions;
      return session;
    },
  },
});
