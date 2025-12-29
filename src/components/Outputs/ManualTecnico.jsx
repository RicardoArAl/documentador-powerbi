import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './ManualTecnico.module.css';

/**
 * COMPONENTE: Manual Técnico
 * 
 * Genera un documento PDF completo con toda la documentación del reporte.
 * Incluye texto, tablas e imágenes capturadas.
 * 
 * Props:
 * - reportData: objeto con toda la información del reporte
 */

const ManualTecnico = ({ reportData }) => {
  
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  /**
   * Función auxiliar para agregar texto al PDF con word wrap
   */
  const agregarTextoConWrap = (doc, texto, x, y, maxWidth) => {
    if (!texto) return y;
    
    const lineas = doc.splitTextToSize(texto, maxWidth);
    doc.text(lineas, x, y);
    return y + (lineas.length * 7); // 7 es el interlineado
  };

  /**
   * Función auxiliar para agregar imagen al PDF
   */
  const agregarImagen = async (doc, imagenBase64, x, y, maxWidth, maxHeight) => {
    if (!imagenBase64) return y;
    
    try {
      const img = new Image();
      img.src = imagenBase64;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calcular dimensiones manteniendo aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      doc.addImage(imagenBase64, 'PNG', x, y, width, height);
      return y + height + 10;
    } catch (error) {
      console.error('Error al agregar imagen:', error);
      return y;
    }
  };

  /**
   * Función principal para generar el PDF
   */
  const handleGenerarPDF = async () => {
    setGenerando(true);
    setProgreso(0);

    try {
      // Crear documento PDF en formato carta (letter)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter'
      });

      let yPos = 20; // Posición Y inicial
      const margenIzq = 20;
      const margenDer = 20;
      const anchoUtil = doc.internal.pageSize.width - margenIzq - margenDer;

      // ========== PORTADA ==========
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont(undefined, 'bold');
      doc.text('MANUAL TÉCNICO', doc.internal.pageSize.width / 2, 80, { align: 'center' });
      
      doc.setFontSize(24);
      doc.text(reportData.nombreReporte || 'Reporte Power BI', doc.internal.pageSize.width / 2, 100, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(`Código: ${reportData.codigoReporte || 'N/A'}`, doc.internal.pageSize.width / 2, 120, { align: 'center' });
      doc.text(`Fecha: ${reportData.fechaDocumentacion || new Date().toISOString().split('T')[0]}`, doc.internal.pageSize.width / 2, 130, { align: 'center' });
      doc.text(`Documentado por: ${reportData.documentadoPor || 'Ricardo Aral'}`, doc.internal.pageSize.width / 2, 140, { align: 'center' });

      setProgreso(10);

      // ========== PÁGINA 2: INFORMACIÓN BÁSICA ==========
      doc.addPage();
      yPos = 20;
      doc.setTextColor(0, 0, 0);
      
      // Título de sección
      doc.setFillColor(33, 150, 243);
      doc.rect(margenIzq, yPos, anchoUtil, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('1. INFORMACIÓN BÁSICA', margenIzq + 3, yPos + 7);
      yPos += 15;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      // Nombre del reporte
      doc.setFont(undefined, 'bold');
      doc.text('Nombre del Reporte:', margenIzq, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      yPos = agregarTextoConWrap(doc, reportData.nombreReporte || 'N/A', margenIzq + 5, yPos, anchoUtil - 5);
      yPos += 5;

      // Código
      doc.setFont(undefined, 'bold');
      doc.text('Código del Reporte:', margenIzq, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(reportData.codigoReporte || 'N/A', margenIzq + 5, yPos);
      yPos += 10;

      // Categoría
      doc.setFont(undefined, 'bold');
      doc.text('Categoría:', margenIzq, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(`${reportData.categoria || 'N/A'} ${reportData.subcategoria ? '/ ' + reportData.subcategoria : ''}`, margenIzq + 5, yPos);
      yPos += 10;

      // Objetivo
      doc.setFont(undefined, 'bold');
      doc.text('Objetivo del Reporte:', margenIzq, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      yPos = agregarTextoConWrap(doc, reportData.objetivo || 'N/A', margenIzq + 5, yPos, anchoUtil - 5);
      yPos += 5;

      // Usuarios
      if (reportData.usuarios) {
        doc.setFont(undefined, 'bold');
        doc.text('Usuarios que lo utilizan:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        yPos = agregarTextoConWrap(doc, reportData.usuarios, margenIzq + 5, yPos, anchoUtil - 5);
      }

      setProgreso(20);

      // ========== PÁGINA 3: CONSULTA SQL Y ESTRUCTURA ==========
      doc.addPage();
      yPos = 20;

      // Título de sección
      doc.setFillColor(156, 39, 176);
      doc.rect(margenIzq, yPos, anchoUtil, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('2. CONSULTA SQL Y ESTRUCTURA', margenIzq + 3, yPos + 7);
      yPos += 15;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      // Tabla origen
      doc.setFont(undefined, 'bold');
      doc.text('Tabla/Vista Origen:', margenIzq, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.text(reportData.tablaOrigen || 'N/A', margenIzq + 5, yPos);
      yPos += 10;

      // Campos detectados
      doc.setFont(undefined, 'bold');
      doc.text(`Campos Detectados (${reportData.camposDetectados?.length || 0}):`, margenIzq, yPos);
      yPos += 10;

      // Tabla de campos (primeros 15)
      if (reportData.camposDetectados && reportData.camposDetectados.length > 0) {
        doc.setFontSize(9);
        
        const camposMostrar = reportData.camposDetectados.slice(0, 15);
        
        camposMostrar.forEach((campo, index) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont(undefined, 'bold');
          doc.text(`• ${campo.nombre}`, margenIzq + 5, yPos);
          doc.setFont(undefined, 'normal');
          doc.text(`[${campo.tipo}]${campo.esLlave ? ' 🔑' : ''}`, margenIzq + 80, yPos);
          yPos += 5;
          
          if (campo.descripcion) {
            doc.setFont(undefined, 'italic');
            yPos = agregarTextoConWrap(doc, campo.descripcion, margenIzq + 10, yPos, anchoUtil - 15);
            yPos += 3;
          }
        });

        if (reportData.camposDetectados.length > 15) {
          doc.setFont(undefined, 'italic');
          doc.text(`... y ${reportData.camposDetectados.length - 15} campos más`, margenIzq + 5, yPos);
        }
      }

      setProgreso(40);

      // ========== PÁGINA 4: FILTROS Y PARÁMETROS ==========
      if (reportData.filtros && reportData.filtros.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFillColor(255, 152, 0);
        doc.rect(margenIzq, yPos, anchoUtil, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('3. FILTROS Y PARÁMETROS', margenIzq + 3, yPos + 7);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        for (const filtro of reportData.filtros) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }

          // Nombre del filtro
          doc.setFont(undefined, 'bold');
          doc.text(`• ${filtro.nombre}`, margenIzq, yPos);
          yPos += 7;

          // Detalles
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
          doc.text(`Campo SQL: ${filtro.campoSQL || 'N/A'}`, margenIzq + 5, yPos);
          yPos += 5;
          doc.text(`Tipo de control: ${filtro.tipoControl || 'N/A'}`, margenIzq + 5, yPos);
          yPos += 5;
          
          if (filtro.valores) {
            doc.text(`Valores: ${filtro.valores}`, margenIzq + 5, yPos);
            yPos += 5;
          }

          if (filtro.descripcion) {
            yPos = agregarTextoConWrap(doc, `Descripción: ${filtro.descripcion}`, margenIzq + 5, yPos, anchoUtil - 10);
          }

          // Imagen del filtro si existe
          if (filtro.imagenPreview) {
            yPos += 5;
            if (yPos > 200) {
              doc.addPage();
              yPos = 20;
            }
            yPos = await agregarImagen(doc, filtro.imagenPreview, margenIzq, yPos, anchoUtil, 60);
          }

          yPos += 10;
        }
      }

      setProgreso(60);

      // ========== PÁGINA 5: VISUALIZACIONES ==========
      if (reportData.visualizaciones && reportData.visualizaciones.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setFillColor(102, 126, 234);
        doc.rect(margenIzq, yPos, anchoUtil, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('4. VISUALIZACIONES', margenIzq + 3, yPos + 7);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);

        for (const visual of reportData.visualizaciones) {
          if (yPos > 220) {
            doc.addPage();
            yPos = 20;
          }

          // Título del visual
          doc.setFont(undefined, 'bold');
          doc.text(`• ${visual.titulo || 'Sin título'}`, margenIzq, yPos);
          yPos += 7;

          // Tipo
          doc.setFont(undefined, 'normal');
          doc.setFontSize(10);
          doc.text(`Tipo: ${visual.tipo || 'N/A'}`, margenIzq + 5, yPos);
          yPos += 5;

          // Campos utilizados
          if (visual.camposUtilizados && visual.camposUtilizados.length > 0) {
            doc.text(`Campos: ${visual.camposUtilizados.join(', ')}`, margenIzq + 5, yPos);
            yPos += 5;
          }

          // Métricas
          if (visual.metricasCalculadas) {
            yPos = agregarTextoConWrap(doc, `Métricas: ${visual.metricasCalculadas}`, margenIzq + 5, yPos, anchoUtil - 10);
            yPos += 3;
          }

          // Descripción
          if (visual.descripcion) {
            yPos = agregarTextoConWrap(doc, `Descripción: ${visual.descripcion}`, margenIzq + 5, yPos, anchoUtil - 10);
          }

          // Imagen del visual
          if (visual.imagen) {
            yPos += 5;
            if (yPos > 180) {
              doc.addPage();
              yPos = 20;
            }
            yPos = await agregarImagen(doc, visual.imagen, margenIzq, yPos, anchoUtil, 80);
          }

          yPos += 10;
        }
      }

      setProgreso(80);

      // ========== PÁGINA 6: INFORMACIÓN ADICIONAL ==========
      doc.addPage();
      yPos = 20;

      doc.setFillColor(63, 81, 181);
      doc.rect(margenIzq, yPos, anchoUtil, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('6. INFORMACIÓN ADICIONAL', margenIzq + 3, yPos + 7);
      yPos += 15;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);

      // Reportes relacionados
      if (reportData.reportesRelacionados) {
        doc.setFont(undefined, 'bold');
        doc.text('Reportes Relacionados:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        yPos = agregarTextoConWrap(doc, reportData.reportesRelacionados, margenIzq + 5, yPos, anchoUtil - 5);
        yPos += 10;
      }

      // Frecuencia
      if (reportData.frecuenciaActualizacion) {
        doc.setFont(undefined, 'bold');
        doc.text('Frecuencia de Actualización:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(reportData.frecuenciaActualizacion, margenIzq + 5, yPos);
        yPos += 10;
      }

      // Volumetría
      if (reportData.volumetria) {
        doc.setFont(undefined, 'bold');
        doc.text('Volumetría Estimada:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.text(reportData.volumetria, margenIzq + 5, yPos);
        yPos += 10;
      }

      // Notas técnicas
      if (reportData.notasTecnicas) {
        doc.setFont(undefined, 'bold');
        doc.text('Notas Técnicas:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        yPos = agregarTextoConWrap(doc, reportData.notasTecnicas, margenIzq + 5, yPos, anchoUtil - 5);
        yPos += 10;
      }

      // Historial de cambios
      if (reportData.historialCambios) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont(undefined, 'bold');
        doc.text('Historial de Cambios:', margenIzq, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        yPos = agregarTextoConWrap(doc, reportData.historialCambios, margenIzq + 5, yPos, anchoUtil - 5);
      }

      setProgreso(100);

      // ========== GUARDAR PDF ==========
      const nombreArchivo = reportData.codigoReporte
        ? `Manual_${reportData.codigoReporte}_${new Date().toISOString().split('T')[0]}.pdf`
        : `Manual_Tecnico_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(nombreArchivo);

      console.log('✅ Manual Técnico generado exitosamente');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor intenta nuevamente.');
    } finally {
      setGenerando(false);
      setProgreso(0);
    }
  };

  // ========== RENDER ==========
  
  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>📄</div>
        <h2 className={styles.title}>Manual Técnico</h2>
        <p className={styles.subtitle}>
          Genera un documento PDF completo con toda la documentación del reporte
        </p>
      </div>

      {/* Contenido del manual */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>📋 Contenido del Manual</h3>
        <div className={styles.contenidoList}>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>1</span>
            <div>
              <h4>Información Básica</h4>
              <p>Nombre, código, categoría, objetivo y usuarios del reporte</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>2</span>
            <div>
              <h4>Consulta SQL y Estructura</h4>
              <p>Tabla origen y listado completo de campos con sus tipos y descripciones</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>3</span>
            <div>
              <h4>Filtros y Parámetros</h4>
              <p>Documentación de todos los filtros con capturas de pantalla</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>4</span>
            <div>
              <h4>Visualizaciones</h4>
              <p>Cada visual con su imagen, campos utilizados y métricas</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>5</span>
            <div>
              <h4>Consultas Adicionales</h4>
              <p>Stored procedures, funciones y queries complementarios</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <span className={styles.numero}>6</span>
            <div>
              <h4>Información Adicional</h4>
              <p>Reportes relacionados, frecuencia, volumetría y notas técnicas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de generación */}
      <div className={styles.exportSection}>
        <button
          className={styles.btnExport}
          onClick={handleGenerarPDF}
          disabled={generando || !reportData.nombreReporte}
        >
          <span className={styles.btnIcon}>
            {generando ? '⏳' : '📥'}
          </span>
          <span className={styles.btnText}>
            {generando ? 'Generando PDF...' : 'Descargar Manual (PDF)'}
          </span>
        </button>

        {generando && (
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progreso}%` }}
            />
          </div>
        )}

        {!reportData.nombreReporte && (
          <p className={styles.warningText}>
            ⚠️ Completa al menos la Sección 1 (Información Básica) para generar el manual
          </p>
        )}
      </div>

      {/* Notas */}
      <div className={styles.notes}>
        <h3 className={styles.notesTitle}>📝 Notas Importantes</h3>
        <ul className={styles.notesList}>
          <li>
            El PDF incluye todas las imágenes capturadas (filtros y visualizaciones)
          </li>
          <li>
            La generación puede tardar unos segundos dependiendo de la cantidad de imágenes
          </li>
          <li>
            El archivo se descarga automáticamente con el formato: 
            <code>Manual_[CodigoReporte]_[Fecha].pdf</code>
          </li>
          <li>
            Si alguna sección no tiene datos, no aparecerá en el documento final
          </li>
        </ul>
      </div>

    </div>
  );
};

export default ManualTecnico;