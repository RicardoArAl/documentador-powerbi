import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, BorderStyle, ImageRun, AlignmentType, ShadingType, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import styles from './ManualTecnico.module.css';

const ManualTecnico = ({ reportData }) => {
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [generandoWord, setGenerandoWord] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // === PALETA DE COLORES INSTITUCIONAL AREANDINA ===
  const COLORS = {
    primary: [140, 198, 63],      // Verde Areandina RGB (PDF)
    primaryHex: "8CC63F",         // Verde Areandina HEX (Word)
    secondary: [240, 240, 240],   // Gris claro RGB
    secondaryHex: "F0F0F0",       // Gris claro HEX
    text: [60, 60, 60],           // Gris oscuro RGB
    textHex: "3C3C3C",            // Gris oscuro HEX
    border: [180, 180, 180],      // Borde RGB
    borderHex: "B4B4B4",          // Borde HEX
    white: [255, 255, 255],
    whiteHex: "FFFFFF"
  };

  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return String(texto).replace(/(\r\n|\n|\r)/gm, " ").trim();
  };

  /** =================================================================================
   * GENERADOR PDF - FORMATO MEJORADO CON FICHAS TÉCNICAS
   * ================================================================================= */
  
  const verificarEspacio = (doc, yPos, alturaRequerida) => {
    if (yPos + alturaRequerida > 260) {
      doc.addPage();
      return 20; 
    }
    return yPos;
  };

  const agregarImagenPDF = async (doc, base64, x, y, maxWidth, maxHeight, centrado = false) => {
    if (!base64 || base64.length < 100) return y;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          
          // Escalar manteniendo aspecto
          if (w > maxWidth) {
            h = (h * maxWidth) / w;
            w = maxWidth;
          }
          if (h > maxHeight) {
            w = (w * maxHeight) / h;
            h = maxHeight;
          }
          
          let posX = x;
          if (centrado) posX = x + (maxWidth - w) / 2;

          let currentY = verificarEspacio(doc, y, h + 5);
          
          // Agregar imagen con borde
          doc.addImage(base64, 'PNG', posX, currentY, w, h);
          doc.setDrawColor(...COLORS.border);
          doc.setLineWidth(0.3);
          doc.rect(posX, currentY, w, h);
          
          resolve(currentY + h + 3);
        } catch {
          resolve(y);
        }
      };
      img.onerror = () => resolve(y);
      img.src = base64;
    });
  };

  const dibujarCeldaPDF = (doc, text, x, y, w, h, config = {}) => {
    const {
      isHeader = false,
      fontSize = 9,
      align = "left",
      bgColor = null,
      bold = false
    } = config;

    // Fondo
    const fillColor = isHeader ? COLORS.primary : (bgColor || COLORS.white);
    doc.setFillColor(...fillColor);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h, 'FD');

    // Texto
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", (isHeader || bold) ? "bold" : "normal");
    doc.setTextColor(...(isHeader ? COLORS.white : COLORS.text));
    
    const textY = y + 4;

    if (align === "center") {
      doc.text(limpiarTexto(text), x + (w / 2), textY, { align: "center" });
    } else {
      const lines = doc.splitTextToSize(limpiarTexto(text), w - 4);
      doc.text(lines, x + 2, textY);
    }
  };

  const imprimirTituloSeccionPDF = (doc, titulo, y, margen, anchoUtil) => {
    const newY = verificarEspacio(doc, y, 15);
    
    // Línea superior decorativa
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(1);
    doc.line(margen, newY, margen + anchoUtil, newY);
    
    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.primary);
    doc.text(titulo.toUpperCase(), margen, newY + 6);
    
    // Línea inferior
    doc.setLineWidth(0.3);
    doc.line(margen, newY + 8, margen + anchoUtil, newY + 8);
    
    doc.setTextColor(...COLORS.text);
    return newY + 14;
  };

  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    setProgreso(0);
    
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'letter' });
      let y = 20;
      const margen = 20;
      const width = 175.9;

      // ========== 1. PORTADA (TABLA DE ENCABEZADO) ==========
      setProgreso(10);
      
      const w1 = width * 0.35, w2 = width * 0.25, w3 = width * 0.40;
      
      // Fila 1: Headers
      dibujarCeldaPDF(doc, "NOMBRE SOLUCIÓN", margen, y, w1, 8, { isHeader: true, fontSize: 9, align: "center" });
      dibujarCeldaPDF(doc, "TIPO DOCUMENTO", margen + w1, y, w2, 8, { isHeader: true, fontSize: 9, align: "center" });
      dibujarCeldaPDF(doc, "OBJETIVO", margen + w1 + w2, y, w3, 8, { isHeader: true, fontSize: 9, align: "center" });
      y += 8;

      // Fila 2: Datos (con altura dinámica para objetivo)
      const objLines = doc.splitTextToSize(reportData.objetivo || "N/A", w3 - 4);
      const hObj = Math.max(12, objLines.length * 4 + 4);
      
      dibujarCeldaPDF(doc, reportData.nombreReporte || "N/A", margen, y, w1, hObj, { fontSize: 9, bold: true });
      dibujarCeldaPDF(doc, "MANUAL TÉCNICO", margen + w1, y, w2, hObj, { fontSize: 10, align: "center", bold: true });
      
      // Objetivo con salto de línea manual
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.rect(margen + w1 + w2, y, w3, hObj, 'FD');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.text);
      doc.text(objLines, margen + w1 + w2 + 2, y + 4);
      y += hObj + 3;

      // Tabla de metadatos
      const wM = width / 5;
      const metaHeaders = ["FECHA", "VERSIÓN", "CÓDIGO", "AUTOR", "APROBADO POR"];
      metaHeaders.forEach((h, i) => {
        dibujarCeldaPDF(doc, h, margen + (wM * i), y, wM, 7, { isHeader: true, fontSize: 8, align: "center" });
      });
      y += 7;

      const metaData = [
        reportData.fechaDocumentacion || new Date().toLocaleDateString('es-CO'),
        "1.0",
        reportData.codigoReporte || "N/A",
        reportData.documentadoPor || "Usuario",
        ""
      ];
      metaData.forEach((d, i) => {
        dibujarCeldaPDF(doc, d, margen + (wM * i), y, wM, 7, { fontSize: 9, align: "center" });
      });
      y += 12;

      // ========== 2. INFORMACIÓN GENERAL ==========
      setProgreso(20);
      y = imprimirTituloSeccionPDF(doc, "INFORMACIÓN GENERAL", y, margen, width);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Categoría:", margen, y);
      doc.setFont("helvetica", "normal");
      doc.text(reportData.categoria || "N/A", margen + 25, y);
      y += 6;

      if (reportData.usuarios) {
        y = verificarEspacio(doc, y, 10);
        doc.setFont("helvetica", "bold");
        doc.text("Usuarios:", margen, y);
        doc.setFont("helvetica", "normal");
        const uLines = doc.splitTextToSize(limpiarTexto(reportData.usuarios), width - 25);
        doc.text(uLines, margen + 25, y);
        y += (uLines.length * 5) + 3;
      }

      y += 5;

      // ========== 3. ESTRUCTURA DE DATOS (TABLA) ==========
      setProgreso(30);
      if (reportData.camposDetectados?.length > 0) {
        y = imprimirTituloSeccionPDF(doc, "ESTRUCTURA DE DATOS", y, margen, width);
        
        if (reportData.tablaOrigen) {
          doc.setFont("helvetica", "bold");
          doc.text("Tabla Origen:", margen, y);
          doc.setFont("helvetica", "normal");
          doc.text(reportData.tablaOrigen, margen + 30, y);
          y += 8;
        }

        // Encabezados de tabla
        const cw1 = width * 0.35, cw2 = width * 0.18, cw3 = width * 0.47;
        y = verificarEspacio(doc, y, 20);
        
        dibujarCeldaPDF(doc, "NOMBRE", margen, y, cw1, 7, { isHeader: true, fontSize: 9, align: "center" });
        dibujarCeldaPDF(doc, "TIPO", margen + cw1, y, cw2, 7, { isHeader: true, fontSize: 9, align: "center" });
        dibujarCeldaPDF(doc, "DESCRIPCIÓN", margen + cw1 + cw2, y, cw3, 7, { isHeader: true, fontSize: 9, align: "center" });
        y += 7;

        // Filas de datos (con colores alternos)
        reportData.camposDetectados.forEach((campo, index) => {
          const desc = limpiarTexto(campo.descripcion || "-");
          const descLines = doc.splitTextToSize(desc, cw3 - 4);
          const hRow = Math.max(7, descLines.length * 4 + 2);

          // Nueva página si no cabe
          if (y + hRow > 260) {
            doc.addPage();
            y = 20;
            // Re-dibujar encabezados
            dibujarCeldaPDF(doc, "NOMBRE", margen, y, cw1, 7, { isHeader: true, fontSize: 9, align: "center" });
            dibujarCeldaPDF(doc, "TIPO", margen + cw1, y, cw2, 7, { isHeader: true, fontSize: 9, align: "center" });
            dibujarCeldaPDF(doc, "DESCRIPCIÓN", margen + cw1 + cw2, y, cw3, 7, { isHeader: true, fontSize: 9, align: "center" });
            y += 7;
          }

          const bgColor = index % 2 === 0 ? COLORS.white : COLORS.secondary;
          const pk = campo.esLlave ? " (PK)" : "";

          dibujarCeldaPDF(doc, campo.nombre + pk, margen, y, cw1, hRow, { bgColor, fontSize: 8, bold: campo.esLlave });
          dibujarCeldaPDF(doc, campo.tipo, margen + cw1, y, cw2, hRow, { bgColor, fontSize: 8 });
          
          // Descripción manual
          doc.setFillColor(...bgColor);
          doc.rect(margen + cw1 + cw2, y, cw3, hRow, 'FD');
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.text(descLines, margen + cw1 + cw2 + 2, y + 4);

          y += hRow;
        });

        y += 8;
      }

      // ========== 4. FILTROS Y PARÁMETROS ==========
      setProgreso(50);
      if (reportData.filtros?.length > 0) {
        y = imprimirTituloSeccionPDF(doc, "FILTROS Y PARÁMETROS", y, margen, width);

        for (const filtro of reportData.filtros) {
          y = verificarEspacio(doc, y, 40);

          // Nombre del filtro
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...COLORS.primary);
          doc.text(`• ${filtro.nombre}`, margen, y);
          y += 6;

          // Detalles técnicos (bloque gris)
          const indent = margen + 5;
          doc.setFillColor(...COLORS.secondary);
          
          const detailsHeight = 15;
          doc.rect(indent, y, width - 5, detailsHeight, 'F');
          doc.setDrawColor(...COLORS.border);
          doc.rect(indent, y, width - 5, detailsHeight);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.text);
          
          let yDetail = y + 4;
          doc.text(`Campo SQL: ${filtro.campoSQL || 'N/A'}`, indent + 2, yDetail);
          yDetail += 5;
          doc.text(`Tipo de Control: ${filtro.tipoControl || 'N/A'}`, indent + 2, yDetail);
          yDetail += 5;
          
          if (filtro.valores) {
            const valLines = doc.splitTextToSize(`Valores: ${filtro.valores}`, width - 10);
            doc.text(valLines, indent + 2, yDetail);
          }

          y += detailsHeight + 3;

          // Imagen (si existe)
          if (filtro.imagenPreview) {
            y = await agregarImagenPDF(doc, filtro.imagenPreview, indent, y, 90, 50, false);
          }

          y += 5;
        }
      }

      // ========== 5. VISUALIZACIONES (FICHAS TÉCNICAS) ==========
      setProgreso(70);
      if (reportData.visualizaciones?.length > 0) {
        y = imprimirTituloSeccionPDF(doc, "VISUALIZACIONES", y, margen, width);

        for (const visual of reportData.visualizaciones) {
          y = verificarEspacio(doc, y, 80);

          // ====== FICHA TÉCNICA (3 BLOQUES) ======
          
          // 1. TÍTULO (Barra Verde)
          doc.setFillColor(...COLORS.primary);
          doc.rect(margen, y, width, 8, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.text(visual.titulo || "Visualización", margen + 3, y + 5.5);
          y += 8;

          // 2. IMAGEN (Centrada con fondo blanco)
          if (visual.imagen) {
            const imgY = y;
            doc.setFillColor(...COLORS.white);
            doc.rect(margen, imgY, width, 70, 'F');
            doc.setDrawColor(...COLORS.border);
            doc.rect(margen, imgY, width, 70);
            
            y = await agregarImagenPDF(doc, visual.imagen, margen + 5, imgY + 3, width - 10, 64, true);
            y = imgY + 70;
          }

          // 3. DETALLES (Bloque Gris)
          const camposStr = visual.camposUtilizados 
            ? (Array.isArray(visual.camposUtilizados) ? visual.camposUtilizados.join(", ") : visual.camposUtilizados)
            : "N/A";

          const camposLines = doc.splitTextToSize(camposStr, width - 20);
          const descLines = visual.descripcion ? doc.splitTextToSize(visual.descripcion, width - 6) : [];
          
          let hDetalle = 18 + (camposLines.length * 4);
          if (descLines.length > 0) hDetalle += (descLines.length * 4) + 3;

          y = verificarEspacio(doc, y, hDetalle);

          doc.setFillColor(...COLORS.secondary);
          doc.rect(margen, y, width, hDetalle, 'F');
          doc.setDrawColor(...COLORS.border);
          doc.rect(margen, y, width, hDetalle);

          let yIn = y + 4;
          
          // Tipo y Métricas
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...COLORS.text);
          doc.text("Tipo:", margen + 3, yIn);
          doc.setFont("helvetica", "normal");
          doc.text(visual.tipo || "N/A", margen + 15, yIn);
          
          doc.setFont("helvetica", "bold");
          doc.text("Métricas:", margen + 60, yIn);
          doc.setFont("helvetica", "normal");
          const metricasText = doc.splitTextToSize(visual.metricasCalculadas || "N/A", width - 75);
          doc.text(metricasText, margen + 78, yIn);
          yIn += 5;

          // Campos
          doc.setFont("helvetica", "bold");
          doc.text("Campos:", margen + 3, yIn);
          doc.setFont("helvetica", "normal");
          doc.text(camposLines, margen + 20, yIn);
          yIn += (camposLines.length * 4) + 3;

          // Descripción
          if (descLines.length > 0) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(descLines, margen + 3, yIn);
          }

          y += hDetalle + 10;
        }
      }

      // ========== 6. CONSULTAS SQL ADICIONALES ==========
      setProgreso(85);
      if (reportData.consultasAdicionales?.length > 0) {
        y = imprimirTituloSeccionPDF(doc, "CONSULTAS SQL ADICIONALES", y, margen, width);

        reportData.consultasAdicionales.forEach(consulta => {
          y = verificarEspacio(doc, y, 30);

          // Nombre
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.primary);
          doc.text(`• ${consulta.nombre}`, margen, y);
          y += 5;

          // Tipo
          if (consulta.tipo) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(...COLORS.text);
            doc.text(`Tipo: ${consulta.tipo}`, margen + 5, y);
            y += 5;
          }

          // Código SQL (bloque gris)
          if (consulta.codigoSQL) {
            const codeLines = doc.splitTextToSize(limpiarTexto(consulta.codigoSQL), width - 8);
            const hCode = codeLines.length * 4 + 6;

            y = verificarEspacio(doc, y, hCode);

            doc.setFillColor(245, 245, 245);
            doc.rect(margen + 5, y, width - 5, hCode, 'F');
            doc.setDrawColor(...COLORS.border);
            doc.rect(margen + 5, y, width - 5, hCode);

            doc.setFont('courier', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(40, 40, 40);
            doc.text(codeLines, margen + 7, y + 4);

            doc.setFont('helvetica', 'normal');
            y += hCode + 5;
          }

          y += 3;
        });
      }

      // ========== 7. INFORMACIÓN ADICIONAL ==========
      setProgreso(95);
      if (reportData.frecuenciaActualizacion || reportData.volumetria || reportData.notasTecnicas || reportData.historialCambios) {
        y = imprimirTituloSeccionPDF(doc, "INFORMACIÓN ADICIONAL", y, margen, width);

        if (reportData.frecuenciaActualizacion) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text("Frecuencia de Actualización:", margen, y);
          doc.setFont("helvetica", "normal");
          doc.text(reportData.frecuenciaActualizacion, margen + 60, y);
          y += 6;
        }

        if (reportData.volumetria) {
          doc.setFont("helvetica", "bold");
          doc.text("Volumetría:", margen, y);
          doc.setFont("helvetica", "normal");
          doc.text(reportData.volumetria, margen + 30, y);
          y += 6;
        }

        if (reportData.notasTecnicas) {
          y = verificarEspacio(doc, y, 15);
          doc.setFont("helvetica", "bold");
          doc.text("Notas Técnicas:", margen, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          const notasLines = doc.splitTextToSize(reportData.notasTecnicas, width - 5);
          doc.text(notasLines, margen + 5, y);
          y += (notasLines.length * 4) + 5;
        }

        if (reportData.historialCambios) {
          y = verificarEspacio(doc, y, 15);
          doc.setFont("helvetica", "bold");
          doc.text("Historial de Cambios:", margen, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          const histLines = doc.splitTextToSize(reportData.historialCambios, width - 5);
          doc.text(histLines, margen + 5, y);
        }
      }

      setProgreso(100);
      doc.save(`Manual_${limpiarTexto(reportData.codigoReporte)}_${Date.now()}.pdf`);

    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Revise la consola para más detalles.");
    } finally {
      setGenerandoPDF(false);
      setProgreso(0);
    }
  };

  /** =================================================================================
   * GENERADOR WORD - FORMATO IDÉNTICO A PDF CON TABLAS
   * ================================================================================= */

  const celdaHeader = (texto, widthPercent) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: COLORS.primaryHex, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
      },
      children: [new Paragraph({
        children: [new TextRun({ text: limpiarTexto(texto), bold: true, color: "FFFFFF", size: 18 })],
        alignment: AlignmentType.CENTER
      })],
      verticalAlign: VerticalAlign.CENTER
    });
  };

  const celdaDato = (texto, widthPercent, align = AlignmentType.LEFT, bg = "FFFFFF", bold = false) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: bg, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
      },
      children: [new Paragraph({
        children: [new TextRun({ text: limpiarTexto(texto), size: 18, color: COLORS.textHex, bold })],
        alignment: align
      })],
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  };

  const tituloSeccionWord = (texto) => {
    return new Paragraph({
      children: [new TextRun({ text: texto.toUpperCase(), bold: true, size: 28, color: COLORS.primaryHex })],
      border: {
        top: { color: COLORS.primaryHex, space: 1, value: BorderStyle.SINGLE, size: 12 },
        bottom: { color: COLORS.primaryHex, space: 1, value: BorderStyle.SINGLE, size: 6 }
      },
      spacing: { before: 400, after: 200 }
    });
  };

  const crearImagenWord = async (base64String, ancho = 500, alto = 300) => {
    if (!base64String || base64String.length < 100) {
      return new Paragraph({ text: "[Imagen no disponible]", italics: true, color: "999999" });
    }
    try {
      const raw = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const buffer = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      return new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: ancho, height: alto } })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 150, before: 150 }
      });
    } catch (error) {
      console.error("Error creando imagen Word:", error);
      return new Paragraph({ text: "[Error al cargar imagen]", italics: true, color: "FF0000" });
    }
  };

  const handleGenerarWord = async () => {
    setGenerandoWord(true);
    setProgreso(0);

    try {
      const children = [];

      // ========== 1. PORTADA (TABLAS) ==========
      setProgreso(10);

      // Tabla 1: Nombre, Tipo, Objetivo
      const tabla1 = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              celdaHeader("NOMBRE SOLUCIÓN", 35),
              celdaHeader("TIPO DOCUMENTO", 25),
              celdaHeader("OBJETIVO", 40)
            ]
          }),
          new TableRow({
            children: [
              celdaDato(reportData.nombreReporte || "N/A", 35, AlignmentType.LEFT, "FFFFFF", true),
              celdaDato("MANUAL TÉCNICO", 25, AlignmentType.CENTER, "FFFFFF", true),
              celdaDato(reportData.objetivo || "N/A", 40)
            ]
          })
        ]
      });
      children.push(tabla1);
      children.push(new Paragraph({ text: "" }));

      // Tabla 2: Metadatos
      const tabla2 = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["FECHA", "VERSIÓN", "CÓDIGO", "AUTOR", "APROBADO POR"].map(h => celdaHeader(h, 20))
          }),
          new TableRow({
            children: [
              reportData.fechaDocumentacion || new Date().toLocaleDateString('es-CO'),
              "1.0",
              reportData.codigoReporte || "N/A",
              reportData.documentadoPor || "Usuario",
              ""
            ].map(d => celdaDato(d, 20, AlignmentType.CENTER))
          })
        ]
      });
      children.push(tabla2);
      children.push(new Paragraph({ text: "" }));

      // ========== 2. INFORMACIÓN GENERAL ==========
      setProgreso(20);
      children.push(tituloSeccionWord("INFORMACIÓN GENERAL"));
      
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Categoría: ", bold: true, size: 20 }),
          new TextRun({ text: reportData.categoria || "N/A", size: 20 })
        ],
        spacing: { after: 150 }
      }));

      if (reportData.usuarios) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "Usuarios: ", bold: true, size: 20 }),
            new TextRun({ text: reportData.usuarios, size: 20 })
          ],
          spacing: { after: 150 }
        }));
      }

      // ========== 3. ESTRUCTURA DE DATOS (TABLA) ==========
      setProgreso(30);
      if (reportData.camposDetectados?.length > 0) {
        children.push(tituloSeccionWord("ESTRUCTURA DE DATOS"));

        if (reportData.tablaOrigen) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Tabla Origen: ", bold: true, size: 20 }),
              new TextRun({ text: reportData.tablaOrigen, size: 20 })
            ],
            spacing: { after: 200 }
          }));
        }

        // Tabla de campos con filas alternas
        const headerRow = new TableRow({
          children: [
            celdaHeader("NOMBRE", 40),
            celdaHeader("TIPO", 18),
            celdaHeader("DESCRIPCIÓN", 42)
          ]
        });

        const dataRows = reportData.camposDetectados.map((campo, index) => {
          const bgColor = index % 2 === 0 ? "FFFFFF" : COLORS.secondaryHex;
          const pk = campo.esLlave ? " (PK)" : "";
          
          return new TableRow({
            children: [
              celdaDato(campo.nombre + pk, 40, AlignmentType.LEFT, bgColor, campo.esLlave),
              celdaDato(campo.tipo, 18, AlignmentType.LEFT, bgColor),
              celdaDato(campo.descripcion || "-", 42, AlignmentType.LEFT, bgColor)
            ]
          });
        });

        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows]
        }));
        children.push(new Paragraph({ text: "" }));
      }

      // ========== 4. FILTROS Y PARÁMETROS ==========
      setProgreso(50);
      if (reportData.filtros?.length > 0) {
        children.push(tituloSeccionWord("FILTROS Y PARÁMETROS"));

        for (const filtro of reportData.filtros) {
          // Nombre del filtro
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${filtro.nombre}`, bold: true, size: 22, color: COLORS.primaryHex })],
            spacing: { after: 100 }
          }));

          // Bloque de detalles (tabla con fondo gris)
          const detallesRows = [];
          
          detallesRows.push(new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Campo SQL: ", bold: true, size: 18 }),
                    new TextRun({ text: filtro.campoSQL || "N/A", size: 18 })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 100, bottom: 50, left: 100, right: 100 }
            })]
          }));

          detallesRows.push(new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tipo de Control: ", bold: true, size: 18 }),
                    new TextRun({ text: filtro.tipoControl || "N/A", size: 18 })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 50, bottom: 50, left: 100, right: 100 }
            })]
          }));

          if (filtro.valores) {
            detallesRows.push(new TableRow({
              children: [new TableCell({
                shading: { fill: COLORS.secondaryHex },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Valores: ", bold: true, size: 18 }),
                      new TextRun({ text: filtro.valores, size: 18 })
                    ]
                  })
                ],
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                  left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                  right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
                },
                margins: { top: 50, bottom: 100, left: 100, right: 100 }
              })]
            }));
          }

          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: detallesRows
          }));

          // Imagen
          if (filtro.imagenPreview) {
            children.push(await crearImagenWord(filtro.imagenPreview, 350, 180));
          }

          children.push(new Paragraph({ text: "" }));
        }
      }

      // ========== 5. VISUALIZACIONES (FICHAS TÉCNICAS) ==========
      setProgreso(70);
      if (reportData.visualizaciones?.length > 0) {
        children.push(tituloSeccionWord("VISUALIZACIONES"));

        for (const visual of reportData.visualizaciones) {
          // ====== FICHA TÉCNICA (TABLA DE 3 FILAS) ======

          // Fila 1: Título (Barra Verde)
          const titleRow = new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.primaryHex },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: visual.titulo || "Visualización", bold: true, color: "FFFFFF", size: 22 })],
                  alignment: AlignmentType.CENTER
                })
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primaryHex },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex }
              },
              margins: { top: 150, bottom: 150 }
            })]
          });

          // Fila 2: Imagen (Centrada con fondo blanco)
          const imgParagraph = visual.imagen 
            ? await crearImagenWord(visual.imagen, 500, 300)
            : new Paragraph({ text: "[Sin imagen]", italics: true, alignment: AlignmentType.CENTER, color: "999999" });

          const imgRow = new TableRow({
            children: [new TableCell({
              shading: { fill: "FFFFFF" },
              children: [imgParagraph],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 200, bottom: 200 }
            })]
          });

          // Fila 3: Detalles (Bloque Gris)
          const camposStr = visual.camposUtilizados 
            ? (Array.isArray(visual.camposUtilizados) ? visual.camposUtilizados.join(", ") : visual.camposUtilizados)
            : "N/A";

          const detailsRow = new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tipo: ", bold: true, size: 18 }),
                    new TextRun({ text: visual.tipo || "N/A", size: 18 }),
                    new TextRun({ text: " | ", size: 18 }),
                    new TextRun({ text: "Métricas: ", bold: true, size: 18 }),
                    new TextRun({ text: visual.metricasCalculadas || "N/A", size: 18 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Campos: ", bold: true, size: 18 }),
                    new TextRun({ text: camposStr, size: 18 })
                  ],
                  spacing: { before: 100 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: visual.descripcion || "", italics: true, size: 16, color: "505050" })],
                  spacing: { before: 150 }
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 150, bottom: 150, left: 150, right: 150 }
            })]
          });

          // Agregar tabla completa de visualización
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [titleRow, imgRow, detailsRow]
          }));
          children.push(new Paragraph({ text: "" }));
        }
      }

      // ========== 6. CONSULTAS SQL ADICIONALES ==========
      setProgreso(85);
      if (reportData.consultasAdicionales?.length > 0) {
        children.push(tituloSeccionWord("CONSULTAS SQL ADICIONALES"));

        for (const consulta of reportData.consultasAdicionales) {
          // Nombre
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${consulta.nombre}`, bold: true, size: 20, color: COLORS.primaryHex })],
            spacing: { after: 100 }
          }));

          // Tipo
          if (consulta.tipo) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: "Tipo: ", bold: true, size: 18 }),
                new TextRun({ text: consulta.tipo, size: 18 })
              ],
              spacing: { after: 100 }
            }));
          }

          // Código SQL (bloque gris)
          if (consulta.codigoSQL) {
            children.push(new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [new TableCell({
                    shading: { fill: "F5F5F5" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: consulta.codigoSQL, font: "Courier New", size: 16, color: "282828" })]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
                    },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })]
                })
              ]
            }));
          }

          children.push(new Paragraph({ text: "" }));
        }
      }

      // ========== 7. INFORMACIÓN ADICIONAL ==========
      setProgreso(95);
      if (reportData.frecuenciaActualizacion || reportData.volumetria || reportData.notasTecnicas || reportData.historialCambios) {
        children.push(tituloSeccionWord("INFORMACIÓN ADICIONAL"));

        if (reportData.frecuenciaActualizacion) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Frecuencia de Actualización: ", bold: true, size: 18 }),
              new TextRun({ text: reportData.frecuenciaActualizacion, size: 18 })
            ],
            spacing: { after: 150 }
          }));
        }

        if (reportData.volumetria) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Volumetría: ", bold: true, size: 18 }),
              new TextRun({ text: reportData.volumetria, size: 18 })
            ],
            spacing: { after: 150 }
          }));
        }

        if (reportData.notasTecnicas) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "Notas Técnicas:", bold: true, size: 20 })],
            spacing: { after: 100 }
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: reportData.notasTecnicas, size: 18 })],
            spacing: { after: 200 }
          }));
        }

        if (reportData.historialCambios) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "Historial de Cambios:", bold: true, size: 20 })],
            spacing: { after: 100 }
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: reportData.historialCambios, size: 18 })],
            spacing: { after: 200 }
          }));
        }
      }

      setProgreso(100);

      // Crear documento
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 pulgada
                bottom: 1440,
                left: 1440,
                right: 1440
              }
            }
          },
          children
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Manual_${limpiarTexto(reportData.codigoReporte)}_${Date.now()}.docx`);

    } catch (error) {
      console.error("Error generando Word:", error);
      alert("Error al generar el documento Word. Revise la consola para más detalles.");
    } finally {
      setGenerandoWord(false);
      setProgreso(0);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>📄</div>
        <h2 className={styles.title}>Manual Técnico</h2>
        <p className={styles.subtitle}>Documentación Oficial Areandina</p>
      </div>

      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>📋 Contenido del Manual</h3>
        <div className={styles.contenidoList}>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>1</div>
            <div>
              <h4>Portada Institucional</h4>
              <p>Nombre del reporte, objetivo y metadatos</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>2</div>
            <div>
              <h4>Información General</h4>
              <p>Categoría y audiencia objetivo</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>3</div>
            <div>
              <h4>Estructura de Datos</h4>
              <p>Tabla origen y diccionario de campos completo</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>4</div>
            <div>
              <h4>Filtros y Parámetros</h4>
              <p>Controles interactivos con capturas de pantalla</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>5</div>
            <div>
              <h4>Visualizaciones (Fichas Técnicas)</h4>
              <p>Cada visual con imagen, tipo, métricas y descripción</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>6</div>
            <div>
              <h4>Consultas SQL Adicionales</h4>
              <p>Stored Procedures, Functions y código relacionado</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>7</div>
            <div>
              <h4>Información Adicional</h4>
              <p>Frecuencia, volumetría y notas técnicas</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.exportSection}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className={styles.btnExport}
            onClick={handleGenerarPDF}
            disabled={generandoPDF || !reportData.nombreReporte}
            style={{ background: 'linear-gradient(135deg, #8CC63F 0%, #6BA82E 100%)' }}
          >
            <span className={styles.btnIcon}>{generandoPDF ? '⚙️' : '📄'}</span>
            <span className={styles.btnText}>
              {generandoPDF ? `Generando PDF... ${progreso}%` : 'Descargar PDF'}
            </span>
          </button>

          <button
            className={styles.btnExport}
            onClick={handleGenerarWord}
            disabled={generandoWord || !reportData.nombreReporte}
            style={{ background: 'linear-gradient(135deg, #2b579a 0%, #1a3d6b 100%)' }}
          >
            <span className={styles.btnIcon}>{generandoWord ? '⚙️' : '📝'}</span>
            <span className={styles.btnText}>
              {generandoWord ? `Generando Word... ${progreso}%` : 'Descargar Word'}
            </span>
          </button>
        </div>

        {(generandoPDF || generandoWord) && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progreso}%` }}></div>
          </div>
        )}
      </div>

      <div className={styles.notes}>
        <h3 className={styles.notesTitle}>💡 Notas Importantes</h3>
        <ul className={styles.notesList}>
          <li>Los documentos se generan con <strong>formato corporativo Areandina</strong> (verde #8CC63F)</li>
          <li>El PDF y Word tienen <strong>estructura idéntica</strong> para consistencia</li>
          <li>Las visualizaciones usan <strong>fichas técnicas de 3 secciones</strong> (título, imagen, detalles)</li>
          <li>Los campos se muestran en <strong>tablas con filas alternas</strong> para mejor legibilidad</li>
          <li>Las imágenes se ajustan automáticamente manteniendo su relación de aspecto</li>
          <li>El código SQL se formatea en <strong>bloques con fondo gris</strong> y fuente monoespaciada</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualTecnico;