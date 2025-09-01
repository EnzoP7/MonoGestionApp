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

    // Obtener todos los movimientos
    const movimientos = await prisma.movimiento.findMany({
      where: {
        userId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      orderBy: { fecha: 'desc' }
    });

    // Análisis por tipo
    const movimientosPorTipo = movimientos.reduce((acc, mov) => {
      if (!acc[mov.tipo]) {
        acc[mov.tipo] = { cantidad: 0, monto: 0 };
      }
      acc[mov.tipo].cantidad += 1;
      acc[mov.tipo].monto += mov.monto;
      return acc;
    }, {} as Record<string, any>);

    // Flujo de efectivo diario
    const flujoDiario = movimientos.reduce((acc, mov) => {
      const fecha = mov.fecha.toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = { fecha, ingresos: 0, egresos: 0, neto: 0 };
      }
      
      if (['Ingreso', 'Venta'].includes(mov.tipo)) {
        acc[fecha].ingresos += mov.monto;
      } else {
        acc[fecha].egresos += mov.monto;
      }
      acc[fecha].neto = acc[fecha].ingresos - acc[fecha].egresos;
      return acc;
    }, {} as Record<string, any>);

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalMovimientos: movimientos.length,
        montoTotal: movimientos.reduce((sum, m) => sum + m.monto, 0),
      },
      movimientos: movimientos.slice(0, 1000), // Limitar para performance
      movimientosPorTipo: Object.entries(movimientosPorTipo).map(([tipo, data]) => ({ tipo, ...data })),
      flujoDiario: Object.values(flujoDiario).sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    };

    if (formato === 'excel') {
      return generateExcelReport(reporteData);
    } else {
      return generatePDFReport(reporteData);
    }
  } catch (error) {
    console.error("[REPORTE_MOVIMIENTOS_GENERAL]", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();
  
  // Resumen
  const resumenData = [
    ["MOVIMIENTOS GENERALES"], [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`], [""],
    ["Total Movimientos", data.resumen.totalMovimientos],
    ["Monto Total", `$${data.resumen.montoTotal.toLocaleString()}`], [""],
    ["DISTRIBUCIÓN POR TIPO"], ["Tipo", "Cantidad", "Monto"],
    ...data.movimientosPorTipo.map((m: any) => [m.tipo, m.cantidad, m.monto])
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), "Resumen");

  // Movimientos detallados
  const movimientosData = [
    ["Fecha", "Tipo", "Descripción", "Monto"],
    ...data.movimientos.map((m: any) => [
      m.fecha.toISOString().split('T')[0], m.tipo, m.descripcion || "", m.monto
    ])
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(movimientosData), "Movimientos");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="movimientos-general-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
    },
  });
}

function generatePDFReport(data: any) {
  const pdf = new jsPDF();
  pdf.setFontSize(20);
  pdf.text("MOVIMIENTOS GENERALES", pdf.internal.pageSize.width / 2, 20, { align: 'center' });
  
  let yPosition = 50;
  pdf.setFontSize(12);
  pdf.text(`Total Movimientos: ${data.resumen.totalMovimientos}`, 20, yPosition);
  pdf.text(`Monto Total: $${data.resumen.montoTotal.toLocaleString()}`, 20, yPosition + 15);

  yPosition += 40;
  pdf.setFontSize(14);
  pdf.text("DISTRIBUCIÓN POR TIPO", 20, yPosition);
  yPosition += 15;

  data.movimientosPorTipo.forEach((tipo: any) => {
    pdf.setFontSize(10);
    pdf.text(`${tipo.tipo}: ${tipo.cantidad} movimientos - $${tipo.monto.toLocaleString()}`, 25, yPosition);
    yPosition += 10;
  });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="movimientos-general-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}