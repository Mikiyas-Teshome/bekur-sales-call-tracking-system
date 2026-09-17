import { SettingsWorkspace } from "@/features/settings/components/settings-workspace";
import { requireUser } from "@/lib/require-user";
import { getProfile } from "@/services/profile.service";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return <SettingsWorkspace profile={profile} />;
}
