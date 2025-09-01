"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  AlertTriangle, 
  DollarSign,
  Users,
  BarChart3,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Settings,
  TestTube
} from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/lib/notifications/push-service";

interface NotificationPreferences {
  stockAlerts: boolean;
  salesAlerts: boolean;
  expenseAlerts: boolean;
  customerAlerts: boolean;
  reportAlerts: boolean;
  reminderAlerts: boolean;
}

export default function NotificacionesConfigPage() {
  const { status, requestPermission, unsubscribe, sendTestNotification } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    stockAlerts: true,
    salesAlerts: true,
    expenseAlerts: true,
    customerAlerts: true,
    reportAlerts: true,
    reminderAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar preferencias al montar el componente
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success('¡Notificaciones habilitadas correctamente!');
    } else {
      toast.error('No se pudieron habilitar las notificaciones');
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Notificaciones deshabilitadas');
    } else {
      toast.error('Error al deshabilitar notificaciones');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      toast.success('Notificación de prueba enviada');
    } catch (error) {
      toast.error('Error al enviar notificación de prueba');
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      toast.success('Preferencias actualizadas');
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences(preferences);
      toast.error('Error al guardar preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (status.loading) {
      return <Badge variant="secondary">Cargando...</Badge>;
    }
    
    if (!status.supported) {
      return <Badge variant="destructive">No Soportado</Badge>;
    }
    
    if (status.permission === 'denied') {
      return <Badge variant="destructive">Denegado</Badge>;
    }
    
    if (status.subscribed) {
      return <Badge variant="default" className="bg-green-500">Activo</Badge>;
    }
    
    return <Badge variant="outline">Inactivo</Badge>;
  };

  const notificationTypes = [
    {
      key: 'stockAlerts' as keyof NotificationPreferences,
      title: 'Alertas de Inventario',
      description: 'Stock bajo, productos agotados',
      icon: Package,
      color: 'text-orange-500',
      examples: ['🚨 Producto sin stock', '⚠️ Stock bajo en 5 productos']
    },
    {
      key: 'salesAlerts' as keyof NotificationPreferences,
      title: 'Alertas de Ventas',
      description: 'Ventas importantes, metas alcanzadas',
      icon: DollarSign,
      color: 'text-green-500',
      examples: ['🎉 Venta de $50.000', '🏆 Meta mensual alcanzada']
    },
    {
      key: 'expenseAlerts' as keyof NotificationPreferences,
      title: 'Alertas de Gastos',
      description: 'Límites de gastos, presupuesto',
      icon: AlertTriangle,
      color: 'text-red-500',
      examples: ['⚠️ Límite de gastos al 90%', '💳 Gasto inusual detectado']
    },
    {
      key: 'customerAlerts' as keyof NotificationPreferences,
      title: 'Alertas de Clientes',
      description: 'Nuevos clientes, clientes inactivos',
      icon: Users,
      color: 'text-blue-500',
      examples: ['👋 Nuevo cliente registrado', '😴 Cliente inactivo 30 días']
    },
    {
      key: 'reportAlerts' as keyof NotificationPreferences,
      title: 'Reportes y Análisis',
      description: 'Reportes listos, análisis completados',
      icon: BarChart3,
      color: 'text-purple-500',
      examples: ['📊 Reporte mensual listo', '📈 Análisis completado']
    },
    {
      key: 'reminderAlerts' as keyof NotificationPreferences,
      title: 'Recordatorios',
      description: 'Pagos pendientes, facturas por vencer',
      icon: Clock,
      color: 'text-amber-500',
      examples: ['💳 Pago vence en 3 días', '📄 Factura por vencer']
    }
  ];

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Configuración de Notificaciones
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus notificaciones push y preferencias de alertas
          </p>
        </div>

        {/* Estado del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Estado de Notificaciones
              </div>
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              Configuración del sistema de notificaciones push
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {status.supported ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {status.supported ? 'Navegador Compatible' : 'No Compatible'}
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {status.permission === 'granted' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : status.permission === 'denied' ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-500" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  Permisos {status.permission === 'granted' ? 'Otorgados' : 
                           status.permission === 'denied' ? 'Denegados' : 'Pendientes'}
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {status.subscribed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {status.subscribed ? 'Suscrito Activamente' : 'No Suscrito'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              {!status.subscribed && status.supported && (
                <Button onClick={handlePermissionRequest} size="lg">
                  <Bell className="h-4 w-4 mr-2" />
                  Habilitar Notificaciones
                </Button>
              )}
              
              {status.subscribed && (
                <>
                  <Button 
                    onClick={handleTestNotification}
                    variant="outline"
                    size="lg"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Probar Notificación
                  </Button>
                  
                  <Button 
                    onClick={handleUnsubscribe}
                    variant="destructive"
                    size="lg"
                  >
                    <BellOff className="h-4 w-4 mr-2" />
                    Deshabilitar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferencias por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias de Notificaciones
            </CardTitle>
            <CardDescription>
              Configura qué tipos de notificaciones quieres recibir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {notificationTypes.map((type, index) => {
                const IconComponent = type.icon;
                const isEnabled = preferences[type.key];
                
                return (
                  <div key={type.key}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`mt-1 ${type.color}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-medium">{type.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {type.description}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Ejemplos:</p>
                            <div className="flex flex-wrap gap-1">
                              {type.examples.map((example, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => 
                            updatePreference(type.key, checked)
                          }
                          disabled={isSaving || !status.subscribed}
                        />
                        <Label className="text-xs">
                          {isEnabled ? 'ON' : 'OFF'}
                        </Label>
                      </div>
                    </div>
                    
                    {index < notificationTypes.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Información Importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🔋 Ahorro de Batería</h4>
                <p className="text-sm text-muted-foreground">
                  Las notificaciones se agrupan para minimizar el consumo de batería
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🕐 Horarios Inteligentes</h4>
                <p className="text-sm text-muted-foreground">
                  No enviamos notificaciones entre 22:00 y 7:00 horas
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">📱 Múltiples Dispositivos</h4>
                <p className="text-sm text-muted-foreground">
                  Las notificaciones llegan a todos tus dispositivos sincronizados
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🔒 Privacidad</h4>
                <p className="text-sm text-muted-foreground">
                  Los datos nunca se comparten con terceros
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}