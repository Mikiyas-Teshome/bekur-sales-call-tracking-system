export const reportPeriods = ["This month", "Last 30 days", "This quarter", "Year to date"];
export const reportTabs = ["Overview", "Conversion", "Team performance"];

export const reportSummary = [
  { label: "Total leads", value: "248", delta: "+12.0%", detail: "vs previous period" },
  { label: "Calls made", value: "386", delta: "+18.4%", detail: "across 4 reps" },
  { label: "Closed won", value: "46", delta: "+9.5%", detail: "18.6% conversion" },
  { label: "Revenue", value: "$42,800", delta: "+22.6%", detail: "$930 avg deal" },
];

export const revenueTrend = [
  { label: "Jun 1", revenue: 42, leads: 28 },
  { label: "Jun 5", revenue: 51, leads: 35 },
  { label: "Jun 9", revenue: 46, leads: 31 },
  { label: "Jun 13", revenue: 64, leads: 40 },
  { label: "Jun 17", revenue: 59, leads: 43 },
  { label: "Jun 21", revenue: 78, leads: 49 },
  { label: "Jun 25", revenue: 71, leads: 55 },
  { label: "Jun 30", revenue: 92, leads: 63 },
];

export const pipelineFunnel = [
  { label: "New Lead", count: 248, rate: "100%", width: "100%" },
  { label: "Contacted", count: 159, rate: "64%", width: "74%" },
  { label: "Qualified", count: 91, rate: "37%", width: "53%" },
  { label: "Demo Completed", count: 63, rate: "25%", width: "38%" },
  { label: "Proposal Sent", count: 52, rate: "21%", width: "31%" },
  { label: "Closed Won", count: 46, rate: "19%", width: "27%" },
];

export const campaignPerformance = [
  { name: "September Messages", project: "Clinic Growth", leads: 112, calls: 184, won: 24, revenue: "$22,320", roas: "4.8x", share: 76 },
  { name: "Demo Requests", project: "Clinic Growth", leads: 79, calls: 128, won: 15, revenue: "$13,950", roas: "3.9x", share: 52 },
  { name: "Referral Partners", project: "Partner Growth", leads: 57, calls: 74, won: 7, revenue: "$6,530", roas: "5.2x", share: 34 },
];

export const outcomeMix = [
  { label: "Interested", count: 92, percentage: 35, tone: "chart-1" },
  { label: "Requested demo", count: 68, percentage: 26, tone: "chart-2" },
  { label: "Follow-up scheduled", count: 57, percentage: 22, tone: "chart-3" },
  { label: "No answer", count: 43, percentage: 17, tone: "chart-5" },
];

export const repLeaderboard = [
  { initials: "AM", name: "Amanuel Mekonnen", role: "Administrator", calls: 118, contactRate: "72%", won: 18, revenue: "$16,740", progress: 86 },
  { initials: "SA", name: "Saron Abebe", role: "Sales Rep", calls: 104, contactRate: "68%", won: 15, revenue: "$13,950", progress: 73 },
  { initials: "YK", name: "Yared Kebede", role: "Sales Rep", calls: 92, contactRate: "61%", won: 9, revenue: "$8,370", progress: 58 },
  { initials: "MH", name: "Marta Haile", role: "Sales Rep", calls: 72, contactRate: "55%", won: 4, revenue: "$3,740", progress: 41 },
];

export const activityHeatmap = [
  [0, 1, 2, 3, 1, 0, 2, 3, 2, 1, 3, 2],
  [1, 2, 3, 2, 3, 1, 0, 2, 3, 3, 2, 1],
  [2, 3, 2, 3, 3, 2, 1, 3, 2, 3, 3, 2],
  [0, 1, 1, 2, 1, 3, 2, 1, 2, 3, 1, 0],
  [1, 2, 3, 3, 2, 3, 2, 3, 3, 2, 3, 2],
];
