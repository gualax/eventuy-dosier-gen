"use client";

import { useState } from "react";
import { ScrapedSpace, SPACE_TYPES, ACTIVITIES, SERVICES } from "@/types";

interface SpaceEditorProps {
  space: ScrapedSpace;
  onUpdate: (space: ScrapedSpace) => void;
  onRemove: () => void;
  onUpload: (space: ScrapedSpace) => void;
}

export default function SpaceEditor({
  space,
  onUpdate,
  onRemove,
  onUpload,
}: SpaceEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "location" | "services" | "images">("general");

  const updateField = (field: string, value: unknown) => {
    onUpdate({ ...space, [field]: value });
  };

  const updateLocation = (field: string, value: unknown) => {
    onUpdate({
      ...space,
      location: { ...space.location, [field]: value },
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...space.images];
    newImages.splice(index, 1);
    updateField("images", newImages);
  };

  const addImage = () => {
    const url = prompt("URL de la imagen:");
    if (url) {
      updateField("images", [...space.images, url]);
    }
  };

  const toggleArrayItem = (field: "services" | "activities", value: string) => {
    const arr = space[field] || [];
    if (arr.includes(value)) {
      updateField(
        field,
        arr.filter((v: string) => v !== value)
      );
    } else {
      updateField(field, [...arr, value]);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {space.images[0] && (
          <img
            src={space.images[0]}
            alt={space.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {space.title || "Sin título"}
          </h3>
          <p className="text-sm text-muted truncate">
            {space.location.city && `${space.location.city} · `}
            {space.price ? `${space.price}€` : "Sin precio"} ·{" "}
            {space.images.length} fotos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpload(space);
            }}
            className="btn-success text-xs px-3 py-1"
          >
            Subir a Eventuy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="btn-danger text-xs px-3 py-1"
          >
            Eliminar
          </button>
          <svg
            className={`w-5 h-5 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["general", "location", "services", "images"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab === "general" && "General"}
                {tab === "location" && "Ubicación"}
                {tab === "services" && "Servicios"}
                {tab === "images" && `Fotos (${space.images.length})`}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* General Tab */}
            {activeTab === "general" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Título</label>
                  <input
                    type="text"
                    value={space.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={space.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    className="input-field resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Precio (€)</label>
                    <input
                      type="number"
                      value={space.price || ""}
                      onChange={(e) =>
                        updateField("price", e.target.value ? Number(e.target.value) : null)
                      }
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de espacio</label>
                    <select
                      value={space.spaceType}
                      onChange={(e) => updateField("spaceType", e.target.value)}
                      className="input-field"
                    >
                      {SPACE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacidad máxima</label>
                    <input
                      type="number"
                      value={space.maxCapacity || ""}
                      onChange={(e) =>
                        updateField("maxCapacity", e.target.value ? Number(e.target.value) : null)
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">URL origen</label>
                    <input
                      type="url"
                      value={space.sourceUrl}
                      onChange={(e) => updateField("sourceUrl", e.target.value)}
                      className="input-field"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Normas / Reglas</label>
                  <textarea
                    value={(space.rules || []).join("\n")}
                    onChange={(e) =>
                      updateField(
                        "rules",
                        e.target.value.split("\n").filter((r) => r.trim())
                      )
                    }
                    rows={3}
                    className="input-field resize-y"
                    placeholder="Una regla por línea"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Actividades</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIVITIES.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleArrayItem("activities", a.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (space.activities || []).includes(a.value)
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-muted hover:bg-gray-200"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Dirección completa</label>
                  <input
                    type="text"
                    value={space.location.address}
                    onChange={(e) => updateLocation("address", e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Calle</label>
                    <input
                      type="text"
                      value={space.location.street}
                      onChange={(e) => updateLocation("street", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número</label>
                    <input
                      type="text"
                      value={space.location.number}
                      onChange={(e) => updateLocation("number", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Piso</label>
                    <input
                      type="text"
                      value={space.location.floor}
                      onChange={(e) => updateLocation("floor", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Código Postal</label>
                    <input
                      type="text"
                      value={space.location.postalCode}
                      onChange={(e) => updateLocation("postalCode", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={space.location.city}
                      onChange={(e) => updateLocation("city", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Provincia</label>
                    <input
                      type="text"
                      value={space.location.province}
                      onChange={(e) => updateLocation("province", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">País</label>
                    <input
                      type="text"
                      value={space.location.country}
                      onChange={(e) => updateLocation("country", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      value={space.location.latitude ?? ""}
                      onChange={(e) =>
                        updateLocation("latitude", e.target.value ? Number(e.target.value) : null)
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      value={space.location.longitude ?? ""}
                      onChange={(e) =>
                        updateLocation("longitude", e.target.value ? Number(e.target.value) : null)
                      }
                      className="input-field"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Servicios disponibles</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleArrayItem("services", s.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          (space.services || []).includes(s.value)
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-muted hover:bg-gray-200"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Servicios adicionales (extraídos)
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {space.services
                      .filter((s) => !SERVICES.find((sv) => sv.value === s))
                      .map((s, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() =>
                              updateField(
                                "services",
                                space.services.filter((_, idx) => idx !== space.services.indexOf(s))
                              )
                            }
                            className="ml-1 hover:text-amber-950"
                          >
                            x
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Images Tab */}
            {activeTab === "images" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {space.images.map((img, i) => (
                    <div key={i} className="relative group aspect-video">
                      <img
                        src={img}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addImage}
                    className="aspect-video border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors"
                  >
                    <span className="text-2xl">+</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
