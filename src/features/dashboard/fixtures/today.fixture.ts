export type TodayScope = "My performance" | "Team performance" | "All workspace";

export const todayKpis = [
  { label: "Leads assigned", value: "248", delta: "+12", detail: "this week" },
  { label: "Calls made", value: "86", delta: "+18.4%", detail: "vs last week" },
  { label: "Contact rate", value: "64.2%", delta: "+4.8%", detail: "vs last week" },
  { label: "Revenue won", value: "$18,400", delta: "+22.6%", detail: "this month" },
];

export const todayFollowUps = [
  { initials: "MT", name: "Mekdes Tadesse", company: "Addis Family Clinic", stage: "Proposal Sent", due: "2 days overdue", tone: "destructive" },
  { initials: "SB", name: "Samuel Bekele", company: "Lalibela Medical Center", stage: "Demo Scheduled", due: "Due today", tone: "warning" },
  { initials: "HG", name: "Hana Girma", company: "Orbit Dental Care", stage: "Qualified", due: "Due today", tone: "warning" },
  { initials: "MW", name: "Meron Wondimu", company: "Nile Healthcare", stage: "New Lead", due: "Never called", tone: "primary" },
];

export const attentionItems = [
  { label: "Never called", count: 12, detail: "new leads waiting for first contact", tone: "primary" },
  { label: "Overdue follow-up", count: 7, detail: "conversations that need a response", tone: "destructive" },
  { label: "Gone quiet", count: 16, detail: "open leads with no recent activity", tone: "warning" },
];

export const recentCalls = [
  { initials: "SM", name: "Selamawit Mulu", outcome: "Converted / Sale", note: "Annual plan confirmed for one clinic.", time: "12 min ago", tone: "success" },
  { initials: "MW", name: "Meron Wondimu", outcome: "Requested Demo", note: "Interested in a two-branch walkthrough.", time: "48 min ago", tone: "primary" },
  { initials: "YK", name: "Yared Kebede", outcome: "Follow-up Scheduled", note: "Proposal review moved to Thursday.", time: "2 hr ago", tone: "warning" },
];

export const weeklyCalls = [42, 58, 38, 72, 55, 84, 66];
