// Triggers automáticos para notificaciones basados en eventos del sistema
import { prisma } from "@/lib/prisma";

export class NotificationTriggers {
  // Verificar stock bajo y enviar alertas
  static async checkStockAlerts(userId: string) {
    try {
      // Productos sin stock
      const productosAgotados = await prisma.producto.findMany({
        where: {
          userId,
          cantidad: 0,
          activo: true,
        },
      });

      if (productosAgotados.length > 0) {
        await this.sendNotification(userId, {
          type: 'stock-agotado',
          title: '🚨 Productos Agotados',
          message: `${productosAgotados.length} productos sin stock requieren atención`,
          actionUrl: '/dashboard/productos',
          data: {
            productCount: productosAgotados.length,
            products: productosAgotados.slice(0, 3).map(p => p.nombre),
          },
          priority: 'high'
        });
      }

      // Productos con stock bajo (≤ 10)
      const productosStockBajo = await prisma.producto.findMany({
        where: {
          userId,
          cantidad: { gt: 0, lte: 10 },
          activo: true,
        },
      });

      if (productosStockBajo.length > 0) {
        await this.sendNotification(userId, {
          type: 'stock-bajo',
          title: '⚠️ Stock Bajo',
          message: `${productosStockBajo.length} productos con stock bajo`,
          actionUrl: '/dashboard/productos',
          data: {
            productCount: productosStockBajo.length,
            products: productosStockBajo.slice(0, 3).map(p => `${p.nombre} (${p.cantidad})`),
          }
        });
      }
    } catch (error) {
      console.error('Error checking stock alerts:', error);
    }
  }

  // Detectar ventas importantes
  static async checkHighValueSales(userId: string) {
    try {
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

      // Buscar ventas del día actual superiores a un umbral
      const ventasAltas = await prisma.venta.findMany({
        where: {
          userId,
          fecha: { gte: inicioHoy },
          monto: { gte: 50000 }, // Umbral configurable
        },
        include: {
          cliente: true,
        },
        orderBy: { monto: 'desc' },
      });

      for (const venta of ventasAltas.slice(0, 5)) { // Máximo 5 notificaciones por día
        await this.sendNotification(userId, {
          type: 'venta-alta',
          title: '🎉 Venta Importante',
          message: `Venta de $${venta.monto.toLocaleString()} ${venta.cliente ? `a ${venta.cliente.nombre}` : ''}`,
          actionUrl: `/dashboard/ventas/${venta.id}`,
          data: {
            ventaId: venta.id,
            monto: venta.monto,
            clienteNombre: venta.cliente?.nombre,
          }
        });
      }
    } catch (error) {
      console.error('Error checking high value sales:', error);
    }
  }

  // Verificar metas mensuales
  static async checkMonthlyGoals(userId: string) {
    try {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Calcular ventas del mes
      const ventasDelMes = await prisma.venta.aggregate({
        where: {
          userId,
          fecha: { gte: inicioMes },
        },
        _sum: { monto: true },
      });

      const totalVentas = ventasDelMes._sum.monto || 0;
      
      // Meta mensual (configurable por usuario)
      const metaMensual = 500000; // $500,000 por defecto

      const porcentajeMeta = (totalVentas / metaMensual) * 100;

      // Notificar cuando se alcance 75%, 90% y 100% de la meta
      if (porcentajeMeta >= 100) {
        await this.sendNotification(userId, {
          type: 'meta-alcanzada',
          title: '🏆 ¡Meta Alcanzada!',
          message: `¡Felicitaciones! Superaste tu meta mensual con $${totalVentas.toLocaleString()}`,
          actionUrl: '/dashboard/finanzas',
          data: {
            metaMensual,
            totalVentas,
            porcentaje: porcentajeMeta,
          }
        });
      } else if (porcentajeMeta >= 90) {
        await this.sendNotification(userId, {
          type: 'meta-cercana',
          title: '🎯 Cerca de la Meta',
          message: `Estás al ${porcentajeMeta.toFixed(0)}% de tu meta mensual`,
          actionUrl: '/dashboard/finanzas',
          data: {
            metaMensual,
            totalVentas,
            porcentaje: porcentajeMeta,
          }
        });
      }
    } catch (error) {
      console.error('Error checking monthly goals:', error);
    }
  }

