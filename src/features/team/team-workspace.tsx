"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Mail, MoreHorizontal, Search, Shield, ShieldCheck, UserRoundPlus, UsersRound } from "lucide-react";
import { FilterMenu } from "@/components/shared/filter-menu";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, primaryPillClass, softPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./fixtures/team.fixture";
import { getMemberAssignedLeadsAction, inviteTeamMemberAction } from "@/actions/team";
import { assignUserRoleAction } from "@/actions/roles";
import { reassignClientsAction } from "@/actions/clients";

type RoleOption = { code: string; name: string };

const statusClasses = { Active: "bg-success/12 text-success", Invited: "bg-warning/12 text-warning", Inactive: "bg-muted text-muted-foreground" };
const roleClasses: Record<string, string> = { Administrator: "bg-primary/12 text-primary", "Sales Manager": "bg-accent text-accent-foreground", "Sales Rep": "bg-muted text-muted-foreground" };
const fallbackRoleClass = "bg-accent text-accent-foreground";

export function TeamWorkspace({ initialMembers, roles }: { initialMembers: TeamMember[]; roles: RoleOption[] }) {
  const [role, setRole] = useState("All roles");
  const [status, setStatus] = useState<"All statuses" | TeamMember["status"]>("All statuses");
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const teamRoles = [...new Set(initialMembers.map((member) => member.role))];
  const visibleMembers = initialMembers.filter((member) => (role === "All roles" || member.role === role) && (status === "All statuses" || member.status === status) && `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase()));
  const activeMembers = initialMembers.filter((member) => member.status === "Active").length;
  const totalLeads = initialMembers.reduce((sum, member) => sum + member.leads, 0);
  const totalCalls = initialMembers.reduce((sum, member) => sum + member.calls, 0);

  return <div className="space-y-4 lg:space-y-5"><section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between lg:pt-0"><div><p className="text-sm font-medium text-primary">Administration</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Team & permissions</h2><p className="mt-1 text-sm text-muted-foreground">Manage access, ownership, and sales performance across your workspace.</p></div><div className="flex gap-2"><Link href="/team/roles" className={cn(softPillClass, "h-11 px-5 text-sm")}><Shield className="size-4" strokeWidth={1.75} />Roles & permissions</Link><button type="button" onClick={() => setInviteOpen(true)} className={cn(primaryPillClass, "h-11 px-5 text-sm")}><UserRoundPlus className="size-4" strokeWidth={1.75} />Invite teammate</button></div></section><section className="grid gap-3 sm:grid-cols-3"><TeamStat icon={UsersRound} label="Team members" value={String(initialMembers.length)} detail={`${activeMembers} active now`} /><TeamStat icon={ShieldCheck} label="Assigned leads" value={String(totalLeads)} detail="across your workspace" /><TeamStat icon={Check} label="Calls logged" value={String(totalCalls)} detail="all time" /></section><Surface><SurfaceHeader className="items-start"><div><SurfaceTitle>Sales team</SurfaceTitle><p className="mt-1 text-sm text-muted-foreground">{visibleMembers.length} members match your current view.</p></div><button type="button" onClick={() => setStatus("All statuses")} className="text-sm font-semibold text-muted-foreground hover:text-foreground">View activity</button></SurfaceHeader><div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="relative min-w-0 flex-1"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} /><input aria-label="Search team" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="h-11 w-full rounded-full border border-input bg-background pr-4 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" /></label><div className="flex gap-2"><FilterMenu label="Role" value={role} options={["All roles", ...teamRoles]} onChange={(value) => setRole(value as typeof role)} /><FilterMenu label="Status" value={status} options={["All statuses", "Active", "Invited", "Inactive"]} onChange={(value) => setStatus(value as typeof status)} /></div></div></Surface><Surface className="hidden overflow-hidden p-0 md:block"><div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-220 text-left"><thead className="border-b border-border bg-muted/60 text-[11px] text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Member</th><th className="px-4 py-3 font-medium">Role</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Leads</th><th className="px-4 py-3 font-medium">Calls</th><th className="px-4 py-3 font-medium">Conversion</th><th className="px-4 py-3 font-medium">Revenue</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead><tbody className="divide-y divide-border">{visibleMembers.map((member) => <TeamRow key={member.id} member={member} onManage={setSelectedMember} />)}</tbody></table></div></Surface><div className="space-y-3 md:hidden">{visibleMembers.map((member) => <TeamCard key={member.id} member={member} onManage={setSelectedMember} />)}</div><InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} roles={roles} /><ManageDialog key={selectedMember?.id} member={selectedMember} roles={roles} teammates={initialMembers} onClose={() => setSelectedMember(null)} /></div>;
}

function TeamStat({ icon: Icon, label, value, detail }: { icon: typeof UsersRound; label: string; value: string; detail: string }) { return <Surface className="p-4"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="grid size-9 place-items-center rounded-full bg-accent text-primary"><Icon className="size-4" strokeWidth={1.75} /></span></div><p className="mt-5 text-[32px] leading-none font-bold tracking-tight">{value}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></Surface>; }


function MemberIdentity({ member }: { member: TeamMember }) { return <div className="flex min-w-52 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-primary">{member.initials}</span><span className="min-w-0"><span className="block truncate text-sm font-bold">{member.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{member.email}</span></span></div>; }

function TeamRow({ member, onManage }: { member: TeamMember; onManage: (member: TeamMember) => void }) { return <tr className="text-sm transition-colors hover:bg-muted/55"><td className="px-5 py-3.5"><MemberIdentity member={member} /></td><td className="px-4 py-3.5"><span className={cn(chipClass, (roleClasses[member.role] ?? fallbackRoleClass))}>{member.role}</span></td><td className="px-4 py-3.5"><span className={cn(chipClass, statusClasses[member.status])}>{member.status}</span><p className="mt-1 text-xs text-muted-foreground">{member.lastActive}</p></td><td className="px-4 py-3.5 font-semibold tabular-nums">{member.leads}</td><td className="px-4 py-3.5 font-semibold tabular-nums">{member.calls}</td><td className="px-4 py-3.5 font-semibold text-success">{member.conversion}</td><td className="px-4 py-3.5 font-semibold tabular-nums">{member.revenue}</td><td className="px-5 py-3.5 text-right"><button type="button" onClick={() => onManage(member)} aria-label={`Manage ${member.name}`} className={cn(softPillClass, "grid size-11 place-items-center rounded-full p-0")}><MoreHorizontal className="size-5" strokeWidth={1.75} /></button></td></tr>; }

function TeamCard({ member, onManage }: { member: TeamMember; onManage: (member: TeamMember) => void }) { return <Surface className="p-4"><div className="flex items-start justify-between gap-3"><MemberIdentity member={member} /><button type="button" onClick={() => onManage(member)} aria-label={`Manage ${member.name}`} className={cn(softPillClass, "grid size-11 shrink-0 place-items-center rounded-full p-0")}><MoreHorizontal className="size-5" strokeWidth={1.75} /></button></div><div className="mt-4 flex flex-wrap gap-2"><span className={cn(chipClass, (roleClasses[member.role] ?? fallbackRoleClass))}>{member.role}</span><span className={cn(chipClass, statusClasses[member.status])}>{member.status}</span></div><div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4"><div><p className="text-xs text-muted-foreground">Leads</p><p className="mt-1 text-sm font-bold tabular-nums">{member.leads}</p></div><div><p className="text-xs text-muted-foreground">Calls</p><p className="mt-1 text-sm font-bold tabular-nums">{member.calls}</p></div><div><p className="text-xs text-muted-foreground">Won</p><p className="mt-1 text-sm font-bold text-success">{member.conversion}</p></div></div></Surface>; }

function InviteDialog({ open, onOpenChange, roles }: { open: boolean; onOpenChange: (open: boolean) => void; roles: RoleOption[] }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleCode, setRoleCode] = useState(roles[0]?.code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const close = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setFullName("");
      setEmail("");
      setRoleCode(roles[0]?.code ?? "");
      setError(null);
    }
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await inviteTeamMemberAction({ fullName, email, roleCode });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      close(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={close} title="Invite teammate" description="Give a teammate access to the sales workspace.">
      <div className="space-y-4 px-5 pb-5">
        <label className="block text-sm font-bold">
          Full name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="e.g. Hana Girma" />
        </label>
        <label className="block text-sm font-bold">
          Work email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50" placeholder="name@company.com" />
        </label>
        <label className="block text-sm font-bold">
          Role
          <select value={roleCode} onChange={(event) => setRoleCode(event.target.value)} className="mt-2 h-11 w-full appearance-none rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            {roles.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
        <button type="button" disabled={pending || !fullName.trim() || !email.trim() || !roleCode} onClick={submit} className={cn(primaryPillClass, "h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-50")}>
          <Mail className="size-4" strokeWidth={1.75} />
          {pending ? "Sending…" : "Send invitation"}
        </button>
      </div>
    </ResponsiveDialog>
  );
}

function ManageDialog({ member, roles, teammates, onClose }: { member: TeamMember | null; roles: RoleOption[]; teammates: TeamMember[]; onClose: () => void }) {
  const [roleCode, setRoleCode] = useState(member?.roleCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const router = useRouter();

  if (!member) return null;

  const submitRole = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await assignUserRoleAction({ userCode: member.id, roleCode });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      setSaved(true);
    });
  };

  return (
    <ResponsiveDialog open={Boolean(member)} onOpenChange={(open) => !open && onClose()} title={`Manage ${member.name}`} description="Update role, assignment access, or account status.">
      <div className="space-y-3 px-5 pb-5">
        <div className="rounded-2xl border border-border p-3">
          <label className="block text-xs font-bold text-muted-foreground" htmlFor="member-role">
            Role
          </label>
          <div className="mt-2 flex items-center gap-2">
            <select id="member-role" value={roleCode} onChange={(event) => setRoleCode(event.target.value)} className="h-11 flex-1 appearance-none rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
              {roles.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            <button type="button" disabled={pending || roleCode === member.roleCode} onClick={submitRole} className={cn(softPillClass, "h-11 shrink-0 gap-1.5 px-4 text-xs disabled:pointer-events-none disabled:opacity-50")}>
              <ShieldCheck className="size-3.5" strokeWidth={1.75} />
              {pending ? "Saving…" : "Change role"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
          {saved && !error ? <p className="mt-2 text-xs font-semibold text-success">Role updated.</p> : null}
        </div>
        {assignmentsOpen ? (
          <ManageAssignmentsPanel member={member} teammates={teammates} onDone={() => setAssignmentsOpen(false)} />
        ) : (
          <button type="button" onClick={() => setAssignmentsOpen(true)} className={cn(softPillClass, "h-11 w-full justify-start px-4 text-sm")}>
            <UsersRound className="size-4" strokeWidth={1.75} />
            Manage assignments
          </button>
        )}
        <button type="button" onClick={onClose} className={cn(primaryPillClass, "h-11 w-full text-sm")}>
          <Check className="size-4" strokeWidth={2.25} />
          Done
        </button>
      </div>
    </ResponsiveDialog>
  );
}

type AssignedLead = { code: string; name: string; business: string; stage: string };

function ManageAssignmentsPanel({ member, teammates, onDone }: { member: TeamMember; teammates: TeamMember[]; onDone: () => void }) {
  const [leads, setLeads] = useState<AssignedLead[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toUserCode, setToUserCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitPending, startSubmit] = useTransition();
  const router = useRouter();
  const otherMembers = teammates.filter((teammate) => teammate.id !== member.id);

  useEffect(() => {
    let cancelled = false;
    getMemberAssignedLeadsAction(member.id).then((result) => {
      if (cancelled) return;
      setLeads(result.ok ? result.leads : []);
      if (!result.ok) setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  if (leads === null) {
    return (
      <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
        Loading {member.name}&apos;s assigned leads…
      </div>
    );
  }

  const toggle = (code: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const submit = () => {
    setError(null);
    startSubmit(async () => {
      const result = await reassignClientsAction({ clientCodes: [...selected], toUserCode });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border p-3">
      <p className="text-xs font-bold text-muted-foreground">{leads.length} lead{leads.length === 1 ? "" : "s"} assigned to {member.name}</p>
      {leads.length ? (
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {leads.map((lead) => (
            <li key={lead.code}>
              <label className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
                <input type="checkbox" checked={selected.has(lead.code)} onChange={() => toggle(lead.code)} className="size-4 rounded border-input accent-primary" />
                <span className="min-w-0 flex-1 truncate">
                  {lead.name} <span className="text-xs text-muted-foreground">· {lead.business}</span>
                </span>
                <span className={cn(chipClass, "shrink-0 bg-muted text-muted-foreground")}>{lead.stage}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No leads are currently assigned to this teammate.</p>
      )}
      {leads.length ? (
        <div className="flex items-center gap-2">
          <select value={toUserCode} onChange={(event) => setToUserCode(event.target.value)} className="h-10 flex-1 appearance-none rounded-full border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <option value="">Reassign to…</option>
            {otherMembers.map((teammate) => (
              <option key={teammate.id} value={teammate.id}>
                {teammate.name}
              </option>
            ))}
          </select>
          <button type="button" disabled={submitPending || !toUserCode || selected.size === 0} onClick={submit} className={cn(primaryPillClass, "h-10 shrink-0 px-4 text-xs disabled:pointer-events-none disabled:opacity-50")}>
            {submitPending ? "Moving…" : `Move ${selected.size || ""}`}
          </button>
        </div>
      ) : null}
      {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
