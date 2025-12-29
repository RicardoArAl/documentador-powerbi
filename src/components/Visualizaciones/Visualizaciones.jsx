/**
 * =====================================================
 * COMPONENTE: VISUALIZACIONES
 * Sección 4 - Con Análisis de IA Integrado
 * =====================================================
 */

import React, { useState, useRef } from 'react';
import styles from './Visualizaciones.module.css';
import { analizarVisualizacionDeImagen, validarRespuestaIA } from '../../utils/ai/analizarImagen';

const Visualizaciones = ({ reportData, setReportData }) => {
  
  // ===== NUEVOS ESTADOS PARA IA =====
  const [modalIAVisible, setModalIAVisible] = useState(false);
  const [visualSeleccionadoIA, setVisualSeleccionadoIA] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
  
  const inputImagenRef = useRef(null);

  // ===== CONSTANTES =====
  const TIPOS_VISUAL = [
    'Tabla',
    'Matriz',
    'Gráfico de Barras Verticales',
    'Gráfico de Barras Horizontales',
    'Gráfico de Líneas',
    'Gráfico de Áreas',
    'Gráfico Circular (Pie)',
    'Gráfico de Anillo (Donut)',
    'Gráfico de Dispersión',
    'Mapa',
    'KPI Card',
    'Medidor (Gauge)',
    'Embudo (Funnel)',
    'Cascada (Waterfall)',
    'Treemap',
    'Otro'
  ];

  // ===== FUNCIONES EXISTENTES =====

  /**
   * Agregar nueva visualización vacía
   */
  const handleAgregarVisualizacion = () => {
    const nuevaVisualizacion = {
      id: Date.now(),
      titulo: '',
      tipo: '',
      imagen: null,
      camposUtilizados: [],
      metricasCalculadas: '',
      descripcion: ''
    };

    setReportData(prev => ({
      ...prev,
      visualizaciones: [...prev.visualizaciones, nuevaVisualizacion]
    }));
  };

  /**
   * Eliminar visualización por ID
   */
  const handleEliminarVisualizacion = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta visualización?')) {
      setReportData(prev => ({
        ...prev,
        visualizaciones: prev.visualizaciones.filter(v => v.id !== id)
      }));
    }
  };

  /**
   * Mover visualización hacia arriba
   */
  const handleMoverArriba = (index) => {
    if (index === 0) return;
    
    setReportData(prev => {
      const newVisuals = [...prev.visualizaciones];
      [newVisuals[index - 1], newVisuals[index]] = [newVisuals[index], newVisuals[index - 1]];
      return { ...prev, visualizaciones: newVisuals };
    });
  };

  /**
   * Mover visualización hacia abajo
   */
  const handleMoverAbajo = (index) => {
    if (index === reportData.visualizaciones.length - 1) return;
    
    setReportData(prev => {
      const newVisuals = [...prev.visualizaciones];
      [newVisuals[index], newVisuals[index + 1]] = [newVisuals[index + 1], newVisuals[index]];
      return { ...prev, visualizaciones: newVisuals };
    });
  };

  /**
   * Actualizar campo específico de una visualización
   */
  const handleCambioVisualizacion = (id, campo, valor) => {
    setReportData(prev => ({
      ...prev,
      visualizaciones: prev.visualizaciones.map(v =>
        v.id === id ? { ...v, [campo]: valor } : v
      )
    }));
  };

  /**
   * Manejar carga de imagen y convertir a Base64
   */
  const handleImagenChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB');
        return;
      }

      const reader = new FileReader();
      
      reader.onloadend = () => {
        handleCambioVisualizacion(id, 'imagen', reader.result);
      };

      reader.onerror = () => {
        alert('Error al leer el archivo');
      };

      reader.readAsDataURL(file);
    }
  };

  /**
   * Eliminar imagen
   */
  const handleEliminarImagen = (id) => {
    handleCambioVisualizacion(id, 'imagen', null);
  };

  /**
   * Toggle campo SQL en multiselect
   */
  const handleToggleCampo = (visualId, campo) => {
    setReportData(prev => ({
      ...prev,
      visualizaciones: prev.visualizaciones.map(v => {
        if (v.id === visualId) {
          const campos = v.camposUtilizados.includes(campo)
            ? v.camposUtilizados.filter(c => c !== campo)
            : [...v.camposUtilizados, campo];
          return { ...v, camposUtilizados: campos };
        }
        return v;
      })
    }));
  };

  // ===== NUEVAS FUNCIONES PARA IA =====

  /**
   * Abre el modal de análisis IA para una visualización específica
   */
  const abrirModalIA = (visual) => {
    setVisualSeleccionadoIA(visual);
    setModalIAVisible(true);
    setImagenSeleccionada(null);
    setResultadoIA(null);
    setErrorIA(null);
  };

  /**
   * Cierra el modal y limpia estados
   */
  const cerrarModalIA = () => {
    setModalIAVisible(false);
    setVisualSeleccionadoIA(null);
    setImagenSeleccionada(null);
    setResultadoIA(null);
    setErrorIA(null);
    setAnalizandoIA(false);
  };

  /**
   * Maneja la selección de imagen desde el input
   */
  const manejarSeleccionImagen = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
      if (!archivo.type.startsWith('image/')) {
        setErrorIA('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (archivo.size > 5 * 1024 * 1024) {
        setErrorIA('La imagen es demasiado grande. Máximo 5MB');
        return;
      }

      setImagenSeleccionada(archivo);
      setErrorIA(null);
    }
  };

  /**
   * Maneja el drag and drop de imágenes
   */
  const manejarDrop = (e) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    
    if (archivo && archivo.type.startsWith('image/')) {
      setImagenSeleccionada(archivo);
      setErrorIA(null);
    } else {
      setErrorIA('Por favor suelta un archivo de imagen válido');
    }
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Ejecuta el análisis de IA sobre la imagen seleccionada
   */
  const ejecutarAnalisisIA = async () => {
    if (!imagenSeleccionada) {
      setErrorIA('Por favor selecciona una imagen primero');
      return;
    }

    setAnalizandoIA(true);
    setErrorIA(null);
    setResultadoIA(null);

    try {
      const camposDisponibles = reportData.camposDetectados || [];
      const resultado = await analizarVisualizacionDeImagen(imagenSeleccionada, camposDisponibles);

      const validacion = validarRespuestaIA(resultado, 0.6);
      
      if (!validacion.valida) {
        console.warn('⚠️ Advertencia:', validacion.mensaje);
      }

      setResultadoIA(resultado);
      console.log('✅ Análisis completado:', resultado);

    } catch (error) {
      console.error('❌ Error al analizar imagen:', error);
      setErrorIA(`Error al analizar imagen: ${error.message}`);
    } finally {
      setAnalizandoIA(false);
    }
  };

  /**
   * Aplica los resultados del análisis IA a la visualización
   */
  const aplicarResultadosIA = () => {
    if (!resultadoIA || !visualSeleccionadoIA) return;

    const visualId = visualSeleccionadoIA.id;

    // Aplicar título
    if (resultadoIA.titulo) {
      handleCambioVisualizacion(visualId, 'titulo', resultadoIA.titulo);
    }

    // Aplicar tipo de visualización
    if (resultadoIA.tipo) {
      // Intentar hacer match con los tipos disponibles
      const tipoEncontrado = TIPOS_VISUAL.find(
        t => t.toLowerCase() === resultadoIA.tipo.toLowerCase()
      );
      handleCambioVisualizacion(visualId, 'tipo', tipoEncontrado || resultadoIA.tipo);
    }

    // Aplicar campos utilizados (con matching inteligente)
    if (resultadoIA.camposVisibles && Array.isArray(resultadoIA.camposVisibles)) {
      const camposDisponibles = reportData.camposDetectados?.map(c => c.nombre) || [];
      const camposMatcheados = [];

      resultadoIA.camposVisibles.forEach(campoIA => {
        // Buscar match exacto o parcial
        const match = camposDisponibles.find(
          campoReal => 
            campoReal.toLowerCase() === campoIA.toLowerCase() ||
            campoReal.toLowerCase().includes(campoIA.toLowerCase()) ||
            campoIA.toLowerCase().includes(campoReal.toLowerCase())
        );
        
        if (match) {
          camposMatcheados.push(match);
        }
      });

      handleCambioVisualizacion(visualId, 'camposUtilizados', camposMatcheados);
    }

    // Aplicar métricas calculadas
    if (resultadoIA.metricasCalculadas) {
      handleCambioVisualizacion(visualId, 'metricasCalculadas', resultadoIA.metricasCalculadas);
    }

    // Aplicar descripción
    if (resultadoIA.descripcion) {
      handleCambioVisualizacion(visualId, 'descripcion', resultadoIA.descripcion);
    }

    // Guardar la imagen analizada
    if (imagenSeleccionada) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleCambioVisualizacion(visualId, 'imagen', e.target.result);
      };
      reader.readAsDataURL(imagenSeleccionada);
    }

    cerrarModalIA();
    alert('✅ Información aplicada correctamente desde el análisis de IA');
  };

  // ===== RENDER =====

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📊 Visualizaciones del Reporte</h2>
        <p className={styles.descripcion}>
          Documenta cada gráfico, tabla o visual presente en tu reporte Power BI.
          <span className={styles.opcional}> (Sección opcional)</span>
        </p>
      </div>

      {/* Lista de visualizaciones */}
      {reportData.visualizaciones && reportData.visualizaciones.length > 0 ? (
        <div className={styles.listaVisualizaciones}>
          {reportData.visualizaciones.map((visual, index) => (
            <div key={visual.id} className={styles.visualCard}>
              
              {/* Header del card */}
              <div className={styles.cardHeader}>
                <span className={styles.badge}>
                  Visual #{index + 1}
                </span>
                <span className={styles.titulo}>
                  {visual.titulo || '(Sin título)'}
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
                    disabled={index === reportData.visualizaciones.length - 1}
                    className={styles.btnIcono}
                    title="Mover abajo"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarVisualizacion(visual.id)}
                    className={styles.btnEliminar}
                    title="Eliminar visualización"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Contenido del formulario */}
              <div className={styles.cardBody}>
                
                {/* NUEVO: Sección de IA */}
                <div className={styles.seccionIA}>
                  <h4 className={styles.seccionIATitulo}>🤖 Asistencia con IA</h4>
                  <p className={styles.seccionIADescripcion}>
                    Sube una imagen del visual y la IA lo documentará automáticamente
                  </p>
                  <button
                    type="button"
                    onClick={() => abrirModalIA(visual)}
                    className={styles.btnIA}
                  >
                    <span className={styles.btnIAIcono}>📷</span>
                    <span className={styles.btnIATexto}>Analizar con IA</span>
                  </button>
                </div>

                {/* Upload de imagen */}
                <div className={styles.formGroup}>
                  <label>Captura del visual</label>
                  <div className={styles.uploadArea}>
                    {visual.imagen ? (
                      <div className={styles.previewContainer}>
                        <img 
                          src={visual.imagen} 
                          alt="Preview" 
                          className={styles.preview}
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarImagen(visual.id)}
                          className={styles.btnEliminarImagen}
                        >
                          ✕ Eliminar imagen
                        </button>
                      </div>
                    ) : (
                      <label className={styles.uploadLabel}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImagenChange(visual.id, e)}
                          className={styles.inputFile}
                        />
                        <div className={styles.uploadPlaceholder}>
                          <span className={styles.uploadIcon}>📷</span>
                          <span>Haz clic para subir captura</span>
                          <span className={styles.uploadHint}>PNG, JPG o JPEG (máx. 5MB)</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Título */}
                <div className={styles.formGroup}>
                  <label htmlFor={`titulo-${visual.id}`}>
                    Título del visual <span className={styles.requerido}>*</span>
                  </label>
                  <input
                    type="text"
                    id={`titulo-${visual.id}`}
                    value={visual.titulo}
                    onChange={(e) => handleCambioVisualizacion(visual.id, 'titulo', e.target.value)}
                    placeholder="Ej: Tabla de materias por programa"
                    className={styles.input}
                  />
                </div>

                {/* Tipo de visual */}
                <div className={styles.formGroup}>
                  <label htmlFor={`tipo-${visual.id}`}>
                    Tipo de visualización <span className={styles.requerido}>*</span>
                  </label>
                  <select
                    id={`tipo-${visual.id}`}
                    value={visual.tipo}
                    onChange={(e) => handleCambioVisualizacion(visual.id, 'tipo', e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- Selecciona un tipo --</option>
                    {TIPOS_VISUAL.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                {/* Campos SQL utilizados (multiselect) */}
                <div className={styles.formGroup}>
                  <label>Campos SQL utilizados</label>
                  <div className={styles.multiselect}>
                    {reportData.camposDetectados && reportData.camposDetectados.length > 0 ? (
                      reportData.camposDetectados.map(campo => (
                        <label key={campo.nombre} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={visual.camposUtilizados.includes(campo.nombre)}
                            onChange={() => handleToggleCampo(visual.id, campo.nombre)}
                          />
                          <span>{campo.nombre}</span>
                        </label>
                      ))
                    ) : (
                      <p className={styles.noData}>
                        No hay campos detectados. Completa primero la Sección 2.
                      </p>
                    )}
                  </div>
                  <small className={styles.hint}>
                    Selecciona los campos que utiliza este visual
                  </small>
                </div>

                {/* Métricas calculadas */}
                <div className={styles.formGroup}>
                  <label htmlFor={`metricas-${visual.id}`}>Métricas calculadas</label>
                  <input
                    type="text"
                    id={`metricas-${visual.id}`}
                    value={visual.metricasCalculadas}
                    onChange={(e) => handleCambioVisualizacion(visual.id, 'metricasCalculadas', e.target.value)}
                    placeholder="Ej: Total Créditos = SUM(CREDITOS), Promedio = AVG(NOTA)"
                    className={styles.input}
                  />
                  <small className={styles.hint}>
                    Separa múltiples métricas con comas
                  </small>
                </div>

                {/* Descripción */}
                <div className={styles.formGroup}>
                  <label htmlFor={`desc-${visual.id}`}>Descripción</label>
                  <textarea
                    id={`desc-${visual.id}`}
                    value={visual.descripcion}
                    onChange={(e) => handleCambioVisualizacion(visual.id, 'descripcion', e.target.value)}
                    placeholder="Describe qué muestra este visual y su propósito..."
                    className={styles.textarea}
                    rows="3"
                  />
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>📊</span>
          <p>No hay visualizaciones agregadas</p>
          <p className={styles.emptyHint}>
            Haz clic en "Agregar visualización" para comenzar
          </p>
        </div>
      )}

      {/* Botón agregar */}
      <button
        type="button"
        onClick={handleAgregarVisualizacion}
        className={styles.btnAgregar}
      >
        + Agregar visualización
      </button>

      {/* Contador */}
      {reportData.visualizaciones && reportData.visualizaciones.length > 0 && (
        <div className={styles.contador}>
          <strong>{reportData.visualizaciones.length}</strong> 
          {reportData.visualizaciones.length === 1 ? ' visualización' : ' visualizaciones'} documentada(s)
        </div>
      )}

      {/* ===== MODAL DE IA ===== */}
      {modalIAVisible && (
        <div className={styles.modalOverlay} onClick={cerrarModalIA}>
          <div className={styles.modalContenido} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitulo}>
                🤖 Análisis de Visualización con IA
              </h3>
              <button 
                onClick={cerrarModalIA}
                className={styles.btnCerrarModal}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              
              {/* Paso 1: Seleccionar imagen */}
              <div className={styles.pasoModal}>
                <h4 className={styles.pasoTitulo}>
                  <span className={styles.pasoNumero}>1</span>
                  Selecciona una imagen de la visualización
                </h4>
                
                <div 
                  className={styles.dropZone}
                  onDrop={manejarDrop}
                  onDragOver={manejarDragOver}
                  onClick={() => inputImagenRef.current?.click()}
                >
                  {imagenSeleccionada ? (
                    <div className={styles.imagenSeleccionada}>
                      <img 
                        src={URL.createObjectURL(imagenSeleccionada)} 
                        alt="Imagen seleccionada"
                        className={styles.imagenSeleccionadaPreview}
                      />
                      <p className={styles.imagenNombre}>{imagenSeleccionada.name}</p>
                    </div>
                  ) : (
                    <div className={styles.dropZonePlaceholder}>
                      <div className={styles.dropZoneIcono}>📊</div>
                      <p className={styles.dropZoneTexto}>
                        Arrastra una imagen aquí
                      </p>
                      <p className={styles.dropZoneSubtexto}>
                        o haz clic para seleccionar
                      </p>
                    </div>
                  )}
                </div>

                <input
                  ref={inputImagenRef}
                  type="file"
                  accept="image/*"
                  onChange={manejarSeleccionImagen}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Paso 2: Analizar */}
              {imagenSeleccionada && !resultadoIA && (
                <div className={styles.pasoModal}>
                  <h4 className={styles.pasoTitulo}>
                    <span className={styles.pasoNumero}>2</span>
                    Analizar con IA
                  </h4>
                  
                  <button
                    onClick={ejecutarAnalisisIA}
                    disabled={analizandoIA}
                    className={styles.btnAnalizar}
                  >
                    {analizandoIA ? (
                      <>
                        <span className={styles.spinner}></span>
                        Analizando...
                      </>
                    ) : (
                      <>
                        🔍 Analizar Imagen
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Paso 3: Resultados */}
              {resultadoIA && (
                <div className={styles.pasoModal}>
                  <h4 className={styles.pasoTitulo}>
                    <span className={styles.pasoNumero}>3</span>
                    Resultados del análisis
                  </h4>
                  
                  <div className={styles.resultadosIA}>
                    <div className={styles.resultadoItem}>
                      <strong>Título:</strong> {resultadoIA.titulo || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Tipo:</strong> {resultadoIA.tipo || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Campos Visibles:</strong> {
                        resultadoIA.camposVisibles && resultadoIA.camposVisibles.length > 0
                          ? resultadoIA.camposVisibles.join(', ')
                          : 'No detectados'
                      }
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Métricas:</strong> {resultadoIA.metricasCalculadas || 'No detectadas'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Descripción:</strong> {resultadoIA.descripcion || 'No generada'}
                    </div>
                    {resultadoIA.confianza && (
                      <div className={styles.resultadoConfianza}>
                        <strong>Confianza:</strong> {(resultadoIA.confianza * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>

                  <div className={styles.modalAcciones}>
                    <button
                      onClick={aplicarResultadosIA}
                      className={styles.btnAplicar}
                    >
                      ✅ Aplicar Resultados
                    </button>
                    <button
                      onClick={ejecutarAnalisisIA}
                      className={styles.btnReintentar}
                    >
                      🔄 Reintentar
                    </button>
                  </div>
                </div>
              )}

              {/* Errores */}
              {errorIA && (
                <div className={styles.errorIA}>
                  ⚠️ {errorIA}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizaciones;