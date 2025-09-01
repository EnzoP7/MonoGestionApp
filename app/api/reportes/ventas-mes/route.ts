import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { fechaInicio, fechaFin, formato } = body;

    if (!fechaInicio || !fechaFin || !formato) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos: fechaInicio, fechaFin, formato" },
        { status: 400 }
      );
    }

    // Obtener ventas en el rango de fechas
    const ventas = await prisma.venta.findMany({
      where: {
        userId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      include: {
        cliente: true,
        VentaProducto: {
          include: {
            producto: true
          }
        },
        servicios: {
          include: {
            servicio: true
          }
        }
      },
      orderBy: { fecha: "asc" },
    });

    // Calcular métricas
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.monto, 0);
    const numeroVentas = ventas.length;
    const ventaPromedio = numeroVentas > 0 ? totalVentas / numeroVentas : 0;

    // Separar productos vs servicios
    const ventasProductos = ventas.filter(v => v.tipo === 'producto' || v.tipo === 'mixta');
    const ventasServicios = ventas.filter(v => v.tipo === 'servicio' || v.tipo === 'mixta');
    
    const totalProductos = ventasProductos.reduce((sum, venta) => {
      return sum + venta.VentaProducto.reduce((pSum, vp) => pSum + (vp.cantidad * vp.precio), 0);
    }, 0);
    
    const totalServicios = ventasServicios.reduce((sum, venta) => {
      return sum + venta.servicios.reduce((sSum, vs) => sSum + (vs.cantidad * vs.precio), 0);
    }, 0);

    // Análisis por días
    const ventasPorDia = ventas.reduce((acc, venta) => {
      const fecha = venta.fecha.toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, monto: 0, cantidad: 0 };
      }
      acc[fecha].monto += venta.monto;
      acc[fecha].cantidad += 1;
      return acc;
    }, {} as Record<string, any>);

    const tendenciaDiaria = Object.values(ventasPorDia).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // Top clientes
    const clientesVentas = ventas.reduce((acc, venta) => {
      const clienteNombre = venta.cliente?.nombre || "Cliente General";
      if (!acc[clienteNombre]) {
        acc[clienteNombre] = { nombre: clienteNombre, monto: 0, cantidad: 0 };
      }
      acc[clienteNombre].monto += venta.monto;
      acc[clienteNombre].cantidad += 1;
      return acc;
    }, {} as Record<string, any>);

    const topClientes = Object.values(clientesVentas)
      .sort((a: any, b: any) => b.monto - a.monto)
      .slice(0, 10);

    // Productos más vendidos
    const productosVendidos = ventas.flatMap(venta => 
      venta.VentaProducto.map(vp => ({
        nombre: vp.producto.nombre,
        cantidad: vp.cantidad,
        monto: vp.cantidad * vp.precio
      }))
    ).reduce((acc, item) => {
      if (!acc[item.nombre]) {
        acc[item.nombre] = { nombre: item.nombre, cantidad: 0, monto: 0 };
      }
      acc[item.nombre].cantidad += item.cantidad;
      acc[item.nombre].monto += item.monto;
      return acc;
    }, {} as Record<string, any>);

    const topProductos = Object.values(productosVendidos)
      .sort((a: any, b: any) => b.monto - a.monto)
      .slice(0, 10);

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalVentas,
        numeroVentas,
        ventaPromedio,
        totalProductos,
        totalServicios,
        porcentajeProductos: totalVentas > 0 ? (totalProductos / totalVentas) * 100 : 0,
        porcentajeServicios: totalVentas > 0 ? (totalServicios / totalVentas) * 100 : 0,
      },
      ventas: ventas.map(venta => ({
        fecha: venta.fecha.toISOString().split('T')[0],
        cliente: venta.cliente?.nombre || "Cliente General",
        tipo: venta.tipo,
        monto: venta.monto,
        productos: venta.VentaProducto.map(vp => ({
          nombre: vp.producto.nombre,
          cantidad: vp.cantidad,
          precio: vp.precio,
          subtotal: vp.cantidad * vp.precio
        })),
        servicios: venta.servicios.map(vs => ({
          nombre: vs.servicio.nombre,
          cantidad: vs.cantidad,
          precio: vs.precio,
          subtotal: vs.cantidad * vs.precio
        }))
      })),
      tendenciaDiaria,
      topClientes,
      topProductos,
    };

    if (formato === 'excel') {
      return generateExcelReport(reporteData);
    } else if (formato === 'pdf') {
      return generatePDFReport(reporteData);
    } else {
      return NextResponse.json(
        { error: "Formato no soportado. Use 'excel' o 'pdf'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[REPORTE_VENTAS_MES]", error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();

  // Hoja de Resumen
  const resumenData = [
    ["REPORTE DE VENTAS"],
    [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN EJECUTIVO"],
    ["Total Ventas", `$${data.resumen.totalVentas.toLocaleString()}`],
    ["Número de Ventas", data.resumen.numeroVentas],
    ["Venta Promedio", `$${data.resumen.ventaPromedio.toLocaleString()}`],
    ["Total Productos", `$${data.resumen.totalProductos.toLocaleString()}`],
    ["Total Servicios", `$${data.resumen.totalServicios.toLocaleString()}`],
    ["% Productos", `${data.resumen.porcentajeProductos.toFixed(1)}%`],
    ["% Servicios", `${data.resumen.porcentajeServicios.toFixed(1)}%`],
    [""],
    ["TOP CLIENTES"],
    ["Cliente", "Monto Total", "Número Ventas"],
    ...data.topClientes.map((cliente: any) => [
      cliente.nombre,
      `$${cliente.monto.toLocaleString()}`,
      cliente.cantidad
    ]),
    [""],
    ["TOP PRODUCTOS"],
    ["Producto", "Cantidad", "Monto Total"],
    ...data.topProductos.map((producto: any) => [
      producto.nombre,
      producto.cantidad,
      `$${producto.monto.toLocaleString()}`
    ])
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  // Hoja de Ventas Detalladas
  if (data.ventas.length > 0) {
    const ventasData = [
      ["Fecha", "Cliente", "Tipo", "Monto", "Detalle"],
      ...data.ventas.map((venta: any) => [
        venta.fecha,
        venta.cliente,
        venta.tipo,
        venta.monto,
        [...venta.productos.map((p: any) => `${p.nombre} (${p.cantidad} x $${p.precio})`),
         ...venta.servicios.map((s: any) => `${s.nombre} (${s.cantidad} x $${s.precio})`)].join("; ")
      ])
    ];
    const ventasSheet = XLSX.utils.aoa_to_sheet(ventasData);
    XLSX.utils.book_append_sheet(workbook, ventasSheet, "Ventas Detalladas");
  }

  // Hoja de Tendencia Diaria
  if (data.tendenciaDiaria.length > 0) {
    const tendenciaData = [
      ["Fecha", "Monto Vendido", "Número Ventas"],
      ...data.tendenciaDiaria.map((dia: any) => [
        dia.fecha,
        dia.monto,
        dia.cantidad
      ])
    ];
    const tendenciaSheet = XLSX.utils.aoa_to_sheet(tendenciaData);
    XLSX.utils.book_append_sheet(workbook, tendenciaSheet, "Tendencia Diaria");
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-ventas-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
    },
  });
}

function generatePDFReport(data: any) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  let yPosition = 20;

  // Título
  pdf.setFontSize(20);
  pdf.setTextColor(51, 51, 51);
  pdf.text("REPORTE DE VENTAS", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Período
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Resumen Ejecutivo
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text("RESUMEN EJECUTIVO", 20, yPosition);
  yPosition += 15;

  // Cuadro de resumen
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 80, 'F');
  
  pdf.setFontSize(12);
  
  // Total ventas
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Total Ventas: $${data.resumen.totalVentas.toLocaleString()}`, 30, yPosition + 10);
  
  // Número de ventas
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Número de Ventas: ${data.resumen.numeroVentas}`, 30, yPosition + 25);
  
  // Venta promedio
  pdf.setTextColor(168, 85, 247);
  pdf.text(`Venta Promedio: $${data.resumen.ventaPromedio.toLocaleString()}`, 30, yPosition + 40);
  
  // Distribución productos vs servicios
  pdf.setTextColor(251, 146, 60);
  pdf.text(`Productos: $${data.resumen.totalProductos.toLocaleString()} (${data.resumen.porcentajeProductos.toFixed(1)}%)`, 30, yPosition + 55);
  
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Servicios: $${data.resumen.totalServicios.toLocaleString()} (${data.resumen.porcentajeServicios.toFixed(1)}%)`, 30, yPosition + 70);
  
  yPosition += 95;

  // Top Clientes
  if (data.topClientes.length > 0) {
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("TOP CLIENTES", 20, yPosition);
    yPosition += 10;

    data.topClientes.slice(0, 8).forEach((cliente: any, index: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${index + 1}. ${cliente.nombre}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`$${cliente.monto.toLocaleString()}`, 120, yPosition);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`(${cliente.cantidad} ventas)`, 160, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Top Productos
  if (data.topProductos.length > 0) {
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("TOP PRODUCTOS VENDIDOS", 20, yPosition);
    yPosition += 10;

    data.topProductos.slice(0, 8).forEach((producto: any, index: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${index + 1}. ${producto.nombre}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`$${producto.monto.toLocaleString()}`, 120, yPosition);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`(${producto.cantidad} unidades)`, 160, yPosition);
      yPosition += 8;
    });
  }

  // Footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 30, pdf.internal.pageSize.height - 10);
    pdf.text(`Generado el ${new Date().toLocaleDateString()}`, 20, pdf.internal.pageSize.height - 10);
  }

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-ventas-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}