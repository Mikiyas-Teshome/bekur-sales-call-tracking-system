import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function EmailShell({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f2f4f8", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 24, maxWidth: 480, margin: "0 auto", overflow: "hidden", boxShadow: "0 12px 32px -12px rgba(22, 94, 211, 0.25)" }}>
          <Section style={{ padding: "32px 32px 0" }}>
            <Img src={`${appUrl}/bekur-logo.svg`} width="40" height="40" alt="Bekur" />
          </Section>
          <Section style={{ padding: "16px 32px 32px" }}>{children}</Section>
          <Hr style={{ borderColor: "#e6ebf5", margin: 0 }} />
          <Section style={{ padding: "20px 32px" }}>
            <Text style={{ fontSize: 12, color: "#8792a6", margin: 0, lineHeight: "18px" }}>Sent by Bekur Sales Workspace. If you didn&apos;t expect this email, you can safely ignore it.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "24px 0" }}>
      <tbody>
        <tr>
          <td style={{ borderRadius: 999, backgroundColor: "#165ed3" }}>
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: "14px 28px",
                borderRadius: 999,
                backgroundColor: "#165ed3",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export const emailHeadingStyle = { fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" };
export const emailTextStyle = { fontSize: 15, lineHeight: "24px", color: "#3c4658", margin: "0 0 12px" };
export const emailMutedStyle = { fontSize: 13, lineHeight: "20px", color: "#8792a6", margin: "0 0 4px" };
