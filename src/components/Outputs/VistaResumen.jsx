import React from 'react';
import styles from './VistaResumen.module.css';

/**
 * COMPONENTE: Vista Resumen
 * 
 * Muestra un dashboard con estadísticas del reporte documentado:
 * - Métricas generales (campos, filtros, visuales, consultas)
 * - Estado de completitud por sección
 * - Botones de exportación centralizados
 * 
 * Props:
 * - reportData: objeto con toda la información del reporte
 * - onExportarDiccionario: función para exportar diccionario de datos
 * - onExportarManual: función para exportar manual técnico
 */

const VistaResumen = ({ reportData, onExportarDiccionario, onExportarManual }) => {
  
  // ========== CÁLCULOS DE MÉTRICAS ==========
  
  // Total de campos detectados
  const totalCampos = reportData.camposDetectados?.length || 0;
  
  // Total de filtros documentados
  const totalFiltros = reportData.filtros?.length || 0;
  
  // Total de visualizaciones documentadas
  const totalVisuales = reportData.visualizaciones?.length || 0;
  
  // Total de consultas adicionales
  const totalConsultas = reportData.consultasAdicionales?.length || 0;
  
  // Campos que son llaves primarias
  const totalLlaves = reportData.camposDetectados?.filter(c => c.esLlave).length || 0;
  
  // Campos que son métricas
  const totalMetricas = reportData.camposDetectados?.filter(c => c.esMetrica).length || 0;
  
  // Campos usados en al menos un visual
  const camposUsados = reportData.camposDetectados?.filter(c => 
    c.usadoEnVisuales && c.usadoEnVisuales.length > 0
  ).length || 0;
  
  // Campos que participan en filtros
  const camposEnFiltros = reportData.camposDetectados?.filter(c => 
    c.participaEnFiltros
  ).length || 0;


  // ========== ANÁLISIS DE COMPLETITUD POR SECCIÓN ==========
  
  const completitudSecciones = [
    {
      numero: 1,
      nombre: 'Información Básica',
      completado: Boolean(
        reportData.nombreReporte && 
        reportData.codigoReporte && 
        reportData.categoria && 
        reportData.objetivo
      ),
      color: '#2196f3'
    },
    {
      numero: 2,
      nombre: 'Consulta SQL',
      completado: Boolean(
        reportData.tablaOrigen && 
        reportData.camposDetectados?.length > 0
      ),
      color: '#9c27b0'
    },
    {
      numero: 3,
      nombre: 'Filtros',
      completado: totalFiltros > 0,
      color: '#ff9800'
    },
    {
      numero: 4,
      nombre: 'Visualizaciones',
      completado: totalVisuales > 0,
      color: '#667eea'
    },
    {
      numero: 5,
      nombre: 'Consultas Adicionales',
      completado: totalConsultas > 0,
      color: '#43a047'
    },
    {
      numero: 6,
      nombre: 'Información Adicional',
      completado: Boolean(
        reportData.frecuenciaActualizacion || 
        reportData.notasTecnicas || 
        reportData.historialCambios
      ),
      color: '#3f51b5'
    }
  ];

  const seccionesCompletadas = completitudSecciones.filter(s => s.completado).length;
  const porcentajeCompletitud = Math.round((seccionesCompletadas / 6) * 100);


  // ========== RENDER ==========
  
  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>📊</div>
        <h2 className={styles.title}>Vista Resumen del Reporte</h2>
        <p className={styles.subtitle}>
          Dashboard ejecutivo con métricas y estadísticas de la documentación
        </p>
      </div>

      {/* Indicador de completitud general */}
      <div className={styles.completitudGeneral}>
        <div className={styles.completitudHeader}>
          <h3>Completitud de la Documentación</h3>
          <span className={styles.porcentaje}>{porcentajeCompletitud}%</span>
        </div>
        <div className={styles.barraProgreso}>
          <div 
            className={styles.barraProgresoFill} 
            style={{ width: `${porcentajeCompletitud}%` }}
          />
        </div>
        <p className={styles.completitudTexto}>
          {seccionesCompletadas} de 6 secciones completadas
        </p>
      </div>

      {/* Grid de métricas principales */}
      <div className={styles.metricsGrid}>
        
        <div className={styles.metricCard} style={{ '--card-color': '#667eea' }}>
          <div className={styles.metricIcon}>📋</div>
          <div className={styles.metricContent}>
            <h3 className={styles.metricValue}>{totalCampos}</h3>
            <p className={styles.metricLabel}>Campos Detectados</p>
          </div>
        </div>

        <div className={styles.metricCard} style={{ '--card-color': '#ff9800' }}>
          <div className={styles.metricIcon}>🔍</div>
          <div className={styles.metricContent}>
            <h3 className={styles.metricValue}>{totalFiltros}</h3>
            <p className={styles.metricLabel}>Filtros Documentados</p>
          </div>
        </div>

        <div className={styles.metricCard} style={{ '--card-color': '#9c27b0' }}>
          <div className={styles.metricIcon}>📊</div>
          <div className={styles.metricContent}>
            <h3 className={styles.metricValue}>{totalVisuales}</h3>
            <p className={styles.metricLabel}>Visualizaciones</p>
          </div>
        </div>

        <div className={styles.metricCard} style={{ '--card-color': '#43a047' }}>
          <div className={styles.metricIcon}>💾</div>
          <div className={styles.metricContent}>
            <h3 className={styles.metricValue}>{totalConsultas}</h3>
            <p className={styles.metricLabel}>Consultas Adicionales</p>
          </div>
        </div>

      </div>

      {/* Detalles de campos */}
      <div className={styles.detallesSection}>
        <h3 className={styles.sectionTitle}>📊 Detalles de Campos</h3>
        <div className={styles.detallesGrid}>
          
          <div className={styles.detalleItem}>
            <span className={styles.detalleIcon}>🔑</span>
            <div>
              <p className={styles.detalleValue}>{totalLlaves}</p>
              <p className={styles.detalleLabel}>Llaves Primarias</p>
            </div>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleIcon}>📈</span>
            <div>
              <p className={styles.detalleValue}>{totalMetricas}</p>
              <p className={styles.detalleLabel}>Métricas</p>
            </div>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleIcon}>✅</span>
            <div>
              <p className={styles.detalleValue}>{camposUsados}</p>
              <p className={styles.detalleLabel}>Usados en Visuales</p>
            </div>
          </div>

          <div className={styles.detalleItem}>
            <span className={styles.detalleIcon}>🔍</span>
            <div>
              <p className={styles.detalleValue}>{camposEnFiltros}</p>
              <p className={styles.detalleLabel}>En Filtros</p>
            </div>
          </div>

        </div>
      </div>

      {/* Estado por sección */}
      <div className={styles.seccionesStatus}>
        <h3 className={styles.sectionTitle}>📋 Estado por Sección</h3>
        <div className={styles.seccionesGrid}>
          {completitudSecciones.map((seccion) => (
            <div 
              key={seccion.numero} 
              className={`${styles.seccionCard} ${seccion.completado ? styles.completada : styles.incompleta}`}
              style={{ '--seccion-color': seccion.color }}
            >
              <div className={styles.seccionNumero}>{seccion.numero}</div>
              <div className={styles.seccionInfo}>
                <h4>{seccion.nombre}</h4>
                <span className={styles.seccionEstado}>
                  {seccion.completado ? '✅ Completada' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información del reporte */}
      {reportData.nombreReporte && (
        <div className={styles.infoReporte}>
          <h3 className={styles.sectionTitle}>📄 Información del Reporte</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Nombre:</span>
              <span className={styles.infoValue}>{reportData.nombreReporte}</span>
            </div>
            {reportData.codigoReporte && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Código:</span>
                <span className={styles.infoValue}>{reportData.codigoReporte}</span>
              </div>
            )}
            {reportData.categoria && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Categoría:</span>
                <span className={styles.infoValue}>{reportData.categoria}</span>
              </div>
            )}
            {reportData.tablaOrigen && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tabla Origen:</span>
                <span className={styles.infoValue}>{reportData.tablaOrigen}</span>
              </div>
            )}
            {reportData.frecuenciaActualizacion && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Frecuencia:</span>
                <span className={styles.infoValue}>{reportData.frecuenciaActualizacion}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha Documentación:</span>
              <span className={styles.infoValue}>{reportData.fechaDocumentacion}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botones de exportación */}
      <div className={styles.exportSection}>
        <h3 className={styles.sectionTitle}>💾 Exportar Documentación</h3>
        <p className={styles.exportSubtitle}>
          Genera los documentos de salida en diferentes formatos
        </p>
        <div className={styles.exportButtons}>
          
          <button 
            className={styles.btnExport}
            onClick={onExportarDiccionario}
            disabled={totalCampos === 0}
          >
            <span className={styles.btnIcon}>📊</span>
            <div className={styles.btnContent}>
              <span className={styles.btnTitle}>Diccionario de Datos</span>
              <span className={styles.btnDesc}>Excel con todos los campos</span>
            </div>
          </button>

          <button 
            className={styles.btnExport}
            onClick={onExportarManual}
            disabled={!reportData.nombreReporte}
          >
            <span className={styles.btnIcon}>📄</span>
            <div className={styles.btnContent}>
              <span className={styles.btnTitle}>Manual Técnico</span>
              <span className={styles.btnDesc}>PDF completo con imágenes</span>
            </div>
          </button>

        </div>
      </div>

      {/* Mensaje de ayuda si no hay datos */}
      {totalCampos === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3>No hay datos para mostrar</h3>
          <p>Completa las secciones anteriores para ver las estadísticas del reporte</p>
        </div>
      )}

    </div>
  );
};

export default VistaResumen;