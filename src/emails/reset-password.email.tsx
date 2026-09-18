import { Text } from "@react-email/components";
import { EmailButton, EmailShell, emailHeadingStyle, emailMutedStyle, emailTextStyle } from "./components/email-shell";

export function ResetPasswordEmail({ fullName, resetUrl }: { fullName: string; resetUrl: string }) {
  return (
    <EmailShell preview="Reset your Bekur password">
      <Text style={emailHeadingStyle}>Reset your password</Text>
      <Text style={emailTextStyle}>Hi {fullName}, we received a request to reset your Bekur password. Choose a new one below.</Text>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <Text style={emailMutedStyle}>This link expires in 1 hour. If you didn&apos;t request this, you can ignore this email — your password won&apos;t change.</Text>
      <Text style={{ ...emailMutedStyle, wordBreak: "break-all" }}>{resetUrl}</Text>
    </EmailShell>
  );
}

export default ResetPasswordEmail;
