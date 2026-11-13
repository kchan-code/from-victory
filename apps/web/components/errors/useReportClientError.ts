"use client";

import { useEffect } from "react";

import {
  isStaleDeploymentError,
  reloadOnceForStaleDeployment,
} from "@/lib/deploy-skew";
import { reportClientError } from "@/lib/monitoring/report-client-error";

/**
 * Error-boundary side effect (FV-729, FV-731).
 *
 * Reports route, digest, redacted message, and build to the first-party
 * endpoint, then hard-reloads once when the failure is a stale server action
 * from a deploy the open WebView missed.
 */
export function useReportClientError(error: Error & { digest?: string }): void {
  useEffect(() => {
    reportClientError({
      route: window.location.pathname,
      digest: error.digest,
      message: error.message,
    });
    if (isStaleDeploymentError(error)) {
      reloadOnceForStaleDeployment();
    }
  }, [error]);
}
