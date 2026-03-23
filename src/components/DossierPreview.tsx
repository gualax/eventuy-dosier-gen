"use client";

import { ScrapedSpace, SERVICES, ACTIVITIES, SPACE_TYPES } from "@/types";

interface DossierPreviewProps {
  spaces: ScrapedSpace[];
  dossierName: string;
  clientName?: string;
  notes?: string;
}

function getServiceLabel(value: string): string {
  return SERVICES.find((s) => s.value === value)?.label || value;
}

function getActivityLabel(value: string): string {
  return ACTIVITIES.find((a) => a.value === value)?.label || value;
}

function getSpaceTypeLabel(value: string): string {
  return SPACE_TYPES.find((t) => t.value === value)?.label || value;
}

function SpaceCard({ space, index }: { space: ScrapedSpace; index: number }) {
  return (
    <div className="mb-12">
      {/* Space Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <h2 className="text-2xl font-bold text-foreground">{space.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          {space.location.city && <span>{space.location.city}</span>}
          {space.spaceType && (
            <>
              <span>·</span>
              <span>{getSpaceTypeLabel(space.spaceType)}</span>
            </>
          )}
          {space.maxCapacity && (
            <>
              <span>·</span>
              <span>Hasta {space.maxCapacity} personas</span>
            </>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {space.images.length > 0 && (
        <div className="mb-6">
          {space.images.length === 1 ? (
            <img
              src={space.images[0]}
              alt={space.title}
              className="w-full h-80 object-cover rounded-xl"
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <img
                src={space.images[0]}
                alt={space.title}
                className="col-span-2 row-span-2 w-full h-80 object-cover rounded-xl"
              />
              {space.images.slice(1, 5).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${space.title} ${i + 2}`}
                  className="w-full h-[152px] object-cover rounded-xl"
                />
              ))}
            </div>
          )}
          {space.images.length > 5 && (
            <p className="text-sm text-muted mt-2">
              +{space.images.length - 5} fotos más
            </p>
          )}
        </div>
      )}

      {/* Price */}
      {space.price && (
        <div className="bg-gradient-to-r from-primary to-indigo-500 text-white rounded-xl p-6 mb-6">
          <div className="text-3xl font-bold">{space.price}€</div>
          <div className="text-indigo-200 text-sm mt-1">
            {space.priceType || "por sesión"}
          </div>
        </div>
      )}

      {/* Description */}
      {space.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Descripción</h3>
          <p className="text-muted leading-relaxed whitespace-pre-line">
            {space.description}
          </p>
        </div>
      )}

      {/* Services */}
      {space.services.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Servicios incluidos</h3>
          <div className="flex flex-wrap gap-2">
            {space.services.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-indigo-50 text-indigo-700 font-medium"
              >
                {getServiceLabel(s)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Activities */}
      {space.activities && space.activities.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Actividades</h3>
          <div className="flex flex-wrap gap-2">
            {space.activities.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-amber-50 text-amber-700 font-medium"
              >
                {getActivityLabel(a)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      {space.rules && space.rules.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Normas del espacio</h3>
          <ul className="space-y-2">
            {space.rules.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted">
                <span className="text-primary mt-0.5">&#8226;</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Location */}
      {(space.location.address || space.location.city) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Ubicación</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-foreground">
              {[
                space.location.street &&
                  `${space.location.street}${space.location.number ? ` ${space.location.number}` : ""}`,
                space.location.floor && `Piso ${space.location.floor}`,
                space.location.postalCode,
                space.location.city,
                space.location.province !== space.location.city && space.location.province,
                space.location.country,
              ]
                .filter(Boolean)
                .join(", ") || space.location.address}
            </p>
            {space.location.latitude && space.location.longitude && (
              <p className="text-xs text-muted mt-2">
                Coordenadas: {space.location.latitude}, {space.location.longitude}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DossierPreview({
  spaces,
  dossierName,
  clientName,
  notes,
}: DossierPreviewProps) {
  if (spaces.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg">No hay espacios en este dossier</p>
        <p className="text-sm mt-1">Agrega espacios usando el formulario de arriba</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Dossier Header */}
      <div className="text-center mb-10 pb-8 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {dossierName}
        </h1>
        {clientName && (
          <p className="text-lg text-muted">Preparado para: {clientName}</p>
        )}
        <p className="text-sm text-muted mt-2">
          {spaces.length} {spaces.length === 1 ? "espacio" : "espacios"} seleccionados
        </p>
        {notes && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
            <p className="text-sm text-amber-800">{notes}</p>
          </div>
        )}
      </div>

      {/* Spaces */}
      {spaces.map((space, i) => (
        <SpaceCard key={space.id} space={space} index={i} />
      ))}

      {/* Footer */}
      <div className="text-center py-8 border-t border-border mt-8">
        <p className="text-sm text-muted">
          Dossier generado con Eventuy Dossier Generator
        </p>
      </div>
    </div>
  );
}
