import type { AuthenticityCheck } from "@/types/estimation";

export function evaluateCounterfeitRisk(
  authenticity: AuthenticityCheck
): {
  isSuspected: boolean;
  details: string | null;
} {
  if (authenticity.is_suspected_counterfeit) {
    const details = authenticity.red_flags.length > 0
      ? `סימנים חשודים: ${authenticity.red_flags.join(", ")}`
      : "הפריט מעלה חשד לזיוף";
    return { isSuspected: true, details };
  }

  if (authenticity.confidence === "LOW" && authenticity.red_flags.length > 0) {
    return {
      isSuspected: true,
      details: `ביטחון נמוך באותנטיות. ${authenticity.red_flags.join(", ")}`,
    };
  }

  return { isSuspected: false, details: null };
}
