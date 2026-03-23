import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Extract embedded JSON data from script tags.
 * Spathios is likely a SPA (Next.js/Nuxt/React) where content is
 * client-rendered. The raw HTML may contain hydration data we can parse.
 */
function extractEmbeddedData(
  $: cheerio.CheerioAPI
): Record<string, unknown> | null {
  // Try __NEXT_DATA__ (Next.js SSR)
  const nextData = $('script#__NEXT_DATA__[type="application/json"]').html();
  if (nextData) {
    try {
      return JSON.parse(nextData);
    } catch {
      // ignore
    }
  }

  // Try __NUXT__ / __NUXT_DATA__ (Nuxt.js)
  let nuxtData: Record<string, unknown> | null = null;
  $("script").each((_, el) => {
    const text = $(el).html() || "";
    // window.__NUXT__ = { ... }
    const nuxtMatch = text.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});?\s*$/);
    if (nuxtMatch) {
      try {
        nuxtData = JSON.parse(nuxtMatch[1]);
      } catch {
        // Nuxt sometimes uses a function, can't parse
      }
    }
  });
  if (nuxtData) return nuxtData;

  // Try generic window.__INITIAL_STATE__ or similar
  let initialState: Record<string, unknown> | null = null;
  $("script").each((_, el) => {
    const text = $(el).html() || "";
    const stateMatch = text.match(
      /window\.__(?:INITIAL_STATE|PRELOADED_STATE|APP_DATA|DATA)__\s*=\s*(\{[\s\S]*?\});?\s*$/
    );
    if (stateMatch) {
      try {
        initialState = JSON.parse(stateMatch[1]);
      } catch {
        // ignore
      }
    }
  });
  if (initialState) return initialState;

  // Try to find any large JSON object in inline scripts that looks like listing data
  let bestJson: Record<string, unknown> | null = null;
  $("script:not([src])").each((_, el) => {
    const text = $(el).html() || "";
    // Look for JSON objects containing listing-related keys
    const jsonMatches = text.match(/\{[^{}]*"(?:title|name|description|price|address|images)"[^{}]*\}/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.title || parsed.name || parsed.description) {
            bestJson = parsed;
          }
        } catch {
          // ignore
        }
      }
    }
  });
  if (bestJson) return bestJson;

  return null;
}

/**
 * Recursively search an object for a value by key name
 */
