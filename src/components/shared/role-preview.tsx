"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PermissionKey, PermissionSet } from "@/lib/permissions";

export type PreviewableRole = { code: string; name: string; permissionKeys: PermissionKey[] };

type RolePreviewContextValue = {
  ownRoleCode: string;
  ownRoleName: string;
  previewRoleCode: string | null;
  effectiveRoleName: string;
  effectivePermissions: PermissionSet;
  roles: PreviewableRole[];
  setPreviewRoleCode: (code: string | null) => void;
};

const RolePreviewContext = createContext<RolePreviewContextValue | null>(null);

export function RolePreviewProvider({ children, roles }: { children: ReactNode; roles: PreviewableRole[] }) {
  const currentUser = useCurrentUser();
  const [previewRoleCode, setPreviewRoleCode] = useState<string | null>(null);

  const value = useMemo<RolePreviewContextValue>(() => {
    const previewRole = previewRoleCode ? (roles.find((role) => role.code === previewRoleCode) ?? null) : null;

    return {
      ownRoleCode: currentUser.roleCode,
      ownRoleName: currentUser.roleName,
      previewRoleCode: previewRole ? previewRole.code : null,
      effectiveRoleName: previewRole ? previewRole.name : currentUser.roleName,
      effectivePermissions: previewRole ? previewRole.permissionKeys : currentUser.permissions,
      roles,
      setPreviewRoleCode,
    };
  }, [currentUser.roleCode, currentUser.roleName, currentUser.permissions, previewRoleCode, roles]);

  return <RolePreviewContext.Provider value={value}>{children}</RolePreviewContext.Provider>;
}

export function useRolePreview() {
  const context = useContext(RolePreviewContext);
  if (!context) throw new Error("useRolePreview must be used inside RolePreviewProvider");
  return context;
}

export function RolePreviewToggle({ tone = "light", className }: { tone?: "light" | "ink"; className?: string }) {
  const { ownRoleCode, previewRoleCode, roles, setPreviewRoleCode } = useRolePreview();
  const effectiveCode = previewRoleCode ?? ownRoleCode;

  return (
    <div role="group" aria-label="Preview as" className={cn("flex gap-1 overflow-x-auto rounded-full p-1 scrollbar-none", tone === "ink" ? "bg-white/8" : "bg-muted", className)}>
      {roles.map((role) => {
        const selected = role.code === effectiveCode;

        return (
          <button
            key={role.code}
            type="button"
            aria-pressed={selected}
            onClick={() => setPreviewRoleCode(role.code === ownRoleCode ? null : role.code)}
            className={cn(
              "flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              tone === "ink"
                ? selected
                  ? "bg-white text-ink"
                  : "text-canvas-muted hover:text-canvas-foreground"
                : selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            {role.name}
          </button>
        );
      })}
    </div>
  );
}

export function RolePreviewBanner() {
  const { previewRoleCode, ownRoleName, roles, setPreviewRoleCode } = useRolePreview();
  if (!previewRoleCode) return null;
  const previewRoleName = roles.find((role) => role.code === previewRoleCode)?.name ?? previewRoleCode;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-accent px-4 py-3 text-sm">
      <span className="font-semibold text-accent-foreground">
        Previewing as <span className="font-bold">{previewRoleName}</span> — you are signed in as {ownRoleName}.
      </span>
      <button type="button" onClick={() => setPreviewRoleCode(null)} className={cn(softPillClass, "ml-auto h-8 gap-1.5 px-3 text-xs")}>
        <X className="size-3.5" strokeWidth={1.75} />
        Exit preview
      </button>
    </div>
  );
}
