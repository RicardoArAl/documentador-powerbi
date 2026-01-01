import React, { useState } from 'react';
import { analizarCodigoSQL, validarRespuestaSQL } from '../../utils/ai/analizarTexto';
import { tieneApiKey } from '../../utils/ai/geminiClient';
import styles from './ConsultasAdicionales.module.css';

/**
 * SECCIÓN 5: CONSULTAS ADICIONALES (CON IA - FASE 3)
 * 
 * Componente para documentar stored procedures, funciones, views y queries adicionales
 * - Permite análisis automático con IA del código SQL
 * - Extrae: nombre, tipo, parámetros, tablas, descripción
 * - Usuario puede revisar y ajustar los resultados
 */

const ConsultasAdicionales = ({ reportData, setReportData }) => {
  
  // Estado local para controlar qué consultas están expandidas
  const [expandidas, setExpandidas] = useState({});
  
  // Estado para análisis IA
  const [analizando, setAnalizando] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [consultaActual, setConsultaActual] = useState(null);
  const [mensajeIA, setMensajeIA] = useState('');

  // Tipos de consultas predefinidos
  const TIPOS_CONSULTA = [
    'Stored Procedure',
    'Function',
    'View',
    'Query',
    'Table-Valued Function',
    'Scalar Function',
    'Trigger',
    'Otro'
  ];

  /**
   * Agregar nueva consulta vacía
   */
  const handleAgregarConsulta = () => {
    const nuevaConsulta = {
      id: Date.now(), // ID único
      nombre: '',
      tipo: '',
      codigoSQL: '',
      parametros: '',
      descripcion: '',
      tablasSalida: ''
    };

    setReportData(prev => ({
      ...prev,
      consultasAdicionales: [...prev.consultasAdicionales, nuevaConsulta]
    }));

    // Expandir automáticamente la nueva consulta
    setExpandidas(prev => ({
      ...prev,
      [nuevaConsulta.id]: true
    }));
  };

  /**
   * Eliminar consulta por ID
   */
  const handleEliminarConsulta = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta consulta?')) {
      setReportData(prev => ({
        ...prev,
        consultasAdicionales: prev.consultasAdicionales.filter(c => c.id !== id)
      }));
      
      // Eliminar del estado de expandidas
      setExpandidas(prev => {
        const newExpandidas = { ...prev };
        delete newExpandidas[id];
        return newExpandidas;
      });
    }
  };

  /**
   * Mover consulta hacia arriba
   */
  const handleMoverArriba = (index) => {
    if (index === 0) return;
    
    setReportData(prev => {
      const newConsultas = [...prev.consultasAdicionales];
      [newConsultas[index - 1], newConsultas[index]] = [newConsultas[index], newConsultas[index - 1]];
      return { ...prev, consultasAdicionales: newConsultas };
    });
  };

  /**
   * Mover consulta hacia abajo
   */
  const handleMoverAbajo = (index) => {
    if (index === reportData.consultasAdicionales.length - 1) return;
    
    setReportData(prev => {
      const newConsultas = [...prev.consultasAdicionales];
      [newConsultas[index], newConsultas[index + 1]] = [newConsultas[index + 1], newConsultas[index]];
      return { ...prev, consultasAdicionales: newConsultas };
    });
  };

  /**
   * Actualizar campo específico de una consulta
   */
  const handleCambioConsulta = (id, campo, valor) => {
    setReportData(prev => ({
      ...prev,
      consultasAdicionales: prev.consultasAdicionales.map(c =>
        c.id === id ? { ...c, [campo]: valor } : c
      )
    }));
  };

  /**
   * Toggle expandir/colapsar consulta
   */
  const toggleExpandir = (id) => {
    setExpandidas(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  /**
   * Copiar código SQL al clipboard
   */
  const handleCopiarCodigo = (codigo) => {
    navigator.clipboard.writeText(codigo)
      .then(() => {
        alert('✅ Código SQL copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar:', err);
        alert('❌ No se pudo copiar el código');
      });
  };

  // =====================================================
  // FUNCIONES DE IA (FASE 3)
  // =====================================================

  /**
   * Iniciar análisis IA del código SQL
   */
  const handleAnalizarConIA = async (consulta) => {
    // Validar API key
    if (!tieneApiKey()) {
      alert('⚠️ Por favor configura tu API key de Gemini primero.\n\nHaz clic en el botón "⚙️ Configurar IA" en el header.');
      return;
    }

    // Validar que haya código SQL
    if (!consulta.codigoSQL || consulta.codigoSQL.trim() === '') {
      setMensajeIA('⚠️ Por favor ingresa el código SQL antes de analizar');
      return;
    }

    try {
      setAnalizando(true);
      setConsultaActual(consulta);
      setResultadoIA(null);
      setMensajeIA('🤖 Analizando código SQL con IA...');

      // Llamar a la función de análisis
      const resultado = await analizarCodigoSQL(
        consulta.codigoSQL,
        consulta.tipo || 'Query'
      );

      // Validar resultado
      const validacion = validarRespuestaSQL(resultado, 0.7);
      
      if (!validacion.valida) {
        setMensajeIA(`⚠️ ${validacion.mensaje}`);
      } else {
        setMensajeIA('✅ Análisis completado con éxito');
      }

      setResultadoIA(resultado);

    } catch (error) {
      console.error('Error al analizar código:', error);
      setMensajeIA(`❌ Error: ${error.message}`);
    } finally {
      setAnalizando(false);
    }
  };

  /**
   * Aplicar resultados de IA al formulario
   */
  const handleAplicarResultadosIA = () => {
    if (!resultadoIA || !consultaActual) return;

    // Actualizar la consulta con los datos analizados
    setReportData(prev => ({
      ...prev,
      consultasAdicionales: prev.consultasAdicionales.map(c => {
        if (c.id === consultaActual.id) {
          return {
            ...c,
            nombre: resultadoIA.nombre || c.nombre,
            tipo: resultadoIA.tipo || c.tipo,
            parametros: resultadoIA.parametros || c.parametros,
            tablasSalida: Array.isArray(resultadoIA.tablasSalida) 
              ? resultadoIA.tablasSalida.join(', ')
              : resultadoIA.tablasSalida || c.tablasSalida,
            descripcion: resultadoIA.descripcion || c.descripcion
          };
        }
        return c;
      })
    }));

    // Limpiar estado de IA
    setResultadoIA(null);
    setConsultaActual(null);
    setMensajeIA('✅ Resultados aplicados correctamente');
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setMensajeIA(''), 3000);
  };

  /**
   * Cancelar análisis IA
   */
  const handleCancelarIA = () => {
    setResultadoIA(null);
    setConsultaActual(null);
    setMensajeIA('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🔄 Consultas Adicionales</h2>
        <p className={styles.descripcion}>
          Documenta stored procedures, funciones, views o queries adicionales que utiliza tu reporte.
          <span className={styles.opcional}> (Sección opcional)</span>
        </p>
      </div>

      {/* Lista de consultas */}
      {reportData.consultasAdicionales && reportData.consultasAdicionales.length > 0 ? (
        <div className={styles.listaConsultas}>
          {reportData.consultasAdicionales.map((consulta, index) => (
            <div key={consulta.id} className={styles.consultaCard}>
              
              {/* Header del card */}
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  Consulta #{index + 1}
                </span>
                <span className={styles.titulo}>
                  {consulta.nombre || '(Sin nombre)'}
                  {consulta.tipo && (
                    <span className={styles.tipoBadge}>{consulta.tipo}</span>
                  )}
                </span>
                <div className={styles.acciones}>
                  <button
                    type="button"
                    onClick={() => handleMoverArriba(index)}
                    disabled={index === 0}
                    className={styles.btnIcono}
                    title="Mover arriba"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoverAbajo(index)}
                    disabled={index === reportData.consultasAdicionales.length - 1}
                    className={styles.btnIcono}
                    title="Mover abajo"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpandir(consulta.id)}
                    className={styles.btnIcono}
                    title={expandidas[consulta.id] ? "Colapsar" : "Expandir"}
                  >
                    {expandidas[consulta.id] ? '🔽' : '▶️'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarConsulta(consulta.id)}
                    className={styles.btnEliminar}
                    title="Eliminar consulta"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Contenido del formulario (expandible) */}
              {expandidas[consulta.id] && (
                <div className={styles.cardBody}>
                  
                  {/* ========== SECCIÓN IA ========== */}
                  {tieneApiKey() && consulta.codigoSQL && (
                    <div className={styles.seccionIA}>
                      <div className={styles.seccionIATitulo}>
                        <span>🤖</span>
                        <h4>Asistencia con IA</h4>
                      </div>
                      <p className={styles.seccionIADescripcion}>
                        La IA puede analizar automáticamente tu código SQL y completar:
                        nombre, tipo, parámetros, tablas y descripción.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleAnalizarConIA(consulta)}
                        disabled={analizando || !consulta.codigoSQL}
                        className={styles.btnAnalizarIA}
                      >
                        {analizando ? (
                          <>
                            <div className={styles.spinner}></div>
                            <span>Analizando código SQL...</span>
                          </>
                        ) : (
                          <>
                            <span>🔍</span>
                            <span>Analizar Código SQL con IA</span>
                          </>
                        )}
                      </button>

                      {/* Mensaje de estado */}
                      {mensajeIA && consultaActual?.id === consulta.id && (
                        <div className={`${styles.mensajeAnalisis} ${mensajeIA.startsWith('❌') ? styles.error : ''}`}>
                          <span>{mensajeIA}</span>
                        </div>
                      )}

                      {/* Resultados de IA */}
                      {resultadoIA && consultaActual?.id === consulta.id && (
                        <div className={styles.resultadosIA}>
                          <div className={styles.resultadosIATitulo}>
                            ✨ Resultados del Análisis
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Nombre:</span>
                            <span className={styles.resultadoValor}>{resultadoIA.nombre || 'No detectado'}</span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Tipo:</span>
                            <span className={styles.resultadoValor}>{resultadoIA.tipo || 'No detectado'}</span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Parámetros:</span>
                            <span className={styles.resultadoValor}>{resultadoIA.parametros || 'Sin parámetros'}</span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Tablas Entrada:</span>
                            <span className={styles.resultadoValor}>
                              {Array.isArray(resultadoIA.tablasEntrada) 
                                ? resultadoIA.tablasEntrada.join(', ') || 'No detectadas'
                                : resultadoIA.tablasEntrada || 'No detectadas'}
                            </span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Campos Salida:</span>
                            <span className={styles.resultadoValor}>
                              {Array.isArray(resultadoIA.tablasSalida) 
                                ? resultadoIA.tablasSalida.join(', ') || 'No detectados'
                                : resultadoIA.tablasSalida || 'No detectados'}
                            </span>
                          </div>

                          <div className={styles.resultadoItem}>
                            <span className={styles.resultadoLabel}>Descripción:</span>
                            <span className={styles.resultadoValor}>{resultadoIA.descripcion || 'No generada'}</span>
                          </div>

                          {resultadoIA.confianza && (
                            <div className={styles.resultadoItem}>
                              <span className={styles.resultadoLabel}>Confianza:</span>
                              <span className={styles.badgeConfianza}>
                                {(resultadoIA.confianza * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleAplicarResultadosIA}
                            className={styles.btnAplicarResultados}
                          >
                            ✅ Aplicar Resultados al Formulario
                          </button>

                          <button
                            type="button"
                            onClick={handleCancelarIA}
                            className={styles.btnCopiar}
                            style={{ marginTop: '0.5rem', width: '100%' }}
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nombre de la consulta */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`nombre-${consulta.id}`}>
                      Nombre de la consulta <span className={styles.requerido}>*</span>
                    </label>
                    <input
                      type="text"
                      id={`nombre-${consulta.id}`}
                      value={consulta.nombre}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'nombre', e.target.value)}
                      placeholder="Ej: SP_ObtenerPensum, VW_ReporteProgramas"
                      className={styles.input}
                    />
                    <small className={styles.hint}>
                      Nombre del stored procedure, función o view
                    </small>
                  </div>

                  {/* Tipo de consulta */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`tipo-${consulta.id}`}>
                      Tipo de consulta <span className={styles.requerido}>*</span>
                    </label>
                    <select
                      id={`tipo-${consulta.id}`}
                      value={consulta.tipo}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'tipo', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- Selecciona un tipo --</option>
                      {TIPOS_CONSULTA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Código SQL */}
                  <div className={styles.formGroup}>
                    <div className={styles.labelConBoton}>
                      <label htmlFor={`codigo-${consulta.id}`}>
                        Código SQL <span className={styles.requerido}>*</span>
                      </label>
                      {consulta.codigoSQL && (
                        <button
                          type="button"
                          onClick={() => handleCopiarCodigo(consulta.codigoSQL)}
                          className={styles.btnCopiar}
                          title="Copiar código"
                        >
                          📋 Copiar
                        </button>
                      )}
                    </div>
                    <textarea
                      id={`codigo-${consulta.id}`}
                      value={consulta.codigoSQL}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'codigoSQL', e.target.value)}
                      placeholder="Pega aquí el código SQL completo..."
                      className={styles.textareaSQL}
                      rows="12"
                    />
                    <small className={styles.hint}>
                      Incluye el código completo del stored procedure, función o query
                    </small>
                  </div>

                  {/* Parámetros */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`parametros-${consulta.id}`}>
                      Parámetros
                    </label>
                    <input
                      type="text"
                      id={`parametros-${consulta.id}`}
                      value={consulta.parametros}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'parametros', e.target.value)}
                      placeholder="Ej: @ProgramaID INT, @PeriodoID VARCHAR(10)"
                      className={styles.input}
                    />
                    <small className={styles.hint}>
                      Lista los parámetros de entrada si los tiene
                    </small>
                  </div>

                  {/* Tablas de salida */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`tablas-${consulta.id}`}>
                      Tablas/Campos de salida
                    </label>
                    <input
                      type="text"
                      id={`tablas-${consulta.id}`}
                      value={consulta.tablasSalida}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'tablasSalida', e.target.value)}
                      placeholder="Ej: ProgramaID, ProgramaNombre, TotalCreditos"
                      className={styles.input}
                    />
                    <small className={styles.hint}>
                      Lista las tablas o campos que retorna
                    </small>
                  </div>

                  {/* Descripción */}
                  <div className={styles.formGroup}>
                    <label htmlFor={`desc-${consulta.id}`}>
                      Descripción
                    </label>
                    <textarea
                      id={`desc-${consulta.id}`}
                      value={consulta.descripcion}
                      onChange={(e) => handleCambioConsulta(consulta.id, 'descripcion', e.target.value)}
                      placeholder="Describe qué hace esta consulta y cuándo se ejecuta..."
                      className={styles.textarea}
                      rows="4"
                    />
                  </div>

                </div>
              )}

              {/* Vista compacta cuando está colapsado */}
              {!expandidas[consulta.id] && (
                <div className={styles.consultaResumen}>
                  <div className={styles.resumenItem}>
                    <strong>Tipo:</strong> {consulta.tipo || '(No definido)'}
                  </div>
                  <div className={styles.resumenItem}>
                    <strong>Parámetros:</strong> {consulta.parametros || 'Sin parámetros'}
                  </div>
                  {consulta.codigoSQL && (
                    <div className={styles.resumenItem}>
                      <span className={styles.badgeInfo}>📝 Con código SQL</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔄</span>
          <p>No hay consultas adicionales documentadas</p>
          <p className={styles.emptyHint}>
            Si tu reporte utiliza stored procedures, funciones o queries adicionales, documéntalos aquí
          </p>
        </div>
      )}

      {/* Botón agregar */}
      <button
        type="button"
        onClick={handleAgregarConsulta}
        className={styles.btnAgregar}
      >
        + Agregar consulta adicional
      </button>

      {/* Contador */}
      {reportData.consultasAdicionales && reportData.consultasAdicionales.length > 0 && (
        <div className={styles.contador}>
          <strong>{reportData.consultasAdicionales.length}</strong> 
          {reportData.consultasAdicionales.length === 1 ? ' consulta' : ' consultas'} documentada(s)
        </div>
      )}
    </div>
  );
};

export default ConsultasAdicionales;