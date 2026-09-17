"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { useRolePreview } from "@/components/shared/role-preview";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

type RoleGateProps = {
  permission: PermissionKey;
  children: ReactNode;
};

export function RoleGate({ permission, children }: RoleGateProps) {
  const { effectivePermissions, effectiveRoleName } = useRolePreview();

  if (hasPermission(effectivePermissions, permission)) return children;

  return (
    <PagePlaceholder
      icon={Lock}
      title="Restricted"
      description={`This page requires the "${permission}" permission. You're previewing as ${effectiveRoleName}.`}
    />
  );
}
