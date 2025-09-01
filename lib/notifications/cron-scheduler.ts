// Sistema de programación de verificaciones automáticas para notificaciones
import { NotificationTriggers } from './notification-triggers';

export class NotificationScheduler {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();

  // Iniciar verificaciones automáticas para un usuario
  static startUserNotifications(userId: string) {
    if (this.intervals.has(userId)) {
      console.log(`Notifications already running for user ${userId}`);
      return;
    }

    console.log(`Starting notification checks for user ${userId}`);

    // Verificar cada 30 minutos
    const interval = setInterval(async () => {
      try {
        await NotificationTriggers.runAllChecks(userId);
      } catch (error) {
        console.error(`Error in scheduled notifications for user ${userId}:`, error);
      }
    }, 30 * 60 * 1000); // 30 minutos

    this.intervals.set(userId, interval);

    // Ejecutar verificación inicial
    setTimeout(async () => {
      try {
        await NotificationTriggers.runAllChecks(userId);
      } catch (error) {
        console.error(`Error in initial notification check for user ${userId}:`, error);
      }
    }, 5000); // 5 segundos después del inicio
  }

  // Detener verificaciones para un usuario
  static stopUserNotifications(userId: string) {
    const interval = this.intervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(userId);
      console.log(`Stopped notification checks for user ${userId}`);
    }
  }

  // Reiniciar verificaciones para un usuario
  static restartUserNotifications(userId: string) {
    this.stopUserNotifications(userId);
    this.startUserNotifications(userId);
  }

  // Obtener usuarios activos y iniciar notificaciones para todos
  static async startAllActiveUsers() {
    try {
      // En un entorno real, obtendrías usuarios activos de la base de datos
      // Por ahora, este método puede ser llamado cuando un usuario se conecta
      console.log('Notification scheduler ready for active users');
    } catch (error) {
      console.error('Error starting notifications for all users:', error);
    }
  }

  // Detener todas las verificaciones
  static stopAll() {
    for (const [userId, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped notifications for user ${userId}`);
    }
    this.intervals.clear();
  }

  // Verificaciones específicas por horario
  static scheduleHourlyChecks() {
    // Verificar stock cada hora
    setInterval(async () => {
      try {
        // Aquí podrías obtener todos los usuarios activos y ejecutar verificaciones de stock
        console.log('Running hourly stock checks...');
      } catch (error) {
        console.error('Error in hourly checks:', error);
      }
    }, 60 * 60 * 1000); // 1 hora
  }

  // Verificaciones diarias
  static scheduleDailyChecks() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM

    const msUntilTomorrow = tomorrow.getTime() - now.getTime();

    // Programar primera ejecución para mañana a las 9 AM
    setTimeout(() => {
      this.runDailyChecks();
      
      // Luego ejecutar cada 24 horas
      setInterval(() => {
        this.runDailyChecks();
      }, 24 * 60 * 60 * 1000);
    }, msUntilTomorrow);
  }

  private static async runDailyChecks() {
    try {
      console.log('Running daily notification checks...');
      // Aquí ejecutarías verificaciones diarias como:
      // - Clientes inactivos
      // - Resúmenes diarios
      // - Recordatorios de pagos
    } catch (error) {
      console.error('Error in daily checks:', error);
    }
  }

  // Método para integrar con el sistema de autenticación
  static onUserLogin(userId: string) {
    this.startUserNotifications(userId);
  }

  // Método para cuando el usuario se desconecta
  static onUserLogout(userId: string) {
    this.stopUserNotifications(userId);
  }
}