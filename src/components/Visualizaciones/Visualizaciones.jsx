/**
 * =====================================================
 * COMPONENTE: VISUALIZACIONES v2.1
 * Sección 4 - Con Análisis de IA Integrado
 * ⭐ NUEVO: Soporte Ctrl+V para pegar capturas
 * =====================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './Visualizaciones.module.css';
import { analizarVisualizacionDeImagen, validarRespuestaIA } from '../../utils/ai/analizarImagen';

const Visualizaciones = ({ reportData, setReportData }) => {
  
  // ===== NUEVOS ESTADOS PARA IA =====
  const [mostrarModalAsistencia, setMostrarModalAsistencia] = useState(false);
  const [visualSeleccionadoIA, setVisualSeleccionadoIA] = useState(null);
  const [imagenIA, setImagenIA] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
  
  const inputImagenRef = useRef(null);

  // ⭐ NUEVO: EFECTO PARA DETECTAR CTRL+V
  useEffect(() => {
    if (!mostrarModalAsistencia) return;

    const manejarPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const blob = items[i].getAsFile();
          const nombreArchivo = `captura-pegada-${Date.now()}.png`;
          const archivo = new File([blob], nombreArchivo, { type: blob.type });
          
          setImagenIA(archivo);
          setErrorIA(null);
          
          console.log('✅ Imagen pegada desde portapapeles');
          break;
        }
      }
    };

    document.addEventListener('paste', manejarPaste);
    
    return () => {
      document.removeEventListener('paste', manejarPaste);
    };
  }, [mostrarModalAsistencia]);

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

  const handleEliminarVisualizacion = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta visualización?')) {
      setReportData(prev => ({
        ...prev,
        visualizaciones: prev.visualizaciones.filter(v => v.id !== id)
      }));
    }
  };

  const handleMoverArriba = (index) => {
    if (index === 0) return;
    
    setReportData(prev => {
      const newVisuals = [...prev.visualizaciones];
      [newVisuals[index - 1], newVisuals[index]] = [newVisuals[index], newVisuals[index - 1]];
      return { ...prev, visualizaciones: newVisuals };
    });
  };

  const handleMoverAbajo = (index) => {
    if (index === reportData.visualizaciones.length - 1) return;
    
    setReportData(prev => {
      const newVisuals = [...prev.visualizaciones];
      [newVisuals[index], newVisuals[index + 1]] = [newVisuals[index + 1], newVisuals[index]];
      return { ...prev, visualizaciones: newVisuals };
    });
  };

  const handleCambioVisualizacion = (id, campo, valor) => {
    setReportData(prev => ({
      ...prev,
      visualizaciones: prev.visualizaciones.map(v =>
        v.id === id ? { ...v, [campo]: valor } : v
      )
    }));
  };

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

  const handleEliminarImagen = (id) => {
    handleCambioVisualizacion(id, 'imagen', null);
  };

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

  const abrirModalIA = (visual) => {
    setVisualSeleccionadoIA(visual);
    setMostrarModalAsistencia(true);
    setImagenIA(null);
    setResultadoIA(null);
    setErrorIA(null);
  };

  const cerrarModalIA = () => {
    setMostrarModalAsistencia(false);
    setVisualSeleccionadoIA(null);
    setImagenIA(null);
    setResultadoIA(null);
    setErrorIA(null);
    setAnalizandoIA(false);
  };

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

      setImagenIA(archivo);
      setErrorIA(null);
    }
  };

  const manejarDrop = (e) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    
    if (archivo && archivo.type.startsWith('image/')) {
      setImagenIA(archivo);
      setErrorIA(null);
    } else {
      setErrorIA('Por favor suelta un archivo de imagen válido');
    }
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
  };

  const ejecutarAnalisisIA = async () => {
    if (!imagenIA) {
      setErrorIA('Por favor selecciona una imagen primero');
      return;
    }

    setAnalizandoIA(true);
    setErrorIA(null);
    setResultadoIA(null);

    try {
      const camposDisponibles = reportData.camposDetectados || [];
      const resultado = await analizarVisualizacionDeImagen(imagenIA, camposDisponibles);

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

  const aplicarResultadosIA = () => {
  if (!resultadoIA || !visualSeleccionadoIA) return;

  const visualId = visualSeleccionadoIA.id;
  let cambiosAplicados = [];
  let advertencias = [];
  let sugerencias = [];

  // 1. APLICAR TÍTULO
  if (resultadoIA.titulo && resultadoIA.titulo.trim()) {
    handleCambioVisualizacion(visualId, 'titulo', resultadoIA.titulo);
    cambiosAplicados.push(`✅ Título: "${resultadoIA.titulo}"`);
  } else {
    advertencias.push('⚠️ No se detectó título en la imagen');
  }

  // 2. APLICAR TIPO DE VISUAL - MATCHING INTELIGENTE
  if (resultadoIA.tipo) {
    const tiposSoportados = [
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
    
    // Matching flexible de tipo
    let tipoEncontrado = tiposSoportados.find(t => 
      t.toLowerCase() === resultadoIA.tipo.toLowerCase()
    );
    
    // Si no hay match exacto, buscar parcial
    if (!tipoEncontrado) {
      tipoEncontrado = tiposSoportados.find(t => 
        t.toLowerCase().includes(resultadoIA.tipo.toLowerCase()) ||
        resultadoIA.tipo.toLowerCase().includes(t.toLowerCase())
      );
    }
    
    // Mapeo de nombres alternativos comunes
    if (!tipoEncontrado) {
      const mapeoAlternativo = {
        'bar': 'Gráfico de Barras Verticales',
        'column': 'Gráfico de Barras Verticales',
        'line': 'Gráfico de Líneas',
        'pie': 'Gráfico Circular (Pie)',
        'donut': 'Gráfico de Anillo (Donut)',
        'scatter': 'Gráfico de Dispersión',
        'gauge': 'Medidor (Gauge)',
        'kpi': 'KPI Card',
        'card': 'KPI Card',
        'funnel': 'Embudo (Funnel)',
        'waterfall': 'Cascada (Waterfall)',
        'matrix': 'Matriz',
        'table': 'Tabla'
      };
      
      const tipoNormalizado = resultadoIA.tipo.toLowerCase();
      for (const [clave, valor] of Object.entries(mapeoAlternativo)) {
        if (tipoNormalizado.includes(clave)) {
          tipoEncontrado = valor;
          break;
        }
      }
    }
    
    if (tipoEncontrado) {
      handleCambioVisualizacion(visualId, 'tipo', tipoEncontrado);
      cambiosAplicados.push(`✅ Tipo: "${tipoEncontrado}"`);
    } else {
      handleCambioVisualizacion(visualId, 'tipo', 'Otro');
      advertencias.push(`⚠️ Tipo "${resultadoIA.tipo}" no coincide exactamente. Se marcó como "Otro"`);
      sugerencias.push(`💡 Revisa y corrige manualmente el tipo de visual`);
    }
  }

  // 3. APLICAR CAMPOS VISIBLES - MATCHING INTELIGENTE MÚLTIPLE
  if (resultadoIA.camposVisibles && Array.isArray(resultadoIA.camposVisibles) && resultadoIA.camposVisibles.length > 0) {
    const camposDisponibles = reportData.camposDetectados?.map(c => c.nombre) || [];
    const camposMatcheados = [];
    const camposNoMatcheados = [];

    resultadoIA.camposVisibles.forEach(campoIA => {
      // Estrategia 1: Match exacto (ignorando case)
      let match = camposDisponibles.find(
        campoReal => campoReal.toLowerCase() === campoIA.toLowerCase()
      );
      
      // Estrategia 2: Match parcial (includes)
      if (!match) {
        match = camposDisponibles.find(
          campoReal => 
            campoReal.toLowerCase().includes(campoIA.toLowerCase()) ||
            campoIA.toLowerCase().includes(campoReal.toLowerCase())
        );
      }
      
      // Estrategia 3: Match semántico
      if (!match) {
        // Buscar por palabras clave
        const palabrasClaveIA = campoIA.toLowerCase().split(/[_\s-]+/);
        match = camposDisponibles.find(campoReal => {
          const palabrasClaveReal = campoReal.toLowerCase().split(/[_\s-]+/);
          return palabrasClaveIA.some(p => palabrasClaveReal.includes(p));
        });
      }
      
      if (match) {
        camposMatcheados.push(match);
      } else {
        camposNoMatcheados.push(campoIA);
      }
    });

    if (camposMatcheados.length > 0) {
      handleCambioVisualizacion(visualId, 'camposUtilizados', camposMatcheados);
      cambiosAplicados.push(`✅ Campos SQL: ${camposMatcheados.length} campo(s) identificado(s)`);
      cambiosAplicados.push(`   → ${camposMatcheados.join(', ')}`);
    }

    if (camposNoMatcheados.length > 0) {
      advertencias.push(`⚠️ ${camposNoMatcheados.length} campo(s) sugerido(s) por IA pero no encontrado(s) en SQL:`);
      advertencias.push(`   → ${camposNoMatcheados.join(', ')}`);
      sugerencias.push(`💡 Estos campos podrían ser: (1) calculados en Power BI, (2) nombres diferentes en SQL, (3) de otras tablas`);
    }

    // Información adicional de matching
    if (camposMatcheados.length > 0 && camposNoMatcheados.length > 0) {
      const tasaMatch = ((camposMatcheados.length / resultadoIA.camposVisibles.length) * 100).toFixed(0);
      sugerencias.push(`📊 Tasa de matching: ${tasaMatch}% (${camposMatcheados.length}/${resultadoIA.camposVisibles.length})`);
    }
  } else if (reportData.camposDetectados && reportData.camposDetectados.length > 0) {
    advertencias.push('⚠️ IA no detectó campos específicos en la imagen');
  }

  // 4. APLICAR MÉTRICAS CALCULADAS
  if (resultadoIA.metricasCalculadas && resultadoIA.metricasCalculadas.trim()) {
    handleCambioVisualizacion(visualId, 'metricasCalculadas', resultadoIA.metricasCalculadas);
    cambiosAplicados.push(`✅ Métricas: "${resultadoIA.metricasCalculadas.substring(0, 60)}${resultadoIA.metricasCalculadas.length > 60 ? '...' : ''}"`);
    
    // Validar si las métricas mencionan campos que existen
    if (reportData.camposDetectados && reportData.camposDetectados.length > 0) {
      const camposEnMetricas = resultadoIA.metricasCalculadas.match(/[A-Z_]+[A-Z0-9_]*/g) || [];
      const camposReales = reportData.camposDetectados.map(c => c.nombre);
      const camposMetricasValidos = camposEnMetricas.filter(c => camposReales.includes(c));
      
      if (camposMetricasValidos.length > 0) {
        sugerencias.push(`✅ Las métricas referencian campos SQL válidos: ${camposMetricasValidos.join(', ')}`);
      }
    }
  }

  // 5. APLICAR DESCRIPCIÓN
  if (resultadoIA.descripcion && resultadoIA.descripcion.trim()) {
    handleCambioVisualizacion(visualId, 'descripcion', resultadoIA.descripcion);
    cambiosAplicados.push(`✅ Descripción funcional generada (${resultadoIA.descripcion.length} caracteres)`);
  }

  // 6. APLICAR IMAGEN
  if (imagenIA) {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleCambioVisualizacion(visualId, 'imagen', e.target.result);
    };
    reader.readAsDataURL(imagenIA);
    cambiosAplicados.push(`✅ Imagen del visual guardada`);
  }

  // 7. INFORMACIÓN ADICIONAL DE DETALLES TÉCNICOS
  if (resultadoIA.detallesCampos) {
    const detalles = resultadoIA.detallesCampos;
    const infoTecnica = [];
    
    if (detalles.ejeX) infoTecnica.push(`Eje X: ${detalles.ejeX}`);
    if (detalles.ejeY) infoTecnica.push(`Eje Y: ${detalles.ejeY}`);
    if (detalles.leyenda) infoTecnica.push(`Leyenda: ${detalles.leyenda}`);
    if (detalles.columnas && detalles.columnas.length > 0) {
      infoTecnica.push(`Columnas: ${detalles.columnas.length} detectadas`);
    }
    
    if (infoTecnica.length > 0) {
      sugerencias.push(`🔧 Detalles técnicos detectados: ${infoTecnica.join(' | ')}`);
    }
  }

  // 8. MOSTRAR RESUMEN COMPLETO
  cerrarModalIA();
  
  let mensajeResumen = `🎉 ANÁLISIS DE VISUALIZACIÓN COMPLETADO\n\n`;
  
  // Sección de cambios aplicados
  if (cambiosAplicados.length > 0) {
    mensajeResumen += `✅ CAMBIOS APLICADOS:\n`;
    cambiosAplicados.forEach(cambio => {
      mensajeResumen += `${cambio}\n`;
    });
  }
  
  // Sección de advertencias
  if (advertencias.length > 0) {
    mensajeResumen += `\n⚠️ ADVERTENCIAS:\n`;
    advertencias.forEach(adv => {
      mensajeResumen += `${adv}\n`;
    });
  }
  
  // Sección de sugerencias
  if (sugerencias.length > 0) {
    mensajeResumen += `\n💡 SUGERENCIAS:\n`;
    sugerencias.forEach(sug => {
      mensajeResumen += `${sug}\n`;
    });
  }
  
  // Razonamiento de la IA
  if (resultadoIA.razonamiento) {
    mensajeResumen += `\n🤖 RAZONAMIENTO DE LA IA:\n${resultadoIA.razonamiento}`;
  }
  
  // Nivel de confianza
  if (resultadoIA.confianza) {
    const confianzaPorcentaje = (resultadoIA.confianza * 100).toFixed(0);
    mensajeResumen += `\n\n📊 Nivel de confianza: ${confianzaPorcentaje}%`;
    
    if (resultadoIA.confianza >= 0.8) {
      mensajeResumen += ` ✅ (Alta)`;
    } else if (resultadoIA.confianza >= 0.6) {
      mensajeResumen += ` ⚠️ (Media - Revisa los resultados)`;
    } else {
      mensajeResumen += ` ❌ (Baja - Verifica manualmente)`;
    }
  }
  
  alert(mensajeResumen);
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
      {mostrarModalAsistencia && (
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
                  {imagenIA ? (
                    <div className={styles.imagenSeleccionada}>
                      <img 
                        src={URL.createObjectURL(imagenIA)} 
                        alt="Imagen seleccionada"
                        className={styles.imagenSeleccionadaPreview}
                      />
                      <p className={styles.imagenNombre}>{imagenIA.name}</p>
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
              {imagenIA && !resultadoIA && (
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
                
                {/* Badge de confianza */}
                {resultadoIA.confianza && (
                  <div className={`${styles.confianzaBadge} ${
                    resultadoIA.confianza >= 0.8 ? styles.confianzaAlta :
                    resultadoIA.confianza >= 0.6 ? styles.confianzaMedia :
                    styles.confianzaBaja
                  }`}>
                    📊 Confianza: {(resultadoIA.confianza * 100).toFixed(0)}%
                    {resultadoIA.confianza >= 0.8 ? ' (Alta)' : 
                    resultadoIA.confianza >= 0.6 ? ' (Media)' : ' (Baja)'}
                  </div>
                )}
                
                <div className={styles.resultadosIA}>
                  
                  {/* Título */}
                  <div className={styles.resultadoItem}>
                    <strong>Título del Visual:</strong>
                    <span className={resultadoIA.titulo ? styles.valorDetectado : styles.valorNoDetectado}>
                      {resultadoIA.titulo || 'No detectado'}
                    </span>
                  </div>
                  
                  {/* Tipo con indicador visual */}
                  <div className={styles.resultadoItem}>
                    <strong>Tipo de Visualización:</strong>
                    <div className={styles.tipoVisualContainer}>
                      <span className={resultadoIA.tipo ? styles.valorDetectado : styles.valorNoDetectado}>
                        {resultadoIA.tipo || 'No detectado'}
                      </span>
                      {resultadoIA.tipo && (
                        <span className={styles.tipoIcon}>
                          {resultadoIA.tipo.includes('Tabla') ? '📋' :
                          resultadoIA.tipo.includes('Barras') ? '📊' :
                          resultadoIA.tipo.includes('Líneas') ? '📈' :
                          resultadoIA.tipo.includes('Circular') || resultadoIA.tipo.includes('Anillo') ? '🥧' :
                          resultadoIA.tipo.includes('KPI') ? '🎯' :
                          resultadoIA.tipo.includes('Mapa') ? '🗺️' : '📊'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Campos visibles con matching status */}
                  <div className={styles.resultadoItem}>
                    <strong>Campos Detectados:</strong>
                    {resultadoIA.camposVisibles && resultadoIA.camposVisibles.length > 0 ? (
                      <div className={styles.camposContainer}>
                        <div className={styles.camposList}>
                          {resultadoIA.camposVisibles.map((campo, idx) => {
                            // Verificar si hay matching
                            const camposDisponibles = reportData.camposDetectados?.map(c => c.nombre) || [];
                            const tieneMatch = camposDisponibles.some(c => 
                              c.toLowerCase() === campo.toLowerCase() ||
                              c.toLowerCase().includes(campo.toLowerCase()) ||
                              campo.toLowerCase().includes(c.toLowerCase())
                            );
                            
                            return (
                              <div key={idx} className={styles.campoChip}>
                                <span className={tieneMatch ? styles.campoMatch : styles.campoNoMatch}>
                                  {tieneMatch ? '✅' : '⚠️'} {campo}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Resumen de matching */}
                        {reportData.camposDetectados && reportData.camposDetectados.length > 0 && (
                          <div className={styles.matchingSummary}>
                            {(() => {
                              const camposDisponibles = reportData.camposDetectados.map(c => c.nombre);
                              const matched = resultadoIA.camposVisibles.filter(c => 
                                camposDisponibles.some(d => 
                                  d.toLowerCase() === c.toLowerCase() ||
                                  d.toLowerCase().includes(c.toLowerCase()) ||
                                  c.toLowerCase().includes(d.toLowerCase())
                                )
                              ).length;
                              const total = resultadoIA.camposVisibles.length;
                              const porcentaje = ((matched / total) * 100).toFixed(0);
                              
                              return (
                                <span className={
                                  matched === total ? styles.matchCompleto :
                                  matched > 0 ? styles.matchParcial :
                                  styles.matchNulo
                                }>
                                  {matched === total ? '✅' : matched > 0 ? '⚠️' : '❌'} 
                                  {` ${matched}/${total} campos coinciden con SQL (${porcentaje}%)`}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.valorNoDetectado}>No detectados</span>
                    )}
                  </div>
                  
                  {/* Métricas calculadas */}
                  <div className={styles.resultadoItem}>
                    <strong>Métricas Calculadas:</strong>
                    {resultadoIA.metricasCalculadas ? (
                      <code className={styles.metricasCode}>
                        {resultadoIA.metricasCalculadas}
                      </code>
                    ) : (
                      <span className={styles.valorNoDetectado}>No detectadas</span>
                    )}
                  </div>
                  
                  {/* Descripción */}
                  <div className={styles.resultadoItem}>
                    <strong>Descripción Funcional:</strong>
                    {resultadoIA.descripcion ? (
                      <p className={styles.descripcionTexto}>
                        {resultadoIA.descripcion}
                      </p>
                    ) : (
                      <span className={styles.valorNoDetectado}>No generada</span>
                    )}
                  </div>
                  
                  {/* Detalles técnicos (si existen) */}
                  {resultadoIA.detallesCampos && (
                    <div className={styles.resultadoItem}>
                      <strong>📐 Detalles Técnicos:</strong>
                      <div className={styles.detallesTecnicos}>
                        {resultadoIA.detallesCampos.ejeX && (
                          <div className={styles.detalleTecnico}>
                            <span className={styles.detalleLabel}>Eje X:</span>
                            <code>{resultadoIA.detallesCampos.ejeX}</code>
                          </div>
                        )}
                        {resultadoIA.detallesCampos.ejeY && (
                          <div className={styles.detalleTecnico}>
                            <span className={styles.detalleLabel}>Eje Y:</span>
                            <code>{resultadoIA.detallesCampos.ejeY}</code>
                          </div>
                        )}
                        {resultadoIA.detallesCampos.leyenda && (
                          <div className={styles.detalleTecnico}>
                            <span className={styles.detalleLabel}>Leyenda:</span>
                            <code>{resultadoIA.detallesCampos.leyenda}</code>
                          </div>
                        )}
                        {resultadoIA.detallesCampos.columnas && resultadoIA.detallesCampos.columnas.length > 0 && (
                          <div className={styles.detalleTecnico}>
                            <span className={styles.detalleLabel}>Columnas:</span>
                            <span>{resultadoIA.detallesCampos.columnas.length} detectadas</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Razonamiento de la IA */}
                  {resultadoIA.razonamiento && (
                    <div className={styles.razonamientoIA}>
                      <strong>💡 Razonamiento de la IA:</strong>
                      <p>{resultadoIA.razonamiento}</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
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