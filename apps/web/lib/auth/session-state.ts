import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  resolveSessionState,
  type SessionResolution,
} from "./session-state-core";

export {
  classifyProfilelessUser,
  homeForState,
  type SessionResolution,
  type SessionState,
} from "./session-state-core";

/**
 * The signed-in user's session state (FV-672; spec §5.1). Uses `getUser()`
 * (validates the JWT against Auth) — NEVER `getClaims()` alone, which would not
 * notice a revoked session or a deleted user. A query error is `error`, never
 * `pending`. Returns the user too so /welcome can show the auth email.
 */
export async function getSessionState(): Promise<SessionResolution> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return resolveSessionState(supabase, user);
}
