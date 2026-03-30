import { InternalPublisher } from "./internal-publisher";
import { Yad2Publisher } from "./yad2-publisher";
import { FacebookPublisher } from "./facebook-publisher";
import type { PublishableAd, PublishResult } from "./publisher-base";

const publishers = {
  INTERNAL: new InternalPublisher(),
  YAD2: new Yad2Publisher(),
  FACEBOOK: new FacebookPublisher(),
};

export type Platform = keyof typeof publishers;

export async function publishToMultiplePlatforms(
  ad: PublishableAd,
  platforms: Platform[]
): Promise<Record<Platform, PublishResult>> {
  const results: Record<string, PublishResult> = {};

  await Promise.all(
    platforms.map(async (platform) => {
      const publisher = publishers[platform];
      if (!publisher) {
        results[platform] = { success: false, error: `Unknown platform: ${platform}` };
        return;
      }
      try {
        results[platform] = await publisher.publish(ad);
      } catch (error) {
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    })
  );

  return results as Record<Platform, PublishResult>;
}

export function getFormattedAdForPlatform(ad: PublishableAd, platform: Platform): string {
  const publisher = publishers[platform];
  if (!publisher) return "";
  return publisher.getFormattedText(ad);
}