  // Verificar límites de gastos
  static async checkExpenseLimits(userId: string) {
    try {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      // Calcular egresos del mes
      const egresosDelMes = await prisma.egreso.aggregate({
        where: {
          userId,
          fecha: { gte: inicioMes },
        },
        _sum: { monto: true },
      });

      const totalEgresos = egresosDelMes._sum.monto || 0;
      
      // Límite mensual de gastos (configurable)
      const limiteGastos = 200000; // $200,000 por defecto

      const porcentajeLimite = (totalEgresos / limiteGastos) * 100;

      if (porcentajeLimite >= 90) {
        await this.sendNotification(userId, {
          type: 'limite-gastos',
          title: '⚠️ Límite de Gastos',
          message: `Alcanzaste el ${porcentajeLimite.toFixed(0)}% de tu límite mensual de gastos`,
          actionUrl: '/dashboard/egresos',
          data: {
            limiteGastos,
            totalEgresos,
            porcentaje: porcentajeLimite,
          },
          priority: 'high'
        });
      }
    } catch (error) {
      console.error('Error checking expense limits:', error);
    }
  }

  // Detectar clientes nuevos
  static async checkNewCustomers(userId: string) {
    try {
      const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const clientesNuevos = await prisma.cliente.findMany({
        where: {
          userId,
          createdAt: { gte: hace24Horas },
        },
      });

      for (const cliente of clientesNuevos) {
        await this.sendNotification(userId, {
          type: 'cliente-nuevo',
          title: '👋 Cliente Nuevo',
          message: `${cliente.nombre} se registró como nuevo cliente`,
          actionUrl: `/dashboard/clientes/${cliente.id}`,
          data: {
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
          }
        });
      }
    } catch (error) {
      console.error('Error checking new customers:', error);
    }
  }

  // Detectar clientes inactivos
  static async checkInactiveCustomers(userId: string) {
    try {
      const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clientes con última compra hace más de 30 días
      const clientesInactivos = await prisma.cliente.findMany({
        where: {
          userId,
          ventas: {
            none: {
              fecha: { gte: hace30Dias },
            },
          },
        },
        include: {
          ventas: {
            orderBy: { fecha: 'desc' },
            take: 1,
          },
        },
      });

      // Notificar solo clientes valiosos (más de $10,000 en compras históricas)
      for (const cliente of clientesInactivos.slice(0, 3)) { // Máximo 3 por día
        const totalCompras = await prisma.venta.aggregate({
          where: {
            userId,
            clienteId: cliente.id,
          },
          _sum: { monto: true },
        });

        if ((totalCompras._sum.monto || 0) > 10000) {
          await this.sendNotification(userId, {
            type: 'cliente-inactivo',
            title: '😴 Cliente Inactivo',
            message: `${cliente.nombre} no compra hace tiempo. Total histórico: $${totalCompras._sum.monto?.toLocaleString()}`,
            actionUrl: `/dashboard/clientes/${cliente.id}`,
            data: {
              clienteId: cliente.id,
              clienteNombre: cliente.nombre,
              totalCompras: totalCompras._sum.monto,
              ultimaCompra: cliente.ventas[0]?.fecha,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking inactive customers:', error);
    }
  }

  // Notificar cuando los reportes estén listos
  static async notifyReportReady(userId: string, reportType: string, downloadUrl: string) {
    try {
      await this.sendNotification(userId, {
        type: 'reporte-listo',
        title: '📊 Reporte Disponible',
        message: `Tu reporte de ${reportType} está listo para descargar`,
        actionUrl: downloadUrl,
        data: {
          reportType,
          downloadUrl,
        }
      });
    } catch (error) {
      console.error('Error sending report notification:', error);
    }
  }

  // Función helper para enviar notificaciones
  private static async sendNotification(userId: string, notificationData: {
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    data?: any;
    priority?: 'normal' | 'high';
  }) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          ...notificationData
        }),
      });

      if (!response.ok) {
        console.error('Failed to send notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Ejecutar todas las verificaciones automáticas
  static async runAllChecks(userId: string) {
    console.log(`Running notification checks for user ${userId}`);
    
    await Promise.allSettled([
      this.checkStockAlerts(userId),
      this.checkHighValueSales(userId),
      this.checkMonthlyGoals(userId),
      this.checkExpenseLimits(userId),
      this.checkNewCustomers(userId),
      this.checkInactiveCustomers(userId),
    ]);
  }
}