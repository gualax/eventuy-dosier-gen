import { getDossier } from "@/lib/storage";
import DossierPreview from "@/components/DossierPreview";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function VerDossier({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dossier = await getDossier(id);

  if (!dossier) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal header for public view */}
      <header className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="text-lg font-bold">
                Eventuy <span className="text-primary">Dossier</span>
              </span>
            </div>
            <Link
              href={`/dossier/${id}`}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Editar
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <DossierPreview
          spaces={dossier.spaces}
          dossierName={dossier.name}
          clientName={dossier.clientName}
          notes={dossier.notes}
        />
      </main>
    </div>
  );
}
