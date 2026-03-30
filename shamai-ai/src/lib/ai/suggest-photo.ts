import type { AdditionalPhotoRequest, ConfidenceLevel } from "@/types/estimation";

export interface PhotoSuggestion {
  needed: boolean;
  type: string | null;
  reason: string;
  confidenceImprovement: string;
}

export function evaluatePhotoSuggestion(
  photoRequest: AdditionalPhotoRequest,
  currentConfidence: ConfidenceLevel,
  photoCount: number
): PhotoSuggestion {
  if (photoCount >= 5) {
    return {
      needed: false,
      type: null,
      reason: "",
      confidenceImprovement: "",
    };
  }

  if (!photoRequest.needed) {
    return {
      needed: false,
      type: null,
      reason: "",
      confidenceImprovement: "",
    };
  }

  return {
    needed: true,
    type: photoRequest.type,
    reason: photoRequest.reason_he,
    confidenceImprovement: photoRequest.confidence_improvement,
  };
}
