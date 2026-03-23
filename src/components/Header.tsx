"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Eventuy <span className="text-primary">Dossier</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-muted hover:text-foreground transition-colors text-sm font-medium">
              Dossieres
            </Link>
            <Link href="/nuevo" className="btn-primary text-sm">
              + Nuevo Dossier
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
