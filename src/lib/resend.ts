import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder_key");

export async function sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement }) {
  const from = process.env.RESEND_FROM_EMAIL ?? "Bekur <onboarding@resend.dev>";
  const result = await resend.emails.send({ from, to, subject, react });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
