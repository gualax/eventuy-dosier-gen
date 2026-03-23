import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function scrapeSpathios(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const $ = cheerio.load(html);

  // Title
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    "";

  // Description
  const description =
    $('[class*="description"], [class*="descripcion"], .listing-description')
      .first()
      .text()
      .trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  // Images
  const images: string[] = [];

  // Check og:image first
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content && !images.includes(content)) images.push(content);
  });

  // Gallery images
  $(
    '[class*="gallery"] img, [class*="slider"] img, [class*="carousel"] img, [class*="listing"] img, .swiper img'
  ).each((_, el) => {
    const src =
      $(el).attr("data-src") || $(el).attr("src") || $(el).attr("data-lazy");
    if (src && !src.includes("placeholder") && !src.includes("logo")) {
      const fullUrl = src.startsWith("http")
        ? src
        : new URL(src, url).toString();
      if (!images.includes(fullUrl)) {
        images.push(fullUrl);
      }
    }
  });

  // Background images
  $('[style*="background-image"]').each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/url\(['"]?(.*?)['"]?\)/);
    if (match && match[1] && !match[1].includes("placeholder")) {
      const fullUrl = match[1].startsWith("http")
        ? match[1]
        : new URL(match[1], url).toString();
      if (!images.includes(fullUrl)) {
        images.push(fullUrl);
      }
    }
  });

  // Services / amenities
  const services: string[] = [];
  $(
    '[class*="service"] li, [class*="amenit"] li, [class*="feature"] li, [class*="equipamiento"] li, [class*="incluido"] li'
  ).each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text) services.push(text);
  });

  // Also check icon-based services
  $('[class*="service"] span, [class*="amenity"] span, [class*="feature-item"]').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text && !services.includes(text)) services.push(text);
  });

  // Price
  let price: number | null = null;
  let priceType: string | null = null;
  const priceText = $(
    '[class*="price"], [class*="precio"], [class*="rate"]'
  )
    .first()
    .text()
    .trim();
  if (priceText) {
    const priceMatch = priceText.match(/[\d.,]+/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(".", "").replace(",", "."));
    }
    if (priceText.toLowerCase().includes("hora")) priceType = "por hora";
    else if (priceText.toLowerCase().includes("día")) priceType = "por día";
  }

  // Rules
  const rules: string[] = [];
  $(
    '[class*="rule"] li, [class*="norma"] li, [class*="restriction"] li, [class*="condicion"] li'
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text) rules.push(text);
  });

  // Location
  const locationText =
    $('[class*="location"], [class*="address"], [class*="ubicacion"]')
      .first()
      .text()
      .trim() || "";

  let latitude: number | null = null;
  let longitude: number | null = null;

  // Check for map data
  const mapIframe = $('iframe[src*="google.com/maps"]').attr("src") || "";
  const coordMatch = mapIframe.match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/);
  if (coordMatch) {
    longitude = parseFloat(coordMatch[1]);
    latitude = parseFloat(coordMatch[2]);
  }

  // Check for data attributes with coords
  $("[data-lat], [data-latitude]").each((_, el) => {
    latitude =
      parseFloat($(el).attr("data-lat") || $(el).attr("data-latitude") || "") ||
      latitude;
    longitude =
      parseFloat(
        $(el).attr("data-lng") || $(el).attr("data-longitude") || ""
      ) || longitude;
  });

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.geo) {
        latitude = parseFloat(data.geo.latitude) || latitude;
        longitude = parseFloat(data.geo.longitude) || longitude;
      }
    } catch {
      // ignore
    }
  });

  // Capacity
  let maxCapacity: number | null = null;
  const capacityText = $(
    '[class*="capacity"], [class*="capacidad"], [class*="aforo"], [class*="person"]'
  )
    .first()
    .text()
    .trim();
  if (capacityText) {
    const capMatch = capacityText.match(/(\d+)/);
    if (capMatch) maxCapacity = parseInt(capMatch[1]);
  }

  const city = locationText.split(",").slice(-2, -1)[0]?.trim() || "";

  return {
    id: uuidv4(),
    sourceUrl: url,
    title,
    description,
    images,
    services,
    price,
    priceType,
    rules,
    location: {
      address: locationText,
      city,
      province: city,
      country: "España",
      postalCode: "",
      latitude,
      longitude,
      street: "",
      number: "",
      floor: "",
    },
    maxCapacity,
    minCapacity: null,
    spaceType: "SALA_EVENTOS",
    activities: [],
    extras: {},
  };
}
