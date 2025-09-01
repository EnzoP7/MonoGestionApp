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

    // Obtener ventas con productos en el período
    const ventasConProductos = await prisma.ventaProducto.findMany({
      where: {
        venta: {
          userId,
          fecha: {
            gte: new Date(fechaInicio),
            lte: new Date(fechaFin),
          },
        },
      },
      include: {
        producto: true,
        venta: {
          include: {
            cliente: true
          }
        }
      },
    });

    // Agrupar por producto
    const productosVendidos = ventasConProductos.reduce((acc, vp) => {
      const productoId = vp.producto.id;
      if (!acc[productoId]) {
        acc[productoId] = {
          producto: vp.producto,
          cantidadVendida: 0,
          montoTotal: 0,
          numeroVentas: 0,
          clientes: new Set(),
          ventaPromedio: 0,
          precioPromedio: 0,
        };
      }
      
      acc[productoId].cantidadVendida += vp.cantidad;
      acc[productoId].montoTotal += vp.cantidad * vp.precio;
      acc[productoId].numeroVentas += 1;
      
      if (vp.venta.cliente) {
        acc[productoId].clientes.add(vp.venta.cliente.nombre);
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular promedios y convertir Set a array
    const topProductos = Object.values(productosVendidos).map((p: any) => {
      p.ventaPromedio = p.montoTotal / p.numeroVentas;
      p.precioPromedio = p.montoTotal / p.cantidadVendida;
      p.clientesUnicos = Array.from(p.clientes);
      p.numeroClientesUnicos = p.clientesUnicos.length;
      delete p.clientes; // Remover el Set
      return p;
    });

    // Ordenar por diferentes métricas
    const topPorMonto = [...topProductos].sort((a, b) => b.montoTotal - a.montoTotal);
    const topPorCantidad = [...topProductos].sort((a, b) => b.cantidadVendida - a.cantidadVendida);
    const topPorVentas = [...topProductos].sort((a, b) => b.numeroVentas - a.numeroVentas);

    // Métricas generales
    const totalProductosVendidos = topProductos.reduce((sum, p) => sum + p.cantidadVendida, 0);
    const totalMontoProductos = topProductos.reduce((sum, p) => sum + p.montoTotal, 0);
    const productosMasVendidos = topProductos.length;

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalProductosVendidos,
        totalMontoProductos,
        productosMasVendidos,
        ventaPromedio: productosMasVendidos > 0 ? totalMontoProductos / productosMasVendidos : 0,
      },
      topPorMonto: topPorMonto.slice(0, 20),
      topPorCantidad: topPorCantidad.slice(0, 20),
      topPorVentas: topPorVentas.slice(0, 20),
      todosLosProductos: topProductos,
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
    console.error("[REPORTE_PRODUCTOS_TOP]", error);
    return NextResponse.json(
      { error: "Error al generar el reporte" },
      { status: 500 }
    );
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();

  // Resumen
  const resumenData = [
    ["TOP PRODUCTOS MÁS VENDIDOS"],
    [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN"],
    ["Total Unidades Vendidas", data.resumen.totalProductosVendidos],
    ["Monto Total", `$${data.resumen.totalMontoProductos.toLocaleString()}`],
    ["Productos con Ventas", data.resumen.productosMasVendidos],
    [""],
    ["TOP 10 POR MONTO"],
    ["Producto", "Monto Total", "Cantidad", "Precio Promedio"],
    ...data.topPorMonto.slice(0, 10).map((p: any) => [
      p.producto.nombre,
      `$${p.montoTotal.toLocaleString()}`,
      p.cantidadVendida,
      `$${p.precioPromedio.toFixed(2)}`
    ])
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  // Top por Monto
  const montoData = [
    ["Ranking", "Producto", "Descripción", "Monto Total", "Cantidad", "Precio Promedio", "Clientes Únicos"],
    ...data.topPorMonto.map((p: any, index: number) => [
      index + 1,
      p.producto.nombre,
      p.producto.descripcion || "",
      p.montoTotal,
      p.cantidadVendida,
      p.precioPromedio.toFixed(2),
      p.numeroClientesUnicos
    ])
  ];
  const montoSheet = XLSX.utils.aoa_to_sheet(montoData);
  XLSX.utils.book_append_sheet(workbook, montoSheet, "Top por Monto");

  // Top por Cantidad
  const cantidadData = [
    ["Ranking", "Producto", "Cantidad Vendida", "Monto Total", "Precio Promedio"],
    ...data.topPorCantidad.map((p: any, index: number) => [
      index + 1,
      p.producto.nombre,
      p.cantidadVendida,
      p.montoTotal,
      p.precioPromedio.toFixed(2)
    ])
  ];
  const cantidadSheet = XLSX.utils.aoa_to_sheet(cantidadData);
  XLSX.utils.book_append_sheet(workbook, cantidadSheet, "Top por Cantidad");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="top-productos-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
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
  pdf.text("TOP PRODUCTOS MÁS VENDIDOS", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Período
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Resumen
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text("RESUMEN EJECUTIVO", 20, yPosition);
  yPosition += 15;

  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 50, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Total Unidades: ${data.resumen.totalProductosVendidos.toLocaleString()}`, 30, yPosition + 10);
  pdf.text(`Monto Total: $${data.resumen.totalMontoProductos.toLocaleString()}`, 30, yPosition + 25);
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Productos Vendidos: ${data.resumen.productosMasVendidos}`, 30, yPosition + 40);
  
  yPosition += 65;

  // Top 10 por Monto
  pdf.setFontSize(14);
  pdf.setTextColor(51, 51, 51);
  pdf.text("TOP 10 POR MONTO VENDIDO", 20, yPosition);
  yPosition += 10;

  data.topPorMonto.slice(0, 10).forEach((producto: any, index: number) => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${index + 1}. ${producto.producto.nombre}`, 25, yPosition);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`$${producto.montoTotal.toLocaleString()}`, 120, yPosition);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`(${producto.cantidadVendida} unidades)`, 160, yPosition);
    yPosition += 8;
  });

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
      'Content-Disposition': `attachment; filename="top-productos-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}