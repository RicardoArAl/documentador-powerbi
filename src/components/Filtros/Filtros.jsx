/**
 * =====================================================
 * COMPONENTE: FILTROS Y PARÁMETROS v2.1
 * Sección 3 - Con Análisis de IA Integrado
 * ⭐ NUEVO: Soporte Ctrl+V para pegar capturas
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
  const [mostrarModalIA, setMostrarModalIA] = useState(false);
  const [filtroSeleccionadoIA, setFiltroSeleccionadoIA] = useState(null);
  const [imagenAnalisis, setImagenAnalisis] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorAnalisis, setErrorAnalisis] = useState(null);
  
  const inputImagenRef = useRef(null);

  // Sincronizar estado si los datos cambian desde fuera
  useEffect(() => {
    if (datos.filtros) {
      setFiltros(datos.filtros);
    }
  }, [datos.filtros]);

  // ⭐ NUEVO: EFECTO PARA DETECTAR CTRL+V
  useEffect(() => {
    if (!mostrarModalIA) return;

    const manejarPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const blob = items[i].getAsFile();
          const nombreArchivo = `captura-pegada-${Date.now()}.png`;
          const archivo = new File([blob], nombreArchivo, { type: blob.type });
          
          setImagenAnalisis(archivo);
          setErrorAnalisis(null);
          
          console.log('✅ Imagen pegada desde portapapeles');
          break;
        }
      }
    };

    document.addEventListener('paste', manejarPaste);
    
    return () => {
      document.removeEventListener('paste', manejarPaste);
    };
  }, [mostrarModalIA]);

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

  const abrirModalIA = (filtro, index) => {
    setFiltroSeleccionadoIA({ filtro, index });
    setMostrarModalIA(true);
    setImagenAnalisis(null);
    setResultadoIA(null);
    setErrorAnalisis(null);
  };

  const cerrarModalIA = () => {
    setMostrarModalIA(false);
    setFiltroSeleccionadoIA(null);
    setImagenAnalisis(null);
    setResultadoIA(null);
    setErrorAnalisis(null);
    setAnalizandoIA(false);
  };

  const manejarSeleccionImagen = (evento) => {
    const archivo = evento.target.files[0];
    if (archivo) {
      if (!archivo.type.startsWith('image/')) {
        setErrorAnalisis('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (archivo.size > 5 * 1024 * 1024) {
        setErrorAnalisis('La imagen es demasiado grande. Máximo 5MB');
        return;
      }

      setImagenAnalisis(archivo);
      setErrorAnalisis(null);
    }
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    
    if (archivo && archivo.type.startsWith('image/')) {
      setImagenAnalisis(archivo);
      setErrorAnalisis(null);
    } else {
      setErrorAnalisis('Por favor suelta un archivo de imagen válido');
    }
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
  };

  const ejecutarAnalisisIA = async () => {
    if (!imagenAnalisis) {
      setErrorAnalisis('Por favor selecciona una imagen primero');
      return;
    }

    setAnalizandoIA(true);
    setErrorAnalisis(null);
    setResultadoIA(null);

    try {
      const camposDisponibles = datos.camposDetectados || [];
      const resultado = await analizarFiltroDeImagen(imagenAnalisis, camposDisponibles);

      const validacion = validarRespuestaIA(resultado, 0.6);
      
      if (!validacion.valida) {
        console.warn('⚠️ Advertencia:', validacion.mensaje);
      }

      setResultadoIA(resultado);
      console.log('✅ Análisis completado:', resultado);

    } catch (error) {
      console.error('❌ Error al analizar imagen:', error);
      setErrorAnalisis(`Error al analizar imagen: ${error.message}`);
    } finally {
      setAnalizandoIA(false);
    }
  };

  const aplicarResultadosIA = () => {
  if (!resultadoIA || !filtroSeleccionadoIA) return;

  const { index } = filtroSeleccionadoIA;
  let cambiosAplicados = [];
  let advertencias = [];

  // 1. APLICAR NOMBRE
  if (resultadoIA.nombre && resultadoIA.nombre.trim()) {
    handleActualizarFiltro(index, 'nombre', resultadoIA.nombre);
    cambiosAplicados.push(`✅ Nombre: "${resultadoIA.nombre}"`);
  }

  // 2. APLICAR TIPO DE CONTROL
  if (resultadoIA.tipoControl) {
    // Buscar coincidencia exacta o similar en los tipos disponibles
    const tiposControl = [
      'Segmentación (Slicer) - Lista',
      'Segmentación (Slicer) - Menú desplegable',
      'Segmentación (Slicer) - Mosaico/Botones',
      'Segmentación (Slicer) - Entre (Fechas/Números)',
      'Filtro Panel Lateral',
      'Filtro URL'
    ];
    
    const tipoEncontrado = tiposControl.find(t => 
      t.toLowerCase().includes(resultadoIA.tipoControl.toLowerCase()) ||
      resultadoIA.tipoControl.toLowerCase().includes(t.toLowerCase())
    );
    
    if (tipoEncontrado) {
      handleActualizarFiltro(index, 'tipoControl', tipoEncontrado);
      cambiosAplicados.push(`✅ Tipo: "${tipoEncontrado}"`);
    } else {
      handleActualizarFiltro(index, 'tipoControl', resultadoIA.tipoControl);
      advertencias.push(`⚠️ Tipo "${resultadoIA.tipoControl}" no coincide exactamente con los predefinidos`);
    }
  }

  // 3. APLICAR VALORES
  if (resultadoIA.valores && resultadoIA.valores.trim()) {
    handleActualizarFiltro(index, 'valores', resultadoIA.valores);
    cambiosAplicados.push(`✅ Valores: "${resultadoIA.valores.substring(0, 50)}${resultadoIA.valores.length > 50 ? '...' : ''}"`);
  }

  // 4. APLICAR CAMPO SQL - LÓGICA MEJORADA
  if (resultadoIA.campoSQL) {
    const camposSQLRaw = resultadoIA.campoSQL;
    
    // Detectar si hay concatenación (operador +)
    if (camposSQLRaw.includes(' + ')) {
      // Caso: Múltiples campos concatenados
      const camposSeparados = camposSQLRaw
        .split('+')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      // Buscar coincidencias en campos disponibles
      const camposEncontrados = [];
      const camposNoEncontrados = [];
      
      camposSeparados.forEach(campoIA => {
        const campoMatch = columnasDisponibles.find(colDisp => 
          colDisp.toLowerCase() === campoIA.toLowerCase() ||
          colDisp.toLowerCase().includes(campoIA.toLowerCase()) ||
          campoIA.toLowerCase().includes(colDisp.toLowerCase())
        );
        
        if (campoMatch) {
          camposEncontrados.push(campoMatch);
        } else {
          camposNoEncontrados.push(campoIA);
        }
      });
      
      // Aplicar campos encontrados
      if (camposEncontrados.length > 0) {
        handleActualizarFiltro(index, 'camposRaw', camposEncontrados);
        handleActualizarFiltro(index, 'campoSQL', camposEncontrados.join(" + ' - ' + "));
        cambiosAplicados.push(`✅ Campos SQL: ${camposEncontrados.join(' + ')}`);
      }
      
      // Advertir sobre campos no encontrados
      if (camposNoEncontrados.length > 0) {
        advertencias.push(`⚠️ Campos sugeridos por IA pero no encontrados en SQL: ${camposNoEncontrados.join(', ')}`);
      }
      
    } else {
      // Caso: Un solo campo
      const campoMatch = columnasDisponibles.find(colDisp => 
        colDisp.toLowerCase() === camposSQLRaw.toLowerCase() ||
        colDisp.toLowerCase().includes(camposSQLRaw.toLowerCase()) ||
        camposSQLRaw.toLowerCase().includes(colDisp.toLowerCase())
      );
      
      if (campoMatch) {
        // Coincidencia encontrada
        handleActualizarFiltro(index, 'campoSQL', campoMatch);
        handleActualizarFiltro(index, 'camposRaw', [campoMatch]);
        cambiosAplicados.push(`✅ Campo SQL: "${campoMatch}"`);
      } else {
        // No se encontró coincidencia
        if (camposSQLRaw.toLowerCase().includes('campo no disponible') || 
            camposSQLRaw.toLowerCase().includes('no identificado')) {
          advertencias.push(`⚠️ IA no pudo identificar el campo SQL. Revisa manualmente.`);
        } else {
          handleActualizarFiltro(index, 'campoSQL', camposSQLRaw);
          advertencias.push(`⚠️ Campo sugerido "${camposSQLRaw}" no coincide exactamente con campos disponibles`);
        }
      }
    }
  }

  // 5. APLICAR DESCRIPCIÓN
  if (resultadoIA.descripcion && resultadoIA.descripcion.trim()) {
    handleActualizarFiltro(index, 'descripcion', resultadoIA.descripcion);
    cambiosAplicados.push(`✅ Descripción aplicada`);
  }

  // 6. APLICAR IMAGEN
  if (imagenAnalisis) {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleActualizarFiltro(index, 'imagenReferencia', imagenAnalisis);
      handleActualizarFiltro(index, 'imagenPreview', e.target.result);
    };
    reader.readAsDataURL(imagenAnalisis);
    cambiosAplicados.push(`✅ Imagen de referencia guardada`);
  }

  // 7. MOSTRAR RESUMEN DE CAMBIOS
  cerrarModalIA();
  
  let mensajeResumen = `🎉 Análisis de IA completado:\n\n`;
  
  if (cambiosAplicados.length > 0) {
    mensajeResumen += `CAMBIOS APLICADOS:\n${cambiosAplicados.join('\n')}\n`;
  }
  
  if (advertencias.length > 0) {
    mensajeResumen += `\n⚠️ ADVERTENCIAS:\n${advertencias.join('\n')}\n`;
  }
  
  if (resultadoIA.razonamiento) {
    mensajeResumen += `\n💡 RAZONAMIENTO DE LA IA:\n${resultadoIA.razonamiento}`;
  }
  
  if (resultadoIA.confianza) {
    const confianzaPorcentaje = (resultadoIA.confianza * 100).toFixed(0);
    mensajeResumen += `\n\n📊 Nivel de confianza: ${confianzaPorcentaje}%`;
    
    if (resultadoIA.confianza < 0.7) {
      mensajeResumen += `\n⚠️ Confianza baja - Revisa cuidadosamente los resultados`;
    }
  }
  
  alert(mensajeResumen);
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
      {mostrarModalIA && (
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
                  {imagenAnalisis ? (
                    <div className={styles.imagenSeleccionada}>
                      <img 
                        src={URL.createObjectURL(imagenAnalisis)} 
                        alt="Imagen seleccionada"
                        className={styles.imagenSeleccionadaPreview}
                      />
                      <p className={styles.imagenNombre}>{imagenAnalisis.name}</p>
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
                      
                      {/* ⭐ NUEVO: Hint de Ctrl+V */}
                      <div className={styles.pasteHint}>
                        <span className={styles.pasteIcon}>⌨️</span>
                        <span>
                          O presiona <kbd>Ctrl</kbd> + <kbd>V</kbd> para pegar captura
                        </span>
                      </div>
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
              {imagenAnalisis && !resultadoIA && (
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
                  
                  {/* Nivel de confianza destacado */}
                  {resultadoIA.confianza && (
                    <div className={`${styles.confianzaBadge} ${
                      resultadoIA.confianza >= 0.8 ? styles.confianzaAlta :
                      resultadoIA.confianza >= 0.6 ? styles.confianzaMedia :
                      styles.confianzaBaja
                    }`}>
                      📊 Confianza: {(resultadoIA.confianza * 100).toFixed(0)}%
                    </div>
                  )}
                  
                  <div className={styles.resultadosIA}>
                    <div className={styles.resultadoItem}>
                      <strong>Nombre del Filtro:</strong> 
                      <span className={resultadoIA.nombre ? styles.valorDetectado : styles.valorNoDetectado}>
                        {resultadoIA.nombre || 'No detectado'}
                      </span>
                    </div>
                    
                    <div className={styles.resultadoItem}>
                      <strong>Tipo de Control:</strong> 
                      <span className={resultadoIA.tipoControl ? styles.valorDetectado : styles.valorNoDetectado}>
                        {resultadoIA.tipoControl || 'No detectado'}
                      </span>
                    </div>
                    
                    <div className={styles.resultadoItem}>
                      <strong>Valores Visibles:</strong> 
                      <span className={resultadoIA.valores ? styles.valorDetectado : styles.valorNoDetectado}>
                        {resultadoIA.valores || 'No detectados'}
                      </span>
                    </div>
                    
                    {/* Campo SQL con indicador de matching */}
                    <div className={styles.resultadoItem}>
                      <strong>Campo(s) SQL Sugerido(s):</strong>
                      {resultadoIA.campoSQL ? (
                        <div className={styles.campoSQLContainer}>
                          <code className={styles.campoSQLCode}>
                            {resultadoIA.campoSQL}
                          </code>
                          {columnasDisponibles.length > 0 && (
                            <div className={styles.matchingStatus}>
                              {(() => {
                                // Verificar si hay matching
                                const campos = resultadoIA.campoSQL.includes(' + ') 
                                  ? resultadoIA.campoSQL.split(' + ').map(c => c.trim())
                                  : [resultadoIA.campoSQL];
                                
                                const encontrados = campos.filter(c => 
                                  columnasDisponibles.some(d => 
                                    d.toLowerCase() === c.toLowerCase() ||
                                    d.toLowerCase().includes(c.toLowerCase()) ||
                                    c.toLowerCase().includes(d.toLowerCase())
                                  )
                                );
                                
                                if (encontrados.length === campos.length) {
                                  return <span className={styles.matchOk}>✅ Coincidencia encontrada</span>;
                                } else if (encontrados.length > 0) {
                                  return <span className={styles.matchParcial}>⚠️ Coincidencia parcial ({encontrados.length}/{campos.length})</span>;
                                } else {
                                  return <span className={styles.matchNo}>❌ No coincide con campos SQL disponibles</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={styles.valorNoDetectado}>No sugerido</span>
                      )}
                    </div>
                    
                    <div className={styles.resultadoItem}>
                      <strong>Descripción:</strong> 
                      <p className={resultadoIA.descripcion ? styles.valorDetectado : styles.valorNoDetectado}>
                        {resultadoIA.descripcion || 'No generada'}
                      </p>
                    </div>
                    
                    {/* Razonamiento de la IA */}
                    {resultadoIA.razonamiento && (
                      <div className={styles.razonamientoIA}>
                        <strong>💡 Razonamiento de la IA:</strong>
                        <p>{resultadoIA.razonamiento}</p>
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
                      🔄 Reintentar Análisis
                    </button>
                  </div>
                </div>
              )}

              {/* Errores */}
              {errorAnalisis && (
                <div className={styles.errorIA}>
                  ⚠️ {errorAnalisis}
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