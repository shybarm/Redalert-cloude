import { PublisherBase, type PublishableAd, type PublishResult } from "./publisher-base";

export class FacebookPublisher extends PublisherBase {
  platform = "FACEBOOK";

  async publish(ad: PublishableAd): Promise<PublishResult> {
    return {
      success: true,
      externalUrl: "https://www.facebook.com/marketplace/create/item/",
      adText: this.getFormattedText(ad),
    };
  }

  getFormattedText(ad: PublishableAd): string {
    const priceShekels = (ad.price / 100).toFixed(0);
    return `${ad.title}\n\n₪${priceShekels}\n\n${ad.description}\n\nמצב: ${ad.condition}\n${ad.city ? `מיקום: ${ad.city}` : ""}\n${ad.selfPickup ? "איסוף עצמי" : ""}${ad.courierAvailable ? " | משלוח אפשרי" : ""}`;
  }
}
