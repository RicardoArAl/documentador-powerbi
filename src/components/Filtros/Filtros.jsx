/**
 * =====================================================
 * COMPONENTE: FILTROS Y PARÁMETROS
 * Sección 3 - Con Análisis de IA Integrado
 * =====================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from './Filtros.module.css';
import { analizarFiltroDeImagen, validarRespuestaIA } from '../../utils/ai/analizarImagen';

const Filtros = ({ datos, onGuardar }) => {
  // ===== ESTADOS EXISTENTES =====
  const [filtros, setFiltros] = useState(datos.filtros || []);
  const [editandoId, setEditandoId] = useState(null);
  const [campoTemporal, setCampoTemporal] = useState('');
  
  // ===== NUEVOS ESTADOS PARA IA =====
  const [modalIAVisible, setModalIAVisible] = useState(false);
  const [filtroSeleccionadoIA, setFiltroSeleccionadoIA] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
  
  const inputImagenRef = useRef(null);

  // Sincronizar estado si los datos cambian desde fuera
  useEffect(() => {
    if (datos.filtros) {
      setFiltros(datos.filtros);
    }
  }, [datos.filtros]);

  // ===== CONSTANTES =====
  const tiposControl = [
    'Segmentación (Slicer) - Lista',
    'Segmentación (Slicer) - Menú desplegable',
    'Segmentación (Slicer) - Mosaico/Botones',
    'Segmentación (Slicer) - Entre (Fechas/Números)',
    'Filtro Panel Lateral',
    'Filtro URL'
  ];

  const columnasDisponibles = datos.camposDetectados?.map(campo => campo.nombre) || [];

  // ===== FUNCIONES EXISTENTES =====
  
  const guardarEnPadre = (nuevosFiltros) => {
    onGuardar({ filtros: nuevosFiltros });
  };

  /**
   * Agrega un nuevo filtro vacío y LO ABRE AUTOMÁTICAMENTE
   */
  const handleAgregarFiltro = () => {
    const nuevoId = Date.now();
    
    const nuevoFiltro = {
      id: nuevoId,
      nombre: '',
      campoSQL: '',
      camposRaw: [],
      tipoControl: '',
      valores: '',
      descripcion: '',
      imagenReferencia: null,
      imagenPreview: null
    };

    const nuevosFiltros = [...filtros, nuevoFiltro];
    setFiltros(nuevosFiltros);
    setEditandoId(nuevoId);
    guardarEnPadre(nuevosFiltros);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleAgregarCampo = (index) => {
    if (!campoTemporal) return;
    const nuevosFiltros = [...filtros];
    const filtro = nuevosFiltros[index];
    const camposActuales = filtro.camposRaw || (filtro.campoSQL ? [filtro.campoSQL] : []);

    if (!camposActuales.includes(campoTemporal)) {
      const nuevosCampos = [...camposActuales, campoTemporal];
      filtro.camposRaw = nuevosCampos;
      filtro.campoSQL = nuevosCampos.length > 1 
        ? nuevosCampos.join(" + ' - ' + ") 
        : nuevosCampos[0];

      setFiltros(nuevosFiltros);
      guardarEnPadre(nuevosFiltros);
    }
    setCampoTemporal('');
  };

  const handleEliminarCampo = (indexFiltro, campoAEliminar) => {
    const nuevosFiltros = [...filtros];
    const filtro = nuevosFiltros[indexFiltro];
    const camposActuales = filtro.camposRaw || (filtro.campoSQL ? [filtro.campoSQL] : []);
    const nuevosCampos = camposActuales.filter(c => c !== campoAEliminar);
    
    filtro.camposRaw = nuevosCampos;
    filtro.campoSQL = nuevosCampos.length > 0 
        ? nuevosCampos.join(" + ' - ' + ") 
        : '';

    setFiltros(nuevosFiltros);
    guardarEnPadre(nuevosFiltros);
  };

  const handleActualizarFiltro = (index, campo, valor) => {
    const nuevosFiltros = [...filtros];
    nuevosFiltros[index][campo] = valor;
    setFiltros(nuevosFiltros);
    guardarEnPadre(nuevosFiltros);
  };

  const handleCargarImagen = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nuevosFiltros = [...filtros];
        nuevosFiltros[index].imagenReferencia = file;
        nuevosFiltros[index].imagenPreview = reader.result;
        setFiltros(nuevosFiltros);
        guardarEnPadre(nuevosFiltros);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEliminarImagen = (index) => {
    const nuevosFiltros = [...filtros];
    nuevosFiltros[index].imagenReferencia = null;
    nuevosFiltros[index].imagenPreview = null;
    setFiltros(nuevosFiltros);
    guardarEnPadre(nuevosFiltros);
  };

  const handleEliminarFiltro = (index) => {
    const nuevosFiltros = filtros.filter((_, i) => i !== index);
    setFiltros(nuevosFiltros);
    if (editandoId === filtros[index].id) {
      setEditandoId(null);
    }
    guardarEnPadre(nuevosFiltros);
  };

  const toggleEdicion = (id) => {
    setEditandoId(editandoId === id ? null : id);
    setCampoTemporal('');
  };

  // ===== NUEVAS FUNCIONES PARA IA =====

  /**
   * Abre el modal de análisis IA para un filtro específico
   */
  const abrirModalIA = (filtro, index) => {
    setFiltroSeleccionadoIA({ filtro, index });
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
    setFiltroSeleccionadoIA(null);
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
      const camposDisponibles = datos.camposDetectados || [];
      const resultado = await analizarFiltroDeImagen(imagenSeleccionada, camposDisponibles);

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
   * Aplica los resultados del análisis IA al filtro
   */
  const aplicarResultadosIA = () => {
    if (!resultadoIA || !filtroSeleccionadoIA) return;

    const { index } = filtroSeleccionadoIA;

    // Aplicar cada campo detectado
    if (resultadoIA.nombre) {
      handleActualizarFiltro(index, 'nombre', resultadoIA.nombre);
    }

    if (resultadoIA.tipoControl) {
      handleActualizarFiltro(index, 'tipoControl', resultadoIA.tipoControl);
    }

    if (resultadoIA.valores) {
      handleActualizarFiltro(index, 'valores', resultadoIA.valores);
    }

    // Para campo SQL: intentar hacer match con campos disponibles
    if (resultadoIA.campoSQLSugerido) {
      const campoEncontrado = columnasDisponibles.find(
        col => col.toLowerCase().includes(resultadoIA.campoSQLSugerido.toLowerCase()) ||
               resultadoIA.campoSQLSugerido.toLowerCase().includes(col.toLowerCase())
      );
      
      if (campoEncontrado) {
        handleActualizarFiltro(index, 'campoSQL', campoEncontrado);
        handleActualizarFiltro(index, 'camposRaw', [campoEncontrado]);
      } else {
        // Si no hay match, dejar el sugerido como texto
        handleActualizarFiltro(index, 'campoSQL', resultadoIA.campoSQLSugerido);
      }
    }

    if (resultadoIA.descripcion) {
      handleActualizarFiltro(index, 'descripcion', resultadoIA.descripcion);
    }

    // Guardar también la imagen analizada como referencia
    if (imagenSeleccionada) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleActualizarFiltro(index, 'imagenReferencia', imagenSeleccionada);
        handleActualizarFiltro(index, 'imagenPreview', e.target.result);
      };
      reader.readAsDataURL(imagenSeleccionada);
    }

    cerrarModalIA();
    alert('✅ Información aplicada correctamente desde el análisis de IA');
  };

  // ===== RENDER =====
  
  return (
    <div className={styles.container}>
      <h2>🔍 Sección 3: Filtros y Parámetros</h2>

      <div className={styles.instruccion}>
        <strong>📌 Instrucciones:</strong> Documenta los filtros. Si un filtro usa dos campos (ej: Código + Nombre), agrégalos en orden y se concatenarán automáticamente.
      </div>

      {columnasDisponibles.length === 0 && (
        <div className={styles.advertencia}>
          ⚠️ No se detectaron columnas en la Sección 2. Completa la consulta SQL primero.
        </div>
      )}

      {filtros.length === 0 ? (
        <div className={styles.sinFiltros}>
          <p>📝 No has agregado ningún filtro todavía.</p>
          <p>Haz clic en "+ Agregar Filtro" para comenzar.</p>
        </div>
      ) : (
        <div className={styles.listaFiltros}>
          {filtros.map((filtro, index) => (
            <div key={filtro.id} className={styles.filtroCard}>
              
              {/* Header del filtro */}
              <div className={styles.filtroHeader}>
                <div className={styles.filtroTitulo}>
                  <span className={styles.numeroFiltro}>Filtro #{index + 1}</span>
                  <span className={styles.nombreFiltro}>
                    {filtro.nombre || '(Sin nombre)'}
                  </span>
                </div>
                <div className={styles.filtroAcciones}>
                  <button
                    onClick={() => toggleEdicion(filtro.id)}
                    className={styles.btnEditar}
                    title={editandoId === filtro.id ? 'Colapsar' : 'Editar'}
                  >
                    {editandoId === filtro.id ? '▲' : '✏️'}
                  </button>
                  <button
                    onClick={() => handleEliminarFiltro(index)}
                    className={styles.btnEliminar}
                    title="Eliminar filtro"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Contenido Expandible */}
              {editandoId === filtro.id && (
                <div className={styles.filtroContenido}>
                  
                  {/* NUEVO: Sección de IA */}
                  <div className={styles.seccionIA}>
                    <h4 className={styles.seccionIATitulo}>🤖 Asistencia con IA</h4>
                    <p className={styles.seccionIADescripcion}>
                      Sube una imagen del filtro y la IA lo documentará automáticamente
                    </p>
                    <button
                      type="button"
                      onClick={() => abrirModalIA(filtro, index)}
                      className={styles.btnIA}
                    >
                      <span className={styles.btnIAIcono}>📷</span>
                      <span className={styles.btnIATexto}>Analizar con IA</span>
                    </button>
                  </div>

                  {/* Nombre */}
                  <div className={styles.campo}>
                    <label>Nombre del filtro <span className={styles.requerido}>*</span></label>
                    <input
                      type="text"
                      value={filtro.nombre}
                      onChange={(e) => handleActualizarFiltro(index, 'nombre', e.target.value)}
                      placeholder="Ej: Sede, Año, Programa"
                      className={styles.input}
                    />
                  </div>

                  {/* CAMPO SQL (LÓGICA MULTISELECCIÓN) */}
                  <div className={styles.campo}>
                    <label>Campo(s) SQL asociado(s) <span className={styles.requerido}>*</span></label>
                    
                    <div className={styles.selectorWrapper}>
                      <select
                        value={campoTemporal}
                        onChange={(e) => setCampoTemporal(e.target.value)}
                        className={styles.select}
                        style={{ flex: 1 }}
                      >
                        <option value="">-- Selecciona campo para agregar --</option>
                        {columnasDisponibles.map((col, i) => (
                          <option key={i} value={col}>{col}</option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => handleAgregarCampo(index)}
                        className={styles.btnAgregarCampo}
                        disabled={!campoTemporal}
                      >
                        + Agregar
                      </button>
                    </div>

                    <div className={styles.chipsContainer}>
                      {(!filtro.camposRaw || filtro.camposRaw.length === 0) && !filtro.campoSQL && (
                        <span className={styles.placeholderChips}>No hay campos seleccionados</span>
                      )}
                      
                      {(filtro.camposRaw || (filtro.campoSQL ? [filtro.campoSQL] : [])).map((campo, idx, arr) => (
                        <div key={idx} className={styles.chipItem}>
                          <span className={styles.chipText}>{campo}</span>
                          <button 
                            className={styles.chipDelete}
                            onClick={() => handleEliminarCampo(index, campo)}
                            title="Quitar campo"
                          >✕</button>
                          {idx < arr.length - 1 && <span className={styles.chipConnector}>+</span>}
                        </div>
                      ))}
                    </div>
                    
                    <div className={styles.sqlPreview}>
                      <small>Resultado concatenado: </small> 
                      <code>{filtro.campoSQL}</code>
                    </div>
                  </div>

                  {/* Tipo de control */}
                  <div className={styles.campo}>
                    <label>Tipo de control <span className={styles.requerido}>*</span></label>
                    <select
                      value={filtro.tipoControl}
                      onChange={(e) => handleActualizarFiltro(index, 'tipoControl', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- Selecciona un tipo --</option>
                      {tiposControl.map((tipo, i) => (
                        <option key={i} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Valores posibles */}
                  <div className={styles.campo}>
                    <label>Valores posibles</label>
                    <input
                      type="text"
                      value={filtro.valores}
                      onChange={(e) => handleActualizarFiltro(index, 'valores', e.target.value)}
                      placeholder="Ej: 2024, 2025, 2026"
                      className={styles.input}
                    />
                    <small className={styles.ayuda}>Separa múltiples valores con comas</small>
                  </div>

                  {/* Descripción */}
                  <div className={styles.campo}>
                    <label>Descripción</label>
                    <textarea
                      value={filtro.descripcion}
                      onChange={(e) => handleActualizarFiltro(index, 'descripcion', e.target.value)}
                      className={styles.textarea}
                      rows={3}
                      placeholder="Describe la función del filtro..."
                    />
                  </div>

                  {/* Imagen */}
                  <div className={styles.campo}>
                    <label>Imagen de referencia (opcional)</label>
                    {filtro.imagenPreview ? (
                      <div className={styles.imagenPreview}>
                        <img src={filtro.imagenPreview} alt="Preview" />
                        <button onClick={() => handleEliminarImagen(index)} className={styles.btnEliminarImagen}>
                          ✕ Eliminar imagen
                        </button>
                      </div>
                    ) : (
                      <div className={styles.uploadArea}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCargarImagen(index, e)}
                          className={styles.inputFile}
                          id={`img-${filtro.id}`}
                        />
                        <label htmlFor={`img-${filtro.id}`} className={styles.labelFile}>
                          📸 Subir Imagen
                        </label>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Resumen Compacto */}
              {editandoId !== filtro.id && (
                <div className={styles.filtroResumen}>
                  <div className={styles.resumenItem}>
                    <strong>Campo:</strong> {filtro.campoSQL || '(Pendiente)'}
                  </div>
                  <div className={styles.resumenItem}>
                    <strong>Tipo:</strong> {filtro.tipoControl || '-'}
                  </div>
                  {filtro.imagenPreview && (
                    <div className={styles.resumenItem}>
                      <span className={styles.badge}>📸 Con imagen</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Botón Agregar Filtro */}
      <button onClick={handleAgregarFiltro} className={styles.btnAgregar}>
        ➕ Agregar Filtro
      </button>

      {/* Resumen final */}
      {filtros.length > 0 && (
        <div className={styles.resumenFinal}>
          <strong>📊 Resumen:</strong> {filtros.length} filtro(s) documentado(s)
        </div>
      )}

      {/* ===== MODAL DE IA ===== */}
      {modalIAVisible && (
        <div className={styles.modalOverlay} onClick={cerrarModalIA}>
          <div className={styles.modalContenido} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitulo}>
                🤖 Análisis de Filtro con IA
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
                  Selecciona una imagen del filtro
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
                      <div className={styles.dropZoneIcono}>📷</div>
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
                      <strong>Nombre:</strong> {resultadoIA.nombre || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Tipo de Control:</strong> {resultadoIA.tipoControl || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Valores:</strong> {resultadoIA.valores || 'No detectados'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Campo SQL Sugerido:</strong> {resultadoIA.campoSQLSugerido || 'No sugerido'}
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

export default Filtros;