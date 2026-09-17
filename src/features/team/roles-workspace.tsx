"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import type { PermissionKey } from "@/lib/permissions";
import { createRoleAction, deleteRoleAction, renameRoleAction, updateRolePermissionsAction } from "@/actions/roles";

type PermissionEntry = { key: string; resource: string; action: string; label: string; group: string; description?: string | null };
type RoleSummary = { id: number; code: string; name: string; description: string | null; isSystem: boolean; memberCount: number; permissionKeys: PermissionKey[] };

function groupPermissions(permissions: PermissionEntry[]) {
  const groups = new Map<string, PermissionEntry[]>();
  for (const permission of permissions) {
    const list = groups.get(permission.group) ?? [];
    list.push(permission);
    groups.set(permission.group, list);
  }
  return [...groups.entries()];
}

export function RolesWorkspace({ initialRoles, permissions }: { initialRoles: RoleSummary[]; permissions: PermissionEntry[] }) {
  const [roles, setRoles] = useState(initialRoles);
  const [selectedId, setSelectedId] = useState<number | null>(initialRoles[0]?.id ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();
  const selectedRole = roles.find((role) => role.id === selectedId) ?? null;
  const groupedPermissions = useMemo(() => groupPermissions(permissions), [permissions]);

  const refresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0">
        <div>
          <Link href="/team" className="inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to team
          </Link>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Roles & permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create roles and control exactly what each one can do.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className={cn(primaryPillClass, "h-11 px-5 text-sm")}>
          <Plus className="size-4" strokeWidth={1.75} />
          New role
        </button>
      </section>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5">
        <Surface className="p-2">
          <ul className="space-y-1">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  className={cn("flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm transition-colors", role.id === selectedId ? "bg-accent font-bold text-accent-foreground" : "hover:bg-muted/70")}
                >
                  <span className="min-w-0 flex-1 truncate">{role.name}</span>
                  {role.isSystem ? (
                    <span className={cn(chipClass, "shrink-0 bg-primary/12 text-primary")}>
                      <Lock className="size-3" strokeWidth={2} />
                      System
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </Surface>

        {selectedRole ? (
          <RoleDetail key={selectedRole.id} role={selectedRole} groupedPermissions={groupedPermissions} onDeleted={() => { setRoles((current) => current.filter((role) => role.id !== selectedRole.id)); setSelectedId(roles.find((role) => role.id !== selectedRole.id)?.id ?? null); refresh(); }} onSaved={refresh} />
        ) : (
          <Surface>
            <p className="text-sm text-muted-foreground">Select a role to see its permissions.</p>
          </Surface>
        )}
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} groupedPermissions={groupedPermissions} onCreated={refresh} />
    </div>
  );
}

function RoleDetail({ role, groupedPermissions, onSaved, onDeleted }: { role: RoleSummary; groupedPermissions: [string, PermissionEntry[]][]; onSaved: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(role.name);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(role.permissionKeys));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const saveName = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await renameRoleAction({ roleId: role.id, name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      onSaved();
    });
  };

  const savePermissions = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateRolePermissionsAction({ roleId: role.id, permissionKeys: [...selectedKeys] as PermissionKey[] });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      onSaved();
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteRoleAction(role.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  };

  return (
    <div className="space-y-4">
      <Surface>
        <SurfaceHeader>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <input value={name} onChange={(event) => setName(event.target.value)} disabled={role.isSystem} className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:text-muted-foreground" />
            {!role.isSystem && name !== role.name ? (
              <button type="button" disabled={pending || !name.trim()} onClick={saveName} className={cn(softPillClass, "h-11 shrink-0 px-4 text-xs disabled:pointer-events-none disabled:opacity-50")}>
                Save name
              </button>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
          </span>
        </SurfaceHeader>
        {role.isSystem ? <p className="mt-3 text-xs text-muted-foreground">This is the built-in Administrator role. Its name and permissions are locked so the workspace can never be left without an administrator.</p> : null}
      </Surface>

      <Surface>
        <SurfaceTitle>Permissions</SurfaceTitle>
        <div className="mt-5 space-y-5">
          {groupedPermissions.map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{group}</p>
              <ul className="mt-2 space-y-1">
                {items.map((permission) => (
                  <li key={permission.key}>
                    <label className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors", role.isSystem ? "opacity-60" : "hover:bg-muted/60")}>
                      <input type="checkbox" checked={role.isSystem || selectedKeys.has(permission.key)} disabled={role.isSystem} onChange={() => toggle(permission.key)} className="size-4 rounded border-input accent-primary" />
                      {permission.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error}</p> : null}
        {saved && !error ? <p className="mt-4 text-sm font-semibold text-success">Saved.</p> : null}
        {!role.isSystem ? (
          <button type="button" disabled={pending} onClick={savePermissions} className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm disabled:pointer-events-none disabled:opacity-50")}>
            <Check className="size-4" strokeWidth={2.25} />
            {pending ? "Saving…" : "Save permissions"}
          </button>
        ) : null}
      </Surface>

      {!role.isSystem ? (
        <Surface className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Delete this role</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{role.memberCount > 0 ? `Reassign ${role.memberCount} teammate${role.memberCount === 1 ? "" : "s"} off this role first.` : "This can't be undone."}</p>
          </div>
          <button type="button" disabled={pending || role.memberCount > 0} onClick={remove} className={cn(softPillClass, "h-11 shrink-0 gap-1.5 px-4 text-sm text-destructive disabled:pointer-events-none disabled:opacity-50")}>
            <Trash2 className="size-4" strokeWidth={1.75} />
            Delete role
          </button>
        </Surface>
      ) : null}
    </div>
  );
}

function CreateRoleDialog({ open, onOpenChange, groupedPermissions, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; groupedPermissions: [string, PermissionEntry[]][]; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setName("");
      setDescription("");
      setSelectedKeys(new Set());
      setError(null);
    }
  };

  const toggle = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createRoleAction({ name, description, permissionKeys: [...selectedKeys] as PermissionKey[] });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCreated();
      close(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="New role" description="Name the role and choose what it can do.">
      <div className="space-y-4 px-5 pb-5">
        <label className="block text-sm font-bold">
          Role name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="e.g. Regional Lead" />
        </label>
        <label className="block text-sm font-bold">
          Description (optional)
          <input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="What is this role for?" />
        </label>
        <div className="max-h-72 space-y-4 overflow-y-auto rounded-2xl border border-border p-3">
          {groupedPermissions.map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{group}</p>
              <ul className="mt-1 space-y-0.5">
                {items.map((permission) => (
                  <li key={permission.key}>
                    <label className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
                      <input type="checkbox" checked={selectedKeys.has(permission.key)} onChange={() => toggle(permission.key)} className="size-4 rounded border-input accent-primary" />
                      {permission.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
        <button type="button" disabled={pending || !name.trim()} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
          <ShieldCheck className="size-4" strokeWidth={1.75} />
          {pending ? "Creating…" : "Create role"}
        </button>
      </div>
    </ResponsiveDialog>
  );
}
