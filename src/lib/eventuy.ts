import { ScrapedSpace, EventuyPayload } from "@/types";

export function spaceToEventuyPayload(
  space: ScrapedSpace,
  overrides?: Partial<{
    nameContact: string;
    lastNameContact: string;
    telephoneContact: string;
    hoursAvailability: string[];
    cancellationsType: string;
    minimumReservationHours: number;
    overnightAllowed: boolean;
    cleanPrice: number;
    activities: string[];
    spaceType: string;
    publish: boolean;
  }>
): EventuyPayload {
  return {
    price: space.price || 0,
    title: space.title,
    adress: {
      cp: space.location.postalCode || "",
      city: space.location.city || "",
      latitude: space.location.latitude || 0,
      longitude: space.location.longitude || 0,
      floor: space.location.floor || "",
      otherInfo: null,
      number: space.location.number || "",
      street: space.location.street || "",
      country: space.location.country || "España",
      location: space.location.city || "",
      province: space.location.province || "",
    },
    images: space.images,
    publish: overrides?.publish ?? true,
    horarios: {
      lunes: [],
      jueves: [],
      martes: [],
      sabado: [],
      domingo: [],
      feriado: [],
      general: overrides?.hoursAvailability || ["8:00", "20:00"],
      viernes: [],
      miercoles: [],
    },
    keywords: null,
    services: space.services,
    userCode: null,
    openHours: null,
    priceType: false,
    spaceCode: null,
    spaceType: overrides?.spaceType || space.spaceType || "SALA_EVENTOS",
    activities: overrides?.activities || space.activities || [],
    cleanPrice: overrides?.cleanPrice || 0,
    description: space.description,
    minPersonas: space.minCapacity,
    nameContact: overrides?.nameContact || "",
    lastNameContact: overrides?.lastNameContact || "",
    securityService: [],
    maximumOccupancy: space.maxCapacity || 20,
    overnightAllowed: overrides?.overnightAllowed || false,
    telephoneContact: overrides?.telephoneContact || "",
    cancellationsType: overrides?.cancellationsType || "MODERATE",
    datesNotAvailable: null,
    hoursAvailability: overrides?.hoursAvailability || ["8:00", "20:00"],
    disponibilidadPersonas: null,
    minimumReservationHours: overrides?.minimumReservationHours || 1,
    latitude: String(space.location.latitude || ""),
    longitude: String(space.location.longitude || ""),
  };
}

export async function uploadToEventuy(
  payload: EventuyPayload,
  apiUrl: string,
  apiToken: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
