"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ScrapeForm from "@/components/ScrapeForm";
import SpaceEditor from "@/components/SpaceEditor";
import UploadModal from "@/components/UploadModal";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

export default function NuevoDossier() {
  const router = useRouter();
  const [name, setName] = useState("Nuevo Dossier");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [spaces, setSpaces] = useState<ScrapedSpace[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadSpace, setUploadSpace] = useState<ScrapedSpace | null>(null);

  const handleScraped = (data: Partial<ScrapedSpace>) => {
    const space: ScrapedSpace = {
      id: data.id || uuidv4(),
      sourceUrl: data.sourceUrl || "",
      title: data.title || "Sin título",
      description: data.description || "",
      images: data.images || [],
      services: data.services || [],
      price: data.price ?? null,
      priceType: data.priceType ?? null,
      rules: data.rules || [],
      location: {
        address: data.location?.address || "",
        city: data.location?.city || "",
        province: data.location?.province || "",
        country: data.location?.country || "España",
        postalCode: data.location?.postalCode || "",
        latitude: data.location?.latitude ?? null,
        longitude: data.location?.longitude ?? null,
        street: data.location?.street || "",
        number: data.location?.number || "",
        floor: data.location?.floor || "",
      },
      maxCapacity: data.maxCapacity ?? null,
      minCapacity: data.minCapacity ?? null,
      spaceType: data.spaceType || "SALA_EVENTOS",
      activities: data.activities || [],
      extras: data.extras || {},
    };
    setSpaces((prev) => [...prev, space]);
  };

  const handleUpdateSpace = (index: number, updated: ScrapedSpace) => {
    setSpaces((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const handleRemoveSpace = (index: number) => {
    setSpaces((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dossierId = uuidv4();
      const response = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dossierId,
          name,
          spaces,
          clientName,
          clientEmail,
          notes,
        }),
      });

      if (response.ok) {
        router.push(`/dossier/${dossierId}`);
      }
    } catch (err) {
      console.error("Error saving:", err);
      alert("Error al guardar el dossier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dossier Info */}
        <div className="card p-6 mb-6">
          <h1 className="text-xl font-bold mb-4">Nuevo Dossier</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del dossier
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Ej: Espacios para boda María"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-field"
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email del cliente
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="input-field"
                placeholder="cliente@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                placeholder="Notas internas..."
              />
            </div>
          </div>
        </div>

        {/* Scrape Form */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Agregar espacio</h2>
          <p className="text-sm text-muted mb-4">
            Introduce la URL de un espacio para extraer sus datos automáticamente
          </p>
          <ScrapeForm onScraped={handleScraped} />
        </div>

        {/* Spaces List */}
        {spaces.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">
              Espacios ({spaces.length})
            </h2>
            {spaces.map((space, index) => (
              <SpaceEditor
                key={space.id}
                space={space}
                onUpdate={(updated) => handleUpdateSpace(index, updated)}
                onRemove={() => handleRemoveSpace(index)}
                onUpload={setUploadSpace}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={() => router.push("/")} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || spaces.length === 0}
            className="btn-primary"
          >
            {saving ? "Guardando..." : "Guardar Dossier"}
          </button>
        </div>
      </main>

      {uploadSpace && (
        <UploadModal
          space={uploadSpace}
          onClose={() => setUploadSpace(null)}
        />
      )}
    </>
  );
}
