import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import styles from './DiccionarioDatos.module.css';

/**
 * COMPONENTE: Diccionario de Datos
 * Genera documentación detallada de los campos y permite exportar a Excel con estilos profesionales.
 */
const DiccionarioDatos = ({ reportData }) => {

  /**
   * Genera y descarga el archivo Excel con ESTILOS (Colores, Bordes, Anchos)
   */
  const handleExportarExcel = async () => {
    // 1. Validación de seguridad
    if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) {
      alert('No hay campos detectados para exportar. Por favor completa la Sección 2.');
      return;
    }

    // 2. Crear el Libro de Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = reportData.documentadoPor || 'Admin';
    workbook.created = new Date();

    // =========================================================
    // HOJA 1: INFORMACIÓN GENERAL
    // =========================================================
    const wsInfo = workbook.addWorksheet('Información General', {
      properties: { tabColor: { argb: 'FF8CC63F' } }, // Pestaña Verde
      views: [{ showGridLines: false }]
    });

    // --- Título Principal ---
    wsInfo.mergeCells('B2:E2');
    const titleCell = wsInfo.getCell('B2');
    titleCell.value = 'FICHA TÉCNICA DEL REPORTE';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8CC63F' } }; // Fondo Verde
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    wsInfo.getRow(2).height = 30;

    // Estilo de borde común
    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };

    // Función auxiliar para filas de datos (Label | Valor)
    const addInfoRow = (rowNum, label, value) => {
      const labelCell = wsInfo.getCell(`B${rowNum}`);
      labelCell.value = label;
      labelCell.font = { bold: true, color: { argb: 'FF333333' } };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; // Gris claro
      labelCell.border = thinBorder;
      labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      // Fusionar celdas para el valor (C hasta E)
      wsInfo.mergeCells(`C${rowNum}:E${rowNum}`);
      const valueCell = wsInfo.getCell(`C${rowNum}`);
      valueCell.value = value;
      valueCell.border = thinBorder;
      valueCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      
      wsInfo.getRow(rowNum).height = 20;
    };

    // Insertar datos
    addInfoRow(4, 'Nombre del Reporte', reportData.nombreReporte || '');
    addInfoRow(5, 'Código', reportData.codigoReporte || '');
    addInfoRow(6, 'Categoría', reportData.categoria || '');
    addInfoRow(7, 'Subcategoría', reportData.subcategoria || '');
    addInfoRow(8, 'Tabla Origen', reportData.tablaOrigen || '');
    addInfoRow(9, 'Documentado Por', reportData.documentadoPor || 'Admin');
    addInfoRow(10, 'Fecha Documentación', reportData.fechaDocumentacion || new Date().toISOString().split('T')[0]);
    addInfoRow(11, 'Total Campos', reportData.camposDetectados.length);

    // Sección Objetivo (Celda Grande)
    wsInfo.mergeCells('B13:E13');
    const objHeader = wsInfo.getCell('B13');
    objHeader.value = 'OBJETIVO DEL REPORTE';
    objHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    objHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } }; // Azul Oscuro
    objHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    wsInfo.getRow(13).height = 25;

    wsInfo.mergeCells('B14:E16');
    const objVal = wsInfo.getCell('B14');
    objVal.value = reportData.objetivo || '';
    objVal.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    objVal.border = thinBorder;

    // Sección Usuarios
    wsInfo.mergeCells('B18:E18');
    const userHeader = wsInfo.getCell('B18');
    userHeader.value = 'USUARIOS / AUDIENCIA';
    userHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    userHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
    userHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    wsInfo.getRow(18).height = 25;

    wsInfo.mergeCells('B19:E20');
    const userVal = wsInfo.getCell('B19');
    userVal.value = reportData.usuarios || '';
    userVal.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
    userVal.border = thinBorder;

    // Ajustar ancho columna B
    wsInfo.getColumn('B').width = 25;


    // =========================================================
    // HOJA 2: DICCIONARIO DE CAMPOS (Principal)
    // =========================================================
    const wsDic = workbook.addWorksheet('Diccionario de Campos', {
      properties: { tabColor: { argb: 'FF2C3E50' } }
    });

    // Definir columnas
    wsDic.columns = [
      { header: 'Nombre del Campo', key: 'nombre', width: 35 },
      { header: 'Tipo Dato', key: 'tipo', width: 15 },
      { header: 'Longitud', key: 'long', width: 12 },
      { header: 'PK', key: 'pk', width: 8 },
      { header: 'Null', key: 'null', width: 8 },
      { header: 'Métrica', key: 'metrica', width: 10 },
      { header: 'Descripción / Significado', key: 'desc', width: 50 },
      { header: 'Uso en Visuales', key: 'vis', width: 30 },
      { header: 'Filtro', key: 'fil', width: 10 },
    ];

    // Estilo del Encabezado (Fila 1) - VERDE CORPORATIVO
    const headerRow = wsDic.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8CC63F' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });

    // Agregar Datos
    reportData.camposDetectados.forEach((campo) => {
      const visuales = (campo.usadoEnVisuales && campo.usadoEnVisuales.length > 0)
        ? campo.usadoEnVisuales.join(', ')
        : '-';

      wsDic.addRow({
        nombre: campo.nombre,
        tipo: campo.tipo,
        long: campo.longitud || '-',
        pk: campo.esLlave ? '✔' : '',
        null: campo.aceptaNulos ? '✔' : '',
        metrica: campo.esMetrica ? '✔' : '',
        desc: campo.descripcion || '',
        vis: visuales,
        fil: campo.participaEnFiltros ? '✔' : ''
      });
    });

    // Estilo de las filas de datos (Bordes y alineación)
    wsDic.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
          
          cell.alignment = { vertical: 'middle', wrapText: true };

          // Centrar columnas cortas (Long, PK, Null, Metrica, Filtro)
          if ([3, 4, 5, 6, 9].includes(colNumber)) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          }
          
          // Resaltar nombre de campo en negrita suave
          if (colNumber === 1) {
            cell.font = { bold: true, color: { argb: 'FF2C3E50' } };
          }
        });
      }
    });

    // Activar filtro automático
    wsDic.autoFilter = 'A1:I1';


    // =========================================================
    // HOJA 3: RESUMEN ESTADÍSTICO
    // =========================================================
    const wsResumen = workbook.addWorksheet('Resumen Estadístico', {
        properties: { tabColor: { argb: 'FF8CC63F' } },
        views: [{ showGridLines: false }]
    });

    wsResumen.columns = [
        { header: 'MÉTRICA', key: 'metrica', width: 35 },
        { header: 'CANTIDAD', key: 'cantidad', width: 15 }
    ];

    // Datos estadísticos
    const statsData = [
        { metrica: 'Total de Campos', cantidad: reportData.camposDetectados.length },
        { metrica: 'Llaves Primarias (PK)', cantidad: reportData.camposDetectados.filter(c => c.esLlave).length },
        { metrica: 'Métricas Calculadas', cantidad: reportData.camposDetectados.filter(c => c.esMetrica).length },
        { metrica: 'Campos Usados en Visuales', cantidad: reportData.camposDetectados.filter(c => c.usadoEnVisuales?.length).length },
        { metrica: 'Campos Utilizados en Filtros', cantidad: reportData.camposDetectados.filter(c => c.participaEnFiltros).length },
        { metrica: 'Campos que Aceptan Nulos', cantidad: reportData.camposDetectados.filter(c => c.aceptaNulos).length },
        { metrica: 'Total Filtros Documentados', cantidad: reportData.filtros?.length || 0 },
        { metrica: 'Total Visualizaciones', cantidad: reportData.visualizaciones?.length || 0 },
        { metrica: 'Total Consultas SQL', cantidad: reportData.consultasAdicionales?.length || 0 }
    ];

    // Header Resumen
    const headerRes = wsResumen.getRow(1);
    headerRes.height = 25;
    headerRes.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } }; // Azul
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Insertar filas
    statsData.forEach(d => wsResumen.addRow(d));

    // Estilos Resumen
    wsResumen.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.getCell(1).font = { bold: true, color: { argb: 'FF555555' } };
            row.getCell(1).border = thinBorder;
            
            row.getCell(2).alignment = { horizontal: 'center' };
            row.getCell(2).font = { bold: true, size: 11, color: { argb: 'FF2C3E50' } };
            row.getCell(2).border = thinBorder;
        }
    });

    // =========================================================
    // GENERAR Y DESCARGAR
    // =========================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = reportData.codigoReporte 
      ? `Diccionario_${reportData.codigoReporte}.xlsx` 
      : `Diccionario_Datos.xlsx`;
      
    saveAs(blob, fileName);
  };

  /**
   * Helper para renderizar badges en la UI
   */
  const renderBooleanBadge = (value, labelTrue = "Sí", labelFalse = "-") => {
    if (value) {
      return <span className={`${styles.badge} ${styles.badgeSuccess}`}>{labelTrue}</span>;
    }
    return <span className={styles.textMuted}>{labelFalse}</span>;
  };

  const renderTypeBadge = (type) => {
    let styleClass = styles.typeString;
    const t = type ? type.toUpperCase() : "";
    if (t.includes("INT") || t.includes("NUM") || t.includes("FLOAT") || t.includes("DECIMAL") || t.includes("DOUBLE")) styleClass = styles.typeNumber;
    if (t.includes("DATE") || t.includes("TIME")) styleClass = styles.typeDate;
    
    return <span className={`${styles.badgeType} ${styleClass}`}>{type || "N/A"}</span>;
  };

  /**
   * Renderiza la vista previa de la tabla en pantalla
   */
  const renderVistaPrevia = () => {
    if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) return null;

    // Solo mostramos los primeros 8 para no saturar la pantalla
    const camposPreview = reportData.camposDetectados.slice(0, 8);

    return (
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <h3>📋 Vista Previa de Campos</h3>
          <span className={styles.recordCount}>
            Mostrando {camposPreview.length} de {reportData.camposDetectados.length} registros
          </span>
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Nombre Campo</th>
                <th style={{ width: '12%' }}>Tipo</th>
                <th style={{ width: '8%' }} className={styles.center}>Long.</th>
                <th style={{ width: '8%' }} className={styles.center}>PK</th>
                <th style={{ width: '8%' }} className={styles.center}>Null</th>
                <th style={{ width: '25%' }}>Descripción</th>
                <th style={{ width: '10%' }} className={styles.center}>Uso</th>
              </tr>
            </thead>
            <tbody>
              {camposPreview.map((campo, index) => (
                <tr key={index}>
                  <td className={styles.fieldName} title={campo.nombre}>{campo.nombre}</td>
                  <td>{renderTypeBadge(campo.tipo)}</td>
                  <td className={styles.center}>{campo.longitud || '-'}</td>
                  <td className={styles.center}>{renderBooleanBadge(campo.esLlave, "PK", "")}</td>
                  <td className={styles.center}>{renderBooleanBadge(campo.aceptaNulos, "Sí", "No")}</td>
                  <td className={styles.descCell} title={campo.descripcion}>
                    {campo.descripcion || <span className={styles.textMuted}>-</span>}
                  </td>
                  <td className={styles.center}>
                    {campo.usadoEnVisuales?.length > 0 && <span title="Usado en visuales">📊</span>}
                    {campo.participaEnFiltros && <span title="Usado en filtros"> 🔍</span>}
                    {(!campo.usadoEnVisuales?.length && !campo.participaEnFiltros) && <span className={styles.textMuted}>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {reportData.camposDetectados.length > 8 && (
          <div className={styles.previewFooter}>
            ... y {reportData.camposDetectados.length - 8} campos más disponibles en el Excel descargable.
          </div>
        )}
      </div>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Diccionario de Datos</h2>
          <p className={styles.subtitle}>
            Generación automática de documentación técnica para {reportData.nombreReporte || "el reporte"}.
          </p>
        </div>
        <div className={styles.exportAction}>
            <button 
                className={styles.btnExport} 
                onClick={handleExportarExcel}
                disabled={!reportData.camposDetectados || reportData.camposDetectados.length === 0}
            >
                <span className={styles.icon}>📥</span> Descargar Excel Completo
            </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      {reportData.camposDetectados && reportData.camposDetectados.length > 0 && (
        <div className={styles.statsGrid}>
            <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Campos</span>
                <span className={styles.statValue}>{reportData.camposDetectados.length}</span>
                <div className={styles.statBar} style={{width: '100%', background: '#8CC63F'}}></div>
            </div>
            <div className={styles.statCard}>
                <span className={styles.statLabel}>Llaves (PK)</span>
                <span className={styles.statValue}>
                    {reportData.camposDetectados.filter(c => c.esLlave).length}
                </span>
                <div className={styles.statBar} style={{width: '60%', background: '#2980b9'}}></div>
            </div>
            <div className={styles.statCard}>
                <span className={styles.statLabel}>Visuales</span>
                <span className={styles.statValue}>
                    {reportData.camposDetectados.filter(c => c.usadoEnVisuales && c.usadoEnVisuales.length > 0).length}
                </span>
                <div className={styles.statBar} style={{width: '40%', background: '#e67e22'}}></div>
            </div>
            <div className={styles.statCard}>
                <span className={styles.statLabel}>Filtros</span>
                <span className={styles.statValue}>
                    {reportData.camposDetectados.filter(c => c.participaEnFiltros).length}
                </span>
                <div className={styles.statBar} style={{width: '30%', background: '#9b59b6'}}></div>
            </div>
        </div>
      )}

      {/* Vista Previa o Empty State */}
      {(!reportData.camposDetectados || reportData.camposDetectados.length === 0) ? (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <h3>No hay datos para mostrar</h3>
            <p>Por favor completa la Sección 2 (Consulta SQL) para detectar los campos y generar el diccionario.</p>
        </div>
      ) : renderVistaPrevia()}

      {/* Instrucciones Footer */}
      <div className={styles.instructions}>
        <h4 className={styles.instructionsTitle}>Estructura del archivo Excel generado:</h4>
        <ul className={styles.instructionsList}>
            <li><strong>Hoja 1 (Información General):</strong> Metadatos, objetivos y usuarios del reporte.</li>
            <li><strong>Hoja 2 (Diccionario):</strong> Detalle técnico de cada campo (Tipo, Longitud, PK, Nulls, Uso).</li>
            <li><strong>Hoja 3 (Resumen):</strong> Estadísticas globales de cobertura y uso de datos.</li>
        </ul>
      </div>

    </div>
  );
};

export default DiccionarioDatos;