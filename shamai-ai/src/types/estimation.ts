export type ItemCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  NEW: "חדש",
  LIKE_NEW: "כמו חדש",
  GOOD: "טוב",
  FAIR: "סביר",
  FOR_PARTS: "לחלקים",
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  LOW: "נמוך",
  MEDIUM: "בינוני",
  HIGH: "גבוה",
  VERY_HIGH: "גבוה מאוד",
};

export interface ProductIdentification {
  brand: string | null;
  model: string | null;
  category: string;
  subcategory: string;
  year: number | null;
  color: string;
  material: string | null;
}

export interface ConditionAssessment {
  assessment: ItemCondition;
  details_he: string;
  scratches: boolean;
  working: boolean;
  original_packaging: boolean;
  accessories_visible: string[];
}

export interface AuthenticityCheck {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  indicators: string[];
  red_flags: string[];
  is_suspected_counterfeit: boolean;
}

export interface SafetyCheck {
  is_prohibited: boolean;
  prohibition_category: string | null;
  prohibition_reason_he: string | null;
}

export interface AdditionalPhotoRequest {
  needed: boolean;
  type: string | null;
  reason_he: string;
  confidence_improvement: string;
}

export interface ProductAnalysisResult {
  product: ProductIdentification;
  condition: ConditionAssessment;
  authenticity: AuthenticityCheck;
  safety: SafetyCheck;
  specs: Record<string, string>;
  additional_photo_needed: AdditionalPhotoRequest;
}

export interface PriceEstimationResult {
  price_range: { min: number; max: number };
  tiers: {
    quick_sale: number;
    realistic: number;
    maximum: number;
  };
  confidence: ConfidenceLevel;
  reasoning_he: string;
  comparables_used: number;
  market_trend: "rising" | "stable" | "declining";
  retail_price_estimate: number | null;
  depreciation_factor: number;
}

export interface AdGenerationResult {
  title: string;
  description: string;
  condition_text: string;
  specs_text: string;
  pickup_shipping: string;
  cta: string;
  search_keywords: string[];
  selling_reason: string;
}

export interface EstimationResult {
  id: string;
  product: ProductAnalysisResult;
  pricing: PriceEstimationResult;
  ad: AdGenerationResult;
  isProhibited: boolean;
  prohibitedReason: string | null;
  isSuspectedCounterfeit: boolean;
  counterfeitDetails: string | null;
  photos: {
    id: string;
    url: string;
    type: string;
  }[];
}

export interface EstimationFormData {
  photos: File[];
}
