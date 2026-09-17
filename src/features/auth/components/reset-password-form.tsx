"use client";

import { KeyRound } from "lucide-react";
import { SetPasswordForm } from "./set-password-form";

export function ResetPasswordForm() {
  return (
    <SetPasswordForm
      icon={KeyRound}
      heading="Choose a new password"
      description="Pick something you haven't used before."
      submitLabel="Update password"
      successTitle="Password updated"
      successDescription="Your password has been changed. Sign in with your new password."
    />
  );
}
