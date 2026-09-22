export const permissionCatalog = [
  { key: "dashboard:view", resource: "dashboard", action: "view", label: "View dashboard", group: "Dashboard" },
  { key: "dashboard:view_team_scope", resource: "dashboard", action: "view_team_scope", label: "View team-wide dashboard scope", group: "Dashboard" },
  { key: "leads:view", resource: "leads", action: "view", label: "View leads", group: "Leads" },
  { key: "leads:create", resource: "leads", action: "create", label: "Create leads", group: "Leads" },
  { key: "leads:import", resource: "leads", action: "import", label: "Bulk import leads", group: "Leads" },
  { key: "leads:reassign", resource: "leads", action: "reassign", label: "Reassign leads", group: "Leads" },
  { key: "leads:view_assignment_history", resource: "leads", action: "view_assignment_history", label: "View assignment history", group: "Leads" },
  { key: "calls:log", resource: "calls", action: "log", label: "Log calls", group: "Calls" },
  { key: "team:view", resource: "team", action: "view", label: "View team", group: "Team" },
  { key: "team:invite", resource: "team", action: "invite", label: "Invite teammates", group: "Team" },
  { key: "team:assign_role", resource: "team", action: "assign_role", label: "Change a teammate's role", group: "Team" },
  { key: "team:manage_assignments", resource: "team", action: "manage_assignments", label: "Manage a teammate's lead assignments", group: "Team" },
  { key: "team:deactivate_member", resource: "team", action: "deactivate_member", label: "Deactivate a teammate", group: "Team" },
  { key: "roles:manage", resource: "roles", action: "manage", label: "Manage roles and permissions", group: "Roles" },
  { key: "projects:view", resource: "projects", action: "view", label: "View projects", group: "Projects" },
  { key: "projects:create", resource: "projects", action: "create", label: "Create projects", group: "Projects" },
  { key: "projects:archive", resource: "projects", action: "archive", label: "Archive projects", group: "Projects" },
  { key: "campaigns:view", resource: "campaigns", action: "view", label: "View campaigns", group: "Campaigns" },
  { key: "campaigns:create", resource: "campaigns", action: "create", label: "Create campaigns", group: "Campaigns" },
  { key: "campaigns:manage_status", resource: "campaigns", action: "manage_status", label: "Pause, resume, or end campaigns", group: "Campaigns" },
  { key: "reports:view", resource: "reports", action: "view", label: "View reports", group: "Reports" },
  { key: "reports:view_team", resource: "reports", action: "view_team", label: "View team-wide reports", group: "Reports" },
  { key: "kpi:manage_targets", resource: "kpi", action: "manage_targets", label: "Set monthly KPI targets", group: "Reports" },
  { key: "profile:edit_own", resource: "profile", action: "edit_own", label: "Edit own profile", group: "Self-service" },
  { key: "security:change_password_own", resource: "security", action: "change_password_own", label: "Change own password", group: "Self-service" },
  { key: "notifications:manage_own", resource: "notifications", action: "manage_own", label: "Manage own notification preferences", group: "Self-service" },
] as const;

export type PermissionKey = (typeof permissionCatalog)[number]["key"];

export type PermissionSet = "*" | PermissionKey[];

export function hasPermission(permissions: PermissionSet | undefined | null, key: PermissionKey): boolean {
  if (!permissions) return false;
  if (permissions === "*") return true;
  return permissions.includes(key);
}

export const administratorPermissionKeys: PermissionKey[] = permissionCatalog.map((permission) => permission.key);

export const salesManagerPermissionKeys: PermissionKey[] = permissionCatalog
  .map((permission) => permission.key)
  .filter((key) => !key.startsWith("team:") && key !== "roles:manage");

export const salesRepPermissionKeys: PermissionKey[] = ["dashboard:view", "leads:view", "leads:create", "calls:log", "campaigns:view", "reports:view", "profile:edit_own", "security:change_password_own", "notifications:manage_own"];
