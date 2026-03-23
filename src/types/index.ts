export interface ScrapedSpace {
  id: string;
  sourceUrl: string;
  title: string;
  description: string;
  images: string[];
  services: string[];
  price: number | null;
  priceType: string | null;
  rules: string[];
  location: {
    address: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    street: string;
    number: string;
    floor: string;
  };
  maxCapacity: number | null;
  minCapacity: number | null;
  spaceType: string;
  activities: string[];
  extras: Record<string, string>;
}

export interface Dossier {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  spaces: ScrapedSpace[];
  clientName?: string;
  clientEmail?: string;
  notes?: string;
}

export interface EventuyPayload {
  price: number;
  title: string;
  adress: {
    cp: string;
    city: string;
    latitude: number;
    longitude: number;
    floor: string;
    otherInfo: string | null;
    number: number | string;
    street: string;
    country: string;
    location: string;
    province: string;
  };
  images: string[];
  publish: boolean;
  horarios: {
    lunes: string[];
    jueves: string[];
    martes: string[];
    sabado: string[];
    domingo: string[];
    feriado: string[];
    general: string[];
    viernes: string[];
    miercoles: string[];
  };
  keywords: string[] | null;
  services: string[];
  userCode: string | null;
  openHours: string | null;
  priceType: boolean;
  spaceCode: string | null;
  spaceType: string;
  activities: string[];
  cleanPrice: number;
  description: string;
  minPersonas: number | null;
  nameContact: string;
  lastNameContact: string;
  securityService: string[];
  maximumOccupancy: number;
  overnightAllowed: boolean;
  telephoneContact: string;
  cancellationsType: string;
  datesNotAvailable: string[] | null;
  hoursAvailability: string[];
  disponibilidadPersonas: number | null;
  minimumReservationHours: number;
  latitude: string;
  longitude: string;
}

export const SPACE_TYPES = [
  { value: "CASA_PISO", label: "Casa / Piso" },
  { value: "SALA_EVENTOS", label: "Sala de Eventos" },
  { value: "RESTAURANTE", label: "Restaurante" },
  { value: "HOTEL", label: "Hotel" },
  { value: "TERRAZA", label: "Terraza" },
  { value: "JARDIN", label: "Jardín" },
  { value: "FINCA", label: "Finca" },
  { value: "LOCAL", label: "Local" },
  { value: "ESTUDIO", label: "Estudio" },
  { value: "OFICINA", label: "Oficina" },
  { value: "LOFT", label: "Loft" },
  { value: "BODEGA", label: "Bodega" },
  { value: "OTRO", label: "Otro" },
];

export const ACTIVITIES = [
  { value: "team_building", label: "Team Building" },
  { value: "afterwork", label: "Afterwork" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "boda", label: "Boda" },
  { value: "comunion", label: "Comunión" },
  { value: "bautizo", label: "Bautizo" },
  { value: "reunion", label: "Reunión" },
  { value: "conferencia", label: "Conferencia" },
  { value: "sesion_fotos", label: "Sesión de Fotos" },
  { value: "rodaje", label: "Rodaje" },
  { value: "workshop", label: "Workshop" },
  { value: "cena", label: "Cena" },
  { value: "fiesta", label: "Fiesta" },
  { value: "presentacion", label: "Presentación" },
  { value: "otro", label: "Otro" },
];

export const SERVICES = [
  { value: "wifi", label: "WiFi" },
  { value: "parking", label: "Parking" },
  { value: "ac", label: "Aire Acondicionado" },
  { value: "calefaccion", label: "Calefacción" },
  { value: "cocina", label: "Cocina" },
  { value: "catering", label: "Catering" },
  { value: "parrilla", label: "Parrilla" },
  { value: "piscina", label: "Piscina" },
  { value: "terraza", label: "Terraza" },
  { value: "jardin", label: "Jardín" },
  { value: "mascotas", label: "Mascotas" },
  { value: "accesibilidad", label: "Accesibilidad" },
  { value: "sonido", label: "Sonido" },
  { value: "iluminacion", label: "Iluminación" },
  { value: "proyector", label: "Proyector" },
  { value: "mobiliario", label: "Mobiliario" },
];

export const CANCELLATION_TYPES = [
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "MODERATE", label: "Moderada" },
  { value: "STRICT", label: "Estricta" },
];