function deepFind(
  obj: unknown,
  key: string
): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  if (key in record) return record[key];
  for (const v of Object.values(record)) {
    const found = deepFind(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

/**
 * Search for a listing/space object within embedded data
 */
function findListingData(data: Record<string, unknown>): Record<string, unknown> | null {
  // For Next.js: data is in props.pageProps
  const pageProps = deepFind(data, "pageProps") as Record<string, unknown> | undefined;
  if (pageProps) {
    // Look for listing/space/venue data within pageProps
    const listing =
      (pageProps.listing as Record<string, unknown>) ||
      (pageProps.space as Record<string, unknown>) ||
      (pageProps.venue as Record<string, unknown>) ||
      (pageProps.data as Record<string, unknown>) ||
      (pageProps.item as Record<string, unknown>) ||
      (pageProps.detail as Record<string, unknown>) ||
      pageProps;
    if (listing && (listing.title || listing.name || listing.description)) {
      return listing;
    }
  }

  // For Nuxt: data might be in data[0] or serverRendered data
  const nuxtData = deepFind(data, "data") as unknown[];
  if (Array.isArray(nuxtData) && nuxtData.length > 0) {
    for (const item of nuxtData) {
      if (
        item &&
        typeof item === "object" &&
        ((item as Record<string, unknown>).title ||
          (item as Record<string, unknown>).name)
      ) {
        return item as Record<string, unknown>;
      }
    }
  }

  // Generic: look for an object with title + description + images
  const title = deepFind(data, "title");
  const description = deepFind(data, "description");
  if (title && description) {
    // Build a synthetic listing from deep-found values
    return {
      title,
      description,
      images: deepFind(data, "images") || deepFind(data, "photos") || deepFind(data, "gallery"),
      price: deepFind(data, "price") || deepFind(data, "pricePerHour"),
      services: deepFind(data, "services") || deepFind(data, "amenities") || deepFind(data, "features"),
      address: deepFind(data, "address") || deepFind(data, "location"),
      capacity: deepFind(data, "capacity") || deepFind(data, "maxCapacity") || deepFind(data, "maximumCapacity"),
      rules: deepFind(data, "rules") || deepFind(data, "houseRules"),
      spaceType: deepFind(data, "spaceType") || deepFind(data, "category") || deepFind(data, "type"),
      city: deepFind(data, "city"),
      latitude: deepFind(data, "latitude") || deepFind(data, "lat"),
      longitude: deepFind(data, "longitude") || deepFind(data, "lng") || deepFind(data, "lon"),
    };
  }

  return null;
}

function extractFromEmbeddedData(
  data: Record<string, unknown>,
  url: string
): Partial<ScrapedSpace> | null {
  const listing = findListingData(data);
  if (!listing) return null;

  // Extract images
  let images: string[] = [];
  const rawImages =
    listing.images || listing.photos || listing.gallery || listing.media;
  if (Array.isArray(rawImages)) {
    images = rawImages
      .map((img: unknown) => {
        if (typeof img === "string") return img;
        if (img && typeof img === "object") {
          const imgObj = img as Record<string, unknown>;
          return (
            (imgObj.url as string) ||
            (imgObj.src as string) ||
            (imgObj.original as string) ||
            (imgObj.path as string) ||
            (imgObj.image as string) ||
            ""
          );
        }
        return "";
      })
      .filter((s: string) => s.length > 0);
  }

  // Extract services
  let services: string[] = [];
  const rawServices =
    listing.services || listing.amenities || listing.features || listing.equipment;
  if (Array.isArray(rawServices)) {
    services = rawServices
      .map((s: unknown) => {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") {
          const sObj = s as Record<string, unknown>;
          return (
            (sObj.name as string) || (sObj.label as string) || (sObj.title as string) || ""
          );
        }
        return "";
      })
      .filter((s: string) => s.length > 0);
  }

  // Extract rules
  let rules: string[] = [];
  const rawRules = listing.rules || listing.houseRules || listing.conditions;
  if (Array.isArray(rawRules)) {
    rules = rawRules
      .map((r: unknown) => (typeof r === "string" ? r : ""))
      .filter((s: string) => s.length > 0);
  } else if (typeof rawRules === "string" && rawRules) {
    rules = [rawRules];
  }

  // Extract price
  let price: number | null = null;
  let priceType: string | null = null;
  const rawPrice = listing.price || listing.pricePerHour || listing.pricePerDay;
  if (typeof rawPrice === "number") {
    price = rawPrice;
  } else if (typeof rawPrice === "string") {
    const m = rawPrice.match(/[\d.,]+/);
    if (m) price = parseFloat(m[0].replace(",", "."));
  } else if (rawPrice && typeof rawPrice === "object") {
    const priceObj = rawPrice as Record<string, unknown>;
    price =
      (priceObj.amount as number) ||
      (priceObj.value as number) ||
      parseFloat(String(priceObj.price || "0")) ||
      null;
    priceType = (priceObj.type as string) || (priceObj.unit as string) || null;
  }
  if (listing.pricePerHour) priceType = priceType || "por hora";
  if (listing.pricePerDay) priceType = priceType || "por día";

  // Extract location
  let city = "";
  let province = "";
  let country = "España";
  let latitude: number | null = null;
  let longitude: number | null = null;
  let address = "";
  let street = "";
  let postalCode = "";

  const rawAddress = listing.address || listing.location;
  if (typeof rawAddress === "string") {
    address = rawAddress;
  } else if (rawAddress && typeof rawAddress === "object") {
    const addrObj = rawAddress as Record<string, unknown>;
    city = (addrObj.city as string) || "";
    province = (addrObj.province as string) || (addrObj.state as string) || "";
    country = (addrObj.country as string) || "España";
    street = (addrObj.street as string) || (addrObj.streetAddress as string) || "";
    postalCode = (addrObj.postalCode as string) || (addrObj.zipCode as string) || (addrObj.cp as string) || "";
    address =
      (addrObj.fullAddress as string) ||
      (addrObj.formatted as string) ||
      (addrObj.address as string) ||
      "";
    latitude = parseFloat(String(addrObj.latitude || addrObj.lat || "")) || null;
    longitude = parseFloat(String(addrObj.longitude || addrObj.lng || addrObj.lon || "")) || null;
  }

  // Fallback: look for lat/lng at top level
  if (!latitude) {
    latitude = parseFloat(String(listing.latitude || listing.lat || "")) || null;
  }
  if (!longitude) {
    longitude = parseFloat(String(listing.longitude || listing.lng || listing.lon || "")) || null;
  }
  if (!city && listing.city) city = String(listing.city);

  // Extract capacity
  let maxCapacity: number | null = null;
  const rawCap =
    listing.capacity || listing.maxCapacity || listing.maximumCapacity || listing.maxGuests;
  if (typeof rawCap === "number") {
    maxCapacity = rawCap;
  } else if (typeof rawCap === "string") {
    const m = rawCap.match(/(\d+)/);
    if (m) maxCapacity = parseInt(m[1]);
  }

  return {
    id: uuidv4(),
    sourceUrl: url,
    title: String(listing.title || listing.name || ""),
    description: String(listing.description || ""),
    images,
    services,
    price,
    priceType,
    rules,
    location: {
      address,
      city,
      province,
      country,
      postalCode,
      latitude,
      longitude,
      street,
      number: "",
      floor: "",
    },
    maxCapacity,
    minCapacity: null,
    spaceType: String(listing.spaceType || listing.category || listing.type || "SALA_EVENTOS"),
    activities: [],
    extras: {},
  };
}

export async function scrapeSpathios(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const $ = cheerio.load(html);

  // FIRST: Try to extract data from embedded SPA data (most reliable for SPAs)
  const embeddedData = extractEmbeddedData($);
  if (embeddedData) {
    const fromEmbedded = extractFromEmbeddedData(embeddedData, url);
    if (fromEmbedded && (fromEmbedded.title || fromEmbedded.description)) {
      return fromEmbedded;
    }
  }

  // SECOND: Try JSON-LD structured data
  let jsonLdResult: Partial<ScrapedSpace> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.name || data.description) {
        const images: string[] = [];
        if (data.image) {
          if (typeof data.image === "string") images.push(data.image);
          else if (Array.isArray(data.image))
            images.push(
              ...data.image.map((i: unknown) => (typeof i === "string" ? i : ""))
            );
        }

        jsonLdResult = {
          id: uuidv4(),
          sourceUrl: url,
          title: data.name || "",
          description: data.description || "",
          images,
          services: [],
          price: data.offers?.price ? parseFloat(data.offers.price) : null,
          priceType: data.offers?.priceCurrency || null,
          rules: [],
          location: {
            address: data.address?.streetAddress || "",
            city: data.address?.addressLocality || "",
            province: data.address?.addressRegion || "",
            country: data.address?.addressCountry || "España",
            postalCode: data.address?.postalCode || "",
            latitude: data.geo?.latitude ? parseFloat(data.geo.latitude) : null,
            longitude: data.geo?.longitude
              ? parseFloat(data.geo.longitude)
              : null,
            street: data.address?.streetAddress || "",
            number: "",
            floor: "",
          },
          maxCapacity: null,
          minCapacity: null,
          spaceType: "SALA_EVENTOS",
          activities: [],
          extras: {},
        };
      }
    } catch {
      // ignore
    }
  });
  if (jsonLdResult) return jsonLdResult;

  // THIRD: Fall back to HTML/meta tag scraping
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "";

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

  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content && !images.includes(content)) images.push(content);
  });

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
    '[class*="service"] li, [class*="amenit"] li, [class*="feature"] li, [class*="equipamiento"] li, [class*="incluido"] li'
  ).each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text) services.push(text);
  });

  $('[class*="service"] span, [class*="amenity"] span, [class*="feature-item"]').each(
    (_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text && !services.includes(text)) services.push(text);
    }
  );

  // Price
  let price: number | null = null;
  let priceType: string | null = null;
  const priceText = $('[class*="price"], [class*="precio"], [class*="rate"]')
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

  const mapIframe = $('iframe[src*="google.com/maps"]').attr("src") || "";
  const coordMatch = mapIframe.match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/);
  if (coordMatch) {
    longitude = parseFloat(coordMatch[1]);
    latitude = parseFloat(coordMatch[2]);
  }

  $("[data-lat], [data-latitude]").each((_, el) => {
    latitude =
      parseFloat($(el).attr("data-lat") || $(el).attr("data-latitude") || "") ||
      latitude;
    longitude =
      parseFloat(
        $(el).attr("data-lng") || $(el).attr("data-longitude") || ""
      ) || longitude;
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

  // If we got nothing from HTML either, the result will be mostly empty
  // The user should be warned
  const result: Partial<ScrapedSpace> = {
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

  return result;
}
