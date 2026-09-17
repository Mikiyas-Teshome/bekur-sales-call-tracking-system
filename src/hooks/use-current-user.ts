"use client";

import { useSession } from "next-auth/react";
import type { PermissionSet } from "@/lib/permissions";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function useCurrentUser() {
  const { data } = useSession();
  const name = data?.user?.name ?? "";
  const email = data?.user?.email ?? "";
  const roleCode = data?.user?.roleCode ?? "";
  const roleName = data?.user?.roleName ?? "";
  const permissions: PermissionSet = data?.user?.permissions ?? [];

  return {
    name,
    email,
    roleCode,
    roleName,
    permissions,
    initials: name ? initialsOf(name) : "—",
  };
}
