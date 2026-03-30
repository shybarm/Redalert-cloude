import { PublisherBase, type PublishableAd, type PublishResult } from "./publisher-base";

export class Yad2Publisher extends PublisherBase {
  platform = "YAD2";

  async publish(ad: PublishableAd): Promise<PublishResult> {
    return {
      success: true,
      externalUrl: "https://market.yad2.co.il/publish",
      adText: this.getFormattedText(ad),
    };
  }

  getFormattedText(ad: PublishableAd): string {
    const priceShekels = (ad.price / 100).toFixed(0);
    return `כותרת:\n${ad.title}\n\nתיאור:\n${ad.description}\n\nמצב: ${ad.condition}\n\nמחיר מבוקש: ₪${priceShekels}\n\n${ad.city ? `איסוף מאזור: ${ad.city}` : ""}\n${ad.selfPickup ? "זמין לבדיקה בעת איסוף." : ""}\n${ad.courierAvailable ? "אפשרות לשליח." : ""}\n\nמילות חיפוש:\n${ad.keywords.join(", ")}`;
  }
}
