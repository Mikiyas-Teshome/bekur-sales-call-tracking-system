"use server";

import { z } from "zod";
import { AuthTokenType } from "@/entities";
import { consumeAuthToken, createAuthToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/resend";
import { findUserByEmail, setUserPassword } from "@/services/auth.service";
import { ResetPasswordEmail } from "@/emails/reset-password.email";

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link is on its way.";

const activateSchema = z.object({ token: z.string().min(1), password: z.string().min(8, "Password must be at least 8 characters.") });

export async function activateAccountAction(input: z.infer<typeof activateSchema>) {
  const parsed = activateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const userId = await consumeAuthToken(parsed.data.token, AuthTokenType.INVITE);
  if (!userId) return { ok: false as const, error: "This activation link is invalid or has expired." };

  await setUserPassword(userId, parsed.data.password);
  return { ok: true as const };
}

const requestResetSchema = z.object({ email: z.email("Enter a valid email.") });

export async function requestPasswordResetAction(input: z.infer<typeof requestResetSchema>) {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return { ok: true as const, message: GENERIC_RESET_MESSAGE };

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !user.active) return { ok: true as const, message: GENERIC_RESET_MESSAGE };

  const rawToken = await createAuthToken(user.id, AuthTokenType.PASSWORD_RESET, PASSWORD_RESET_TOKEN_TTL_MS);
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${rawToken}`;

  try {
    await sendEmail({ to: user.email, subject: "Reset your Bekur password", react: ResetPasswordEmail({ fullName: user.fullName, resetUrl }) });
  } catch {
    // Deliberately swallowed: the response must stay generic regardless of delivery outcome to avoid leaking account existence.
  }

  return { ok: true as const, message: GENERIC_RESET_MESSAGE };
}

const resetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8, "Password must be at least 8 characters.") });

export async function resetPasswordAction(input: z.infer<typeof resetPasswordSchema>) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const userId = await consumeAuthToken(parsed.data.token, AuthTokenType.PASSWORD_RESET);
  if (!userId) return { ok: false as const, error: "This reset link is invalid or has expired." };

  await setUserPassword(userId, parsed.data.password);
  return { ok: true as const };
}

