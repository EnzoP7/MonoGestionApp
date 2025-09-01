// Service Worker para notificaciones push
const CACHE_NAME = 'monogestion-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const defaultOptions = {
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: []
  };

  let notificationData;
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (e) {
    notificationData = {
      title: 'MonoGestión',
      body: 'Nueva notificación disponible',
      type: 'info'
    };
  }

  // Configurar notificación según tipo
  const notification = getNotificationConfig(notificationData);
  
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      ...defaultOptions,
      ...notification.options,
      data: notificationData
    })
  );
});

// Configurar notificaciones según tipo
function getNotificationConfig(data) {
  const { type, title, body, actionUrl, priority = 'normal' } = data;
  
  const configs = {
    // 🚨 ALERTAS CRÍTICAS
    'stock-agotado': {
      title: '🚨 Stock Agotado',
      options: {
        body: body || 'Productos sin stock requieren atención inmediata',
        icon: '/icons/alert-critical.png',
        badge: '/icons/stock-alert.png',
        tag: 'stock-alert',
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
          { action: 'view-stock', title: '📦 Ver Inventario' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },
    
    'stock-bajo': {
      title: '⚠️ Stock Bajo',
      options: {
        body: body || 'Algunos productos tienen stock bajo',
        icon: '/icons/alert-warning.png',
        tag: 'stock-warning',
        actions: [
          { action: 'view-stock', title: '📦 Ver Productos' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    // 💰 EVENTOS FINANCIEROS
    'venta-alta': {
      title: '🎉 Venta Importante',
      options: {
        body: body || 'Nueva venta de alto valor registrada',
        icon: '/icons/money-success.png',
        tag: 'venta-alta',
        actions: [
          { action: 'view-sale', title: '💰 Ver Venta' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    'meta-alcanzada': {
      title: '🏆 Meta Alcanzada',
      options: {
        body: body || '¡Felicitaciones! Has alcanzado tu meta',
        icon: '/icons/trophy.png',
        tag: 'meta-success',
        actions: [
          { action: 'view-dashboard', title: '📊 Ver Dashboard' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    'limite-gastos': {
      title: '⚠️ Límite de Gastos',
      options: {
        body: body || 'Te estás acercando al límite de gastos mensual',
        icon: '/icons/alert-expense.png',
        tag: 'expense-warning',
        requireInteraction: true,
        actions: [
          { action: 'view-expenses', title: '💳 Ver Gastos' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    // 📅 RECORDATORIOS
    'pago-pendiente': {
      title: '💳 Pago Pendiente',
      options: {
        body: body || 'Tienes pagos pendientes por realizar',
        icon: '/icons/payment-due.png',
        tag: 'payment-due',
        requireInteraction: true,
        actions: [
          { action: 'view-payments', title: '💰 Ver Pagos' },
          { action: 'snooze', title: '⏰ Recordar más tarde' }
        ]
      }
    },

    'factura-vence': {
      title: '📄 Factura por Vencer',
      options: {
        body: body || 'Facturas próximas a vencer requieren atención',
        icon: '/icons/invoice-warning.png',
        tag: 'invoice-due',
        actions: [
          { action: 'view-invoices', title: '📋 Ver Facturas' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    // 👥 CLIENTES
    'cliente-nuevo': {
      title: '👋 Cliente Nuevo',
      options: {
        body: body || 'Nuevo cliente registrado en el sistema',
        icon: '/icons/user-new.png',
        tag: 'new-customer',
        actions: [
          { action: 'view-customer', title: '👤 Ver Cliente' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    'cliente-inactivo': {
      title: '😴 Cliente Inactivo',
      options: {
        body: body || 'Cliente sin compras hace tiempo',
        icon: '/icons/user-inactive.png',
        tag: 'inactive-customer',
        actions: [
          { action: 'contact-customer', title: '📞 Contactar' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    // 📊 REPORTES Y ANÁLISIS
    'reporte-listo': {
      title: '📊 Reporte Disponible',
      options: {
        body: body || 'Tu reporte mensual está listo',
        icon: '/icons/report-ready.png',
        tag: 'report-ready',
        actions: [
          { action: 'view-report', title: '📈 Ver Reporte' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      }
    },

    'backup-completado': {
      title: '💾 Backup Completado',
      options: {
        body: body || 'Respaldo de datos completado exitosamente',
        icon: '/icons/backup-success.png',
        tag: 'backup-success'
      }
    },

    // 🔔 NOTIFICACIÓN GENERAL
    'info': {
      title: title || '🔔 MonoGestión',
      options: {
        body: body || 'Nueva notificación disponible',
        icon: '/icons/app-icon.png',
        tag: 'general-info'
      }
    }
  };

  return configs[type] || configs['info'];
}

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received.');
  
  event.notification.close();
  
  const { action } = event;
  const { data } = event.notification;
  
  // Determinar URL según acción
  let targetUrl = '/dashboard';
  
  switch (action) {
    case 'view-stock':
      targetUrl = '/dashboard/productos';
      break;
    case 'view-sale':
      targetUrl = '/dashboard/ventas';
      break;
    case 'view-dashboard':
      targetUrl = '/dashboard/finanzas';
      break;
    case 'view-expenses':
      targetUrl = '/dashboard/egresos';
      break;
    case 'view-payments':
      targetUrl = '/dashboard/movimientos';
      break;
    case 'view-invoices':
      targetUrl = '/dashboard/ventas';
      break;
    case 'view-customer':
      targetUrl = data.customerId ? `/dashboard/clientes/${data.customerId}` : '/dashboard/clientes';
      break;
    case 'view-report':
      targetUrl = '/dashboard/reportes';
      break;
    case 'contact-customer':
      // Aquí podrías abrir WhatsApp, email, etc.
      targetUrl = `/dashboard/clientes/${data.customerId}`;
      break;
    case 'snooze':
      // Programar recordatorio para más tarde
      scheduleSnoozeNotification(data);
      return;
    case 'dismiss':
      return;
    default:
      targetUrl = data.actionUrl || '/dashboard';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si hay una ventana abierta, enfocarla y navegar
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Programar notificación para más tarde
function scheduleSnoozeNotification(data) {
  // Programar para 1 hora más tarde
  const snoozeTime = 60 * 60 * 1000; // 1 hora en ms
  
  setTimeout(() => {
    self.registration.showNotification(data.title, {
      body: `⏰ Recordatorio: ${data.body}`,
      icon: '/icons/reminder.png',
      tag: `snooze-${Date.now()}`,
      data: data
    });
  }, snoozeTime);
}

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Aquí podrías enviar analíticas sobre notificaciones cerradas
  // analytics.track('notification_closed', { tag: event.notification.tag });
});