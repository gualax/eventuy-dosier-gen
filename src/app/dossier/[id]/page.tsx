"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ScrapeForm from "@/components/ScrapeForm";
import SpaceEditor from "@/components/SpaceEditor";
import UploadModal from "@/components/UploadModal";
import { Dossier, ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";

export default function EditDossier({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadSpace, setUploadSpace] = useState<ScrapedSpace | null>(null);

  useEffect(() => {
    fetch(`/api/dossiers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setDossier)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleScraped = (data: Partial<ScrapedSpace>) => {
    if (!dossier) return;
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
    setDossier({ ...dossier, spaces: [...dossier.spaces, space] });
  };

  const handleUpdateSpace = (index: number, updated: ScrapedSpace) => {
    if (!dossier) return;
    setDossier({
      ...dossier,
      spaces: dossier.spaces.map((s, i) => (i === index ? updated : s)),
    });
  };

  const handleRemoveSpace = (index: number) => {
    if (!dossier) return;
    setDossier({
      ...dossier,
      spaces: dossier.spaces.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    if (!dossier) return;
    setSaving(true);
    try {
      await fetch(`/api/dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dossier),
      });
      alert("Dossier guardado correctamente");
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-muted">Cargando dossier...</div>
      </>
    );
  }

  if (!dossier) return null;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dossier Info */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Editar Dossier</h1>
            <Link
              href={`/ver/${id}`}
              className="btn-secondary text-sm"
              target="_blank"
            >
              Ver previsualización
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del dossier
              </label>
              <input
                type="text"
                value={dossier.name}
                onChange={(e) =>
                  setDossier({ ...dossier, name: e.target.value })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del cliente
              </label>
              <input
                type="text"
                value={dossier.clientName || ""}
                onChange={(e) =>
                  setDossier({ ...dossier, clientName: e.target.value })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email del cliente
              </label>
              <input
                type="email"
                value={dossier.clientEmail || ""}
                onChange={(e) =>
                  setDossier({ ...dossier, clientEmail: e.target.value })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notas</label>
              <input
                type="text"
                value={dossier.notes || ""}
                onChange={(e) =>
                  setDossier({ ...dossier, notes: e.target.value })
                }
                className="input-field"
              />
            </div>
          </div>

          {/* Share link */}
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm font-medium text-indigo-900 mb-1">
              Enlace para compartir con el cliente:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/ver/${id}`
                    : `/ver/${id}`
                }
                className="input-field flex-1 text-sm bg-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/ver/${id}`
                  );
                  alert("Enlace copiado");
                }}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Copiar enlace
              </button>
            </div>
          </div>
        </div>

        {/* Scrape Form */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Agregar espacio</h2>
          <ScrapeForm onScraped={handleScraped} />
        </div>

        {/* Spaces List */}
        {dossier.spaces.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">
              Espacios ({dossier.spaces.length})
            </h2>
            {dossier.spaces.map((space, index) => (
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
            Volver
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
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
