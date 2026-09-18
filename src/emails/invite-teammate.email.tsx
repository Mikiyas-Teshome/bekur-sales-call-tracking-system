import { Text } from "@react-email/components";
import { EmailButton, EmailShell, emailHeadingStyle, emailMutedStyle, emailTextStyle } from "./components/email-shell";

export function InviteTeammateEmail({ fullName, inviterName, roleName, activateUrl }: { fullName: string; inviterName: string; roleName: string; activateUrl: string }) {
  return (
    <EmailShell preview={`${inviterName} invited you to join Bekur`}>
      <Text style={emailHeadingStyle}>You&apos;re invited to Bekur</Text>
      <Text style={emailTextStyle}>
        Hi {fullName}, {inviterName} has invited you to join the Bekur sales workspace as a <strong>{roleName}</strong>. Set your password to get started.
      </Text>
      <EmailButton href={activateUrl}>Activate your account</EmailButton>
      <Text style={emailMutedStyle}>This link expires in 7 days. If the button doesn&apos;t work, paste this into your browser:</Text>
      <Text style={{ ...emailMutedStyle, wordBreak: "break-all" }}>{activateUrl}</Text>
    </EmailShell>
  );
}

export default InviteTeammateEmail;
