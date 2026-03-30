export interface PublishableAd {
  title: string;
  description: string;
  price: number;
  condition: string;
  photos: string[];
  keywords: string[];
  city: string | null;
  selfPickup: boolean;
  courierAvailable: boolean;
}

export interface PublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
  adText?: string;
}

export abstract class PublisherBase {
  abstract platform: string;
  abstract publish(ad: PublishableAd): Promise<PublishResult>;
  abstract getFormattedText(ad: PublishableAd): string;
}
