/**
 * ScrapingBee API client wrapper.
 * Used for scraping Yad2 and Facebook Marketplace prices.
 */

const SCRAPINGBEE_BASE_URL = "https://app.scrapingbee.com/api/v1/";

interface ScrapeOptions {
  url: string;
  renderJs?: boolean;
  premiumProxy?: boolean;
  countryCode?: string;
  waitForSelector?: string;
}

interface ScrapeResult {
  body: string;
  statusCode: number;
  headers: Record<string, string>;
}

export async function scrapeUrl(options: ScrapeOptions): Promise<ScrapeResult> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    throw new Error("SCRAPINGBEE_API_KEY not configured");
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    url: options.url,
    render_js: (options.renderJs ?? true).toString(),
    premium_proxy: (options.premiumProxy ?? false).toString(),
    country_code: options.countryCode || "il",
  });

  if (options.waitForSelector) {
    params.set("wait_for", options.waitForSelector);
  }

  const response = await fetch(`${SCRAPINGBEE_BASE_URL}?${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `ScrapingBee error: ${response.status} ${response.statusText}`
    );
  }

  const body = await response.text();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return { body, statusCode: response.status, headers };
}
