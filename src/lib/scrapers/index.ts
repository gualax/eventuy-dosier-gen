import { ScrapedSpace } from "@/types";
import { scrapeVenuesPlace } from "./venuesplace";
import { scrapeSpathios } from "./spathios";
import { scrapeGeneric } from "./generic";

export async function scrapeUrl(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const hostname = new URL(url).hostname;

  if (hostname.includes("venuesplace.com")) {
    return scrapeVenuesPlace(url, html);
  } else if (hostname.includes("spathios.com")) {
    return scrapeSpathios(url, html);
  } else {
    return scrapeGeneric(url, html);
  }
}
