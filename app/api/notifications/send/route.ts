import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";
import webpush from 'web-push';

// Configurar VAPID keys (en producción usar variables de entorno)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM7f53ZLND4317jfd2Eb7E-7Mz9CfAl59RHmRRYD3QKjqCHOq8K4yI',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'nV1FpB1i-U-7kLq3-9XHBQ7iGV7T8hbRpY6MFxUHLNY',
};

webpush.setVapidDetails(
  'mailto:admin@monogestion.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      targetUserId, 
      type, 
      title, 
      message, 
      actionUrl, 
      data = {},
      priority = 'normal'
    } = body;

    // Si no se especifica targetUserId, usar el userId actual
    const recipientId = targetUserId || userId;

    // Obtener suscripciones activas del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: recipientId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: "Usuario no tiene suscripciones activas" 
      });
    }

    // Verificar preferencias de notificación
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: recipientId },
    });

    // Verificar si el tipo de notificación está habilitado
    if (preferences && !shouldSendNotification(type, preferences)) {
      return NextResponse.json({ 
        success: false,
        message: "Tipo de notificación deshabilitado por el usuario" 
      });
    }

    // Preparar payload de notificación
    const notificationPayload = {
      type,
      title,
      body: message,
      actionUrl,
      priority,
      timestamp: new Date().toISOString(),
      ...data
    };

    // Enviar notificación a todas las suscripciones
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: JSON.parse(subscription.keys),
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          {
            urgency: priority === 'high' ? 'high' : 'normal',
            TTL: 24 * 60 * 60, // 24 horas
          }
        );

        return { success: true, endpoint: subscription.endpoint };
      } catch (error: any) {
        console.error(`Failed to send to ${subscription.endpoint}:`, error);
        
        // Si la suscripción es inválida, desactivarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false },
          });
        }

        return { success: false, endpoint: subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    // Registrar notificación en historial
    await prisma.notificationHistory.create({
      data: {
        userId: recipientId,
        type,
        title,
        message,
        actionUrl,
        status: successCount > 0 ? 'sent' : 'failed',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: successCount > 0,
      message: `Notificación enviada a ${successCount} de ${subscriptions.length} dispositivos`,
      results: results
    });

  } catch (error) {
    console.error("[NOTIFICATION_SEND]", error);
    return NextResponse.json(
      { error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}

// Verificar si se debe enviar la notificación según las preferencias
function shouldSendNotification(type: string, preferences: any): boolean {
  const typeMapping: Record<string, keyof typeof preferences> = {
    'stock-agotado': 'stockAlerts',
    'stock-bajo': 'stockAlerts',
    'venta-alta': 'salesAlerts',
    'meta-alcanzada': 'salesAlerts',
    'limite-gastos': 'expenseAlerts',
    'pago-pendiente': 'reminderAlerts',
    'factura-vence': 'reminderAlerts',
    'cliente-nuevo': 'customerAlerts',
    'cliente-inactivo': 'customerAlerts',
    'reporte-listo': 'reportAlerts',
    'backup-completado': 'reportAlerts',
  };

  const preferenceKey = typeMapping[type];
  return preferenceKey ? preferences[preferenceKey] : true;
}