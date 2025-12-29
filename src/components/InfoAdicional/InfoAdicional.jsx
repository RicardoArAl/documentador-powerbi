import React from 'react';
import styles from './InfoAdicional.module.css';

/**
 * SECCIÓN 6: INFORMACIÓN ADICIONAL
 * Componente para información complementaria del reporte
 * - Reportes relacionados
 * - Frecuencia de actualización
 * - Volumetría estimada
 * - Notas técnicas
 * - Historial de cambios
 * 
 * Todos los campos son OPCIONALES
 */

const InfoAdicional = ({ reportData, setReportData }) => {

  // Opciones de frecuencia predefinidas
  const FRECUENCIAS = [
    'Tiempo real',
    'Cada 15 minutos',
    'Cada hora',
    'Diaria',
    'Semanal',
    'Quincenal',
    'Mensual',
    'Trimestral',
    'Anual',
    'Bajo demanda',
    'Otro'
  ];

  /**
   * Maneja cambios en los campos
   */
  const handleChange = (campo, valor) => {
    setReportData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <h2>📝 Información Adicional</h2>
        <p className={styles.descripcion}>
          Completa información complementaria sobre el reporte.
          <span className={styles.opcional}> (Todos los campos son opcionales)</span>
        </p>
      </div>

      {/* Formulario */}
      <div className={styles.formulario}>

        {/* Reportes relacionados */}
        <div className={styles.formGroup}>
          <label htmlFor="reportesRelacionados" className={styles.label}>
            <span className={styles.icono}>🔗</span>
            Reportes relacionados
          </label>
          <input
            type="text"
            id="reportesRelacionados"
            value={reportData.reportesRelacionados}
            onChange={(e) => handleChange('reportesRelacionados', e.target.value)}
            placeholder="Ej: RPT-002 (Reporte de notas), RPT-015 (Dashboard académico)"
            className={styles.input}
          />
          <small className={styles.hint}>
            Lista los códigos o nombres de reportes que están relacionados con este
          </small>
        </div>

        {/* Frecuencia de actualización */}
        <div className={styles.formGroup}>
          <label htmlFor="frecuenciaActualizacion" className={styles.label}>
            <span className={styles.icono}>⏱️</span>
            Frecuencia de actualización
          </label>
          <select
            id="frecuenciaActualizacion"
            value={reportData.frecuenciaActualizacion}
            onChange={(e) => handleChange('frecuenciaActualizacion', e.target.value)}
            className={styles.select}
          >
            <option value="">-- Selecciona una frecuencia --</option>
            {FRECUENCIAS.map((frecuencia, index) => (
              <option key={index} value={frecuencia}>
                {frecuencia}
              </option>
            ))}
          </select>
          <small className={styles.hint}>
            ¿Con qué frecuencia se actualizan los datos de este reporte?
          </small>
        </div>

        {/* Volumetría estimada */}
        <div className={styles.formGroup}>
          <label htmlFor="volumetria" className={styles.label}>
            <span className={styles.icono}>📊</span>
            Volumetría estimada
          </label>
          <input
            type="text"
            id="volumetria"
            value={reportData.volumetria}
            onChange={(e) => handleChange('volumetria', e.target.value)}
            placeholder="Ej: ~50,000 registros, 2GB de datos, 10,000 estudiantes/semestre"
            className={styles.input}
          />
          <small className={styles.hint}>
            Estimación del volumen de datos que maneja el reporte
          </small>
        </div>

        {/* Notas técnicas */}
        <div className={styles.formGroup}>
          <label htmlFor="notasTecnicas" className={styles.label}>
            <span className={styles.icono}>🔧</span>
            Notas técnicas
          </label>
          <textarea
            id="notasTecnicas"
            value={reportData.notasTecnicas}
            onChange={(e) => handleChange('notasTecnicas', e.target.value)}
            placeholder="Documenta consideraciones técnicas importantes: índices utilizados, optimizaciones aplicadas, dependencias con otros sistemas, permisos requeridos, etc."
            className={styles.textarea}
            rows="6"
          />
          <small className={styles.hint}>
            Incluye información técnica relevante para mantenimiento o modificaciones futuras
          </small>
        </div>

        {/* Historial de cambios */}
        <div className={styles.formGroup}>
          <label htmlFor="historialCambios" className={styles.label}>
            <span className={styles.icono}>📋</span>
            Historial de cambios
          </label>
          <textarea
            id="historialCambios"
            value={reportData.historialCambios}
            onChange={(e) => handleChange('historialCambios', e.target.value)}
            placeholder="Registra los cambios importantes del reporte:
&#10;2025-01-08 - v1.0 - Versión inicial
&#10;2024-12-15 - v0.9 - Agregado filtro de modalidad
&#10;2024-11-20 - v0.8 - Corrección de cálculo de créditos"
            className={styles.textarea}
            rows="6"
          />
          <small className={styles.hint}>
            Mantén un log de versiones y modificaciones realizadas al reporte
          </small>
        </div>

        {/* Box informativo */}
        <div className={styles.infoBox}>
          <div className={styles.infoIcono}>ℹ️</div>
          <div className={styles.infoTexto}>
            <strong>Información:</strong> Esta sección es completamente opcional. 
            Agrega solo la información que consideres relevante para documentar el reporte. 
            Puedes dejar campos vacíos sin problema.
          </div>
        </div>

      </div>

      {/* Resumen de completitud */}
      <div className={styles.resumen}>
        <h3>📌 Resumen de Información Adicional</h3>
        <div className={styles.resumenGrid}>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Reportes relacionados:</span>
            <span className={styles.resumenValor}>
              {reportData.reportesRelacionados ? '✅ Completado' : '⚪ No especificado'}
            </span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Frecuencia:</span>
            <span className={styles.resumenValor}>
              {reportData.frecuenciaActualizacion ? '✅ Completado' : '⚪ No especificado'}
            </span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Volumetría:</span>
            <span className={styles.resumenValor}>
              {reportData.volumetria ? '✅ Completado' : '⚪ No especificado'}
            </span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Notas técnicas:</span>
            <span className={styles.resumenValor}>
              {reportData.notasTecnicas ? '✅ Completado' : '⚪ No especificado'}
            </span>
          </div>
          <div className={styles.resumenItem}>
            <span className={styles.resumenLabel}>Historial:</span>
            <span className={styles.resumenValor}>
              {reportData.historialCambios ? '✅ Completado' : '⚪ No especificado'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InfoAdicional;