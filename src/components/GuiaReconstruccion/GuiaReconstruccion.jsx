import React, { useState, useEffect } from 'react';
import { generarGuiaPowerBI } from '../../utils/ai/analizarGuia';
import { tieneApiKey } from '../../utils/ai/geminiClient';
import { exportarGuiaPDF } from '../../utils/exportarGuiaPDF';
import styles from './GuiaReconstruccion.module.css';

/**
 * SECCIÓN 8: GUÍA DE RECONSTRUCCIÓN POWER BI
 * 
 * Genera paso a paso detallado para recrear el reporte en Power BI
 * usando toda la información documentada en las secciones anteriores
 * 
 * Versión: 1.0
 * Fecha: 2026-01-01
 */

function GuiaReconstruccion({ reportData, setReportData }) {
  // ============================================
  // ESTADOS
  // ============================================
  const [analizando, setAnalizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState(''); // 'success', 'error', 'warning'
  const [guiaGenerada, setGuiaGenerada] = useState(reportData.guiaReconstruccion || null);
  const [exportando, setExportando] = useState(false);

  // ============================================
  // VERIFICAR SI HAY DATOS SUFICIENTES
  // ============================================
  const datosInsuficientes = () => {
    if (!reportData.nombreReporte || !reportData.codigoReporte) {
      return 'Debes completar al menos la Sección 1 (Información Básica)';
    }
    if (reportData.camposDetectados.length === 0) {
      return 'Debes completar al menos la Sección 2 (Consulta SQL y Campos)';
    }
    return null;
  };

  // ============================================
  // FUNCIÓN: Generar guía con IA
  // ============================================
  const handleGenerarGuia = async () => {
    const errorDatos = datosInsuficientes();
    if (errorDatos) {
      setMensaje(errorDatos);
      setTipoMensaje('warning');
      setTimeout(() => setMensaje(''), 4000);
      return;
    }

    if (!tieneApiKey()) {
      setMensaje('⚠️ Configura tu API Key de Gemini primero (botón en el header)');
      setTipoMensaje('warning');
      setTimeout(() => setMensaje(''), 5000);
      return;
    }

    try {
      setAnalizando(true);
      setMensaje('🤖 Generando guía paso a paso con IA...');
      setTipoMensaje('info');

      const resultado = await generarGuiaPowerBI(reportData);

      if (resultado.exito) {
        setGuiaGenerada(resultado.guia);
        setReportData(prev => ({
          ...prev,
          guiaReconstruccion: resultado.guia
        }));

        setMensaje('✅ Guía generada exitosamente');
        setTipoMensaje('success');
        setTimeout(() => setMensaje(''), 3000);
      } else {
        throw new Error(resultado.error || 'Error al generar guía');
      }
    } catch (error) {
      console.error('Error al generar guía:', error);
      setMensaje(`❌ Error: ${error.message}`);
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setAnalizando(false);
    }
  };

  // ============================================
  // FUNCIÓN: Exportar guía a PDF
  // ============================================
  const handleExportarPDF = async () => {
    if (!guiaGenerada) {
      setMensaje('⚠️ Primero debes generar la guía con IA');
      setTipoMensaje('warning');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    try {
      setExportando(true);
      setMensaje('📄 Generando PDF...');
      setTipoMensaje('info');

      await exportarGuiaPDF(reportData, guiaGenerada);

      setMensaje('✅ PDF descargado exitosamente');
      setTipoMensaje('success');
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      setMensaje(`❌ Error al exportar: ${error.message}`);
      setTipoMensaje('error');
      setTimeout(() => setMensaje(''), 5000);
    } finally {
      setExportando(false);
    }
  };

  // ============================================
  // FUNCIÓN: Toggle checkbox paso completado
  // ============================================
  const togglePasoCompletado = (indicePaso) => {
    if (!guiaGenerada) return;

    const nuevosEstados = [...guiaGenerada.pasosCompletados];
    nuevosEstados[indicePaso] = !nuevosEstados[indicePaso];

    const guiaActualizada = {
      ...guiaGenerada,
      pasosCompletados: nuevosEstados
    };

    setGuiaGenerada(guiaActualizada);
    setReportData(prev => ({
      ...prev,
      guiaReconstruccion: guiaActualizada
    }));
  };

  // ============================================
  // FUNCIÓN: Calcular progreso
  // ============================================
  const calcularProgreso = () => {
    if (!guiaGenerada || !guiaGenerada.pasosCompletados) return 0;
    const completados = guiaGenerada.pasosCompletados.filter(Boolean).length;
    const total = guiaGenerada.pasosCompletados.length;
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.container}>
      
      {/* ========== HEADER ========== */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2 className={styles.titulo}>
            🎯 Guía de Reconstrucción en Power BI
          </h2>
          <p className={styles.descripcion}>
            Genera un paso a paso detallado para recrear este reporte en Power BI Desktop
            usando toda la información documentada
          </p>
        </div>

        {guiaGenerada && (
          <div className={styles.progresoCard}>
            <span className={styles.progresoLabel}>Progreso:</span>
            <div className={styles.progresoBarra}>
              <div 
                className={styles.progresoFill}
                style={{ width: `${calcularProgreso()}%` }}
              />
            </div>
            <span className={styles.progresoTexto}>{calcularProgreso()}%</span>
          </div>
        )}
      </div>

      {/* ========== MENSAJES ========== */}
      {mensaje && (
        <div className={`${styles.mensaje} ${styles[tipoMensaje]}`}>
          {mensaje}
        </div>
      )}

      {/* ========== BOTONES PRINCIPALES ========== */}
      <div className={styles.botonesContainer}>
        <button
          onClick={handleGenerarGuia}
          disabled={analizando}
          className={styles.btnGenerar}
        >
          {analizando ? (
            <>
              <span className={styles.spinner}></span>
              Generando con IA...
            </>
          ) : (
            <>
              🤖 Generar Guía Paso a Paso
            </>
          )}
        </button>

        {guiaGenerada && (
          <button
            onClick={handleExportarPDF}
            disabled={exportando}
            className={styles.btnExportar}
          >
            {exportando ? (
              <>
                <span className={styles.spinner}></span>
                Exportando...
              </>
            ) : (
              <>
                📄 Exportar a PDF
              </>
            )}
          </button>
        )}
      </div>

      {/* ========== GUÍA GENERADA ========== */}
      {guiaGenerada && (
        <div className={styles.guiaContainer}>
          
          {/* Información General */}
          <div className={styles.infoGeneral}>
            <h3>📋 Información General</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>Reporte:</strong> {reportData.nombreReporte}
              </div>
              <div className={styles.infoItem}>
                <strong>Código:</strong> {reportData.codigoReporte}
              </div>
              <div className={styles.infoItem}>
                <strong>Complejidad:</strong> 
                <span className={styles[`badge${guiaGenerada.complejidad}`]}>
                  {guiaGenerada.complejidad}
                </span>
              </div>
              <div className={styles.infoItem}>
                <strong>Tiempo Estimado:</strong> {guiaGenerada.tiempoEstimado}
              </div>
            </div>
            
            {guiaGenerada.prerequisitos && guiaGenerada.prerequisitos.length > 0 && (
              <div className={styles.prerequisitos}>
                <h4>✅ Prerequisitos:</h4>
                <ul>
                  {guiaGenerada.prerequisitos.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pasos */}
          {guiaGenerada.pasos && guiaGenerada.pasos.map((paso, index) => (
            <div key={index} className={styles.pasoCard}>
              
              {/* Header del Paso */}
              <div className={styles.pasoHeader}>
                <div className={styles.pasoHeaderLeft}>
                  <input
                    type="checkbox"
                    checked={guiaGenerada.pasosCompletados[index] || false}
                    onChange={() => togglePasoCompletado(index)}
                    className={styles.checkbox}
                  />
                  <span className={styles.pasoNumero}>Paso {index + 1}</span>
                  <h4 className={styles.pasoTitulo}>{paso.titulo}</h4>
                </div>
                {paso.icono && <span className={styles.pasoIcono}>{paso.icono}</span>}
              </div>

              {/* Descripción */}
              <p className={styles.pasoDescripcion}>{paso.descripcion}</p>

              {/* Instrucciones */}
              {paso.instrucciones && paso.instrucciones.length > 0 && (
                <div className={styles.instrucciones}>
                  <strong>Instrucciones:</strong>
                  <ol>
                    {paso.instrucciones.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Código SQL */}
              {paso.codigoSQL && (
                <div className={styles.codigoSQL}>
                  <strong>📝 Código SQL:</strong>
                  <pre><code>{paso.codigoSQL}</code></pre>
                </div>
              )}

              {/* Configuración */}
              {paso.configuracion && paso.configuracion.length > 0 && (
                <div className={styles.configuracion}>
                  <strong>⚙️ Configuración:</strong>
                  <ul>
                    {paso.configuracion.map((conf, idx) => (
                      <li key={idx}>{conf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {paso.tips && paso.tips.length > 0 && (
                <div className={styles.tips}>
                  <strong>💡 Tips:</strong>
                  <ul>
                    {paso.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Captura de Referencia */}
              {paso.capturaReferencia && (
                <div className={styles.capturaReferencia}>
                  <strong>📷 Referencia visual:</strong>
                  <img 
                    src={paso.capturaReferencia} 
                    alt={`Referencia ${paso.titulo}`}
                    className={styles.imagenReferencia}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Notas Finales */}
          {guiaGenerada.notasFinales && guiaGenerada.notasFinales.length > 0 && (
            <div className={styles.notasFinales}>
              <h3>📝 Notas Finales</h3>
              <ul>
                {guiaGenerada.notasFinales.map((nota, idx) => (
                  <li key={idx}>{nota}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ========== ESTADO VACÍO ========== */}
      {!guiaGenerada && !analizando && (
        <div className={styles.estadoVacio}>
          <div className={styles.iconoVacio}>🎯</div>
          <h3>Genera tu Guía de Reconstrucción</h3>
          <p>
            La IA analizará toda la información documentada y generará
            un paso a paso detallado para recrear este reporte en Power BI Desktop
          </p>
          <ul className={styles.caracteristicas}>
            <li>✅ Pasos ordenados y numerados</li>
            <li>✅ Código SQL incluido donde aplique</li>
            <li>✅ Capturas de referencia de filtros y visuales</li>
            <li>✅ Tips y mejores prácticas</li>
            <li>✅ Seguimiento de progreso con checkboxes</li>
            <li>✅ Exportable a PDF profesional</li>
          </ul>
        </div>
      )}

    </div>
  );
}

export default GuiaReconstruccion;