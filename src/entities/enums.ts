export enum ProjectStatus {
  ACTIVE = "Active",
  PLANNING = "Planning",
  ARCHIVED = "Archived",
}

export enum CampaignPlatform {
  FACEBOOK = "Facebook",
  INSTAGRAM = "Instagram",
  REFERRAL = "Referral",
  ORGANIC = "Organic",
}

export enum CampaignStatus {
  ACTIVE = "Active",
  PAUSED = "Paused",
  ENDED = "Ended",
}

export enum PipelineStage {
  NEW_LEAD = "New Lead",
  ATTEMPTED_CONTACT = "Attempted Contact",
  CONTACTED = "Contacted",
  QUALIFIED = "Qualified",
  NURTURING = "Nurturing",
  DEMO_SCHEDULED = "Demo Scheduled",
  DEMO_COMPLETED = "Demo Completed",
  PROPOSAL_SENT = "Proposal Sent",
  NEGOTIATION = "Negotiation",
  ON_HOLD = "On Hold",
  CLOSED_WON = "Closed Won",
  CLOSED_LOST = "Closed Lost",
  UNQUALIFIED = "Unqualified",
  DO_NOT_CONTACT = "Do Not Contact",
}

export enum CallOutcome {
  ANSWERED_INTERESTED = "Answered - Interested",
  ANSWERED_REQUESTED_DEMO = "Answered - Requested Demo",
  ANSWERED_REQUESTED_INFO = "Answered - Requested Info",
  ANSWERED_NOT_INTERESTED = "Answered - Not Interested",
  ANSWERED_NOT_DECISION_MAKER = "Answered - Not Decision Maker",
  ANSWERED_USING_COMPETITOR = "Answered - Using Competitor",
  ANSWERED_NOT_NOW = "Answered - Not Now",
  CALLBACK_REQUESTED = "Callback Requested",
  FOLLOW_UP_SCHEDULED = "Follow-up Scheduled",
  NO_ANSWER = "No Answer",
  BUSY = "Busy",
  VOICEMAIL_LEFT = "Voicemail Left",
  HUNG_UP = "Hung Up",
  WRONG_NUMBER = "Wrong Number",
  NUMBER_UNREACHABLE = "Number Unreachable",
  CONVERTED_SALE = "Converted / Sale",
  DO_NOT_CALL = "Do Not Call",
}

// Grouped lists drive the <optgroup>s in the log-call form. Every enum value must appear in exactly one group.
export const pipelineStageGroups: { label: string; stages: PipelineStage[] }[] = [
  { label: "Early", stages: [PipelineStage.NEW_LEAD, PipelineStage.ATTEMPTED_CONTACT, PipelineStage.CONTACTED] },
  { label: "Working", stages: [PipelineStage.QUALIFIED, PipelineStage.NURTURING, PipelineStage.DEMO_SCHEDULED, PipelineStage.DEMO_COMPLETED, PipelineStage.PROPOSAL_SENT, PipelineStage.NEGOTIATION, PipelineStage.ON_HOLD] },
  { label: "Closed", stages: [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST, PipelineStage.UNQUALIFIED, PipelineStage.DO_NOT_CONTACT] },
];

export const callOutcomeGroups: { label: string; outcomes: CallOutcome[] }[] = [
  {
    label: "Answered",
    outcomes: [
      CallOutcome.ANSWERED_INTERESTED,
      CallOutcome.ANSWERED_REQUESTED_DEMO,
      CallOutcome.ANSWERED_REQUESTED_INFO,
      CallOutcome.ANSWERED_NOT_NOW,
      CallOutcome.ANSWERED_NOT_DECISION_MAKER,
      CallOutcome.ANSWERED_USING_COMPETITOR,
      CallOutcome.ANSWERED_NOT_INTERESTED,
    ],
  },
  { label: "Scheduled", outcomes: [CallOutcome.CALLBACK_REQUESTED, CallOutcome.FOLLOW_UP_SCHEDULED] },
  { label: "Not reached", outcomes: [CallOutcome.NO_ANSWER, CallOutcome.BUSY, CallOutcome.VOICEMAIL_LEFT, CallOutcome.HUNG_UP, CallOutcome.WRONG_NUMBER, CallOutcome.NUMBER_UNREACHABLE] },
  { label: "Final", outcomes: [CallOutcome.CONVERTED_SALE, CallOutcome.DO_NOT_CALL] },
];

