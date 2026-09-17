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
  QUALIFIED = "Qualified",
  DEMO_SCHEDULED = "Demo Scheduled",
  PROPOSAL_SENT = "Proposal Sent",
  CLOSED_WON = "Closed Won",
  CLOSED_LOST = "Closed Lost",
}

export enum CallOutcome {
  ANSWERED_INTERESTED = "Answered - Interested",
  ANSWERED_REQUESTED_DEMO = "Answered - Requested Demo",
  CALLBACK_REQUESTED = "Callback Requested",
  NO_ANSWER = "No Answer",
  FOLLOW_UP_SCHEDULED = "Follow-up Scheduled",
  CONVERTED_SALE = "Converted / Sale",
}

export const answeredOutcomes: CallOutcome[] = [
  CallOutcome.ANSWERED_INTERESTED,
  CallOutcome.ANSWERED_REQUESTED_DEMO,
  CallOutcome.CALLBACK_REQUESTED,
  CallOutcome.FOLLOW_UP_SCHEDULED,
  CallOutcome.CONVERTED_SALE,
];

export enum AuthTokenType {
  INVITE = "invite",
  PASSWORD_RESET = "password_reset",
}
