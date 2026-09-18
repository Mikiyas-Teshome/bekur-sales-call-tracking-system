"use client";

import { KeyRound } from "lucide-react";
import { resetPasswordAction } from "@/actions/auth";
import { SetPasswordForm } from "./set-password-form";

export function ResetPasswordForm({ token }: { token: string }) {
  return (
    <SetPasswordForm
      icon={KeyRound}
      heading="Choose a new password"
      description="Pick something you haven't used before."
      submitLabel="Update password"
      successTitle="Password updated"
      successDescription="Your password has been changed. Sign in with your new password."
      onSubmit={(password) => resetPasswordAction({ token, password })}
    />
  );
}
