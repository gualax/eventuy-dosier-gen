import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scrapers";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "max-age=0",
  "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Connection: "keep-alive",
};

async function fetchWithRetry(
  url: string,
  maxRetries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const headers = { ...BROWSER_HEADERS };
      // On retry, add a Referer to look more like navigation
      if (i > 0) {
        const origin = new URL(url).origin;
        headers["Referer"] = origin + "/";
      }

      const response = await fetch(url, {
        headers,
        redirect: "follow",
      });

      if (response.ok) {
        return response;
      }

      // If 403, try with different approach on next iteration
      if (response.status === 403 && i < maxRetries) {
        lastError = new Error(`HTTP ${response.status}`);
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to fetch");
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL es requerida" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "URL no válida" }, { status: 400 });
    }

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      // If we still get 403, try a Google Cache or provide helpful error
      if (response.status === 403) {
        return NextResponse.json(
          {
            error: `El sitio bloqueó la solicitud (HTTP 403). Este sitio tiene protección anti-bot. Puedes agregar el espacio manualmente usando el editor.`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Error al obtener la página: HTTP ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const scraped = await scrapeUrl(url, html);

    // Check if scraping returned mostly empty data (SPA that didn't render)
    const isEmpty =
      !scraped.title && !scraped.description && (!scraped.images || scraped.images.length === 0);

    if (isEmpty) {
      return NextResponse.json({
        success: true,
        data: scraped,
        warning:
          "El sitio parece ser una aplicación de página única (SPA) y no se pudieron extraer datos del HTML. Los datos extraídos pueden estar incompletos. Puedes completar la información manualmente en el editor.",
      });
    }

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
