import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint requerido" },
        { status: 400 }
      );
    }

    // Desactivar suscripción
    await prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Desuscripción exitosa" 
    });
  } catch (error) {
    console.error("[NOTIFICATION_UNSUBSCRIBE]", error);
    return NextResponse.json(
      { error: "Error al desuscribirse" },
      { status: 500 }
    );
  }
}