// Stages where the lead is no longer being worked; excluded from follow-up queues and attention counts.
export const closedPipelineStages: PipelineStage[] = [PipelineStage.CLOSED_WON, PipelineStage.CLOSED_LOST, PipelineStage.UNQUALIFIED, PipelineStage.DO_NOT_CONTACT];

// Active stages between first contact and close, in funnel order — used for the pipeline momentum chart.
export const midFunnelStages: PipelineStage[] = [
  PipelineStage.ATTEMPTED_CONTACT,
  PipelineStage.CONTACTED,
  PipelineStage.QUALIFIED,
  PipelineStage.NURTURING,
  PipelineStage.DEMO_SCHEDULED,
  PipelineStage.DEMO_COMPLETED,
  PipelineStage.PROPOSAL_SENT,
  PipelineStage.NEGOTIATION,
];

// Outcomes where a person was actually reached — drives the contact-rate KPI.
export const answeredOutcomes: CallOutcome[] = [
  CallOutcome.ANSWERED_INTERESTED,
  CallOutcome.ANSWERED_REQUESTED_DEMO,
  CallOutcome.ANSWERED_REQUESTED_INFO,
  CallOutcome.ANSWERED_NOT_INTERESTED,
  CallOutcome.ANSWERED_NOT_DECISION_MAKER,
  CallOutcome.ANSWERED_USING_COMPETITOR,
  CallOutcome.ANSWERED_NOT_NOW,
  CallOutcome.CALLBACK_REQUESTED,
  CallOutcome.FOLLOW_UP_SCHEDULED,
  CallOutcome.HUNG_UP,
  CallOutcome.CONVERTED_SALE,
  CallOutcome.DO_NOT_CALL,
];

export type StatusTone = "primary" | "success" | "warning" | "destructive" | "muted" | "accent";

export function pipelineStageTone(stage: PipelineStage | string): StatusTone {
  switch (stage) {
    case PipelineStage.NEW_LEAD:
      return "accent";
    case PipelineStage.ATTEMPTED_CONTACT:
    case PipelineStage.ON_HOLD:
      return "muted";
    case PipelineStage.QUALIFIED:
    case PipelineStage.DEMO_COMPLETED:
    case PipelineStage.CLOSED_WON:
      return "success";
    case PipelineStage.PROPOSAL_SENT:
    case PipelineStage.NEGOTIATION:
    case PipelineStage.NURTURING:
      return "warning";
    case PipelineStage.CLOSED_LOST:
    case PipelineStage.UNQUALIFIED:
    case PipelineStage.DO_NOT_CONTACT:
      return "destructive";
    default:
      return "primary";
  }
}

export function callOutcomeTone(outcome: CallOutcome | string): StatusTone {
  switch (outcome) {
    case CallOutcome.CONVERTED_SALE:
    case CallOutcome.ANSWERED_INTERESTED:
    case CallOutcome.ANSWERED_REQUESTED_DEMO:
      return "success";
    case CallOutcome.NO_ANSWER:
    case CallOutcome.BUSY:
    case CallOutcome.VOICEMAIL_LEFT:
      return "muted";
    case CallOutcome.CALLBACK_REQUESTED:
    case CallOutcome.FOLLOW_UP_SCHEDULED:
    case CallOutcome.ANSWERED_NOT_NOW:
    case CallOutcome.ANSWERED_NOT_DECISION_MAKER:
      return "warning";
    case CallOutcome.ANSWERED_NOT_INTERESTED:
    case CallOutcome.ANSWERED_USING_COMPETITOR:
    case CallOutcome.HUNG_UP:
    case CallOutcome.WRONG_NUMBER:
    case CallOutcome.NUMBER_UNREACHABLE:
    case CallOutcome.DO_NOT_CALL:
      return "destructive";
    default:
      return "primary";
  }
}

export enum AuthTokenType {
  INVITE = "invite",
  PASSWORD_RESET = "password_reset",
}
