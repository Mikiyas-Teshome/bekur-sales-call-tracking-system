import { SettingsWorkspace } from "@/features/settings/components/settings-workspace";
import { requireUser } from "@/lib/require-user";
import { getProfile } from "@/services/profile.service";
import { listNotificationPreferences } from "@/services/notifications.service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, notificationPreferences] = await Promise.all([getProfile(user.id), listNotificationPreferences(user.id)]);

  return <SettingsWorkspace profile={profile} notificationPreferences={notificationPreferences} />;
}
