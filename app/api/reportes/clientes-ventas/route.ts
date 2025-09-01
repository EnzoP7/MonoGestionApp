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

    // Obtener ventas con clientes
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
          include: { producto: true }
        },
        servicios: {
          include: { servicio: true }
        }
      },
    });

    // Análisis por cliente
    const clientesAnalisis = ventas.reduce((acc, venta) => {
      const clienteId = venta.clienteId || 'general';
      const clienteNombre = venta.cliente?.nombre || 'Cliente General';
      
      if (!acc[clienteId]) {
        acc[clienteId] = {
          cliente: venta.cliente || { id: 'general', nombre: 'Cliente General', email: '', telefono: '', direccion: '' },
          totalCompras: 0,
          numeroCompras: 0,
          compraPromedio: 0,
          productos: new Set(),
          servicios: new Set(),
          primeraCompra: venta.fecha,
          ultimaCompra: venta.fecha,
        };
      }
      
      acc[clienteId].totalCompras += venta.monto;
      acc[clienteId].numeroCompras += 1;
      
      if (venta.fecha < acc[clienteId].primeraCompra) {
        acc[clienteId].primeraCompra = venta.fecha;
      }
      if (venta.fecha > acc[clienteId].ultimaCompra) {
        acc[clienteId].ultimaCompra = venta.fecha;
      }
      
      // Agregar productos únicos
      venta.VentaProducto.forEach(vp => {
        acc[clienteId].productos.add(vp.producto.nombre);
      });
      
      // Agregar servicios únicos
      venta.servicios.forEach(vs => {
        acc[clienteId].servicios.add(vs.servicio.nombre);
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular métricas y convertir Sets
    const clientesData = Object.values(clientesAnalisis).map((c: any) => {
      c.compraPromedio = c.numeroCompras > 0 ? c.totalCompras / c.numeroCompras : 0;
      c.productosUnicos = Array.from(c.productos);
      c.serviciosUnicos = Array.from(c.servicios);
      c.diversidadCompra = c.productos.size + c.servicios.size;
      
      // Calcular días entre primera y última compra
      const diasEntreCompras = c.numeroCompras > 1 ? 
        Math.floor((c.ultimaCompra.getTime() - c.primeraCompra.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      c.frecuenciaCompra = c.numeroCompras > 1 ? diasEntreCompras / (c.numeroCompras - 1) : 0;
      
      // Clasificación de cliente
      if (c.totalCompras > 100000) {
        c.categoria = 'Premium';
      } else if (c.totalCompras > 50000) {
        c.categoria = 'Oro';
      } else if (c.totalCompras > 10000) {
        c.categoria = 'Plata';
      } else {
        c.categoria = 'Bronce';
      }
      
      delete c.productos;
      delete c.servicios;
      return c;
    });

    // Rankings
    const topPorMonto = [...clientesData].sort((a, b) => b.totalCompras - a.totalCompras);
    const topPorFrecuencia = [...clientesData].filter(c => c.numeroCompras > 1).sort((a, b) => a.frecuenciaCompra - b.frecuenciaCompra);
    const clientesPremium = clientesData.filter(c => c.categoria === 'Premium');

    // Métricas generales
    const totalClientes = clientesData.length;
    const clientesActivos = clientesData.filter(c => c.numeroCompras > 1).length;
    const valorPromedioPorCliente = clientesData.length > 0 ? 
      clientesData.reduce((sum, c) => sum + c.totalCompras, 0) / clientesData.length : 0;

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalClientes,
        clientesActivos,
        valorPromedioPorCliente,
        clientesPremium: clientesPremium.length,
      },
      topPorMonto: topPorMonto.slice(0, 20),
      topPorFrecuencia: topPorFrecuencia.slice(0, 20),
      clientesPremium,
      todosLosClientes: clientesData,
    };

    if (formato === 'excel') {
      return generateExcelReport(reporteData);
    } else if (formato === 'pdf') {
      return generatePDFReport(reporteData);
    }
  } catch (error) {
    console.error("[REPORTE_CLIENTES_VENTAS]", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();

  // Resumen
  const resumenData = [
    ["ANÁLISIS DE CLIENTES"],
    [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN"],
    ["Total Clientes", data.resumen.totalClientes],
    ["Clientes Activos", data.resumen.clientesActivos],
    ["Valor Promedio por Cliente", `$${data.resumen.valorPromedioPorCliente.toLocaleString()}`],
    ["Clientes Premium", data.resumen.clientesPremium],
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), "Resumen");

  // Top clientes por monto
  const topMontoData = [
    ["Ranking", "Cliente", "Total Compras", "Número Compras", "Compra Promedio", "Categoría"],
    ...data.topPorMonto.map((c: any, index: number) => [
      index + 1,
      c.cliente.nombre,
      c.totalCompras,
      c.numeroCompras,
      c.compraPromedio.toFixed(2),
      c.categoria
    ])
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(topMontoData), "Top por Monto");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="analisis-clientes-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
    },
  });
}

function generatePDFReport(data: any) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  let yPosition = 20;

  pdf.setFontSize(20);
  pdf.setTextColor(51, 51, 51);
  pdf.text("ANÁLISIS DE CLIENTES", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 30;

  // Resumen
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 60, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Total Clientes: ${data.resumen.totalClientes}`, 30, yPosition + 10);
  pdf.text(`Valor Promedio: $${data.resumen.valorPromedioPorCliente.toLocaleString()}`, 30, yPosition + 25);
  pdf.setTextColor(168, 85, 247);
  pdf.text(`Clientes Premium: ${data.resumen.clientesPremium}`, 30, yPosition + 40);
  
  yPosition += 75;

  // Top clientes
  pdf.setFontSize(14);
  pdf.setTextColor(51, 51, 51);
  pdf.text("TOP CLIENTES", 20, yPosition);
  yPosition += 10;

  data.topPorMonto.slice(0, 10).forEach((cliente: any, index: number) => {
    pdf.setFontSize(10);
    pdf.text(`${index + 1}. ${cliente.cliente.nombre}: $${cliente.totalCompras.toLocaleString()}`, 25, yPosition);
    yPosition += 8;
  });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="analisis-clientes-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}