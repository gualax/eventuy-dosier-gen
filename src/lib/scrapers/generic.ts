import * as cheerio from "cheerio";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Try to extract listing data from JSON-LD structured data
 */
function extractFromJsonLd(
  $: cheerio.CheerioAPI,
  url: string
): Partial<ScrapedSpace> | null {
  let result: Partial<ScrapedSpace> | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      let data = JSON.parse($(el).html() || "{}");

      // Handle @graph
      if (data["@graph"] && Array.isArray(data["@graph"])) {
        const venue = data["@graph"].find(
          (item: Record<string, unknown>) =>
            ["Place", "LocalBusiness", "EventVenue", "LodgingBusiness", "Hotel", "Restaurant"].includes(
              String(item["@type"])
            )
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
                  typeof i === "string" ? i : (i as Record<string, unknown>)?.url || ""
                )
                .filter(Boolean)
            );
          else if (data.image.url) images.push(data.image.url);
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
            latitude: data.geo?.latitude ? parseFloat(data.geo.latitude) : null,
            longitude: data.geo?.longitude ? parseFloat(data.geo.longitude) : null,
            street: data.address?.streetAddress || "",
            number: "",
            floor: "",
          },
          maxCapacity: data.maximumAttendeeCapacity
            ? parseInt(data.maximumAttendeeCapacity)
            : null,
          minCapacity: null,
          spaceType: "OTRO",
          activities: [],
          extras: {},
        };
      }
    } catch {
      // ignore
    }
  });

  return result;
}

export async function scrapeGeneric(
  url: string,
  html: string
): Promise<Partial<ScrapedSpace>> {
  const $ = cheerio.load(html);

  // FIRST: Try JSON-LD
  const fromJsonLd = extractFromJsonLd($, url);
  if (fromJsonLd && (fromJsonLd.title || fromJsonLd.description)) {
    // Supplement with OG images if JSON-LD had none
    if (fromJsonLd.images && fromJsonLd.images.length === 0) {
      $('meta[property="og:image"]').each((_, el) => {
        const content = $(el).attr("content");
        if (content) fromJsonLd.images!.push(content);
      });
    }
    return fromJsonLd;
  }

  // SECOND: Try __NEXT_DATA__
  const nextData = $('script#__NEXT_DATA__[type="application/json"]').html();
  if (nextData) {
    try {
      const parsed = JSON.parse(nextData);
      const pageProps = parsed?.props?.pageProps;
      if (pageProps) {
        // Try to find anything with a title/name
        const findObject = (obj: unknown): Record<string, unknown> | null => {
          if (!obj || typeof obj !== "object") return null;
          const record = obj as Record<string, unknown>;
          if (record.title || record.name) return record;
          for (const val of Object.values(record)) {
            const found = findObject(val);
            if (found) return found;
          }
          return null;
        };
        const listing = findObject(pageProps);
        if (listing) {
          return {
            id: uuidv4(),
            sourceUrl: url,
            title: String(listing.title || listing.name || ""),
            description: String(listing.description || ""),
            images: Array.isArray(listing.images)
              ? (listing.images as unknown[]).map((i: unknown) =>
                  typeof i === "string" ? i : String((i as Record<string, unknown>)?.url || "")
                ).filter((s: string) => s.length > 0)
              : [],
            services: [],
            price: typeof listing.price === "number" ? listing.price : null,
            priceType: null,
            rules: [],
            location: {
              address: "",
              city: String(listing.city || ""),
              province: "",
              country: "España",
              postalCode: "",
              latitude: null,
              longitude: null,
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
      }
    } catch {
      // ignore
    }
  }

  // THIRD: Standard HTML + meta scraping
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
