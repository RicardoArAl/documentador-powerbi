import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import styles from './DiccionarioDatos.module.css';

/**
 * COMPONENTE: Diccionario de Datos
 * 
 * Genera un archivo Excel con todos los campos del reporte documentado.
 * Incluye análisis de uso: en qué visuales se usa, si participa en filtros, 
 * si es métrica, etc.
 * 
 * Props:
 * - reportData: objeto con toda la información del reporte
 */

const DiccionarioDatos = ({ reportData }) => {

  /**
   * Función para generar y descargar el Excel
   */
  const handleExportarExcel = () => {
    // Validar que haya campos
    if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) {
      alert('No hay campos detectados para exportar');
      return;
    }

    // ========== PREPARAR DATOS PARA EXCEL ==========
    
    // Crear array de objetos para el Excel
    const datosExcel = reportData.camposDetectados.map((campo) => {
      // Determinar en qué visuales se usa
      const visualesUsados = campo.usadoEnVisuales && campo.usadoEnVisuales.length > 0
        ? campo.usadoEnVisuales.join(', ')
        : 'No usado';

      // Determinar si participa en filtros
      const enFiltros = campo.participaEnFiltros ? 'Sí' : 'No';

      // Determinar si es métrica
      const esMetrica = campo.esMetrica ? 'Sí' : 'No';

      // Determinar si es llave
      const esLlave = campo.esLlave ? 'Sí' : 'No';

      return {
        'Campo': campo.nombre || '',
        'Tabla/Vista': reportData.tablaOrigen || '',
        'Tipo de Dato': campo.tipo || '',
        'Es Llave Primaria': esLlave,
        'Es Métrica': esMetrica,
        'Descripción': campo.descripcion || '',
        'Usado en Visuales': visualesUsados,
        'Participa en Filtros': enFiltros
      };
    });

    // ========== CREAR HOJA DE INFORMACIÓN GENERAL ==========
    
    const infoGeneral = [
      ['DICCIONARIO DE DATOS - REPORTE POWER BI'],
      [],
      ['Nombre del Reporte:', reportData.nombreReporte || ''],
      ['Código del Reporte:', reportData.codigoReporte || ''],
      ['Categoría:', reportData.categoria || ''],
      ['Subcategoría:', reportData.subcategoria || ''],
      ['Tabla/Vista Origen:', reportData.tablaOrigen || ''],
      ['Documentado por:', reportData.documentadoPor || 'Ricardo Aral'],
      ['Fecha de Documentación:', reportData.fechaDocumentacion || ''],
      ['Total de Campos:', reportData.camposDetectados.length],
      [],
      ['OBJETIVO DEL REPORTE:'],
      [reportData.objetivo || ''],
      [],
      ['USUARIOS QUE LO UTILIZAN:'],
      [reportData.usuarios || '']
    ];

    // ========== CREAR HOJA DE RESUMEN ESTADÍSTICO ==========
    
    const totalCampos = reportData.camposDetectados.length;
    const totalLlaves = reportData.camposDetectados.filter(c => c.esLlave).length;
    const totalMetricas = reportData.camposDetectados.filter(c => c.esMetrica).length;
    const camposUsados = reportData.camposDetectados.filter(c => 
      c.usadoEnVisuales && c.usadoEnVisuales.length > 0
    ).length;
    const camposEnFiltros = reportData.camposDetectados.filter(c => 
      c.participaEnFiltros
    ).length;

    const resumenEstadistico = [
      ['RESUMEN ESTADÍSTICO'],
      [],
      ['Métrica', 'Cantidad'],
      ['Total de Campos', totalCampos],
      ['Llaves Primarias', totalLlaves],
      ['Métricas', totalMetricas],
      ['Campos Usados en Visuales', camposUsados],
      ['Campos en Filtros', camposEnFiltros],
      ['Total de Filtros', reportData.filtros?.length || 0],
      ['Total de Visualizaciones', reportData.visualizaciones?.length || 0],
      ['Total de Consultas Adicionales', reportData.consultasAdicionales?.length || 0]
    ];

    // ========== CREAR WORKBOOK ==========
    
    const wb = XLSX.utils.book_new();

    // Hoja 1: Información General
    const wsInfo = XLSX.utils.aoa_to_sheet(infoGeneral);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Información General');

    // Hoja 2: Diccionario de Campos (principal)
    const wsCampos = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, wsCampos, 'Diccionario de Campos');

    // Hoja 3: Resumen Estadístico
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenEstadistico);
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Estadístico');

    // ========== EXPORTAR ARCHIVO ==========
    
    // Generar buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Crear blob
    const data = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Nombre del archivo
    const nombreArchivo = reportData.codigoReporte 
      ? `Diccionario_${reportData.codigoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Diccionario_Datos_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Descargar
    saveAs(data, nombreArchivo);

    // Feedback al usuario
    console.log('✅ Diccionario de Datos exportado exitosamente');
  };


  /**
   * Vista previa de los datos antes de exportar
   */
  const renderVistaPrevia = () => {
    if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) {
      return null;
    }

    // Mostrar solo los primeros 5 campos como preview
    const camposPreview = reportData.camposDetectados.slice(0, 5);

    return (
      <div className={styles.preview}>
        <h3 className={styles.previewTitle}>📋 Vista Previa (primeros 5 campos)</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Tipo</th>
                <th>Llave</th>
                <th>Métrica</th>
                <th>Descripción</th>
                <th>Usado en Visuales</th>
                <th>En Filtros</th>
              </tr>
            </thead>
            <tbody>
              {camposPreview.map((campo, index) => (
                <tr key={index}>
                  <td className={styles.fieldName}>{campo.nombre}</td>
                  <td>
                    <span className={styles.badge}>{campo.tipo}</span>
                  </td>
                  <td className={styles.centered}>
                    {campo.esLlave ? '✅' : '—'}
                  </td>
                  <td className={styles.centered}>
                    {campo.esMetrica ? '✅' : '—'}
                  </td>
                  <td className={styles.description}>{campo.descripcion}</td>
                  <td className={styles.centered}>
                    {campo.usadoEnVisuales && campo.usadoEnVisuales.length > 0 
                      ? `${campo.usadoEnVisuales.length} visual(es)` 
                      : '—'}
                  </td>
                  <td className={styles.centered}>
                    {campo.participaEnFiltros ? '✅' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reportData.camposDetectados.length > 5 && (
          <p className={styles.previewNote}>
            + {reportData.camposDetectados.length - 5} campos más en el Excel completo
          </p>
        )}
      </div>
    );
  };


  // ========== RENDER PRINCIPAL ==========
  
  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>📊</div>
        <h2 className={styles.title}>Diccionario de Datos</h2>
        <p className={styles.subtitle}>
          Exporta todos los campos del reporte a Excel con análisis completo
        </p>
      </div>

      {/* Información del contenido */}
      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>📄 Contenido del Diccionario</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📋</span>
            <div>
              <p className={styles.infoLabel}>Hoja 1: Información General</p>
              <p className={styles.infoDesc}>
                Datos del reporte, objetivo, usuarios, metadatos
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📊</span>
            <div>
              <p className={styles.infoLabel}>Hoja 2: Diccionario de Campos</p>
              <p className={styles.infoDesc}>
                Tabla completa con todos los campos y su análisis
              </p>
            </div>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>📈</span>
            <div>
              <p className={styles.infoLabel}>Hoja 3: Resumen Estadístico</p>
              <p className={styles.infoDesc}>
                Métricas agregadas y estadísticas del reporte
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {reportData.camposDetectados && reportData.camposDetectados.length > 0 && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {reportData.camposDetectados.length}
            </div>
            <div className={styles.statLabel}>Campos Totales</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {reportData.camposDetectados.filter(c => c.esLlave).length}
            </div>
            <div className={styles.statLabel}>Llaves Primarias</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {reportData.camposDetectados.filter(c => c.esMetrica).length}
            </div>
            <div className={styles.statLabel}>Métricas</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>
              {reportData.camposDetectados.filter(c => 
                c.usadoEnVisuales && c.usadoEnVisuales.length > 0
              ).length}
            </div>
            <div className={styles.statLabel}>Usados en Visuales</div>
          </div>
        </div>
      )}

      {/* Vista previa */}
      {renderVistaPrevia()}

      {/* Botón de exportación */}
      <div className={styles.exportSection}>
        <button
          className={styles.btnExport}
          onClick={handleExportarExcel}
          disabled={!reportData.camposDetectados || reportData.camposDetectados.length === 0}
        >
          <span className={styles.btnIcon}>📥</span>
          <span className={styles.btnText}>Descargar Diccionario (Excel)</span>
        </button>
        
        {(!reportData.camposDetectados || reportData.camposDetectados.length === 0) && (
          <p className={styles.warningText}>
            ⚠️ No hay campos detectados. Completa la Sección 2 (Consulta SQL) primero.
          </p>
        )}
      </div>

      {/* Instrucciones */}
      <div className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>💡 Instrucciones</h3>
        <ul className={styles.instructionsList}>
          <li>
            <strong>Hoja 1:</strong> Contiene información general del reporte 
            (nombre, código, categoría, objetivo, usuarios)
          </li>
          <li>
            <strong>Hoja 2:</strong> Diccionario completo con todos los campos detectados, 
            incluyendo tipo de dato, descripción, uso en visuales y filtros
          </li>
          <li>
            <strong>Hoja 3:</strong> Resumen estadístico con totales agregados 
            (cantidad de campos, llaves, métricas, etc.)
          </li>
          <li>
            El archivo se descarga automáticamente con el formato: 
            <code>Diccionario_[CodigoReporte]_[Fecha].xlsx</code>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default DiccionarioDatos;