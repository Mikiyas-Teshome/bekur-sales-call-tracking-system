"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, Camera, Check, KeyRound, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Surface, SurfaceHeader, SurfaceTitle } from "@/components/shared/surface";
import { chipClass, primaryPillClass } from "@/components/shared/pill";
import { cn } from "@/lib/utils";
import { notificationPreferences } from "@/features/settings/fixtures/settings.fixture";
import { updateProfileAction, changePasswordAction } from "@/actions/profile";

const settingsTabs = ["Profile", "Notifications", "Security"] as const;
type SettingsTab = (typeof settingsTabs)[number];

const fieldClass = "mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Profile = { fullName: string; email: string; phone: string | null; role: string; code: string };

export function SettingsWorkspace({ profile }: { profile: Profile }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");

  return (
    <div className="mx-auto max-w-4xl space-y-4 lg:space-y-5">
      <section className="pt-2 lg:pt-0">
        <p className="text-sm font-medium text-primary">Account & workspace</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, notifications, and security.</p>
      </section>

      <div className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1 scrollbar-none">
        <div className="flex min-w-max gap-1">
          {settingsTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn("h-9 rounded-full px-4 text-xs font-semibold transition-colors", activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Profile" ? <ProfilePanel profile={profile} /> : null}
      {activeTab === "Notifications" ? <NotificationsPanel /> : null}
      {activeTab === "Security" ? <SecurityPanel /> : null}
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfilePanel({ profile }: { profile: Profile }) {
  const { update } = useSession();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction({ fullName, email, phone });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await update({ name: result.fullName, email: result.email });
      router.refresh();
      setSaved(true);
    });
  };

  return (
    <Surface>
      <SurfaceHeader>
        <SurfaceTitle>Profile</SurfaceTitle>
      </SurfaceHeader>
      <div className="mt-5 flex items-center gap-4">
        <div className="relative">
          <span className="grid size-16 place-items-center rounded-full bg-accent text-lg font-bold text-primary">{initialsOf(fullName || profile.fullName)}</span>
          <button type="button" aria-label="Change profile photo" className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full bg-ink text-canvas-foreground shadow-float">
            <Camera className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <div>
          <p className="text-base font-bold">{fullName || profile.fullName}</p>
          <span className={cn(chipClass, "mt-1 bg-primary/12 text-primary")}>{profile.role}</span>
        </div>
      </div>
      <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Full name
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={fieldClass} />
        </label>
        <label className="block text-sm font-bold">
          Work email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
        </label>
        <label className="block text-sm font-bold">
          Phone number
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+251 91 200 4488" className={fieldClass} />
        </label>
        <label className="block text-sm font-bold">
          Role
          <input value={profile.role} disabled className={cn(fieldClass, "text-muted-foreground")} />
        </label>
      </div>
      {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error}</p> : null}
      {saved && !error ? <p className="mt-4 text-sm font-semibold text-success">Profile updated.</p> : null}
      <button type="button" disabled={pending || !fullName.trim() || !email.trim()} onClick={submit} className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm disabled:pointer-events-none disabled:opacity-50")}>
        <Check className="size-4" strokeWidth={2.25} />
        {pending ? "Saving…" : "Save profile"}
      </button>
    </Surface>
  );
}

function NotificationsPanel() {
  const [preferences, setPreferences] = useState(notificationPreferences);
  const toggle = (id: string) => setPreferences((current) => current.map((preference) => (preference.id === id ? { ...preference, enabled: !preference.enabled } : preference)));

  return (
    <Surface>
      <SurfaceHeader>
        <SurfaceTitle>Notifications</SurfaceTitle>
        <span className="grid size-10 place-items-center rounded-full bg-accent text-primary">
          <Bell className="size-4" strokeWidth={1.75} />
        </span>
      </SurfaceHeader>
      <ul className="mt-5 divide-y divide-border">
        {preferences.map((preference) => (
          <li key={preference.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-bold">{preference.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{preference.detail}</p>
            </div>
            <Switch checked={preference.enabled} onCheckedChange={() => toggle(preference.id)} aria-label={preference.label} />
          </li>
        ))}
      </ul>
    </Surface>
  );
}

function SecurityPanel() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    setSaved(false);
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    startTransition(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    });
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <Surface>
        <SurfaceHeader>
          <SurfaceTitle>Password</SurfaceTitle>
          <span className="grid size-10 place-items-center rounded-full bg-accent text-primary">
            <KeyRound className="size-4" strokeWidth={1.75} />
          </span>
        </SurfaceHeader>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold sm:col-span-2">
            Current password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="••••••••" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold">
            New password
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="••••••••" className={fieldClass} />
          </label>
          <label className="block text-sm font-bold">
            Confirm new password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className={fieldClass} />
          </label>
        </div>
        {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error}</p> : null}
        {saved && !error ? <p className="mt-4 text-sm font-semibold text-success">Password updated.</p> : null}
        <button type="button" disabled={pending || !currentPassword || !newPassword || !confirmPassword} onClick={submit} className={cn(primaryPillClass, "mt-6 h-11 px-5 text-sm disabled:pointer-events-none disabled:opacity-50")}>
          <Check className="size-4" strokeWidth={2.25} />
          {pending ? "Updating…" : "Update password"}
        </button>
      </Surface>

      <Surface className="flex items-center gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-primary">
          <ShieldCheck className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Two-factor authentication</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Add an extra step when signing in from a new device.</p>
        </div>
        <Switch aria-label="Two-factor authentication" />
      </Surface>
    </div>
  );
}
