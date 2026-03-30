import { PublisherBase, type PublishableAd, type PublishResult } from "./publisher-base";

export class InternalPublisher extends PublisherBase {
  platform = "INTERNAL";

  async publish(ad: PublishableAd): Promise<PublishResult> {
    return { success: true, adText: this.getFormattedText(ad) };
  }

  getFormattedText(ad: PublishableAd): string {
    const priceShekels = (ad.price / 100).toFixed(0);
    return `${ad.title}\n\n${ad.description}\n\nמצב: ${ad.condition}\nמחיר: ₪${priceShekels}\n${ad.city ? `אזור: ${ad.city}` : ""}\n${ad.selfPickup ? "איסוף עצמי" : ""}${ad.courierAvailable ? " | שליח" : ""}\n\n${ad.keywords.join(", ")}`;
  }
}
