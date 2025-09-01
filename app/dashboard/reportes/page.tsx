"use client";

import { useState } from "react";
import { CalendarIcon, TrendingUp, DollarSign, Package, Users, ShoppingCart, FileText, BarChart3, PieChart, LineChart, ArrowUpRight, ArrowDownRight, UserPlus, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "financiero" | "inventario" | "clientes" | "general";
  color: string;
  metrics: string[];
}

const reportOptions: ReportOption[] = [
  // Reportes Financieros
  {
    id: "ventas-mes",
    title: "Resumen de Ventas",
    description: "Análisis completo de ventas por productos y servicios",
    icon: TrendingUp,
    category: "financiero",
    color: "bg-green-500",
    metrics: ["Total ventas", "Venta promedio", "Productos vs Servicios", "Tendencia diaria"]
  },
  {
    id: "ingresos-egresos",
    title: "Ingresos vs Egresos",
    description: "Comparativa mensual de ingresos y gastos por categorías",
    icon: BarChart3,
    category: "financiero", 
    color: "bg-blue-500",
    metrics: ["Balance neto", "Ingresos por categoría", "Gastos por categoría", "Margen de ganancia"]
  },
  {
    id: "compras-proveedores",
    title: "Compras y Proveedores",
    description: "Análisis de compras realizadas y desempeño de proveedores",
    icon: ShoppingCart,
    category: "financiero",
    color: "bg-purple-500",
    metrics: ["Total compras", "Proveedor principal", "Productos más comprados", "Costo promedio"]
  },
  
  // Reportes de Inventario
  {
    id: "stock-productos",
    title: "Estado del Inventario",
    description: "Control de stock, productos agotados y rotación de inventario",
    icon: Package,
    category: "inventario",
    color: "bg-orange-500",
    metrics: ["Stock bajo", "Productos sin stock", "Rotación de inventario", "Valor del inventario"]
  },
  {
    id: "productos-top",
    title: "Productos Más Vendidos",
    description: "Ranking de productos con mejor desempeño de ventas",
    icon: TrendingUp,
    category: "inventario",
    color: "bg-yellow-500",
    metrics: ["Top 10 productos", "Unidades vendidas", "Revenue por producto", "Tendencia de ventas"]
  },
  
  // Reportes de Clientes
  {
    id: "clientes-ventas",
    title: "Análisis de Clientes",
    description: "Comportamiento de compra y segmentación de clientes",
    icon: Users,
    category: "clientes",
    color: "bg-cyan-500",
    metrics: ["Clientes activos", "Cliente premium", "Frecuencia de compra", "Valor promedio por cliente"]
  },
  {
    id: "clientes-nuevos",
    title: "Nuevos Clientes",
    description: "Análisis de adquisición y retención de clientes nuevos",
    icon: UserPlus,
    category: "clientes", 
    color: "bg-teal-500",
    metrics: ["Clientes nuevos", "Tasa de retención", "Primera compra promedio", "Tiempo hasta segunda compra"]
  },
  
  // Reportes Generales
  {
    id: "movimientos-general",
    title: "Movimientos Generales",
    description: "Vista consolidada de todos los movimientos financieros",
    icon: FileText,
    category: "general",
    color: "bg-gray-500",
    metrics: ["Total movimientos", "Distribución por tipo", "Flujo de efectivo", "Categorías principales"]
  },
  {
    id: "tendencias-mes",
    title: "Tendencias del Mes",
    description: "Análisis de tendencias y patrones del mes actual",
    icon: LineChart,
    category: "general",
    color: "bg-indigo-500",
    metrics: ["Crecimiento semanal", "Días pico", "Patrones de compra", "Proyecciones"]
  }
];

const categoryLabels = {
  financiero: "Financiero",
  inventario: "Inventario", 
  clientes: "Clientes",
  general: "General"
};

