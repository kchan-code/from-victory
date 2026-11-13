"use client"; // client: holds step-1 values in memory between the two signup steps

import { useCallback, useState } from "react";

import type { AuthActionState } from "@/lib/actions/auth";

type Action = (
  prev: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

/**
 * Wraps a step-1 action: remembers the submitted fields (minus password) in
 * component memory so they can be re-submitted with the code. Never touches the
 * URL or storage. `dismissed` lets "Use a different email" hide the code step
 * for the current result without losing the form's DOM values.
 */
export function useTwoStepSignup(start: Action, keys: readonly string[]) {
  const [retained, setRetained] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<AuthActionState>(null);

  const wrapped = useCallback(
    async (prev: AuthActionState, fd: FormData) => {
      const next: Record<string, string> = {};
      for (const k of keys) {
        const v = fd.get(k);
        if (typeof v === "string" && k !== "password") next[k] = v;
      }
      setRetained(next);
      return start(prev, fd);
    },
    [start, keys],
  );

  return { wrapped, retained, dismissed, setDismissed };
}
