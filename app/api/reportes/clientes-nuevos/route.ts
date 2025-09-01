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

    // Obtener clientes creados en el período
    const clientesNuevos = await prisma.cliente.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      include: {
        ventas: {
          orderBy: { fecha: 'asc' }
        }
      }
    });

    // Análisis de clientes nuevos
    const analisisClientes = clientesNuevos.map(cliente => {
      const primeraVenta = cliente.ventas[0];
      const totalVentas = cliente.ventas.reduce((sum, v) => sum + v.monto, 0);
      const numeroVentas = cliente.ventas.length;
      
      return {
        ...cliente,
        primeraVenta: primeraVenta?.fecha,
        primeraVentaMonto: primeraVenta?.monto || 0,
        totalVentas,
        numeroVentas,
        tiempoHastaPrimeraVenta: primeraVenta ? 
          Math.floor((primeraVenta.fecha.getTime() - cliente.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null,
        esActivo: numeroVentas > 0,
      };
    });

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalClientesNuevos: clientesNuevos.length,
        clientesConVentas: analisisClientes.filter(c => c.esActivo).length,
        tasaConversion: clientesNuevos.length > 0 ? 
          (analisisClientes.filter(c => c.esActivo).length / clientesNuevos.length) * 100 : 0,
      },
      clientesNuevos: analisisClientes,
    };

    if (formato === 'excel') {
      return generateExcelReport(reporteData);
    } else {
      return generatePDFReport(reporteData);
    }
  } catch (error) {
    console.error("[REPORTE_CLIENTES_NUEVOS]", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();
  const resumenData = [
    ["NUEVOS CLIENTES"], [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`], [""],
    ["Total Clientes Nuevos", data.resumen.totalClientesNuevos],
    ["Con Ventas", data.resumen.clientesConVentas],
    ["Tasa Conversión", `${data.resumen.tasaConversion.toFixed(1)}%`], [""],
    ["Cliente", "Fecha Registro", "Primera Venta", "Monto Primera Venta", "Total Ventas"],
    ...data.clientesNuevos.map((c: any) => [
      c.nombre, c.createdAt.toISOString().split('T')[0], 
      c.primeraVenta?.toISOString().split('T')[0] || "Sin ventas",
      c.primeraVentaMonto, c.totalVentas
    ])
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), "Nuevos Clientes");
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="nuevos-clientes-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
    },
  });
}

function generatePDFReport(data: any) {
  const pdf = new jsPDF();
  pdf.setFontSize(20);
  pdf.text("NUEVOS CLIENTES", pdf.internal.pageSize.width / 2, 20, { align: 'center' });
  
  let yPosition = 50;
  pdf.setFontSize(12);
  pdf.text(`Total: ${data.resumen.totalClientesNuevos}`, 20, yPosition);
  pdf.text(`Conversión: ${data.resumen.tasaConversion.toFixed(1)}%`, 20, yPosition + 15);

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="nuevos-clientes-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}