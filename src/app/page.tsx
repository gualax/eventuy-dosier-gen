"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Dossier } from "@/types";

export default function Home() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dossiers")
      .then((res) => res.json())
      .then((data) => {
        setDossiers(Array.isArray(data) ? data : []);
      })
      .catch(() => setDossiers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este dossier?")) return;
    await fetch(`/api/dossiers/${id}`, { method: "DELETE" });
    setDossiers(dossiers.filter((d) => d.id !== id));
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mis Dossieres</h1>
            <p className="text-muted text-sm mt-1">
              Gestiona tus dossieres de espacios para clientes
            </p>
          </div>
          <Link href="/nuevo" className="btn-primary">
            + Nuevo Dossier
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted">Cargando...</div>
        ) : dossiers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              No tienes dossieres aún
            </h2>
            <p className="text-muted text-sm mt-1 mb-4">
              Crea tu primer dossier extrayendo datos de webs de espacios
            </p>
            <Link href="/nuevo" className="btn-primary inline-block">
              Crear primer dossier
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dossiers.map((dossier) => (
              <div key={dossier.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground truncate pr-2">
                    {dossier.name}
                  </h3>
                  <button
                    onClick={() => handleDelete(dossier.id)}
                    className="text-muted hover:text-danger text-sm flex-shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
                {dossier.clientName && (
                  <p className="text-sm text-muted mb-2">
                    Cliente: {dossier.clientName}
                  </p>
                )}
                <p className="text-sm text-muted mb-3">
                  {dossier.spaces.length}{" "}
                  {dossier.spaces.length === 1 ? "espacio" : "espacios"}
                </p>
                {dossier.spaces.length > 0 && (
                  <div className="flex -space-x-2 mb-4">
                    {dossier.spaces.slice(0, 4).map((space, i) =>
                      space.images[0] ? (
                        <img
                          key={i}
                          src={space.images[0]}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-muted"
                        >
                          {i + 1}
                        </div>
                      )
                    )}
                    {dossier.spaces.length > 4 && (
                      <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-muted">
                        +{dossier.spaces.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/dossier/${dossier.id}`}
                    className="btn-primary text-xs flex-1 text-center"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/ver/${dossier.id}`}
                    className="btn-secondary text-xs flex-1 text-center"
                  >
                    Vista previa
                  </Link>
                </div>
                <p className="text-xs text-muted mt-3">
                  Actualizado: {new Date(dossier.updatedAt).toLocaleDateString("es-ES")}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
