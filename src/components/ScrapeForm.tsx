"use client";

import { useState } from "react";
import { ScrapedSpace } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface ScrapeFormProps {
  onScraped: (space: Partial<ScrapedSpace>) => void;
}

export default function ScrapeForm({ onScraped }: ScrapeFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al hacer scraping");
      }

      if (result.warning) {
        setWarning(result.warning);
      }

      onScraped(result.data);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = () => {
    onScraped({
      id: uuidv4(),
      sourceUrl: "",
      title: "Nuevo espacio",
      description: "",
      images: [],
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
        latitude: null,
        longitude: null,
        street: "",
        number: "",
        floor: "",
      },
      maxCapacity: null,
      minCapacity: null,
      spaceType: "SALA_EVENTOS",
      activities: [],
      extras: {},
    });
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleScrape} className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.venuesplace.com/es/596-mas-de-sant-llei"
          className="input-field flex-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Extrayendo...
            </span>
          ) : (
            "Extraer datos"
          )}
        </button>
      </form>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {warning && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
          {warning}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          Soporta: venuesplace.com, spathios.com y otras webs de espacios
        </p>
        <button
          type="button"
          onClick={handleAddManual}
          className="text-xs text-primary hover:underline"
        >
          + Agregar manualmente
        </button>
      </div>
    </div>
  );
}
