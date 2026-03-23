import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function scrapeVenuesPlace(
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
    $(".venue-description, .description, [class*=description]")
      .first()
      .text()
      .trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  // Images
  const images: string[] = [];
  $(
    '.venue-gallery img, .gallery img, .swiper img, [class*="gallery"] img, [class*="slider"] img, [class*="carousel"] img'
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

  // Also check og:image
  if (images.length === 0) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) images.push(ogImage);
  }

  // Also check background images in style attributes
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

  // Services
  const services: string[] = [];
  $(
    '.venue-services li, .services li, [class*="service"] li, [class*="amenit"] li, [class*="feature"] li'
  ).each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text) services.push(text);
  });

  // Price
  let price: number | null = null;
  let priceType: string | null = null;
  const priceText = $(
    '.price, [class*="price"], [class*="precio"]'
  )
    .first()
    .text()
    .trim();
  if (priceText) {
    const priceMatch = priceText.match(/[\d.,]+/);
    if (priceMatch) {
      price = parseFloat(priceMatch[0].replace(",", "."));
    }
    if (priceText.toLowerCase().includes("hora")) priceType = "por hora";
    else if (priceText.toLowerCase().includes("día")) priceType = "por día";
    else if (priceText.toLowerCase().includes("persona"))
      priceType = "por persona";
  }

  // Rules
  const rules: string[] = [];
  $(
    '[class*="rule"] li, [class*="norma"] li, [class*="restriction"] li'
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text) rules.push(text);
  });

  // Location
  const locationText =
    $('[class*="location"], [class*="address"], [class*="ubicacion"], [class*="direccion"]')
      .first()
      .text()
      .trim() || "";

  // Try to get coordinates from embedded map or structured data
  let latitude: number | null = null;
  let longitude: number | null = null;

  // Check for Google Maps embed
  const mapIframe = $('iframe[src*="google.com/maps"]').attr("src") || "";
  const coordMatch = mapIframe.match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/);
  if (coordMatch) {
    longitude = parseFloat(coordMatch[1]);
    latitude = parseFloat(coordMatch[2]);
  }

  // Check JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.geo) {
        latitude = parseFloat(data.geo.latitude) || latitude;
        longitude = parseFloat(data.geo.longitude) || longitude;
      }
      if (data.address) {
        if (!locationText && data.address.streetAddress) {
          // use structured address
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  // Capacity
  let maxCapacity: number | null = null;
  const capacityText = $(
    '[class*="capacity"], [class*="capacidad"], [class*="aforo"]'
  )
    .first()
    .text()
    .trim();
  if (capacityText) {
    const capMatch = capacityText.match(/(\d+)/);
    if (capMatch) maxCapacity = parseInt(capMatch[1]);
  }

  // Parse city from location or breadcrumbs
  const city =
    $(".breadcrumb li, [class*=breadcrumb] a")
      .filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return (
          text.includes("barcelona") ||
          text.includes("madrid") ||
          text.includes("valencia") ||
          text.includes("sevilla")
        );
      })
      .first()
      .text()
      .trim() || "";

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
