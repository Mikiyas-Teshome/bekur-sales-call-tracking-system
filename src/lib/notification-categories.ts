export type NotificationCategory = {
  id: string;
  label: string;
  detail: string;
  defaultPush: boolean;
  defaultEmail: boolean;
};

export const notificationCategories: NotificationCategory[] = [
  { id: "overdue", label: "Overdue follow-ups", detail: "Get notified when a lead's follow-up date passes without a call.", defaultPush: true, defaultEmail: false },
  { id: "new-lead", label: "New leads", detail: "Get notified the moment a campaign produces a new lead.", defaultPush: true, defaultEmail: false },
  { id: "assignment", label: "Assignment changes", detail: "Get notified when a lead is assigned or reassigned to you.", defaultPush: true, defaultEmail: false },
  { id: "weekly-digest", label: "Weekly performance digest", detail: "A Monday summary of calls, conversions, and revenue.", defaultPush: false, defaultEmail: true },
  { id: "team-activity", label: "Team activity", detail: "Get notified when a teammate closes a deal.", defaultPush: false, defaultEmail: false },
];

export function categoryDefaults(id: string): { channelPush: boolean; channelEmail: boolean } {
  const category = notificationCategories.find((entry) => entry.id === id);
  return { channelPush: category?.defaultPush ?? false, channelEmail: category?.defaultEmail ?? false };
}
