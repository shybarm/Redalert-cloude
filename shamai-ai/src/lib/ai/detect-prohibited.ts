import { openai } from "./openai-client";
import { SAFETY_CHECK_SYSTEM_PROMPT } from "./prompts/safety-check";

interface SafetyCheckResult {
  is_prohibited: boolean;
  prohibition_category: string | null;
  prohibition_reason_he: string | null;
  is_suspicious: boolean;
  suspicious_reason_he: string | null;
}

export async function detectProhibited(
  imageUrls: string[]
): Promise<SafetyCheckResult> {
  const imageContent = imageUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url, detail: "low" as const },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SAFETY_CHECK_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Check these images for prohibited or suspicious items:" },
          ...imageContent,
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return {
      is_prohibited: false,
      prohibition_category: null,
      prohibition_reason_he: null,
      is_suspicious: false,
      suspicious_reason_he: null,
    };
  }

  return JSON.parse(content) as SafetyCheckResult;
}
