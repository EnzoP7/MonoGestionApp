import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener preferencias del usuario
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // Si no existen preferencias, devolver valores por defecto
    if (!preferences) {
      return NextResponse.json({
        stockAlerts: true,
        salesAlerts: true,
        expenseAlerts: true,
        customerAlerts: true,
        reportAlerts: true,
        reminderAlerts: true,
      });
    }

    return NextResponse.json({
      stockAlerts: preferences.stockAlerts,
      salesAlerts: preferences.salesAlerts,
      expenseAlerts: preferences.expenseAlerts,
      customerAlerts: preferences.customerAlerts,
      reportAlerts: preferences.reportAlerts,
      reminderAlerts: preferences.reminderAlerts,
    });

  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES_GET]", error);
    return NextResponse.json(
      { error: "Error al obtener preferencias" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      stockAlerts, 
      salesAlerts, 
      expenseAlerts, 
      customerAlerts, 
      reportAlerts, 
      reminderAlerts 
    } = body;

    // Actualizar o crear preferencias
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        stockAlerts,
        salesAlerts,
        expenseAlerts,
        customerAlerts,
        reportAlerts,
        reminderAlerts,
        updatedAt: new Date(),
      },
      create: {
        userId,
        stockAlerts,
        salesAlerts,
        expenseAlerts,
        customerAlerts,
        reportAlerts,
        reminderAlerts,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        stockAlerts: preferences.stockAlerts,
        salesAlerts: preferences.salesAlerts,
        expenseAlerts: preferences.expenseAlerts,
        customerAlerts: preferences.customerAlerts,
        reportAlerts: preferences.reportAlerts,
        reminderAlerts: preferences.reminderAlerts,
      }
    });

  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES_POST]", error);
    return NextResponse.json(
      { error: "Error al guardar preferencias" },
      { status: 500 }
    );
  }
}