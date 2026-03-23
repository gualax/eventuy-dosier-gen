import { NextRequest, NextResponse } from "next/server";
import { uploadToEventuy } from "@/lib/eventuy";

export async function POST(request: NextRequest) {
  try {
    const { payload, apiUrl, apiToken } = await request.json();

    if (!payload) {
      return NextResponse.json(
        { error: "Payload es requerido" },
        { status: 400 }
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL es requerida" },
        { status: 400 }
      );
    }

    if (!apiToken) {
      return NextResponse.json(
        { error: "API Token es requerido" },
        { status: 400 }
      );
    }

    const result = await uploadToEventuy(payload, apiUrl, apiToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al subir a Eventuy",
      },
      { status: 500 }
    );
  }
}
