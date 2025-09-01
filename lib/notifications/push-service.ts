"use client";

// Servicio para manejar notificaciones push
export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  
  // Clave pública VAPID (en producción debe estar en variables de entorno)
  private readonly VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
    'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM7f53ZLND4317jfd2Eb7E-7Mz9CfAl59RHmRRYD3QKjqCHOq8K4yI';

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Inicializar servicio de notificaciones
  public async initialize(): Promise<boolean> {
    try {
      // Verificar soporte del navegador
      if (!this.isSupported()) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Registrar service worker
      await this.registerServiceWorker();
      
      // Verificar si ya tiene permisos
      const permission = await Notification.permission;
      if (permission === 'granted') {
        await this.subscribeToPush();
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Verificar soporte del navegador
  public isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Registrar service worker
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered:', this.registration);
        
        // Esperar a que esté activo
        await this.waitForServiceWorkerActivation();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  }

  // Esperar activación del service worker
  private async waitForServiceWorkerActivation(): Promise<void> {
    return new Promise((resolve) => {
      if (this.registration?.active) {
        resolve();
        return;
      }

      const checkState = () => {
        if (this.registration?.active) {
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      
      checkState();
    });
  }

  // Solicitar permisos y suscribirse
  public async requestPermissionAndSubscribe(): Promise<boolean> {
    try {
      // Solicitar permiso
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Suscribirse a push
      await this.subscribeToPush();
      return true;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return false;
    }
  }

  // Suscribirse a notificaciones push
  private async subscribeToPush(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Verificar suscripción existente
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Crear nueva suscripción
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
        });

        console.log('New push subscription created');
      }

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(this.subscription);
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      throw error;
    }
  }

  // Enviar suscripción al servidor
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send subscription: ${response.status}`);
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  // Desuscribirse de notificaciones
  public async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        
        // Notificar al servidor
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: this.subscription.endpoint
          }),
        });

        this.subscription = null;
        console.log('Successfully unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  // Obtener estado de suscripción
  public async getSubscriptionStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }> {
    const supported = this.isSupported();
    const permission = supported ? Notification.permission : 'default';
    
    let subscribed = false;
    if (supported && this.registration) {
      try {
        const subscription = await this.registration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.error('Failed to get subscription status:', error);
      }
    }

    return { supported, permission, subscribed };
  }

  // Mostrar notificación local (para testing)
  public async showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options
      });
    }
  }

  // Actualizar configuración de notificaciones del usuario
  public async updateNotificationPreferences(preferences: {
    stockAlerts: boolean;
    salesAlerts: boolean;
    expenseAlerts: boolean;
    customerAlerts: boolean;
    reportAlerts: boolean;
    reminderAlerts: boolean;
  }): Promise<void> {
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  // Enviar notificación de prueba
  public async sendTestNotification(): Promise<void> {
    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Convertir clave VAPID a Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Limpiar recursos
  public cleanup(): void {
    this.registration = null;
    this.subscription = null;
  }
}

// Hook de React para usar notificaciones
import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [service] = useState(() => PushNotificationService.getInstance());
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false,
    loading: true
  });

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await service.initialize();
        const currentStatus = await service.getSubscriptionStatus();
        setStatus({
          ...currentStatus,
          loading: false
        });
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    initializeNotifications();
  }, [service]);

  const requestPermission = async () => {
    const success = await service.requestPermissionAndSubscribe();
    if (success) {
      const newStatus = await service.getSubscriptionStatus();
      setStatus({ ...newStatus, loading: false });
    }
    return success;
  };

  const unsubscribe = async () => {
    const success = await service.unsubscribe();
    if (success) {
      setStatus(prev => ({ ...prev, subscribed: false }));
    }
    return success;
  };

  const sendTestNotification = () => service.sendTestNotification();
  
  const updatePreferences = (preferences: any) => 
    service.updateNotificationPreferences(preferences);

  return {
    status,
    requestPermission,
    unsubscribe,
    sendTestNotification,
    updatePreferences,
    service
  };
};