const categoryColors = {
  financiero: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inventario: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", 
  clientes: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function ReportesPage() {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formatoReporte, setFormatoReporte] = useState<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const filteredReports = selectedCategory 
    ? reportOptions.filter(report => report.category === selectedCategory)
    : reportOptions;

  const generateReports = async () => {
    if (selectedReports.length === 0) {
      toast.error("Selecciona al menos un reporte para generar");
      return;
    }

    setIsGenerating(true);
    
    try {
      if (selectedReports.includes('ingresos-egresos')) {
        // Generar reporte de Ingresos vs Egresos
        await generateIngresosEgresosReport(formatoReporte);
      }
      
      if (selectedReports.includes('compras-proveedores')) {
        // Generar reporte de Compras y Proveedores
        await generateComprasProveedoresReport(formatoReporte);
      }

      if (selectedReports.includes('ventas-mes')) {
        await generateVentasMesReport(formatoReporte);
      }

      if (selectedReports.includes('stock-productos')) {
        await generateStockProductosReport(formatoReporte);
      }

      if (selectedReports.includes('productos-top')) {
        await generateProductosTopReport(formatoReporte);
      }

      if (selectedReports.includes('clientes-ventas')) {
        await generateClientesVentasReport(formatoReporte);
      }

      if (selectedReports.includes('clientes-nuevos')) {
        await generateClientesNuevosReport(formatoReporte);
      }

      if (selectedReports.includes('movimientos-general')) {
        await generateMovimientosGeneralReport(formatoReporte);
      }

      if (selectedReports.includes('tendencias-mes')) {
        await generateTendenciasMesReport(formatoReporte);
      }
      
      toast.success("Reportes generados exitosamente");
    } catch (error) {
      toast.error("Error al generar los reportes");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateIngresosEgresosReport = async (formato: 'pdf' | 'excel') => {
    try {
      const response = await fetch('/api/reportes/ingresos-egresos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaInicio: dateRange.from,
          fechaFin: dateRange.to,
          formato
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Crear nombre de archivo
      const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `reporte-ingresos-egresos-${dateRange.from}-${dateRange.to}.${extension}`;

      // Crear link de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  };

  const generateComprasProveedoresReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/compras-proveedores', 'compras-proveedores', formato);
  };

  const generateVentasMesReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/ventas-mes', 'ventas', formato);
  };

  const generateStockProductosReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/stock-productos', 'inventario', formato);
  };

  const generateProductosTopReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/productos-top', 'top-productos', formato);
  };

  const generateClientesVentasReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/clientes-ventas', 'analisis-clientes', formato);
  };

  const generateClientesNuevosReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/clientes-nuevos', 'nuevos-clientes', formato);
  };

  const generateMovimientosGeneralReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/movimientos-general', 'movimientos-general', formato);
  };

  const generateTendenciasMesReport = async (formato: 'pdf' | 'excel') => {
    await generateReport('/api/reportes/tendencias-mes', 'tendencias', formato);
  };

  const generateReport = async (endpoint: string, reportName: string, formato: 'pdf' | 'excel') => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaInicio: dateRange.from,
          fechaFin: dateRange.to,
          formato
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el reporte');
      }

      // Obtener el blob del archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Crear nombre de archivo
      const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `${reportName}-${dateRange.from}-${dateRange.to}.${extension}`;

      // Crear link de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error generando reporte ${reportName}:`, error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reportes Mensuales</h1>
            <p className="text-muted-foreground">
              Genera reportes detallados para analizar el desempeño de tu negocio
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Rango de Fechas
          </CardTitle>
          <CardDescription>
            Selecciona el período para generar los reportes (por defecto: mes actual)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Fecha inicial</Label>
              <Input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Fecha final</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const now = new Date();
                setDateRange({
                  from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
                  to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                });
              }}
            >
              Mes Actual
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                setDateRange({
                  from: lastMonth.toISOString().split('T')[0],
                  to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0]
                });
              }}
            >
              Mes Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const now = new Date();
                setDateRange({
                  from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
                  to: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
                });
              }}
            >
              Año Actual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          size="sm"
        >
          Todos los Reportes
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? "default" : "outline"}
            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            size="sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = report.icon;
          const isSelected = selectedReports.includes(report.id);
          
          return (
            <Card 
              key={report.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => toggleReport(report.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${report.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <Badge 
                    variant="secondary"
                    className={categoryColors[report.category]}
                  >
                    {categoryLabels[report.category]}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription className="text-sm">
                  {report.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Métricas incluidas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {report.metrics.map((metric, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center gap-1 text-sm text-primary font-medium">
                      <ArrowUpRight className="h-4 w-4" />
                      Seleccionado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Reports Summary */}
      {selectedReports.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Reportes Seleccionados ({selectedReports.length})
            </CardTitle>
            <CardDescription>
              Los siguientes reportes serán generados para el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {selectedReports.map(reportId => {
                const report = reportOptions.find(r => r.id === reportId);
                if (!report) return null;
                
                return (
                  <div 
                    key={reportId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                  >
                    <div className={`p-1 rounded ${report.color} text-white`}>
                      <report.icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium">{report.title}</span>
                  </div>
                );
              })}
            </div>
            
            <Separator className="mb-4" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Período del Reporte</Label>
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {dateRange.from} al {dateRange.to}
                </div>
              </div>
              
              {(selectedReports.includes('ingresos-egresos') || 
                selectedReports.includes('compras-proveedores') ||
                selectedReports.includes('ventas-mes') ||
                selectedReports.includes('stock-productos') ||
                selectedReports.includes('productos-top') ||
                selectedReports.includes('clientes-ventas') ||
                selectedReports.includes('clientes-nuevos') ||
                selectedReports.includes('movimientos-general') ||
                selectedReports.includes('tendencias-mes')) && (
                <div className="space-y-2">
                  <Label>Formato de Exportación</Label>
                  <Select value={formatoReporte} onValueChange={(value: 'pdf' | 'excel') => setFormatoReporte(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-600" />
                          <span>PDF - Reporte Visual</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          <span>Excel - Datos para Análisis</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={generateReports} 
                disabled={isGenerating}
                className="gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Generar Reportes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}