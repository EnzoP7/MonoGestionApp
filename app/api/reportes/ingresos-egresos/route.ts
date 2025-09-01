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

    // Obtener ingresos en el rango de fechas
    const ingresos = await prisma.ingreso.findMany({
      where: {
        userId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      include: {
        categoriaIngreso: true,
      },
      orderBy: { fecha: "asc" },
    });

    // Obtener egresos en el rango de fechas
    const egresos = await prisma.egreso.findMany({
      where: {
        userId,
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
      },
      include: {
        categoriaEgreso: true,
      },
      orderBy: { fecha: "asc" },
    });

    // Calcular totales
    const totalIngresos = ingresos.reduce((sum, ingreso) => sum + ingreso.monto, 0);
    const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
    const balance = totalIngresos - totalEgresos;

    // Agrupar por categoría
    const ingresosPorCategoria = ingresos.reduce((acc, ingreso) => {
      const categoria = ingreso.categoriaIngreso?.nombre || "Sin categoría";
      acc[categoria] = (acc[categoria] || 0) + ingreso.monto;
      return acc;
    }, {} as Record<string, number>);

    const egresosPorCategoria = egresos.reduce((acc, egreso) => {
      const categoria = egreso.categoriaEgreso?.nombre || "Sin categoría";
      acc[categoria] = (acc[categoria] || 0) + egreso.monto;
      return acc;
    }, {} as Record<string, number>);

    const reporteData = {
      periodo: { fechaInicio, fechaFin },
      resumen: {
        totalIngresos,
        totalEgresos,
        balance,
      },
      ingresos: ingresos.map(ingreso => ({
        fecha: ingreso.fecha.toISOString().split('T')[0],
        descripcion: ingreso.descripcion,
        categoria: ingreso.categoriaIngreso?.nombre || "Sin categoría",
        monto: ingreso.monto,
      })),
      egresos: egresos.map(egreso => ({
        fecha: egreso.fecha.toISOString().split('T')[0],
        descripcion: egreso.descripcion,
        categoria: egreso.categoriaEgreso?.nombre || "Sin categoría",
        monto: egreso.monto,
      })),
      ingresosPorCategoria,
      egresosPorCategoria,
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
    console.error("[REPORTE_INGRESOS_EGRESOS]", error);
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
    ["REPORTE INGRESOS VS EGRESOS"],
    [""],
    [`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`],
    [""],
    ["RESUMEN FINANCIERO"],
    ["Total Ingresos", `$${data.resumen.totalIngresos.toLocaleString()}`],
    ["Total Egresos", `$${data.resumen.totalEgresos.toLocaleString()}`],
    ["Balance", `$${data.resumen.balance.toLocaleString()}`],
    [""],
    ["INGRESOS POR CATEGORÍA"],
    ...Object.entries(data.ingresosPorCategoria).map(([categoria, monto]) => 
      [categoria, `$${(monto as number).toLocaleString()}`]
    ),
    [""],
    ["EGRESOS POR CATEGORÍA"],
    ...Object.entries(data.egresosPorCategoria).map(([categoria, monto]) => 
      [categoria, `$${(monto as number).toLocaleString()}`]
    ),
  ];

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

  // Hoja de Ingresos
  if (data.ingresos.length > 0) {
    const ingresosData = [
      ["Fecha", "Descripción", "Categoría", "Monto"],
      ...data.ingresos.map((ingreso: any) => [
        ingreso.fecha,
        ingreso.descripcion,
        ingreso.categoria,
        ingreso.monto
      ])
    ];
    const ingresosSheet = XLSX.utils.aoa_to_sheet(ingresosData);
    XLSX.utils.book_append_sheet(workbook, ingresosSheet, "Ingresos");
  }

  // Hoja de Egresos
  if (data.egresos.length > 0) {
    const egresosData = [
      ["Fecha", "Descripción", "Categoría", "Monto"],
      ...data.egresos.map((egreso: any) => [
        egreso.fecha,
        egreso.descripcion,
        egreso.categoria,
        egreso.monto
      ])
    ];
    const egresosSheet = XLSX.utils.aoa_to_sheet(egresosData);
    XLSX.utils.book_append_sheet(workbook, egresosSheet, "Egresos");
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-ingresos-egresos-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.xlsx"`,
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
  pdf.text("REPORTE INGRESOS VS EGRESOS", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Período
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Período: ${data.periodo.fechaInicio} al ${data.periodo.fechaFin}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Resumen Financiero
  pdf.setFontSize(16);
  pdf.setTextColor(51, 51, 51);
  pdf.text("RESUMEN FINANCIERO", 20, yPosition);
  yPosition += 15;

  // Cuadro de resumen
  pdf.setFillColor(248, 249, 250);
  pdf.rect(20, yPosition - 5, pageWidth - 40, 50, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(51, 51, 51);
  
  // Total Ingresos (verde)
  pdf.setTextColor(34, 197, 94);
  pdf.text(`Total Ingresos: $${data.resumen.totalIngresos.toLocaleString()}`, 30, yPosition + 10);
  
  // Total Egresos (rojo)
  pdf.setTextColor(239, 68, 68);
  pdf.text(`Total Egresos: $${data.resumen.totalEgresos.toLocaleString()}`, 30, yPosition + 25);
  
  // Balance (verde o rojo según el valor)
  if (data.resumen.balance >= 0) {
    pdf.setTextColor(34, 197, 94);
  } else {
    pdf.setTextColor(239, 68, 68);
  }
  pdf.setFontSize(14);
  pdf.text(`Balance: $${data.resumen.balance.toLocaleString()}`, 30, yPosition + 40);
  
  yPosition += 60;

  // Verificar si necesitamos nueva página
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }

  // Ingresos por Categoría
  if (Object.keys(data.ingresosPorCategoria).length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("INGRESOS POR CATEGORÍA", 20, yPosition);
    yPosition += 10;

    Object.entries(data.ingresosPorCategoria).forEach(([categoria, monto]) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`• ${categoria}:`, 25, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`$${(monto as number).toLocaleString()}`, 120, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Egresos por Categoría
  if (Object.keys(data.egresosPorCategoria).length > 0) {
    // Verificar espacio
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(51, 51, 51);
    pdf.text("EGRESOS POR CATEGORÍA", 20, yPosition);
    yPosition += 10;

    Object.entries(data.egresosPorCategoria).forEach(([categoria, monto]) => {
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`• ${categoria}:`, 25, yPosition);
      pdf.setTextColor(239, 68, 68);
      pdf.text(`$${(monto as number).toLocaleString()}`, 120, yPosition);
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
      'Content-Disposition': `attachment; filename="reporte-ingresos-egresos-${data.periodo.fechaInicio}-${data.periodo.fechaFin}.pdf"`,
    },
  });
}