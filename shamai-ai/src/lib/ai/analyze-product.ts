import { openai } from "./openai-client";
import { PRODUCT_ANALYSIS_SYSTEM_PROMPT } from "./prompts/product-analysis";
import { detectProhibited } from "./detect-prohibited";
import { evaluateCounterfeitRisk } from "./detect-counterfeit";
import { estimatePrice } from "./estimate-price";
import { generateAd } from "./generate-ad";
import { evaluatePhotoSuggestion } from "./suggest-photo";
import type {
  ProductAnalysisResult,
  PriceEstimationResult,
  AdGenerationResult,
  ConfidenceLevel,
} from "@/types/estimation";

export interface FullAnalysisResult {
  product: ProductAnalysisResult;
  pricing: PriceEstimationResult;
  ad: AdGenerationResult;
  safety: {
    isProhibited: boolean;
    prohibitedReason: string | null;
    isSuspectedCounterfeit: boolean;
    counterfeitDetails: string | null;
  };
  photoSuggestion: {
    needed: boolean;
    type: string | null;
    reason: string;
    confidenceImprovement: string;
  };
}

/**
 * Full AI analysis pipeline:
 * 1. Safety check (GPT-4o Mini - fast)
 * 2. Product analysis (GPT-4o Vision)
 * 3. Price estimation (GPT-4o + comparable data)
 * 4. Ad generation (GPT-4o)
 * 5. Photo suggestion evaluation
 */
export async function analyzeProduct(
  imageUrls: string[]
): Promise<FullAnalysisResult> {
  // Step 1: Safety check (fast, parallel-safe)
  const safetyResult = await detectProhibited(imageUrls);

  if (safetyResult.is_prohibited) {
    throw new ProhibitedItemError(
      safetyResult.prohibition_reason_he || "פריט אסור למכירה",
      safetyResult.prohibition_category || "unknown"
    );
  }

  // Step 2: Product analysis (GPT-4o Vision)
  const productAnalysis = await analyzeProductImages(imageUrls);

  // Step 3: Counterfeit evaluation
  const counterfeit = evaluateCounterfeitRisk(productAnalysis.authenticity);

  // Step 4: Price estimation (with comparable data from DB)
  const pricing = await estimatePrice(
    productAnalysis.product as unknown as Record<string, unknown>,
    productAnalysis.condition.assessment,
    productAnalysis.product.category,
    productAnalysis.product.brand,
    productAnalysis.product.model
  );

  // Step 5: Ad generation
  const ad = await generateAd(
    productAnalysis.product as unknown as Record<string, unknown>,
    productAnalysis.condition.assessment,
    productAnalysis.condition.details_he,
    productAnalysis.specs,
    pricing.tiers
  );

  // Step 6: Photo suggestion
  const photoSuggestion = evaluatePhotoSuggestion(
    productAnalysis.additional_photo_needed,
    pricing.confidence as ConfidenceLevel,
    imageUrls.length
  );

  return {
    product: productAnalysis,
    pricing,
    ad,
    safety: {
      isProhibited: false,
      prohibitedReason: null,
      isSuspectedCounterfeit: counterfeit.isSuspected,
      counterfeitDetails: counterfeit.details,
    },
    photoSuggestion,
  };
}

async function analyzeProductImages(
  imageUrls: string[]
): Promise<ProductAnalysisResult> {
  const imageContent = imageUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url, detail: "high" as const },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: PRODUCT_ANALYSIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze these product images and provide a full identification, condition assessment, and specs:",
          },
          ...imageContent,
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from product analysis AI");
  }

  return JSON.parse(content) as ProductAnalysisResult;
}

export class ProhibitedItemError extends Error {
  category: string;
  constructor(message: string, category: string) {
    super(message);
    this.name = "ProhibitedItemError";
    this.category = category;
  }
}
