"use client";

import { useState } from "react";
import { ScrapedSpace, CANCELLATION_TYPES } from "@/types";
import { spaceToEventuyPayload } from "@/lib/eventuy";

interface UploadModalProps {
  space: ScrapedSpace;
  onClose: () => void;
}

export default function UploadModal({ space, onClose }: UploadModalProps) {
  const [apiUrl, setApiUrl] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("eventuy_api_url") || ""
      : ""
  );
  const [apiToken, setApiToken] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("eventuy_api_token") || ""
      : ""
  );
  const [nameContact, setNameContact] = useState("");
  const [lastNameContact, setLastNameContact] = useState("");
  const [telephoneContact, setTelephoneContact] = useState("");
  const [cancellationsType, setCancellationsType] = useState("MODERATE");
  const [minimumReservationHours, setMinimumReservationHours] = useState(1);
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showJson, setShowJson] = useState(false);

  const payload = spaceToEventuyPayload(space, {
    nameContact,
    lastNameContact,
    telephoneContact,
    cancellationsType,
    minimumReservationHours,
    publish,
  });

  const handleUpload = async () => {
    if (!apiUrl || !apiToken) {
      setResult({ success: false, message: "API URL y Token son requeridos" });
      return;
    }

    // Save credentials for future use
    localStorage.setItem("eventuy_api_url", apiUrl);
    localStorage.setItem("eventuy_api_token", apiToken);

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/upload-eventuy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, apiUrl, apiToken }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: "Subido correctamente a Eventuy" });
      } else {
        setResult({ success: false, message: data.error || "Error al subir" });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Error de conexión",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Subir a Eventuy</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-medium text-indigo-900">{space.title}</h3>
            <p className="text-sm text-indigo-700 mt-1">
              {space.location.city} · {space.price ? `${space.price}€` : "Sin precio"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API URL de Eventuy</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="input-field"
              placeholder="https://api.eventuy.com/v1/spaces"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="input-field"
              placeholder="Tu token de API"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
              <input
                type="text"
                value={nameContact}
                onChange={(e) => setNameContact(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido de contacto</label>
              <input
                type="text"
                value={lastNameContact}
                onChange={(e) => setLastNameContact(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                type="tel"
                value={telephoneContact}
                onChange={(e) => setTelephoneContact(e.target.value)}
                className="input-field"
                placeholder="+34..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Política de cancelación</label>
              <select
                value={cancellationsType}
                onChange={(e) => setCancellationsType(e.target.value)}
                className="input-field"
              >
                {CANCELLATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Horas mín. reserva</label>
              <input
                type="number"
                value={minimumReservationHours}
                onChange={(e) => setMinimumReservationHours(Number(e.target.value))}
                className="input-field"
                min={1}
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publish}
                  onChange={(e) => setPublish(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-sm font-medium">Publicar inmediatamente</span>
              </label>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="text-sm text-primary hover:underline"
            >
              {showJson ? "Ocultar" : "Ver"} JSON del payload
            </button>
            {showJson && (
              <pre className="mt-2 bg-gray-50 border border-border rounded-lg p-3 text-xs overflow-auto max-h-60">
                {JSON.stringify(payload, null, 2)}
              </pre>
            )}
          </div>

          {result && (
            <div
              className={`p-4 rounded-lg text-sm ${
                result.success
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
          <button onClick={handleUpload} disabled={loading} className="btn-success">
            {loading ? "Subiendo..." : "Subir a Eventuy"}
          </button>
        </div>
      </div>
    </div>
  );
}
