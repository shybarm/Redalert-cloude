import { openai } from "./openai-client";
import {
  AD_GENERATION_SYSTEM_PROMPT,
  buildAdGenerationUserPrompt,
} from "./prompts/ad-generation";
import type { AdGenerationResult } from "@/types/estimation";

export async function generateAd(
  product: Record<string, unknown>,
  condition: string,
  conditionDetails: string,
  specs: Record<string, string>,
  priceTiers: { quick_sale: number; realistic: number; maximum: number }
): Promise<AdGenerationResult> {
  const userPrompt = buildAdGenerationUserPrompt(
    product,
    condition,
    conditionDetails,
    specs,
    priceTiers
  );

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: AD_GENERATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from ad generation AI");
  }

  return JSON.parse(content) as AdGenerationResult;
}

export async function regenerateAd(
  product: Record<string, unknown>,
  newCondition: string,
  conditionDetails: string,
  specs: Record<string, string>,
  priceTiers: { quick_sale: number; realistic: number; maximum: number }
): Promise<AdGenerationResult> {
  return generateAd(product, newCondition, conditionDetails, specs, priceTiers);
}
