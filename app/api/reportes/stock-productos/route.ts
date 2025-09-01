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

    // Obtener todos los productos
    const productos = await prisma.producto.findMany({
      where: { userId },
      include: {
        ventasProducto: {
          where: {
            venta: {
              fecha: {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin),
              },
            },
          },
        },
        comprasProducto: {
          where: {
            compra: {
              fecha: {
                gte: new Date(fechaInicio),
                lte: new Date(fechaFin),
              },
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    // Calcular métricas de inventario
    const totalProductos = productos.length;
    const productosActivos = productos.filter(p => p.activo).length;
    const productosInactivos = productos.filter(p => !p.activo).length;
    const productosSinStock = productos.filter(p => p.cantidad === 0).length;
    const productosStockBajo = productos.filter(p => p.cantidad > 0 && p.cantidad <= 10).length;

    // Valor total del inventario
    const valorTotalInventario = productos.reduce((sum, producto) => {
      return sum + (producto.cantidad * producto.precio);
    }, 0);

    // Productos con más movimiento (ventas)
    const productosConMovimiento = productos.map(producto => {
      const ventasEnPeriodo = producto.ventasProducto.reduce((sum, vp) => sum + vp.cantidad, 0);
      const comprasEnPeriodo = producto.comprasProducto.reduce((sum, cp) => sum + cp.cantidad, 0);
      const valorVentas = producto.ventasProducto.reduce((sum, vp) => sum + (vp.cantidad * vp.precio), 0);
      
      return {
        ...producto,
        ventasEnPeriodo,
        comprasEnPeriodo,
        valorVentas,
        rotacion: producto.cantidad > 0 ? ventasEnPeriodo / producto.cantidad : 0,
        valorInventario: producto.cantidad * producto.precio,
      };
    });

    // Top productos por rotación
    const topRotacion = productosConMovimiento
      .filter(p => p.ventasEnPeriodo > 0)
      .sort((a, b) => b.rotacion - a.rotacion)
      .slice(0, 10);

    // Productos sin movimiento
    const productosSinMovimiento = productosConMovimiento
      .filter(p => p.ventasEnPeriodo === 0 && p.comprasEnPeriodo === 0)
      .sort((a, b) => b.valorInventario - a.valorInventario);

    // Alertas de stock
    const alertasStock = {
      sinStock: productos.filter(p => p.cantidad === 0 && p.activo),
      stockBajo: productos.filter(p => p.cantidad > 0 && p.cantidad <= 10 && p.activo),
      stockAlto: productos.filter(p => p.cantidad > 100 && p.activo),
    };

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalProductos,
        productosActivos,
        productosInactivos,
        productosSinStock,
        productosStockBajo,
        valorTotalInventario,
      },
      productos: productosConMovimiento.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        cantidad: p.cantidad,
        activo: p.activo,
        ventasEnPeriodo: p.ventasEnPeriodo,
        comprasEnPeriodo: p.comprasEnPeriodo,
        valorVentas: p.valorVentas,
        rotacion: p.rotacion,
        valorInventario: p.valorInventario,
        estado: p.cantidad === 0 ? 'Sin Stock' : 
               p.cantidad <= 10 ? 'Stock Bajo' :
               p.cantidad > 100 ? 'Stock Alto' : 'Normal'
      })),
      topRotacion,
      productosSinMovimiento: productosSinMovimiento.slice(0, 20),
      alertasStock,
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
    console.error("[REPORTE_STOCK_PRODUCTOS]", error);
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
    ["REPORTE DE INVENTARIO"],
    [""],
    [`Período de Análisis: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN EJECUTIVO"],
    ["Total Productos", data.resumen.totalProductos],
    ["Productos Activos", data.resumen.productosActivos],
    ["Productos Inactivos", data.resumen.productosInactivos],
    ["Sin Stock", data.resumen.productosSinStock],
    ["Stock Bajo (≤10)", data.resumen.productosStockBajo],
    ["Valor Total Inventario", `$${data.resumen.valorTotalInventario.toLocaleString()}`],
    [""],
    ["ALERTAS DE STOCK"],
    ["Sin Stock", data.alertasStock.sinStock.length],
    ["Stock Bajo", data.alertasStock.stockBajo.length],
    ["Stock Alto (>100)", data.alertasStock.stockAlto.length],
    [""],
    ["TOP PRODUCTOS POR ROTACIÓN"],
    ["Producto", "Stock Actual", "Ventas Período", "Rotación"],
    ...data.topRotacion.map((p: any) => [
      p.nombre,
      p.cantidad,
      p.ventasEnPeriodo,
      p.rotacion.toFixed(2)
    ])
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  // Hoja de Inventario Completo
  const inventarioData = [
    ["Producto", "Descripción", "Precio", "Stock", "Estado", "Ventas Período", "Compras Período", "Rotación", "Valor Inventario"],
    ...data.productos.map((p: any) => [
      p.nombre,
      p.descripcion || "",
      p.precio,
      p.cantidad,
      p.estado,
      p.ventasEnPeriodo,
      p.comprasEnPeriodo,
      p.rotacion.toFixed(2),
      p.valorInventario
    ])
  ];
  const inventarioSheet = XLSX.utils.aoa_to_sheet(inventarioData);
  XLSX.utils.book_append_sheet(workbook, inventarioSheet, "Inventario Completo");

  // Hoja de Alertas
  const alertasData = [
    ["PRODUCTOS SIN STOCK"],
    ["Producto", "Precio", "Última Venta"],
    ...data.alertasStock.sinStock.map((p: any) => [p.nombre, p.precio, "N/A"]),
    [""],
    ["PRODUCTOS CON STOCK BAJO"],
    ["Producto", "Stock Actual", "Precio", "Valor"],
    ...data.alertasStock.stockBajo.map((p: any) => [p.nombre, p.cantidad, p.precio, p.cantidad * p.precio]),
    [""],
    ["PRODUCTOS SIN MOVIMIENTO"],
    ["Producto", "Stock", "Valor Inmovilizado"],
    ...data.productosSinMovimiento.map((p: any) => [p.nombre, p.cantidad, p.valorInventario])
  ];
  const alertasSheet = XLSX.utils.aoa_to_sheet(alertasData);
  XLSX.utils.book_append_sheet(workbook, alertasSheet, "Alertas");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-inventario-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
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
  pdf.text("REPORTE DE INVENTARIO", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Período
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Análisis: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`, pageWidth / 2, yPosition, { align: 'center' });
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
  
  // Métricas principales
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Total Productos: ${data.resumen.totalProductos}`, 30, yPosition + 10);
  
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Productos Activos: ${data.resumen.productosActivos}`, 30, yPosition + 25);
  
  pdf.setTextColor(239, 68, 68);
  pdf.text(`Sin Stock: ${data.resumen.productosSinStock}`, 30, yPosition + 40);
  
  pdf.setTextColor(251, 146, 60);
  pdf.text(`Stock Bajo: ${data.resumen.productosStockBajo}`, 30, yPosition + 55);
  
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Valor Inventario: $${data.resumen.valorTotalInventario.toLocaleString()}`, 30, yPosition + 70);
  
  yPosition += 95;

  // Alertas Críticas
  if (data.alertasStock.sinStock.length > 0 || data.alertasStock.stockBajo.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(239, 68, 68);
    pdf.text("🚨 ALERTAS CRÍTICAS", 20, yPosition);
    yPosition += 15;

    if (data.alertasStock.sinStock.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text(`Productos sin stock: ${data.alertasStock.sinStock.length}`, 25, yPosition);
      yPosition += 10;

      data.alertasStock.sinStock.slice(0, 5).forEach((producto: any) => {
        pdf.setFontSize(10);
        pdf.setTextColor(239, 68, 68);
        pdf.text(`• ${producto.nombre}`, 30, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    }

    if (data.alertasStock.stockBajo.length > 0) {
      pdf.setFontSize(12);
      pdf.setTextColor(51, 51, 51);
      pdf.text(`Productos con stock bajo: ${data.alertasStock.stockBajo.length}`, 25, yPosition);
      yPosition += 10;

      data.alertasStock.stockBajo.slice(0, 5).forEach((producto: any) => {
        pdf.setFontSize(10);
        pdf.setTextColor(251, 146, 60);
        pdf.text(`• ${producto.nombre}: ${producto.cantidad} unidades`, 30, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }
  }

  // Top Rotación
  if (data.topRotacion.length > 0) {
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("TOP PRODUCTOS POR ROTACIÓN", 20, yPosition);
    yPosition += 10;

    data.topRotacion.slice(0, 8).forEach((producto: any, index: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${index + 1}. ${producto.nombre}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`${producto.rotacion.toFixed(2)}`, 120, yPosition);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`(${producto.ventasEnPeriodo} vendidas)`, 140, yPosition);
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
      'Content-Disposition': `attachment; filename="reporte-inventario-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}