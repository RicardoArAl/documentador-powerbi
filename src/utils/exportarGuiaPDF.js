/**
 * EXPORTADOR DE GUÍA DE RECONSTRUCCIÓN A PDF
 * 
 * Genera PDF profesional con la guía paso a paso
 * Formato corporativo Areandina
 * 
 * Versión: 1.0 - CORREGIDO
 * Fecha: 2026-01-01
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Colores Corporativos Areandina
const COLORES = {
  verdeAreandina: '#8CC63F',
  grisClaro: '#F0F0F0',
  grisBordes: '#B4B4B4',
  grisTexto: '#3C3C3C',
  blanco: '#FFFFFF',
  rosaGuia: '#e91e63'
};

/**
 * Exporta la guía de reconstrucción a PDF
 */
export async function exportarGuiaPDF(reportData, guia) {
  try {
    console.log('📄 Generando PDF de guía...');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    let yPos = 20;

    // ========== PORTADA ==========
    yPos = generarPortada(doc, reportData, guia, yPos);

    // ========== NUEVA PÁGINA: INFO GENERAL ==========
    doc.addPage();
    yPos = 20;
    yPos = generarInfoGeneral(doc, reportData, guia, yPos);

    // ========== PASOS ==========
    for (let i = 0; i < guia.pasos.length; i++) {
      const paso = guia.pasos[i];
      
      // Nueva página para cada paso
      doc.addPage();
      yPos = 20;
      
      yPos = generarPaso(doc, paso, i + 1, yPos);
    }

    // ========== NOTAS FINALES ==========
    if (guia.notasFinales && guia.notasFinales.length > 0) {
      doc.addPage();
      yPos = 20;
      generarNotasFinales(doc, guia.notasFinales, yPos);
    }

    // ========== DESCARGAR ==========
    const nombreArchivo = `Guia_Reconstruccion_${reportData.codigoReporte}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log('✅ PDF generado exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    throw error;
  }
}

/**
 * Genera la portada del PDF
 */
function generarPortada(doc, reportData, guia, yPos) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Rectángulo superior con gradiente simulado
  doc.setFillColor(233, 30, 99); // Rosa
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GUÍA DE RECONSTRUCCIÓN', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(20);
  doc.text('POWER BI DESKTOP', pageWidth / 2, 45, { align: 'center' });

  // Icono
  doc.setFontSize(40);
  doc.text('🎯', pageWidth / 2, 70, { align: 'center' });

  // Tabla de información
  yPos = 100;

  doc.autoTable({
    startY: yPos,
    head: [['Campo', 'Valor']],
    body: [
      ['Reporte', reportData.nombreReporte || 'Sin nombre'],
      ['Código', reportData.codigoReporte || 'Sin código'],
      ['Categoría', reportData.categoria || 'General'],
      ['Complejidad', guia.complejidad || 'Media'],
      ['Tiempo Estimado', guia.tiempoEstimado || '2-4 horas'],
      ['Fecha Generación', new Date().toLocaleDateString('es-CO')]
    ],
    headStyles: {
      fillColor: [140, 198, 63], // Verde Areandina
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [60, 60, 60],
      fontSize: 10
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    margin: { left: 20, right: 20 }
  });

  return yPos;
}

/**
 * Genera sección de información general
 */
function generarInfoGeneral(doc, reportData, guia, yPos) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título de sección
  doc.setFillColor(233, 30, 99);
  doc.rect(0, yPos, pageWidth, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📋 INFORMACIÓN GENERAL', 20, yPos + 8);

  yPos += 20;

  // Objetivo
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Objetivo del Reporte:', 20, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const objetivoLineas = doc.splitTextToSize(
    reportData.objetivo || 'No especificado',
    pageWidth - 40
  );
  doc.text(objetivoLineas, 20, yPos);
  yPos += objetivoLineas.length * 5 + 10;

  // Prerequisitos
  if (guia.prerequisitos && guia.prerequisitos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('✅ Prerequisitos:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    guia.prerequisitos.forEach((req, idx) => {
      const lineas = doc.splitTextToSize(`${idx + 1}. ${req}`, pageWidth - 40);
      doc.text(lineas, 25, yPos);
      yPos += lineas.length * 5 + 2;
    });
  }

  return yPos;
}

/**
 * Genera un paso individual
 */
function generarPaso(doc, paso, numero, yPos) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header del paso
  doc.setFillColor(233, 30, 99);
  doc.rect(0, yPos, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titulo = `${paso.icono || '▶️'} PASO ${numero}: ${paso.titulo}`;
  doc.text(titulo, 20, yPos + 10);

  yPos += 22;

  // Descripción
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const descripcionLineas = doc.splitTextToSize(
    paso.descripcion,
    pageWidth - 40
  );
  doc.text(descripcionLineas, 20, yPos);
  yPos += descripcionLineas.length * 5 + 8;

  // Instrucciones
  if (paso.instrucciones && paso.instrucciones.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('📝 Instrucciones:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    paso.instrucciones.forEach((inst, idx) => {
      const lineas = doc.splitTextToSize(
        `${idx + 1}. ${inst}`,
        pageWidth - 40
      );
      doc.text(lineas, 25, yPos);
      yPos += lineas.length * 5 + 2;

      // Verificar espacio
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    yPos += 5;
  }

  // Código SQL
  if (paso.codigoSQL) {
    // Verificar espacio
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(45, 55, 72); // Gris oscuro
    doc.rect(20, yPos, pageWidth - 40, 10, 'F');
    
    doc.setTextColor(233, 30, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('💻 CÓDIGO SQL:', 25, yPos + 7);
    yPos += 12;

    doc.setFillColor(240, 240, 240);
    const codigoHeight = Math.min(paso.codigoSQL.split('\n').length * 5 + 10, 60);
    doc.rect(20, yPos, pageWidth - 40, codigoHeight, 'F');

    doc.setTextColor(60, 60, 60);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const codigoLineas = doc.splitTextToSize(paso.codigoSQL, pageWidth - 50);
    doc.text(codigoLineas.slice(0, 10), 25, yPos + 5); // Máximo 10 líneas
    yPos += codigoHeight + 5;
  }

  // Configuración
  if (paso.configuracion && paso.configuracion.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text('⚙️ Configuración:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    paso.configuracion.forEach((conf) => {
      const lineas = doc.splitTextToSize(`• ${conf}`, pageWidth - 40);
      doc.text(lineas, 25, yPos);
      yPos += lineas.length * 5 + 2;
    });
    yPos += 5;
  }

  // Tips
  if (paso.tips && paso.tips.length > 0) {
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(255, 251, 235); // Amarillo claro
    doc.rect(20, yPos, pageWidth - 40, paso.tips.length * 8 + 10, 'F');

    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('💡 Tips:', 25, yPos + 7);
    yPos += 12;

    doc.setTextColor(120, 53, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    paso.tips.forEach((tip) => {
      const lineas = doc.splitTextToSize(`• ${tip}`, pageWidth - 50);
      doc.text(lineas, 25, yPos);
      yPos += lineas.length * 5 + 2;
    });
  }

  return yPos;
}

/**
 * Genera notas finales
 */
function generarNotasFinales(doc, notasFinales, yPos) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFillColor(102, 126, 234);
  doc.rect(0, yPos, pageWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('📝 NOTAS FINALES', 20, yPos + 10);

  yPos += 22;

  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  notasFinales.forEach((nota, idx) => {
    const lineas = doc.splitTextToSize(`${idx + 1}. ${nota}`, pageWidth - 40);
    doc.text(lineas, 20, yPos);
    yPos += lineas.length * 5 + 5;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  });
}

export default exportarGuiaPDF;