import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: Implement scraping logic
    // 1. Fetch from Yad2 via ScrapingBee
    // 2. Fetch from Facebook Marketplace
    // 3. Normalize and store in PriceReference table
    // 4. Mark old references as inactive

    console.log("Scraper cron triggered at:", new Date().toISOString());

    return NextResponse.json({
      success: true,
      message: "Scraper cron executed",
      scraped: 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scraper cron error:", error);
    return NextResponse.json({ error: "Scraper failed" }, { status: 500 });
  }
}
