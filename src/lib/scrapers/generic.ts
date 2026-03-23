import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function scrapeGeneric(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    $("p").first().text().trim() ||
    "";

  const images: string[] = [];
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content) images.push(content);
  });

  $("img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src");
    if (
      src &&
      !src.includes("logo") &&
      !src.includes("icon") &&
      !src.includes("placeholder") &&
      !src.includes("avatar")
    ) {
      const fullUrl = src.startsWith("http")
        ? src
        : new URL(src, url).toString();
      if (!images.includes(fullUrl) && images.length < 20) {
        images.push(fullUrl);
      }
    }
  });

  let latitude: number | null = null;
  let longitude: number | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.geo) {
        latitude = parseFloat(data.geo.latitude) || null;
        longitude = parseFloat(data.geo.longitude) || null;
      }
    } catch {
      // ignore
    }
  });

  return {
    id: uuidv4(),
    sourceUrl: url,
    title,
    description,
    images,
    services: [],
    price: null,
    priceType: null,
    rules: [],
    location: {
      address: "",
      city: "",
      province: "",
      country: "España",
      postalCode: "",
      latitude,
      longitude,
      street: "",
      number: "",
      floor: "",
    },
    maxCapacity: null,
    minCapacity: null,
    spaceType: "OTRO",
    activities: [],
    extras: {},
  };
}
