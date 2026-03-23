import { NextRequest, NextResponse } from "next/server";
import { saveDossier, getAllDossiers } from "@/lib/storage";
import { Dossier } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const dossiers = await getAllDossiers();
    return NextResponse.json(dossiers);
  } catch (error) {
    console.error("Error fetching dossiers:", error);
    return NextResponse.json(
      { error: "Error al obtener dossieres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dossier: Dossier = {
      id: body.id || uuidv4(),
      name: body.name || "Nuevo Dossier",
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spaces: body.spaces || [],
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      notes: body.notes,
    };

    await saveDossier(dossier);
    return NextResponse.json({ success: true, data: dossier });
  } catch (error) {
    console.error("Error saving dossier:", error);
    return NextResponse.json(
      { error: "Error al guardar dossier" },
      { status: 500 }
    );
  }
}
