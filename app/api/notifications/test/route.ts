import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Enviar notificación de prueba usando el endpoint existente
    const testNotification = {
      targetUserId: userId,
      type: 'test-notification',
      title: '🧪 Notificación de Prueba',
      message: 'Si ves este mensaje, las notificaciones push están funcionando correctamente.',
      actionUrl: '/dashboard/configuracion/notificaciones',
      data: {
        testTimestamp: new Date().toISOString(),
        testMessage: 'Sistema de notificaciones activo'
      },
      priority: 'normal'
    };

    // Hacer request interno al endpoint de envío
    const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Pasar cookies para autenticación
      },
      body: JSON.stringify(testNotification),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error('Error sending test notification:', errorText);
      return NextResponse.json(
        { error: "Error al enviar notificación de prueba" },
        { status: 500 }
      );
    }

    const result = await sendResponse.json();
    return NextResponse.json({
      success: true,
      message: "Notificación de prueba enviada exitosamente",
      details: result
    });

  } catch (error) {
    console.error("[NOTIFICATION_TEST]", error);
    return NextResponse.json(
      { error: "Error al enviar notificación de prueba" },
      { status: 500 }
    );
  }
}