import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/shared/app-shell";
import { listRolesForPreview } from "@/services/roles.service";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const roles = await listRolesForPreview();
  return <Suspense><AppShell roles={roles}>{children}</AppShell></Suspense>;
}
