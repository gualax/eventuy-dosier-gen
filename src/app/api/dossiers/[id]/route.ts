import { NextRequest, NextResponse } from "next/server";
import { getDossier, saveDossier, deleteDossier } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dossier = await getDossier(id);
    if (!dossier) {
      return NextResponse.json(
        { error: "Dossier no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(dossier);
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return NextResponse.json(
      { error: "Error al obtener dossier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getDossier(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Dossier no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updated = {
      ...existing,
      ...body,
      id, // ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await saveDossier(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating dossier:", error);
    return NextResponse.json(
      { error: "Error al actualizar dossier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDossier(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dossier:", error);
    return NextResponse.json(
      { error: "Error al eliminar dossier" },
      { status: 500 }
    );
  }
}
