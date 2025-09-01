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

    // Obtener compras en el rango de fechas con información completa
    const compras = await prisma.compra.findMany({
      where: {
        userId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      include: {
        proveedor: true,
        productos: {
          include: {
            producto: true
          }
        }
      },
      orderBy: { fecha: "asc" },
    });

    // Obtener todos los proveedores del usuario para análisis completo
    const proveedores = await prisma.proveedor.findMany({
      where: { userId },
      include: {
        compras: {
          where: {
            fecha: {
              gte: new Date(fechaInicio),
              lte: new Date(fechaFin),
            },
          },
          include: {
            productos: {
              include: {
                producto: true
              }
            }
          }
        }
      }
    });

    // Calcular totales
    const totalCompras = compras.reduce((sum, compra) => sum + compra.monto, 0);
    const numeroCompras = compras.length;
    const promedioCompra = numeroCompras > 0 ? totalCompras / numeroCompras : 0;

    // Análisis por proveedor
    const comprasPorProveedor = compras.reduce((acc, compra) => {
      const proveedorNombre = compra.proveedor?.nombre || "Sin proveedor";
      if (!acc[proveedorNombre]) {
        acc[proveedorNombre] = {
          nombre: proveedorNombre,
          totalCompras: 0,
          numeroCompras: 0,
          productos: [] as string[]
        };
      }
      acc[proveedorNombre].totalCompras += compra.monto;
      acc[proveedorNombre].numeroCompras += 1;
      
      // Agregar productos únicos
      compra.productos.forEach(cp => {
        if (!acc[proveedorNombre].productos.includes(cp.producto.nombre)) {
          acc[proveedorNombre].productos.push(cp.producto.nombre);
        }
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Top productos más comprados
    const productosMasComprados = compras
      .flatMap(compra => compra.productos.map(cp => ({
        nombre: cp.producto.nombre,
        cantidad: cp.cantidad,
        monto: cp.cantidad * cp.precioUnitario,
        proveedor: compra.proveedor?.nombre || "Sin proveedor"
      })))
      .reduce((acc, item) => {
        if (!acc[item.nombre]) {
          acc[item.nombre] = {
            nombre: item.nombre,
            cantidadTotal: 0,
            montoTotal: 0,
            proveedores: [] as string[]
          };
        }
        acc[item.nombre].cantidadTotal += item.cantidad;
        acc[item.nombre].montoTotal += item.monto;
        if (!acc[item.nombre].proveedores.includes(item.proveedor)) {
          acc[item.nombre].proveedores.push(item.proveedor);
        }
        return acc;
      }, {} as Record<string, any>);

    // Convertir a array y ordenar
    const topProductos = Object.values(productosMasComprados)
      .sort((a: any, b: any) => b.montoTotal - a.montoTotal)
      .slice(0, 10);

    const topProveedores = Object.values(comprasPorProveedor)
      .sort((a: any, b: any) => b.totalCompras - a.totalCompras)
      .slice(0, 10);

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalCompras,
        numeroCompras,
        promedioCompra,
        numeroProveedores: Object.keys(comprasPorProveedor).length,
      },
      compras: compras.map(compra => ({
        fecha: compra.fecha.toISOString().split('T')[0],
        proveedor: compra.proveedor?.nombre || "Sin proveedor",
        descripcion: compra.descripcion || "",
        monto: compra.monto,
        productos: compra.productos.map(cp => ({
          nombre: cp.producto.nombre,
          cantidad: cp.cantidad,
          precioUnitario: cp.precioUnitario,
          subtotal: cp.cantidad * cp.precioUnitario
        }))
      })),
      topProveedores,
      topProductos,
      comprasPorProveedor: Object.values(comprasPorProveedor),
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
    console.error("[REPORTE_COMPRAS_PROVEEDORES]", error);
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
    ["REPORTE COMPRAS Y PROVEEDORES"],
    [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN EJECUTIVO"],
    ["Total Compras", `$${data.resumen.totalCompras.toLocaleString()}`],
    ["Número de Compras", data.resumen.numeroCompras],
    ["Compra Promedio", `$${data.resumen.promedioCompra.toLocaleString()}`],
    ["Proveedores Activos", data.resumen.numeroProveedores],
    [""],
    ["TOP PROVEEDORES"],
    ["Proveedor", "Total Compras", "Número Compras", "Productos"],
    ...data.topProveedores.map((prov: any) => [
      prov.nombre,
      `$${prov.totalCompras.toLocaleString()}`,
      prov.numeroCompras,
      prov.productos.join(", ")
    ]),
    [""],
    ["TOP PRODUCTOS MÁS COMPRADOS"],
    ["Producto", "Cantidad Total", "Monto Total", "Proveedores"],
    ...data.topProductos.map((prod: any) => [
      prod.nombre,
      prod.cantidadTotal,
      `$${prod.montoTotal.toLocaleString()}`,
      prod.proveedores.join(", ")
    ])
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  // Hoja de Compras Detalladas
  if (data.compras.length > 0) {
    const comprasData = [
      ["Fecha", "Proveedor", "Descripción", "Monto Total", "Productos"],
      ...data.compras.map((compra: any) => [
        compra.fecha,
        compra.proveedor,
        compra.descripcion,
        compra.monto,
        compra.productos.map((p: any) => `${p.nombre} (${p.cantidad} x $${p.precioUnitario})`).join("; ")
      ])
    ];
    const comprasSheet = XLSX.utils.aoa_to_sheet(comprasData);
    XLSX.utils.book_append_sheet(workbook, comprasSheet, "Compras Detalladas");
  }

  // Hoja de Análisis por Proveedor
  if (data.comprasPorProveedor.length > 0) {
    const proveedoresData = [
      ["Proveedor", "Total Compras", "Número Compras", "Compra Promedio", "Productos Suministrados"],
      ...data.comprasPorProveedor.map((prov: any) => [
        prov.nombre,
        prov.totalCompras,
        prov.numeroCompras,
        (prov.totalCompras / prov.numeroCompras).toFixed(2),
        prov.productos.join(", ")
      ])
    ];
    const proveedoresSheet = XLSX.utils.aoa_to_sheet(proveedoresData);
    XLSX.utils.book_append_sheet(workbook, proveedoresSheet, "Análisis Proveedores");
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-compras-proveedores-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
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
  pdf.text("REPORTE COMPRAS Y PROVEEDORES", pageWidth / 2, yPosition, { align: 'center' });
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
  pdf.rect(20, yPosition - 5, pageWidth - 40, 60, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(51, 51, 51);
  
  // Métricas principales
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Total Compras: $${data.resumen.totalCompras.toLocaleString()}`, 30, yPosition + 10);
  
  pdf.setTextColor(59, 130, 246);
  pdf.text(`Número de Compras: ${data.resumen.numeroCompras}`, 30, yPosition + 25);
  
  pdf.setTextColor(139, 69, 19);
  pdf.text(`Compra Promedio: $${data.resumen.promedioCompra.toLocaleString()}`, 30, yPosition + 40);
  
  pdf.setTextColor(168, 85, 247);
  pdf.text(`Proveedores Activos: ${data.resumen.numeroProveedores}`, 30, yPosition + 55);
  
  yPosition += 75;

  // Verificar si necesitamos nueva página
  if (yPosition > 230) {
    pdf.addPage();
    yPosition = 20;
  }

  // Top Proveedores
  if (data.topProveedores.length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("TOP PROVEEDORES", 20, yPosition);
    yPosition += 10;

    data.topProveedores.slice(0, 8).forEach((proveedor: any, index: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${index + 1}. ${proveedor.nombre}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`$${proveedor.totalCompras.toLocaleString()}`, 120, yPosition);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`(${proveedor.numeroCompras} compras)`, 160, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Top Productos
  if (data.topProductos.length > 0) {
    // Verificar espacio
    if (yPosition > 230) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("TOP PRODUCTOS MÁS COMPRADOS", 20, yPosition);
    yPosition += 10;

    data.topProductos.slice(0, 8).forEach((producto: any, index: number) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${index + 1}. ${producto.nombre}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`$${producto.montoTotal.toLocaleString()}`, 120, yPosition);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`(${producto.cantidadTotal} unidades)`, 160, yPosition);
      yPosition += 8;
    });
  }

  // Agregar footer
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
      'Content-Disposition': `attachment; filename="reporte-compras-proveedores-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}