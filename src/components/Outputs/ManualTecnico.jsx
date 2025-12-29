import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, BorderStyle, ImageRun, AlignmentType, ShadingType, Header, Footer } from 'docx';
import { saveAs } from 'file-saver';
import styles from './ManualTecnico.module.css';

const ManualTecnico = ({ reportData }) => {
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [generandoWord, setGenerandoWord] = useState(false);

  // === PALETA DE COLORES INSTITUCIONAL ===
  const COLORS = {
    primary: [140, 198, 63],      // Verde RGB (PDF)
    primaryHex: "8CC63F",         // Verde HEX (Word)
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
   * GENERADOR PDF (Lógica "Espejo" - Fichas y Tablas)
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
                  let w = img.width; let h = img.height;
                  // Escalar
                  if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
                  if (h > maxHeight) { w = (w * maxHeight) / h; h = maxHeight; }
                  
                  let posX = x;
                  if (centrado) posX = x + (maxWidth - w) / 2;

                  let currentY = verificarEspacio(doc, y, h + 5);
                  doc.addImage(base64, 'PNG', posX, currentY, w, h);
                  doc.setDrawColor(200); doc.rect(posX, currentY, w, h); // Marco
                  resolve(currentY + h + 8);
              } catch { resolve(y); }
          };
          img.onerror = () => resolve(y);
          img.src = base64;
      });
  };

  const dibujarCeldaPDF = (doc, text, x, y, w, h, isHeader = false, fontSize = 9, align = "left") => {
    doc.setFillColor(...(isHeader ? COLORS.primary : COLORS.white));
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.1);
    doc.rect(x, y, w, h, 'FD');

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    doc.setTextColor(...(isHeader ? COLORS.white : COLORS.text));
    
    // Ajuste vertical
    const textY = y + (h / 2) + (fontSize / 3) - 1.5; 

    if (align === "center") {
        doc.text(limpiarTexto(text), x + (w / 2), textY, { align: "center" });
    } else {
        const lines = doc.splitTextToSize(limpiarTexto(text), w - 4);
        doc.text(lines, x + 2, y + 4);
    }
  };

  const imprimirTituloSeccionPDF = (doc, titulo, y, margen, anchoUtil) => {
      const newY = verificarEspacio(doc, y, 15);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.setTextColor(...COLORS.primary);
      doc.text(titulo.toUpperCase(), margen, newY);
      doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.5);
      doc.line(margen, newY + 2, margen + anchoUtil, newY + 2);
      doc.setLineWidth(0.1); doc.setTextColor(...COLORS.text);
      return newY + 10;
  };

  const handleGenerarPDF = async () => {
    setGenerandoPDF(true);
    try {
        const doc = new jsPDF({ unit: 'mm', format: 'letter' });
        let y = 20; const margen = 20; const width = 175.9;

        // 1. HEADER (TABLAS)
        const w1 = width * 0.35, w2 = width * 0.25, w3 = width * 0.40;
        dibujarCeldaPDF(doc, "NOMBRE SOLUCIÓN", margen, y, w1, 7, true, 8, "center");
        dibujarCeldaPDF(doc, "TIPO DOCUMENTO", margen + w1, y, w2, 7, true, 8, "center");
        dibujarCeldaPDF(doc, "OBJETIVO", margen + w1 + w2, y, w3, 7, true, 8, "center");
        y += 7;

        const objLines = doc.splitTextToSize(reportData.objetivo || "N/A", w3 - 4);
        const hObj = Math.max(10, objLines.length * 4 + 4);
        dibujarCeldaPDF(doc, reportData.nombreReporte || "N/A", margen, y, w1, hObj);
        dibujarCeldaPDF(doc, "MANUAL TÉCNICO", margen + w1, y, w2, hObj, false, 9, "center");
        doc.rect(margen + w1 + w2, y, w3, hObj); 
        doc.text(objLines, margen + w1 + w2 + 2, y + 4);
        y += hObj + 5;

        // Metadatos
        const wM = width / 5;
        const metaH = ["FECHA", "VERSIÓN", "CÓDIGO", "AUTOR", "APROBADO POR"];
        metaH.forEach((h, i) => dibujarCeldaPDF(doc, h, margen + (wM * i), y, wM, 7, true, 8, "center"));
        y += 7;
        const metaD = [reportData.fechaDocumentacion || "Hoy", "1.0", reportData.codigoReporte || "N/A", reportData.documentadoPor || "Admin", ""];
        metaD.forEach((d, i) => dibujarCeldaPDF(doc, d, margen + (wM * i), y, wM, 7, false, 9, "center"));
        y += 15;

        // 2. INFO GENERAL
        y = imprimirTituloSeccionPDF(doc, "INFORMACIÓN GENERAL", y, margen, width);
        doc.setFont("helvetica", "bold"); doc.text("Categoría:", margen, y);
        doc.setFont("helvetica", "normal"); doc.text(reportData.categoria || "N/A", margen + 35, y); y += 6;
        if(reportData.usuarios) {
            y = verificarEspacio(doc, y, 10);
            doc.setFont("helvetica", "bold"); doc.text("Audiencia:", margen, y);
            doc.setFont("helvetica", "normal");
            const uLines = doc.splitTextToSize(limpiarTexto(reportData.usuarios), width - 35);
            doc.text(uLines, margen + 35, y); y += (uLines.length * 5) + 5;
        }

        // 3. ESTRUCTURA
        if(reportData.camposDetectados?.length > 0) {
            y = imprimirTituloSeccionPDF(doc, "ESTRUCTURA DE DATOS", y, margen, width);
            if(reportData.tablaOrigen) {
                doc.setFont("helvetica", "bold"); doc.text("Tabla Origen:", margen, y);
                doc.setFont("helvetica", "normal"); doc.text(reportData.tablaOrigen, margen + 35, y); y += 8;
            }
            const cw1 = width * 0.35, cw2 = width * 0.20, cw3 = width * 0.45;
            y = verificarEspacio(doc, y, 20);
            dibujarCeldaPDF(doc, "NOMBRE", margen, y, cw1, 7, true, 8, "center");
            dibujarCeldaPDF(doc, "TIPO", margen + cw1, y, cw2, 7, true, 8, "center");
            dibujarCeldaPDF(doc, "DESCRIPCIÓN", margen + cw1 + cw2, y, cw3, 7, true, 8, "center");
            y += 7;

            reportData.camposDetectados.forEach((c) => {
                const desc = limpiarTexto(c.descripcion || "-");
                const lD = doc.splitTextToSize(desc, cw3 - 4);
                const hRow = Math.max(7, lD.length * 4 + 2);
                if (y + hRow > 260) { doc.addPage(); y = 20; dibujarCeldaPDF(doc, "NOMBRE", margen, y, cw1, 7, true, 8, "center"); dibujarCeldaPDF(doc, "TIPO", margen + cw1, y, cw2, 7, true, 8, "center"); dibujarCeldaPDF(doc, "DESCRIPCIÓN", margen + cw1 + cw2, y, cw3, 7, true, 8, "center"); y += 7; }
                const pk = c.esLlave ? " (PK)" : "";
                dibujarCeldaPDF(doc, c.nombre + pk, margen, y, cw1, hRow);
                dibujarCeldaPDF(doc, c.tipo, margen + cw1, y, cw2, hRow);
                doc.rect(margen + cw1 + cw2, y, cw3, hRow); doc.text(lD, margen + cw1 + cw2 + 2, y + 4);
                y += hRow;
            });
            y += 10;
        }

        // 4. FILTROS
        if(reportData.filtros?.length > 0) {
            y = imprimirTituloSeccionPDF(doc, "FILTROS Y PARÁMETROS", y, margen, width);
            for(const f of reportData.filtros) {
                y = verificarEspacio(doc, y, 30);
                doc.setFont("helvetica", "bold"); doc.text(`• ${f.nombre}`, margen, y); y += 5;
                const indent = margen + 5;
                doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80);
                doc.text(`Campo: ${f.campoSQL || '-'} | Tipo: ${f.tipoControl || '-'}`, indent, y); y += 5;
                if(f.valores) { const vl = doc.splitTextToSize(`Valores: ${f.valores}`, width - 5); doc.text(vl, indent, y); y += vl.length * 4; }
                if(f.imagenPreview) y = await agregarImagenPDF(doc, f.imagenPreview, indent, y, 80, 40);
                else y += 3;
                y += 3;
            }
        }

        // 5. VISUALIZACIONES (ESTILO FICHA)
        if(reportData.visualizaciones?.length > 0) {
            y = imprimirTituloSeccionPDF(doc, "VISUALIZACIONES", y, margen, width);
            for(const v of reportData.visualizaciones) {
                y = verificarEspacio(doc, y, 60);
                
                // Título Barra Verde
                doc.setFillColor(...COLORS.primary); doc.rect(margen, y, width, 7, 'F');
                doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
                doc.text(v.titulo || "Visualización", margen + 2, y + 5); y += 10;

                // Imagen
                if(v.imagen) y = await agregarImagenPDF(doc, v.imagen, margen, y, width, 110, true);

                // Ficha Gris
                y = verificarEspacio(doc, y, 20);
                doc.setFillColor(...COLORS.secondary);
                
                // Calculo altura ficha
                let hFicha = 10;
                const cStr = v.camposUtilizados ? (Array.isArray(v.camposUtilizados) ? v.camposUtilizados.join(", ") : v.camposUtilizados) : "N/A";
                const cLines = doc.splitTextToSize(cStr, width - 20);
                hFicha += (cLines.length * 4);
                if(v.descripcion) hFicha += 10;

                doc.rect(margen, y, width, hFicha, 'F');
                let yIn = y + 5;
                
                doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(0);
                const meta = [v.tipo ? `Tipo: ${v.tipo}` : null, v.metricasCalculadas ? `Métricas: ${v.metricasCalculadas}` : null].filter(Boolean).join(" | ");
                doc.text(meta, margen + 2, yIn); yIn += 5;

                doc.setFont(undefined, "bold"); doc.text("Campos:", margen + 2, yIn);
                doc.setFont(undefined, "normal"); doc.text(cLines, margen + 20, yIn); yIn += (cLines.length * 4);

                if(v.descripcion) {
                    doc.setFont(undefined, "italic"); doc.setTextColor(80);
                    doc.text(doc.splitTextToSize(v.descripcion, width - 4), margen + 2, yIn + 2);
                }
                
                y += hFicha + 10;
            }
        }

        // 6. CONSULTAS
        if(reportData.consultasAdicionales?.length > 0){
            y = imprimirTituloSeccionPDF(doc, "CONSULTAS SQL ADICIONALES", y, margen, width);
            reportData.consultasAdicionales.forEach(c => {
                y = verificarEspacio(doc, y, 30);
                doc.setFont("helvetica", "bold"); doc.text(`• ${c.nombre}`, margen, y); y += 5;
                if(c.codigo){
                    const l = doc.splitTextToSize(limpiarTexto(c.codigo), width - 6);
                    const h = l.length*4 + 6;
                    y = verificarEspacio(doc, y, h);
                    doc.setFillColor(245); doc.rect(margen, y, width, h, 'F');
                    doc.setFont('courier','normal'); doc.setFontSize(8); doc.setTextColor(50);
                    doc.text(l, margen+3, y+4); doc.setFont('helvetica','normal'); y += h+5;
                }
            });
        }

        doc.save(`Manual_${limpiarTexto(reportData.codigoReporte)}.pdf`);
    } catch(e) { console.error(e); alert("Error PDF"); }
    finally { setGenerandoPDF(false); }
  };

  /** =================================================================================
   * GENERADOR WORD (Lógica de TABLAS para igualar PDF)
   * ================================================================================= */
  
  const celdaHeader = (texto, widthPercent) => {
      return new TableCell({
          width: { size: widthPercent, type: WidthType.PERCENTAGE },
          shading: { fill: COLORS.primaryHex, type: ShadingType.CLEAR, color: "auto" },
          children: [new Paragraph({
              children: [new TextRun({ text: limpiarTexto(texto), bold: true, color: "FFFFFF", size: 16 })], // 8pt
              alignment: AlignmentType.CENTER
          })],
          verticalAlign: AlignmentType.CENTER
      });
  };

  const celdaDato = (texto, widthPercent, align = AlignmentType.LEFT, bg = "FFFFFF") => {
      return new TableCell({
          width: { size: widthPercent, type: WidthType.PERCENTAGE },
          shading: { fill: bg, type: ShadingType.CLEAR, color: "auto" },
          children: [new Paragraph({
              children: [new TextRun({ text: limpiarTexto(texto), size: 18, color: COLORS.textHex })], // 9pt
              alignment: align
          })],
          verticalAlign: AlignmentType.CENTER
      });
  };

  const tituloSeccionWord = (texto) => {
      return new Paragraph({
          children: [new TextRun({ text: texto.toUpperCase(), bold: true, size: 24, color: COLORS.primaryHex })],
          border: { bottom: { color: COLORS.primaryHex, space: 1, value: BorderStyle.SINGLE, size: 6 } },
          spacing: { before: 400, after: 200 }
      });
  };

  const crearImagenWord = async (base64String, ancho=500, alto=300) => {
    if (!base64String || base64String.length < 100) return new Paragraph("");
    try {
        const raw = base64String.split(',')[1];
        const buffer = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
        return new Paragraph({
            children: [new ImageRun({ data: buffer, transformation: { width: ancho, height: alto } })],
            alignment: AlignmentType.CENTER, spacing: { after: 100, before: 100 }
        });
    } catch { return new Paragraph(""); }
  };

  const handleGenerarWord = async () => {
      setGenerandoWord(true);
      try {
          const children = [];

          // 1. HEADER (TABLAS)
          const t1 = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                  new TableRow({ children: [celdaHeader("NOMBRE SOLUCIÓN", 35), celdaHeader("TIPO DOCUMENTO", 25), celdaHeader("OBJETIVO", 40)] }),
                  new TableRow({ children: [
                      celdaDato(reportData.nombreReporte || "N/A", 35),
                      celdaDato("MANUAL TÉCNICO", 25, AlignmentType.CENTER),
                      celdaDato(reportData.objetivo || "N/A", 40)
                  ]})
              ]
          });
          children.push(t1); children.push(new Paragraph(""));

          const t2 = new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                  new TableRow({ children: ["FECHA", "VERSIÓN", "CÓDIGO", "AUTOR", "APROBADO POR"].map(t => celdaHeader(t, 20)) }),
                  new TableRow({ children: [
                      reportData.fechaDocumentacion||"Hoy", "1.0", reportData.codigoReporte||"N/A", reportData.documentadoPor||"Admin", ""
                  ].map(t => celdaDato(t, 20, AlignmentType.CENTER))})
              ]
          });
          children.push(t2); children.push(new Paragraph(""));

          // 2. INFO
          children.push(tituloSeccionWord("INFORMACIÓN GENERAL"));
          children.push(new Paragraph({children:[new TextRun({text:"Categoría: ", bold:true}), new TextRun(reportData.categoria||"N/A")]}));
          if(reportData.usuarios) {
              children.push(new Paragraph({children:[new TextRun({text:"Audiencia: ", bold:true})]}));
              children.push(new Paragraph(reportData.usuarios));
          }

          // 3. ESTRUCTURA (TABLA)
          if(reportData.camposDetectados?.length > 0){
              children.push(tituloSeccionWord("ESTRUCTURA DE DATOS"));
              if(reportData.tablaOrigen) children.push(new Paragraph({children:[new TextRun({text:"Tabla Origen: ", bold:true}), new TextRun(reportData.tablaOrigen)]}));
              children.push(new Paragraph(""));

              const hRow = new TableRow({ children: [celdaHeader("NOMBRE", 40), celdaHeader("TIPO", 20), celdaHeader("DESCRIPCIÓN", 40)] });
              const rows = reportData.camposDetectados.map((c, i) => new TableRow({
                  children: [
                      celdaDato(c.nombre+(c.esLlave?' (PK)':''), 40, AlignmentType.LEFT, i%2!==0?COLORS.secondaryHex:"FFFFFF"),
                      celdaDato(c.tipo, 20, AlignmentType.LEFT, i%2!==0?COLORS.secondaryHex:"FFFFFF"),
                      celdaDato(c.descripcion||"-", 40, AlignmentType.LEFT, i%2!==0?COLORS.secondaryHex:"FFFFFF")
                  ]
              }));
              children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hRow, ...rows] }));
          }

          // 4. FILTROS
          if(reportData.filtros?.length > 0){
              children.push(tituloSeccionWord("FILTROS Y PARÁMETROS"));
              for(const f of reportData.filtros){
                  children.push(new Paragraph({children:[new TextRun({text:`• ${f.nombre}`, bold:true, size:22})]}));
                  children.push(new Paragraph({
                      children: [
                          new TextRun({text: `Campo: ${f.campoSQL||'-'} | Tipo: ${f.tipoControl||'-'}`, color: "666666", size: 18})
                      ],
                      indent: { left: 300 }
                  }));
                  
                  if(f.valores) children.push(new Paragraph({ children:[new TextRun({text:`Valores: ${f.valores}`, size:18})], indent:{left:300} }));
                  
                  if(f.imagenPreview) children.push(await crearImagenWord(f.imagenPreview, 300, 150));
                  children.push(new Paragraph(""));
              }
          }

          // 5. VISUALIZACIONES (ESTILO FICHA)
          if(reportData.visualizaciones?.length > 0){
              children.push(tituloSeccionWord("VISUALIZACIONES"));
              
              for(const v of reportData.visualizaciones){
                  // Tabla contenedora de la visualización
                  const titleRow = new TableRow({
                      children: [new TableCell({
                          shading: { fill: COLORS.primaryHex },
                          children: [new Paragraph({ children: [new TextRun({ text: v.titulo || "Visualización", bold: true, color: "FFFFFF", size: 20 })], alignment: AlignmentType.CENTER })]
                      })]
                  });

                  const imgP = v.imagen ? await crearImagenWord(v.imagen, 500, 300) : new Paragraph("[Sin imagen]");
                  const imgRow = new TableRow({ children: [new TableCell({ children: [imgP] })] });

                  // Datos
                  const cStr = v.camposUtilizados ? (Array.isArray(v.camposUtilizados) ? v.camposUtilizados.join(", ") : v.camposUtilizados) : "N/A";
                  const detailsRow = new TableRow({
                      children: [new TableCell({
                          shading: { fill: COLORS.secondaryHex },
                          children: [
                              new Paragraph({children:[new TextRun({text:`Tipo: ${v.tipo||'N/A'} | Métricas: ${v.metricasCalculadas||'N/A'}`, size:16})]}),
                              new Paragraph({children:[new TextRun({text:"Campos: ", bold:true, size:16}), new TextRun({text:cStr, size:16})]}),
                              new Paragraph({children:[new TextRun({text:v.descripcion||"", italics:true, size:16})]})
                          ],
                          margins: { top: 100, bottom: 100, left: 100, right: 100 }
                      })]
                  });

                  children.push(new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: [titleRow, imgRow, detailsRow]
                  }));
                  children.push(new Paragraph(""));
              }
          }

          // 6. CONSULTAS
          if(reportData.consultasAdicionales?.length > 0){
              children.push(tituloSeccionWord("CONSULTAS SQL ADICIONALES"));
              reportData.consultasAdicionales.forEach(c => {
                  children.push(new Paragraph({children:[new TextRun({text:`• ${c.nombre}`, bold:true})]}));
                  if(c.codigo){
                      children.push(new Table({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          rows: [new TableRow({children:[celdaDato(c.codigo, 100, AlignmentType.LEFT, "F5F5F5")]})]
                      }));
                      children.push(new Paragraph(""));
                  }
              });
          }

          const doc = new Document({ sections: [{ properties: {}, children }] });
          const blob = await Packer.toBlob(doc);
          saveAs(blob, `Manual_${limpiarTexto(reportData.codigoReporte)}.docx`);

      } catch(e) { console.error(e); alert("Error Word"); }
      finally { setGenerandoWord(false); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>📄</div>
        <h2 className={styles.title}>Manual Técnico</h2>
        <p className={styles.subtitle}>Documentación Oficial (Areandina)</p>
      </div>
      <div className={styles.exportSection} style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
        <button className={styles.btnExport} onClick={handleGenerarPDF} disabled={generandoPDF || !reportData.nombreReporte}>
          <span className={styles.btnIcon}>{generandoPDF ? '⚙️' : '📄'}</span>
          <span className={styles.btnText}>{generandoPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
        </button>
        <button className={styles.btnExport} onClick={handleGenerarWord} disabled={generandoWord || !reportData.nombreReporte} style={{background:'#2b579a'}}>
          <span className={styles.btnIcon}>{generandoWord ? '⚙️' : '📝'}</span>
          <span className={styles.btnText}>{generandoWord ? 'Generando Word...' : 'Descargar Word'}</span>
        </button>
      </div>
    </div>
  );
};

export default ManualTecnico;