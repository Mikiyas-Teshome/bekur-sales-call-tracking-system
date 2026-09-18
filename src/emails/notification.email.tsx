import { Text } from "@react-email/components";
import { EmailButton, EmailShell, emailHeadingStyle, emailTextStyle } from "./components/email-shell";

export function NotificationEmail({ title, body, actionUrl, actionLabel }: { title: string; body: string; actionUrl?: string; actionLabel?: string }) {
  return (
    <EmailShell preview={title}>
      <Text style={emailHeadingStyle}>{title}</Text>
      <Text style={emailTextStyle}>{body}</Text>
      {actionUrl ? <EmailButton href={actionUrl}>{actionLabel ?? "Open Bekur"}</EmailButton> : null}
    </EmailShell>
  );
}

export default NotificationEmail;
