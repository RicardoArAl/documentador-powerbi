/**
 * =====================================================
 * COMPONENTE: INFORMACIÓN BÁSICA
 * Sección 1 - Con Análisis de Dashboard Completo + Jerarquía
 * PARTE 1/2: Imports, Estados y Funciones
 * =====================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './InfoBasica.module.css';
import { analizarDashboardCompleto, validarRespuestaIA } from '../../utils/ai/analizarImagen';
import { detectarJerarquiaDesdeArbol } from '../../utils/ai/analizarJerarquia';
import { obtenerAreas, obtenerSubareas } from '../../utils/arbolReportes';

const InfoBasica = ({ datos, onGuardar }) => {
  // ===== ESTADO EXISTENTE =====
  const [formData, setFormData] = useState({
    nombreReporte: datos?.nombreReporte || '',
    codigoReporte: datos?.codigoReporte || '',
    categoria: datos?.categoria || '',
    subcategoria: datos?.subcategoria || '',
    objetivo: datos?.objetivo || '',
    usuarios: datos?.usuarios || ''
  });

  // ===== NUEVO: ESTADO PARA JERARQUÍA =====
  const [jerarquia, setJerarquia] = useState({
    sistema: datos?.jerarquia?.sistema || 'Banner',
    area: datos?.jerarquia?.area || '',
    subarea: datos?.jerarquia?.subarea || '',
    reportesRelacionados: datos?.jerarquia?.reportesRelacionados || [],
    confianzaDeteccion: datos?.jerarquia?.confianzaDeteccion || 0,
    metodoDeteccion: datos?.jerarquia?.metodoDeteccion || '',
    breadcrumb: datos?.jerarquia?.breadcrumb || '',
    razonamiento: datos?.jerarquia?.razonamiento || ''
  });

  // Estado para dropdowns dependientes
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [subareasDisponibles, setSubareasDisponibles] = useState([]);
  
  // Estados para detección IA de jerarquía
  const [detectandoJerarquia, setDetectandoJerarquia] = useState(false);
  const [errorJerarquia, setErrorJerarquia] = useState(null);

  // ===== NUEVOS ESTADOS PARA IA DASHBOARD =====
  const [modalIAVisible, setModalIAVisible] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
  
  const inputImagenRef = useRef(null);

  // Opciones para el dropdown de categoría (mantener compatibilidad)
  const categorias = [
    'Gestión Académica',
    'Gestión Financiera',
    'Gestión Administrativa'
  ];

  // ===== EFECTOS PARA JERARQUÍA =====

  /**
   * Cargar áreas disponibles al montar componente
   */
  useEffect(() => {
    const areas = obtenerAreas();
    setAreasDisponibles(areas);
  }, []);

  /**
   * Actualizar subáreas cuando cambia el área
   */
  useEffect(() => {
    if (jerarquia.area) {
      const subareas = obtenerSubareas(jerarquia.area);
      setSubareasDisponibles(subareas);
    } else {
      setSubareasDisponibles([]);
    }
  }, [jerarquia.area]);

  /**
   * Guardar jerarquía en datos globales cuando cambia
   */
  useEffect(() => {
    if (jerarquia.area || jerarquia.subarea) {
      onGuardar({ jerarquia });
    }
  }, [jerarquia]);

  // ===== FUNCIONES EXISTENTES =====

  /**
   * Maneja cambios en los inputs
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevosData = {
      ...formData,
      [name]: value
    };
    setFormData(nuevosData);
    onGuardar(nuevosData);
  };

  // ===== NUEVAS FUNCIONES PARA JERARQUÍA =====

  /**
   * Maneja cambios en los dropdowns de jerarquía
   */
  const handleJerarquiaChange = (e) => {
    const { name, value } = e.target;
    
    const nuevaJerarquia = {
      ...jerarquia,
      [name]: value
    };

    // Si cambió el área, resetear subárea
    if (name === 'area') {
      nuevaJerarquia.subarea = '';
      nuevaJerarquia.reportesRelacionados = [];
    }

    // Si se seleccionó manualmente, marcar método
    if ((name === 'area' || name === 'subarea') && value) {
      nuevaJerarquia.metodoDeteccion = 'manual';
      nuevaJerarquia.confianzaDeteccion = 1.0;
    }

    // Generar breadcrumb
    if (nuevaJerarquia.area && nuevaJerarquia.subarea) {
      nuevaJerarquia.breadcrumb = `${nuevaJerarquia.sistema} > ${nuevaJerarquia.area} > ${nuevaJerarquia.subarea}`;
    }

    setJerarquia(nuevaJerarquia);
  };

  /**
   * Detecta jerarquía automáticamente desde código del reporte
   */
  const detectarJerarquiaAutomatica = async () => {
    if (!formData.codigoReporte) {
      setErrorJerarquia('Por favor ingresa el código del reporte primero');
      return;
    }

    setDetectandoJerarquia(true);
    setErrorJerarquia(null);

    try {
      const resultado = await detectarJerarquiaDesdeArbol(
        formData.codigoReporte,
        formData.nombreReporte
      );

      console.log('✅ Jerarquía detectada:', resultado);

      // Generar breadcrumb
      const breadcrumb = resultado.area && resultado.subarea
        ? `${resultado.sistema} > ${resultado.area} > ${resultado.subarea}`
        : '';

      setJerarquia({
        sistema: resultado.sistema || 'Banner',
        area: resultado.area || '',
        subarea: resultado.subarea || '',
        reportesRelacionados: resultado.reportesRelacionados || [],
        confianzaDeteccion: resultado.confianza || 0,
        metodoDeteccion: resultado.metodo || 'inferencia_ia',
        breadcrumb: breadcrumb,
        razonamiento: resultado.razonamiento || ''
      });

      // Mostrar mensaje según confianza
      if (resultado.confianza >= 0.9) {
        alert('✅ Jerarquía detectada con alta confianza');
      } else if (resultado.confianza >= 0.7) {
        alert('⚠️ Jerarquía detectada con confianza media. Revisa los resultados.');
      } else {
        alert('⚠️ Jerarquía detectada con baja confianza. Por favor verifica manualmente.');
      }

    } catch (error) {
      console.error('❌ Error al detectar jerarquía:', error);
      setErrorJerarquia(`Error: ${error.message}`);
    } finally {
      setDetectandoJerarquia(false);
    }
  };

  /**
   * Limpia la jerarquía detectada
   */
  const limpiarJerarquia = () => {
    setJerarquia({
      sistema: 'Banner',
      area: '',
      subarea: '',
      reportesRelacionados: [],
      confianzaDeteccion: 0,
      metodoDeteccion: '',
      breadcrumb: '',
      razonamiento: ''
    });
    setErrorJerarquia(null);
  };

  // ===== FUNCIONES PARA IA DASHBOARD =====

  /**
   * Abre el modal de análisis IA
   */
  const abrirModalIA = () => {
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
      const resultado = await analizarDashboardCompleto(imagenSeleccionada);

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
   * Aplica los resultados del análisis IA al formulario
   */
  const aplicarResultadosIA = () => {
    if (!resultadoIA) return;

    const nuevosData = { ...formData };
    let cambiosAplicados = false;

    // Aplicar nombre del reporte
    if (resultadoIA.nombreReporte && !formData.nombreReporte) {
      nuevosData.nombreReporte = resultadoIA.nombreReporte;
      cambiosAplicados = true;
    }

    // Aplicar categoría (hacer match con categorías disponibles)
    if (resultadoIA.categoria) {
      const categoriaEncontrada = categorias.find(
        cat => cat.toLowerCase().includes(resultadoIA.categoria.toLowerCase()) ||
               resultadoIA.categoria.toLowerCase().includes(cat.toLowerCase())
      );
      
      if (categoriaEncontrada && !formData.categoria) {
        nuevosData.categoria = categoriaEncontrada;
        cambiosAplicados = true;
      }
    }

    // Aplicar objetivo
    if (resultadoIA.objetivo && !formData.objetivo) {
      nuevosData.objetivo = resultadoIA.objetivo;
      cambiosAplicados = true;
    }

    if (cambiosAplicados) {
      setFormData(nuevosData);
      onGuardar(nuevosData);
      cerrarModalIA();
      alert('✅ Información aplicada correctamente desde el análisis de IA');
    } else {
      alert('ℹ️ No se aplicaron cambios porque los campos ya estaban llenos');
    }
  };

  // Calcular campos completados para barra de progreso
  const camposCompletados = Object.values(formData).filter(val => val !== '').length;
  const camposRequeridos = 3;
  const camposRequeridosCompletos = [
    formData.nombreReporte,
    formData.codigoReporte,
    formData.categoria
  ].filter(val => val !== '').length;

  // CONTINÚA EN PARTE 2...
  /**
 * =====================================================
 * COMPONENTE: INFORMACIÓN BÁSICA
 * PARTE 2/2: JSX Render Completo
 * =====================================================
 * 
 * IMPORTANTE: Esta es la continuación de la Parte 1
 * Copia ambas partes y únelas en un solo archivo InfoBasica.jsx
 */

  // ===== RENDER =====
  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.titulo}>📋 Información Básica del Reporte</h2>
        <p className={styles.descripcion}>
          Completa los datos principales de tu reporte Power BI
        </p>
      </div>

      {/* Sección de IA Dashboard */}
      <div className={styles.seccionIA}>
        <div className={styles.seccionIAContent}>
          <div className={styles.seccionIATexto}>
            <h3 className={styles.seccionIATitulo}>🤖 Análisis Inteligente</h3>
            <p className={styles.seccionIADescripcion}>
              Sube una captura del dashboard completo y la IA completará automáticamente el nombre, categoría y objetivo del reporte
            </p>
          </div>
          <button
            type="button"
            onClick={abrirModalIA}
            className={styles.btnIA}
          >
            <span className={styles.btnIAIcono}>📊</span>
            <span className={styles.btnIATexto}>Analizar Dashboard</span>
          </button>
        </div>
      </div>

      {/* Formulario */}
      <form className={styles.formulario}>
        
        {/* Grid de campos principales */}
        <div className={styles.formGrid}>
          
          {/* Nombre del Reporte */}
          <div className={styles.formGroup}>
            <label htmlFor="nombreReporte" className={styles.label}>
              Nombre del Reporte <span className={styles.requerido}>*</span>
            </label>
            <input
              type="text"
              id="nombreReporte"
              name="nombreReporte"
              value={formData.nombreReporte}
              onChange={handleChange}
              placeholder="Ej: PENSUM por plan de estudio"
              className={styles.input}
              required
            />
          </div>

          {/* Código del Reporte */}
          <div className={styles.formGroup}>
            <label htmlFor="codigoReporte" className={styles.label}>
              Código del Reporte <span className={styles.requerido}>*</span>
            </label>
            <input
              type="text"
              id="codigoReporte"
              name="codigoReporte"
              value={formData.codigoReporte}
              onChange={handleChange}
              placeholder="Ej: BNR-AC-AA-02"
              className={styles.input}
              required
            />
          </div>

          {/* Categoría */}
          <div className={styles.formGroup}>
            <label htmlFor="categoria" className={styles.label}>
              Categoría <span className={styles.requerido}>*</span>
            </label>
            <select
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">-- Selecciona una categoría --</option>
              {categorias.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoría */}
          <div className={styles.formGroup}>
            <label htmlFor="subcategoria" className={styles.label}>
              Subcategoría
            </label>
            <input
              type="text"
              id="subcategoria"
              name="subcategoria"
              value={formData.subcategoria}
              onChange={handleChange}
              placeholder="Ej: Planes de Estudio"
              className={styles.input}
            />
          </div>

        </div>

        {/* ===== NUEVO: SECCIÓN JERARQUÍA ORGANIZACIONAL ===== */}
        <div className={styles.seccionJerarquia}>
          <div className={styles.jerarquiaHeader}>
            <h3 className={styles.jerarquiaTitulo}>📂 Jerarquía Organizacional</h3>
            <p className={styles.jerarquiaDescripcion}>
              Ubica este reporte en el árbol organizacional de Banner
            </p>
          </div>

          {/* Breadcrumb si existe */}
          {jerarquia.breadcrumb && (
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbIcono}>📍</span>
              <span className={styles.breadcrumbTexto}>{jerarquia.breadcrumb}</span>
              {jerarquia.confianzaDeteccion > 0 && (
                <span className={styles.breadcrumbConfianza}>
                  {jerarquia.metodoDeteccion === 'busqueda_directa' && '✓ Exacto'}
                  {jerarquia.metodoDeteccion === 'inferencia_ia' && `🤖 ${(jerarquia.confianzaDeteccion * 100).toFixed(0)}%`}
                  {jerarquia.metodoDeteccion === 'manual' && '✋ Manual'}
                  {jerarquia.metodoDeteccion === 'fallback_basico' && '⚠️ Inferido'}
                </span>
              )}
            </div>
          )}

          {/* Botón de detección automática */}
          <div className={styles.jerarquiaDeteccion}>
            <button
              type="button"
              onClick={detectarJerarquiaAutomatica}
              disabled={!formData.codigoReporte || detectandoJerarquia}
              className={styles.btnDetectarJerarquia}
              title={!formData.codigoReporte ? 'Ingresa el código del reporte primero' : 'Detectar jerarquía con IA'}
            >
              {detectandoJerarquia ? (
                <>
                  <span className={styles.spinner}></span>
                  Detectando...
                </>
              ) : (
                <>
                  🤖 Detectar desde Código
                </>
              )}
            </button>

            {jerarquia.area && (
              <button
                type="button"
                onClick={limpiarJerarquia}
                className={styles.btnLimpiarJerarquia}
              >
                🔄 Limpiar
              </button>
            )}
          </div>

          {/* Error de detección */}
          {errorJerarquia && (
            <div className={styles.errorJerarquia}>
              ⚠️ {errorJerarquia}
            </div>
          )}

          {/* Dropdowns de jerarquía */}
          <div className={styles.jerarquiaGrid}>
            
            {/* Sistema (readonly) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Sistema</label>
              <input
                type="text"
                value={jerarquia.sistema}
                readOnly
                className={styles.inputReadonly}
              />
            </div>

            {/* Área */}
            <div className={styles.formGroup}>
              <label htmlFor="jerarquia-area" className={styles.label}>
                Área
              </label>
              <select
                id="jerarquia-area"
                name="area"
                value={jerarquia.area}
                onChange={handleJerarquiaChange}
                className={styles.select}
              >
                <option value="">-- Selecciona un área --</option>
                {areasDisponibles.map((area, index) => (
                  <option key={index} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Subárea */}
            <div className={styles.formGroup}>
              <label htmlFor="jerarquia-subarea" className={styles.label}>
                Subárea
              </label>
              <select
                id="jerarquia-subarea"
                name="subarea"
                value={jerarquia.subarea}
                onChange={handleJerarquiaChange}
                className={styles.select}
                disabled={!jerarquia.area}
              >
                <option value="">-- Selecciona una subárea --</option>
                {subareasDisponibles.map((subarea, index) => (
                  <option key={index} value={subarea}>
                    {subarea}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Reportes relacionados */}
          {jerarquia.reportesRelacionados && jerarquia.reportesRelacionados.length > 0 && (
            <div className={styles.reportesRelacionados}>
              <h4 className={styles.relacionadosTitulo}>
                🔗 Reportes Relacionados ({jerarquia.reportesRelacionados.length})
              </h4>
              <div className={styles.relacionadosLista}>
                {jerarquia.reportesRelacionados.slice(0, 5).map((reporte, index) => (
                  <div key={index} className={styles.relacionadoItem}>
                    <span className={styles.relacionadoCodigo}>{reporte.codigo}</span>
                    <span className={styles.relacionadoNombre}>{reporte.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Razonamiento de IA (si existe) */}
          {jerarquia.razonamiento && jerarquia.metodoDeteccion === 'inferencia_ia' && (
            <div className={styles.razonamientoIA}>
              <strong>💡 Razonamiento:</strong> {jerarquia.razonamiento}
            </div>
          )}
        </div>

        {/* Objetivo (campo grande) */}
        <div className={styles.formGroup}>
          <label htmlFor="objetivo" className={styles.label}>
            Objetivo del Reporte <span className={styles.requerido}>*</span>
          </label>
          <textarea
            id="objetivo"
            name="objetivo"
            value={formData.objetivo}
            onChange={handleChange}
            placeholder="Describe el propósito principal del reporte..."
            className={styles.textarea}
            rows={4}
            required
          />
          <span className={styles.hint}>
            Explica qué información proporciona el reporte y para qué se utiliza
          </span>
        </div>

        {/* Usuarios */}
        <div className={styles.formGroup}>
          <label htmlFor="usuarios" className={styles.label}>
            Usuarios que utilizan el reporte
          </label>
          <input
            type="text"
            id="usuarios"
            name="usuarios"
            value={formData.usuarios}
            onChange={handleChange}
            placeholder="Ej: Directores académicos, Coordinadores de programa"
            className={styles.input}
          />
          <span className={styles.hint}>
            Separar múltiples usuarios con comas
          </span>
        </div>

      </form>

      {/* Barra de progreso */}
      <div className={styles.progreso}>
        <div className={styles.progresoHeader}>
          <span className={styles.progresoTexto}>
            {camposRequeridosCompletos === camposRequeridos ? '✅ ' : '📝 '}
            Campos completados
          </span>
          <span className={styles.progresoNumero}>
            {camposCompletados} / 6
          </span>
        </div>
        <div className={styles.progresoBarra}>
          <div 
            className={styles.progresoFill}
            style={{ width: `${(camposCompletados / 6) * 100}%` }}
          />
        </div>
        {camposRequeridosCompletos === camposRequeridos && (
          <p className={styles.progresoMensaje}>
            ✓ Todos los campos requeridos están completos
          </p>
        )}
      </div>

      {/* Info box */}
      <div className={styles.infoBox}>
        <span className={styles.infoIcon}>ℹ️</span>
        <span>
          Los campos marcados con <span className={styles.requerido}>*</span> son obligatorios
        </span>
      </div>

      {/* ===== MODAL DE IA DASHBOARD ===== */}
      {modalIAVisible && (
        <div className={styles.modalOverlay} onClick={cerrarModalIA}>
          <div className={styles.modalContenido} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitulo}>
                🤖 Análisis de Dashboard Completo
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
                  Selecciona una captura del dashboard completo
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
                        Arrastra una captura del dashboard aquí
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
                        Analizando dashboard...
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
                      <strong>Nombre del Reporte:</strong> {resultadoIA.nombreReporte || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Categoría:</strong> {resultadoIA.categoria || 'No detectada'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Objetivo:</strong> {resultadoIA.objetivo || 'No generado'}
                    </div>
                    {resultadoIA.cantidadFiltros !== undefined && (
                      <div className={styles.resultadoItem}>
                        <strong>Filtros detectados:</strong> ~{resultadoIA.cantidadFiltros}
                      </div>
                    )}
                    {resultadoIA.cantidadVisuales !== undefined && (
                      <div className={styles.resultadoItem}>
                        <strong>Visuales detectados:</strong> ~{resultadoIA.cantidadVisuales}
                      </div>
                    )}
                    {resultadoIA.tieneKPIs !== undefined && (
                      <div className={styles.resultadoItem}>
                        <strong>Tiene KPIs:</strong> {resultadoIA.tieneKPIs ? 'Sí' : 'No'}
                      </div>
                    )}
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

export default InfoBasica;