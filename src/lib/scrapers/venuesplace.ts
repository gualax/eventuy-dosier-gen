import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Try to extract data from JSON-LD structured data
 */
function extractFromJsonLd(
  $: cheerio.CheerioAPI,
  url: string
): Partial<ScrapedSpace> | null {
  let result: Partial<ScrapedSpace> | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      let data = JSON.parse($(el).html() || "{}");

      // Handle @graph arrays
      if (data["@graph"] && Array.isArray(data["@graph"])) {
        const venue = data["@graph"].find(
          (item: Record<string, unknown>) =>
            item["@type"] === "Place" ||
            item["@type"] === "LocalBusiness" ||
            item["@type"] === "EventVenue" ||
            item["@type"] === "LodgingBusiness"
        );
        if (venue) data = venue;
      }

      if (data.name || data.description) {
        const images: string[] = [];
        if (data.image) {
          if (typeof data.image === "string") images.push(data.image);
          else if (Array.isArray(data.image))
            images.push(
              ...data.image
                .map((i: unknown) =>
                  typeof i === "string"
                    ? i
                    : (i as Record<string, unknown>)?.url || ""
                )
                .filter(Boolean)
            );
          else if (data.image.url) images.push(data.image.url);
        }
        if (data.photo) {
          const photos = Array.isArray(data.photo) ? data.photo : [data.photo];
          for (const p of photos) {
            const photoUrl = typeof p === "string" ? p : p?.url || p?.contentUrl;
            if (photoUrl && !images.includes(photoUrl)) images.push(photoUrl);
          }
        }

        result = {
          id: uuidv4(),
          sourceUrl: url,
          title: data.name || "",
          description: data.description || "",
          images,
          services: [],
          price: data.offers?.price ? parseFloat(data.offers.price) : null,
          priceType: null,
          rules: [],
          location: {
            address: data.address?.streetAddress || "",
            city: data.address?.addressLocality || "",
            province: data.address?.addressRegion || "",
            country: data.address?.addressCountry || "España",
            postalCode: data.address?.postalCode || "",
            latitude: data.geo?.latitude
              ? parseFloat(data.geo.latitude)
              : null,
            longitude: data.geo?.longitude
              ? parseFloat(data.geo.longitude)
              : null,
            street: data.address?.streetAddress || "",
            number: "",
            floor: "",
          },
          maxCapacity: data.maximumAttendeeCapacity
            ? parseInt(data.maximumAttendeeCapacity)
            : null,
          minCapacity: null,
          spaceType: "SALA_EVENTOS",
          activities: [],
          extras: {},
        };
      }
    } catch {
      // ignore parse errors
    }
  });

  return result;
}

/**
 * Try to extract data from embedded script data (__NEXT_DATA__, etc.)
 */
function extractFromEmbeddedScripts(
  $: cheerio.CheerioAPI,
  url: string
): Partial<ScrapedSpace> | null {
  // Try __NEXT_DATA__
  const nextData = $('script#__NEXT_DATA__[type="application/json"]').html();
  if (nextData) {
    try {
      const parsed = JSON.parse(nextData);
      const pageProps = parsed?.props?.pageProps;
      if (pageProps) {
        const venue =
          pageProps.venue || pageProps.space || pageProps.listing || pageProps;
        if (venue.name || venue.title) {
          let images: string[] = [];
          const rawImages = venue.images || venue.photos || venue.gallery || [];
          if (Array.isArray(rawImages)) {
            images = rawImages
              .map((img: unknown) => {
                if (typeof img === "string") return img;
                if (img && typeof img === "object") {
                  const o = img as Record<string, unknown>;
                  return (o.url || o.src || o.original || o.path || "") as string;
                }
                return "";
              })
              .filter((s: string) => s.length > 0);
          }

          return {
            id: uuidv4(),
            sourceUrl: url,
            title: String(venue.name || venue.title || ""),
            description: String(venue.description || ""),
            images,
            services: Array.isArray(venue.services)
              ? venue.services.map((s: unknown) =>
                  typeof s === "string" ? s : (s as Record<string, unknown>)?.name || ""
                )
              : [],
            price:
              typeof venue.price === "number"
                ? venue.price
                : parseFloat(String(venue.price || "0")) || null,
            priceType: null,
            rules: Array.isArray(venue.rules) ? venue.rules : [],
            location: {
              address: venue.address?.fullAddress || venue.address || "",
              city: venue.address?.city || venue.city || "",
              province: venue.address?.province || "",
              country: venue.address?.country || "España",
              postalCode: venue.address?.postalCode || "",
              latitude:
                parseFloat(
                  String(
                    venue.latitude ||
                      venue.address?.latitude ||
                      venue.geo?.latitude ||
                      ""
                  )
                ) || null,
              longitude:
                parseFloat(
                  String(
                    venue.longitude ||
                      venue.address?.longitude ||
                      venue.geo?.longitude ||
                      ""
                  )
                ) || null,
              street: venue.address?.street || "",
              number: "",
              floor: "",
            },
            maxCapacity:
              typeof venue.capacity === "number" ? venue.capacity : null,
            minCapacity: null,
            spaceType: venue.spaceType || venue.category || "SALA_EVENTOS",
            activities: [],
            extras: {},
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function scrapeVenuesPlace(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const $ = cheerio.load(html);

  // FIRST: Try embedded script data (Next.js, etc.)
  const fromScripts = extractFromEmbeddedScripts($, url);
  if (fromScripts && (fromScripts.title || fromScripts.description)) {
    return fromScripts;
  }

  // SECOND: Try JSON-LD structured data
  const fromJsonLd = extractFromJsonLd($, url);
  if (fromJsonLd && (fromJsonLd.title || fromJsonLd.description)) {
    return fromJsonLd;
  }

  // THIRD: Fall back to DOM scraping

  // Title
  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
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

  // og:image first
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content && !images.includes(content)) images.push(content);
  });

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
  const priceText = $('.price, [class*="price"], [class*="precio"]')
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
    $(
      '[class*="location"], [class*="address"], [class*="ubicacion"], [class*="direccion"]'
    )
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

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data.geo) {
        latitude = parseFloat(data.geo.latitude) || latitude;
        longitude = parseFloat(data.geo.longitude) || longitude;
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

  // Parse city from breadcrumbs or location
  let city = "";
  $(".breadcrumb li, [class*=breadcrumb] a").each((_, el) => {
    const text = $(el).text().trim();
    if (
      text &&
      !city &&
      !text.toLowerCase().includes("inicio") &&
      !text.toLowerCase().includes("home") &&
      !text.toLowerCase().includes("venue")
    ) {
      city = text;
    }
  });

  // Also try extracting city from location text
  if (!city && locationText) {
    const parts = locationText.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      city = parts[parts.length - 2] || parts[0];
    }
  }

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
