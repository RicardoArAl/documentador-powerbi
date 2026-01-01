import React, { useState } from 'react';
import { 
  generarSugerenciasCompletas, 
  validarContextoReporte 
} from '../../utils/ai/analizarContexto';
import { tieneApiKey } from '../../utils/ai/geminiClient';
import styles from './InfoAdicional.module.css';

/**
 * SECCIÓN 6: INFORMACIÓN ADICIONAL (CON IA - FASE 4)
 * 
 * Componente para documentar información complementaria del reporte
 * NUEVA FUNCIONALIDAD: Sugerencias automáticas con IA
 */

const InfoAdicional = ({ reportData, setReportData }) => {
  
  // Estado para análisis IA
  const [generandoSugerencias, setGenerandoSugerencias] = useState(false);
  const [sugerencias, setSugerencias] = useState(null);
  const [mensajeIA, setMensajeIA] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Opciones predefinidas para frecuencia
  const FRECUENCIAS = [
    'Tiempo real',
    'Diaria',
    'Semanal',
    'Mensual',
    'Bajo demanda',
    'Otro'
  ];

  /**
   * Actualizar campo específico en el estado
   */
  const handleCambio = (campo, valor) => {
    setReportData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  /**
   * NUEVA FUNCIÓN: Generar sugerencias con IA
   */
  const handleGenerarSugerencias = async () => {
    // Validar API key
    if (!tieneApiKey()) {
      alert('⚠️ Por favor configura tu API key de Gemini primero.\n\nHaz clic en el botón "⚙️ Configurar IA" en el header.');
      return;
    }

    // Validar contexto del reporte
    const validacion = validarContextoReporte(reportData);
    
    if (!validacion.valido) {
      alert(`⚠️ No hay suficiente información para generar sugerencias de calidad.\n\nFaltan:\n${validacion.errores.join('\n')}\n\nPor favor completa al menos las Secciones 1 y 2.`);
      return;
    }

    // Mostrar advertencias si las hay
    if (validacion.advertencias.length > 0) {
      const continuar = window.confirm(
        `⚠️ ADVERTENCIA:\n\n${validacion.advertencias.join('\n')}\n\nLas sugerencias tendrán calidad ${validacion.calidad}.\n\n¿Deseas continuar?`
      );
      if (!continuar) return;
    }

    try {
      setGenerandoSugerencias(true);
      setMensajeIA('🤖 Analizando reporte completo y generando sugerencias...');
      setSugerencias(null);

      // Llamar a la función de IA
      const resultados = await generarSugerenciasCompletas(reportData);

      setSugerencias(resultados);
      setMostrarSugerencias(true);
      setMensajeIA(`✅ Sugerencias generadas con ${(resultados.confianza * 100).toFixed(0)}% de confianza`);

    } catch (error) {
      console.error('Error generando sugerencias:', error);
      setMensajeIA(`❌ Error: ${error.message}`);
      setSugerencias(null);
    } finally {
      setGenerandoSugerencias(false);
    }
  };

  /**
   * Aplicar sugerencias al formulario
   */
  const handleAplicarSugerencias = () => {
    if (!sugerencias) return;

    setReportData(prev => ({
      ...prev,
      reportesRelacionados: sugerencias.reportesRelacionados || prev.reportesRelacionados,
      frecuenciaActualizacion: sugerencias.frecuenciaActualizacion || prev.frecuenciaActualizacion,
      volumetria: sugerencias.volumetria || prev.volumetria,
      notasTecnicas: sugerencias.notasTecnicas || prev.notasTecnicas,
      historialCambios: sugerencias.historialCambios || prev.historialCambios
    }));

    setMostrarSugerencias(false);
    setSugerencias(null);
    setMensajeIA('✅ Sugerencias aplicadas correctamente');
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setMensajeIA(''), 3000);
  };

  /**
   * Cancelar sugerencias
   */
  const handleCancelarSugerencias = () => {
    setSugerencias(null);
    setMostrarSugerencias(false);
    setMensajeIA('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📋 Información Adicional</h2>
        <p className={styles.descripcion}>
          Completa información complementaria sobre el reporte. 
          <span className={styles.opcional}> (Todos los campos son opcionales)</span>
        </p>
      </div>

      {/* ========== SECCIÓN IA (FASE 4) ========== */}
      {tieneApiKey() && (
        <div className={styles.seccionIA}>
          <div className={styles.seccionIATitulo}>
            <span>✨</span>
            <h3>Asistencia con IA</h3>
          </div>
          <p className={styles.seccionIADescripcion}>
            La IA puede analizar todo tu reporte y generar sugerencias inteligentes para:
            reportes relacionados, frecuencia de actualización, volumetría, notas técnicas e historial de cambios.
          </p>

          <button
            type="button"
            onClick={handleGenerarSugerencias}
            disabled={generandoSugerencias}
            className={styles.btnGenerarSugerencias}
          >
            {generandoSugerencias ? (
              <>
                <div className={styles.spinner}></div>
                <span>Analizando reporte completo...</span>
              </>
            ) : (
              <>
                <span>🔮</span>
                <span>Generar Sugerencias Automáticas</span>
              </>
            )}
          </button>

          {/* Mensaje de estado */}
          {mensajeIA && (
            <div className={`${styles.mensajeIA} ${mensajeIA.startsWith('❌') ? styles.error : ''}`}>
              {mensajeIA}
            </div>
          )}

          {/* Resultados de sugerencias */}
          {mostrarSugerencias && sugerencias && (
            <div className={styles.resultadosSugerencias}>
              <div className={styles.resultadosHeader}>
                <h4>✨ Sugerencias Generadas</h4>
                <span className={styles.badgeConfianza}>
                  Confianza: {(sugerencias.confianza * 100).toFixed(0)}%
                </span>
              </div>

              <div className={styles.sugerenciaItem}>
                <div className={styles.sugerenciaLabel}>
                  <strong>📊 Reportes Relacionados:</strong>
                </div>
                <div className={styles.sugerenciaValor}>
                  {sugerencias.reportesRelacionados || 'No generado'}
                </div>
              </div>

              <div className={styles.sugerenciaItem}>
                <div className={styles.sugerenciaLabel}>
                  <strong>🔄 Frecuencia de Actualización:</strong>
                </div>
                <div className={styles.sugerenciaValor}>
                  {sugerencias.frecuenciaActualizacion || 'No generada'}
                </div>
              </div>

              <div className={styles.sugerenciaItem}>
                <div className={styles.sugerenciaLabel}>
                  <strong>💾 Volumetría Estimada:</strong>
                </div>
                <div className={styles.sugerenciaValor}>
                  {sugerencias.volumetria || 'No generada'}
                </div>
              </div>

              <div className={styles.sugerenciaItem}>
                <div className={styles.sugerenciaLabel}>
                  <strong>🔧 Notas Técnicas:</strong>
                </div>
                <div className={styles.sugerenciaValor}>
                  {sugerencias.notasTecnicas || 'No generadas'}
                </div>
              </div>

              <div className={styles.sugerenciaItem}>
                <div className={styles.sugerenciaLabel}>
                  <strong>📝 Historial de Cambios:</strong>
                </div>
                <div className={styles.sugerenciaValor}>
                  <pre>{sugerencias.historialCambios || 'No generado'}</pre>
                </div>
              </div>

              {sugerencias.razonamiento && (
                <div className={styles.razonamientoBox}>
                  <strong>💡 Razonamiento de la IA:</strong>
                  <p>{sugerencias.razonamiento}</p>
                </div>
              )}

              <div className={styles.botonesAccion}>
                <button
                  type="button"
                  onClick={handleAplicarSugerencias}
                  className={styles.btnAplicar}
                >
                  ✅ Aplicar Sugerencias
                </button>
                <button
                  type="button"
                  onClick={handleCancelarSugerencias}
                  className={styles.btnCancelar}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== FORMULARIO TRADICIONAL ========== */}
      <div className={styles.formulario}>

        {/* Reportes relacionados */}
        <div className={styles.formGroup}>
          <label htmlFor="reportesRelacionados">
            📊 Reportes relacionados
          </label>
          <input
            type="text"
            id="reportesRelacionados"
            value={reportData.reportesRelacionados || ''}
            onChange={(e) => handleCambio('reportesRelacionados', e.target.value)}
            placeholder="Ej: Reporte de Ventas Mensual, Dashboard Ejecutivo"
            className={styles.input}
          />
          <small className={styles.hint}>
            Menciona otros reportes que complementan o se relacionan con este
          </small>
        </div>

        {/* Frecuencia de actualización */}
        <div className={styles.formGroup}>
          <label htmlFor="frecuenciaActualizacion">
            🔄 Frecuencia de actualización
          </label>
          <select
            id="frecuenciaActualizacion"
            value={reportData.frecuenciaActualizacion || ''}
            onChange={(e) => handleCambio('frecuenciaActualizacion', e.target.value)}
            className={styles.select}
          >
            <option value="">-- Selecciona una frecuencia --</option>
            {FRECUENCIAS.map(freq => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
          <small className={styles.hint}>
            ¿Con qué frecuencia se actualizan los datos del reporte?
          </small>
        </div>

        {/* Volumetría estimada */}
        <div className={styles.formGroup}>
          <label htmlFor="volumetria">
            💾 Volumetría estimada
          </label>
          <input
            type="text"
            id="volumetria"
            value={reportData.volumetria || ''}
            onChange={(e) => handleCambio('volumetria', e.target.value)}
            placeholder="Ej: ~50,000 registros/mes, 100 MB de datos"
            className={styles.input}
          />
          <small className={styles.hint}>
            Estimación de la cantidad de datos que procesa el reporte
          </small>
        </div>

        {/* Notas técnicas */}
        <div className={styles.formGroup}>
          <label htmlFor="notasTecnicas">
            🔧 Notas técnicas
          </label>
          <textarea
            id="notasTecnicas"
            value={reportData.notasTecnicas || ''}
            onChange={(e) => handleCambio('notasTecnicas', e.target.value)}
            placeholder="Consideraciones técnicas, dependencias, requisitos especiales..."
            className={styles.textarea}
            rows="5"
          />
          <small className={styles.hint}>
            Menciona aspectos técnicos importantes: rendimiento, dependencias, permisos, etc.
          </small>
        </div>

        {/* Historial de cambios */}
        <div className={styles.formGroup}>
          <label htmlFor="historialCambios">
            📝 Historial de cambios
          </label>
          <textarea
            id="historialCambios"
            value={reportData.historialCambios || ''}
            onChange={(e) => handleCambio('historialCambios', e.target.value)}
            placeholder="[Fecha] - [Versión] - [Autor]
- Descripción del cambio"
            className={styles.textarea}
            rows="6"
          />
          <small className={styles.hint}>
            Registra las modificaciones importantes del reporte. Formato sugerido: [Fecha] - [Versión] - [Descripción]
          </small>
        </div>

      </div>

      {/* Info box */}
      <div className={styles.infoBox}>
        <strong>💡 Consejo:</strong> Aunque estos campos son opcionales, completarlos mejora 
        significativamente la calidad de la documentación y facilita el mantenimiento del reporte.
        {tieneApiKey() && (
          <span> Usa el botón de IA para obtener sugerencias inteligentes basadas en tu reporte.</span>
        )}
      </div>
    </div>
  );
};

export default InfoAdicional;