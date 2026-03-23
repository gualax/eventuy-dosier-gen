import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scrapers";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL es requerida" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "URL no válida" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error al obtener la página: HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const scraped = await scrapeUrl(url, html);

    return NextResponse.json({ success: true, data: scraped });
  } catch (error) {
    console.error("Scraping error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al hacer scraping",
      },
      { status: 500 }
    );
  }
}
