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

    // Obtener datos para análisis de tendencias
    const [ventas, ingresos, egresos] = await Promise.all([
      prisma.venta.findMany({
        where: { userId, fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) } }
      }),
      prisma.ingreso.findMany({
        where: { userId, fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) } }
      }),
      prisma.egreso.findMany({
        where: { userId, fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) } }
      })
    ]);

    // Análisis por semana
    const analisisSemanal = {};
    const procesarPorSemana = (items: any[], tipo: string) => {
      items.forEach(item => {
        const fecha = new Date(item.fecha);
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        const semanaKey = inicioSemana.toISOString().split('T')[0];
        
        if (!analisisSemanal[semanaKey]) {
          analisisSemanal[semanaKey] = { semana: semanaKey, ventas: 0, ingresos: 0, egresos: 0, neto: 0 };
        }
        
        if (tipo === 'ventas') analisisSemanal[semanaKey].ventas += item.monto;
        if (tipo === 'ingresos') analisisSemanal[semanaKey].ingresos += item.monto;
        if (tipo === 'egresos') analisisSemanal[semanaKey].egresos += item.monto;
      });
    };

    procesarPorSemana(ventas, 'ventas');
    procesarPorSemana(ingresos, 'ingresos');
    procesarPorSemana(egresos, 'egresos');

    // Calcular neto y crecimiento
    const tendenciaSemanal = Object.values(analisisSemanal).map((s: any) => {
      s.neto = s.ingresos + s.ventas - s.egresos;
      return s;
    }).sort((a: any, b: any) => new Date(a.semana).getTime() - new Date(b.semana).getTime());

    // Calcular crecimiento semanal
    tendenciaSemanal.forEach((semana: any, index) => {
      if (index > 0) {
        const anterior = tendenciaSemanal[index - 1];
        semana.crecimientoVentas = anterior.ventas > 0 ? 
          ((semana.ventas - anterior.ventas) / anterior.ventas) * 100 : 0;
      } else {
        semana.crecimientoVentas = 0;
      }
    });

    // Identificar patrones
    const diasPico = {};
    [...ventas, ...ingresos].forEach(item => {
      const dia = new Date(item.fecha).getDay();
      const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dia];
      if (!diasPico[nombreDia]) diasPico[nombreDia] = 0;
      diasPico[nombreDia] += item.monto;
    });

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalSemanas: tendenciaSemanal.length,
        crecimientoPromedio: tendenciaSemanal.length > 1 ? 
          tendenciaSemanal.slice(1).reduce((sum, s) => sum + s.crecimientoVentas, 0) / (tendenciaSemanal.length - 1) : 0,
      },
      tendenciaSemanal,
      diasPico: Object.entries(diasPico).map(([dia, monto]) => ({ dia, monto }))
        .sort((a, b) => b.monto - a.monto),
    };

    if (formato === 'excel') {
      return generateExcelReport(reporteData);
    } else {
      return generatePDFReport(reporteData);
    }
  } catch (error) {
    console.error("[REPORTE_TENDENCIAS_MES]", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}

function generateExcelReport(data: any) {
  const workbook = XLSX.utils.book_new();
  
  const resumenData = [
    ["TENDENCIAS DEL MES"], [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`], [""],
    ["Crecimiento Promedio Semanal", `${data.resumen.crecimientoPromedio.toFixed(1)}%`], [""],
    ["ANÁLISIS SEMANAL"], 
    ["Semana", "Ventas", "Ingresos", "Egresos", "Neto", "Crecimiento %"],
    ...data.tendenciaSemanal.map((s: any) => [
      s.semana, s.ventas, s.ingresos, s.egresos, s.neto, s.crecimientoVentas.toFixed(1)
    ]), [""],
    ["DÍAS PICO"], ["Día", "Monto"],
    ...data.diasPico.map((d: any) => [d.dia, d.monto])
  ];

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumenData), "Tendencias");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tendencias-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
    },
  });
}

function generatePDFReport(data: any) {
  const pdf = new jsPDF();
  pdf.setFontSize(20);
  pdf.text("TENDENCIAS DEL MES", pdf.internal.pageSize.width / 2, 20, { align: 'center' });
  
  let yPosition = 50;
  pdf.setFontSize(12);
  pdf.text(`Crecimiento Promedio: ${data.resumen.crecimientoPromedio.toFixed(1)}%`, 20, yPosition);

  yPosition += 30;
  pdf.setFontSize(14);
  pdf.text("DÍAS CON MAYOR ACTIVIDAD", 20, yPosition);
  yPosition += 15;

  data.diasPico.slice(0, 5).forEach((dia: any, index: number) => {
    pdf.setFontSize(10);
    pdf.text(`${index + 1}. ${dia.dia}: $${dia.monto.toLocaleString()}`, 25, yPosition);
    yPosition += 10;
  });

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="tendencias-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}