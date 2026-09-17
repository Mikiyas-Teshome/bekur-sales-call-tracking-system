export type LeadStage = "New Lead" | "Attempted Contact" | "Qualified" | "Demo Scheduled" | "Proposal Sent" | "Closed Won" | "Closed Lost";

export type Lead = {
  id: string;
  initials: string;
  name: string;
  business: string;
  phone: string;
  campaign: string;
  project: string;
  stage: LeadStage;
  assignee: string;
  lastCall: string;
  nextFollowUp: string;
  callCount: number;
  attention: "overdue" | "today" | "clear";
};

export const leads: Lead[] = [
  { id: "CL-0248", initials: "MT", name: "Mekdes Tadesse", business: "Addis Family Clinic", phone: "+251 91 248 7310", campaign: "September Messages", project: "Clinic Growth", stage: "Proposal Sent", assignee: "Amanuel M.", lastCall: "Sep 14", nextFollowUp: "2 days overdue", callCount: 6, attention: "overdue" },
  { id: "CL-0247", initials: "SB", name: "Samuel Bekele", business: "Lalibela Medical Center", phone: "+251 92 344 1908", campaign: "Demo Requests", project: "Clinic Growth", stage: "Demo Scheduled", assignee: "Amanuel M.", lastCall: "Sep 15", nextFollowUp: "Today", callCount: 4, attention: "today" },
  { id: "CL-0246", initials: "HG", name: "Hana Girma", business: "Orbit Dental Care", phone: "+251 93 809 4162", campaign: "September Messages", project: "Clinic Growth", stage: "Qualified", assignee: "Saron A.", lastCall: "Sep 13", nextFollowUp: "Today", callCount: 3, attention: "today" },
  { id: "CL-0245", initials: "YK", name: "Yared Kebede", business: "Betezata Clinic", phone: "+251 91 555 8201", campaign: "Referral Partners", project: "Partner Growth", stage: "Attempted Contact", assignee: "Amanuel M.", lastCall: "Sep 12", nextFollowUp: "Sep 18", callCount: 2, attention: "clear" },
  { id: "CL-0244", initials: "MW", name: "Meron Wondimu", business: "Nile Healthcare", phone: "+251 92 788 3409", campaign: "Demo Requests", project: "Clinic Growth", stage: "New Lead", assignee: "Unassigned", lastCall: "No calls", nextFollowUp: "New today", callCount: 0, attention: "today" },
  { id: "CL-0243", initials: "SA", name: "Selamawit Abebe", business: "Mekane Clinic", phone: "+251 93 402 5176", campaign: "September Messages", project: "Clinic Growth", stage: "Qualified", assignee: "Amanuel M.", lastCall: "Sep 11", nextFollowUp: "Sep 20", callCount: 3, attention: "clear" },
];

export const callOutcomes = ["Answered - Interested", "Answered - Requested Demo", "Callback Requested", "No Answer", "Follow-up Scheduled", "Converted / Sale"];

export const pipelineStages = ["Attempted Contact", "Contacted", "Qualified", "Demo Scheduled", "Proposal Sent", "Closed Won"];

export const callHistory = [
  { id: "call-06", outcome: "Follow-up Scheduled", stage: "Proposal Sent", note: "Asked for a final proposal that includes the two additional branches. She will review it with her partner on Thursday.", date: "Sep 14, 2026 · 2:40 PM", value: "$4,200", rep: "Amanuel M." },
  { id: "call-05", outcome: "Answered - Interested", stage: "Qualified", note: "They are actively comparing clinic-management systems and asked how migration from their current records works.", date: "Sep 10, 2026 · 11:16 AM", value: null, rep: "Amanuel M." },
  { id: "call-04", outcome: "Answered - Requested Demo", stage: "Demo Scheduled", note: "Booked a product walkthrough for the clinic administrator and lead doctor.", date: "Sep 7, 2026 · 4:05 PM", value: null, rep: "Saron A." },
  { id: "call-03", outcome: "No Answer", stage: "Attempted Contact", note: "No answer. A WhatsApp follow-up was sent after the call.", date: "Sep 5, 2026 · 10:30 AM", value: null, rep: "Amanuel M." },
];

export function leadById(id: string) {
  return leads.find((lead) => lead.id === id) ?? leads[0];
}

export type AssignmentEvent = { from: string; to: string; by: string; date: string };

export const assignmentHistory: Record<string, AssignmentEvent[]> = {
  "CL-0248": [
    { from: "Unassigned", to: "Saron A.", by: "Amanuel M.", date: "Sep 3, 2026" },
    { from: "Saron A.", to: "Amanuel M.", by: "Amanuel M.", date: "Sep 9, 2026" },
  ],
  "CL-0246": [{ from: "Unassigned", to: "Saron A.", by: "Amanuel M.", date: "Sep 4, 2026" }],
};

export function assignmentHistoryFor(lead: Lead): AssignmentEvent[] {
  return assignmentHistory[lead.id] ?? [{ from: "Unassigned", to: lead.assignee, by: "Amanuel M.", date: "First contact" }];
}

export type AssignableRep = { code: string; name: string; initials: string; role: string; activeLeads: number };

export const assignableReps: AssignableRep[] = [
  { code: "USR-DEMO1", name: "Amanuel M.", initials: "AM", role: "Administrator", activeLeads: 4 },
  { code: "USR-DEMO2", name: "Saron A.", initials: "SA", role: "Sales Rep", activeLeads: 1 },
  { code: "USR-DEMO3", name: "Yared K.", initials: "YK", role: "Sales Manager", activeLeads: 0 },
  { code: "USR-DEMO4", name: "Marta H.", initials: "MH", role: "Sales Rep", activeLeads: 0 },
];
