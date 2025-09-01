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
    const { subscription, userAgent, timestamp } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Suscripción inválida" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una suscripción para este usuario y endpoint
    const existingSubscription = await prisma.pushSubscription.findFirst({
      where: {
        userId,
        endpoint: subscription.endpoint,
      },
    });

    if (existingSubscription) {
      // Actualizar suscripción existente
      await prisma.pushSubscription.update({
        where: {
          id: existingSubscription.id,
        },
        data: {
          keys: JSON.stringify(subscription.keys),
          userAgent,
          updatedAt: new Date(),
          isActive: true,
        },
      });
    } else {
      // Crear nueva suscripción
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.keys),
          userAgent: userAgent || '',
          isActive: true,
        },
      });
    }

    // Crear o actualizar preferencias de notificación por defecto
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        stockAlerts: true,
        salesAlerts: true,
        expenseAlerts: true,
        customerAlerts: true,
        reportAlerts: true,
        reminderAlerts: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: "Suscripción registrada exitosamente",
      preferences 
    });
  } catch (error) {
    console.error("[NOTIFICATION_SUBSCRIBE]", error);
    return NextResponse.json(
      { error: "Error al registrar suscripción" },
      { status: 500 }
    );
  }
}