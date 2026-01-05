/**
 * =====================================================
 * COMPONENTE: INFORMACIÓN BÁSICA v4.0
 * Sección 1 - Análisis Completo: Dashboard + Jerarquía
 * PARTE 1/2: Imports, Estados y Funciones
 * 
 * CARACTERÍSTICAS v4.0:
 * - ⭐ NUEVO: Pasa contexto SQL a la IA (campos disponibles)
 * - ⭐ NUEVO: Prompt mejorado que infiere columnas no visibles
 * - ⭐ NUEVO: Descripción más específica usando SQL
 * - Campos de nombre y código ANTES del análisis
 * - Análisis IA integrado (Dashboard + Jerarquía en un solo paso)
 * - Extracción automática de código/nombre desde nombre de archivo
 * - Prioriza datos manuales sobre detección IA
 * - Progreso visual en tiempo real
 * - Soporte Ctrl+V para pegar capturas
 * =====================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import styles from './InfoBasica.module.css';
import { analizarDashboardCompleto, validarRespuestaIA } from '../../utils/ai/analizarImagen';
import { detectarJerarquiaDesdeArbol } from '../../utils/ai/analizarJerarquia';
import { obtenerAreas, obtenerSubareas } from '../../utils/arbolReportes';

const InfoBasica = ({ datos, onGuardar }) => {
  // ===== ESTADO FORMULARIO =====
  const [formData, setFormData] = useState({
    nombreReporte: datos?.nombreReporte || '',
    codigoReporte: datos?.codigoReporte || '',
    categoria: datos?.categoria || '',
    subcategoria: datos?.subcategoria || '',
    objetivo: datos?.objetivo || '',
    usuarios: datos?.usuarios || ''
  });

  // ===== ESTADO JERARQUÍA =====
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

  // Dropdowns dependientes
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [subareasDisponibles, setSubareasDisponibles] = useState([]);

  // ===== ESTADOS MODAL IA =====
  const [modalIAVisible, setModalIAVisible] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [errorIA, setErrorIA] = useState(null);
  const [progresoAnalisis, setProgresoAnalisis] = useState('');
  
  // Campos temporales para el modal (Paso 1)
  const [nombreTemporal, setNombreTemporal] = useState('');
  const [codigoTemporal, setCodigoTemporal] = useState('');
  
  // ⭐ NUEVO v4.0: Campos adicionales opcionales para mejorar IA
  const [columnasAdicionales, setColumnasAdicionales] = useState('');
  
  const inputImagenRef = useRef(null);

  const categorias = [
    'Gestión Académica',
    'Gestión Financiera',
    'Gestión Administrativa'
  ];

  // ===== EFECTOS =====
  useEffect(() => {
    const areas = obtenerAreas();
    setAreasDisponibles(areas);
  }, []);

  useEffect(() => {
    if (jerarquia.area) {
      const subareas = obtenerSubareas(jerarquia.area);
      setSubareasDisponibles(subareas);
    } else {
      setSubareasDisponibles([]);
    }
  }, [jerarquia.area]);

  useEffect(() => {
    if (jerarquia.area || jerarquia.subarea) {
      onGuardar({ jerarquia });
    }
  }, [jerarquia]);

  // Efecto para detectar Ctrl+V
  useEffect(() => {
    if (!modalIAVisible) return;

    const manejarPaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const blob = items[i].getAsFile();
          const nombreArchivo = `captura-pegada-${Date.now()}.png`;
          const archivo = new File([blob], nombreArchivo, { type: blob.type });
          
          setImagenSeleccionada(archivo);
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
  }, [modalIAVisible]);

  // ===== HANDLERS FORMULARIO =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nuevosData = { ...formData, [name]: value };
    setFormData(nuevosData);
    onGuardar(nuevosData);
  };

  const handleJerarquiaChange = (e) => {
    const { name, value } = e.target;
    const nuevaJerarquia = { ...jerarquia, [name]: value };

    if (name === 'area') {
      nuevaJerarquia.subarea = '';
      nuevaJerarquia.reportesRelacionados = [];
    }

    if ((name === 'area' || name === 'subarea') && value) {
      nuevaJerarquia.metodoDeteccion = 'manual';
      nuevaJerarquia.confianzaDeteccion = 1.0;
    }

    if (nuevaJerarquia.area && nuevaJerarquia.subarea) {
      nuevaJerarquia.breadcrumb = `${nuevaJerarquia.sistema} > ${nuevaJerarquia.area} > ${nuevaJerarquia.subarea}`;
    }

    setJerarquia(nuevaJerarquia);
  };

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
  };

  // ===== FUNCIONES MODAL IA =====
  const abrirModalIA = () => {
    // Pre-cargar con valores del formulario si existen
    setNombreTemporal(formData.nombreReporte || '');
    setCodigoTemporal(formData.codigoReporte || '');
    
    setModalIAVisible(true);
    setImagenSeleccionada(null);
    setResultadoIA(null);
    setErrorIA(null);
    setProgresoAnalisis('');
    setColumnasAdicionales('');
  };

  const cerrarModalIA = () => {
    setModalIAVisible(false);
    setImagenSeleccionada(null);
    setResultadoIA(null);
    setErrorIA(null);
    setAnalizandoIA(false);
    setProgresoAnalisis('');
    setNombreTemporal('');
    setCodigoTemporal('');
    setColumnasAdicionales('');
  };

  /**
   * Extrae código y nombre del reporte desde el nombre del archivo
   */
  const extraerInfoDesdeNombreArchivo = (nombreArchivo) => {
    const nombreSinExtension = nombreArchivo.replace(/\.(png|jpg|jpeg|gif|webp|bmp)$/i, '');
    
    const patronCodigo = /^([A-Z]{2,4}-[A-Z]{2}-[A-Z]{2}-\d{2,3})/i;
    const matchCodigo = nombreSinExtension.match(patronCodigo);
    
    if (matchCodigo) {
      const codigo = matchCodigo[1].toUpperCase();
      const nombre = nombreSinExtension
        .substring(codigo.length)
        .trim()
        .replace(/^[-_\s]+/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');
      
      return {
        codigo: codigo,
        nombre: nombre || null
      };
    }
    
    return { codigo: null, nombre: null };
  };

  /**
   * Maneja la selección de imagen y actualiza campos temporales
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
      
      // Extraer info del nombre del archivo
      const infoArchivo = extraerInfoDesdeNombreArchivo(archivo.name);
      
      if (infoArchivo.codigo || infoArchivo.nombre) {
        console.log('✅ Información extraída del archivo:', infoArchivo);
        
        if (infoArchivo.codigo && !nombreTemporal && !codigoTemporal) {
          setCodigoTemporal(infoArchivo.codigo);
        }
        
        if (infoArchivo.nombre && !nombreTemporal) {
          setNombreTemporal(infoArchivo.nombre);
        }
      }
      
      setImagenSeleccionada(archivo);
      setErrorIA(null);
    }
  };

  /**
   * Maneja el drag and drop
   */
  const manejarDrop = (e) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    
    if (archivo && archivo.type.startsWith('image/')) {
      const infoArchivo = extraerInfoDesdeNombreArchivo(archivo.name);
      
      if (infoArchivo.codigo || infoArchivo.nombre) {
        console.log('✅ Información extraída (drag&drop):', infoArchivo);
        
        if (infoArchivo.codigo && !nombreTemporal && !codigoTemporal) {
          setCodigoTemporal(infoArchivo.codigo);
        }
        
        if (infoArchivo.nombre && !nombreTemporal) {
          setNombreTemporal(infoArchivo.nombre);
        }
      }
      
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
   * ⭐ v4.0 MEJORADO: Análisis Completo con CONTEXTO COMPLETO (SQL + Usuario)
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
      // Determinar código y nombre con prioridad
      const codigoContexto = codigoTemporal || formData.codigoReporte;
      const nombreContexto = nombreTemporal || formData.nombreReporte;

      // ⭐ NUEVO v4.0: Obtener campos SQL si están disponibles
      let camposSQL = [];
      if (datos?.camposDetectados && datos.camposDetectados.length > 0) {
        camposSQL = datos.camposDetectados;
        console.log(`📊 Enviando ${camposSQL.length} campos SQL a la IA`);
      }
      
      // ⭐ NUEVO v4.0: Agregar columnas adicionales si el usuario las especificó
      if (columnasAdicionales.trim()) {
        const columnasExtra = columnasAdicionales
          .split(',')
          .map(col => col.trim())
          .filter(col => col.length > 0)
          .map(col => ({
            nombre: col,
            tipo: 'VARCHAR',
            descripcion: 'Campo adicional mencionado por el usuario'
          }));
        
        camposSQL = [...camposSQL, ...columnasExtra];
        console.log(`➕ Se agregaron ${columnasExtra.length} columnas adicionales`);
      }

      console.log('📋 Contexto completo para IA:', { 
        codigo: codigoContexto, 
        nombre: nombreContexto,
        camposSQL: camposSQL.length
      });

      // PASO 1: Analizar dashboard con CONTEXTO COMPLETO
      setProgresoAnalisis('📊 Analizando dashboard con IA (usando contexto SQL)...');
      const resultadoDashboard = await analizarDashboardCompleto(
        imagenSeleccionada,
        {
          codigoReporte: codigoContexto,
          nombreReporte: nombreContexto,
          camposSQL: camposSQL // ⭐ NUEVO: Pasar campos SQL
        }
      );

      const validacion = validarRespuestaIA(resultadoDashboard, 0.6);
      if (!validacion.valida) {
        console.warn('⚠️ Advertencia:', validacion.mensaje);
      }

      // Usar contexto proporcionado sobre detección
      const codigoFinal = codigoContexto || resultadoDashboard.codigoReporte;
      const nombreFinal = nombreContexto || resultadoDashboard.nombreReporte;

      console.log('🔍 Código final:', codigoFinal);
      console.log('🔍 Nombre final:', nombreFinal);

      // PASO 2: Detectar jerarquía
      let resultadoJerarquia = null;
      if (codigoFinal) {
        setProgresoAnalisis('🌳 Detectando jerarquía organizacional...');
        
        try {
          resultadoJerarquia = await detectarJerarquiaDesdeArbol(
            codigoFinal,
            nombreFinal
          );
          
          console.log('✅ Jerarquía detectada:', resultadoJerarquia);
        } catch (error) {
          console.warn('⚠️ No se pudo detectar jerarquía:', error.message);
        }
      }

      // Combinar resultados
      setResultadoIA({
        nombreReporte: nombreFinal,
        codigoReporte: codigoFinal,
        categoria: resultadoDashboard.categoria,
        objetivo: resultadoDashboard.objetivo,
        cantidadFiltros: resultadoDashboard.cantidadFiltros,
        cantidadVisuales: resultadoDashboard.cantidadVisuales,
        tieneKPIs: resultadoDashboard.tieneKPIs,
        confianza: resultadoDashboard.confianza,
        jerarquia: resultadoJerarquia,
        observaciones: resultadoDashboard.observaciones // ⭐ Incluir observaciones
      });

      setProgresoAnalisis('✅ Análisis completado');
      console.log('✅ Análisis completo');

    } catch (error) {
      console.error('❌ Error al analizar:', error);
      setErrorIA(`Error al analizar imagen: ${error.message}`);
      setProgresoAnalisis('');
    } finally {
      setAnalizandoIA(false);
    }
  };

  /**
   * Aplicar resultados incluyendo jerarquía
   */
  const aplicarResultadosIA = () => {
    if (!resultadoIA) return;

    const nuevosData = { ...formData };
    let cambiosAplicados = false;

    // Aplicar información básica SOLO si campos están vacíos
    if (resultadoIA.nombreReporte && !formData.nombreReporte) {
      nuevosData.nombreReporte = resultadoIA.nombreReporte;
      cambiosAplicados = true;
    }

    if (resultadoIA.codigoReporte && !formData.codigoReporte) {
      nuevosData.codigoReporte = resultadoIA.codigoReporte;
      cambiosAplicados = true;
    }

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

    if (resultadoIA.objetivo && !formData.objetivo) {
      nuevosData.objetivo = resultadoIA.objetivo;
      cambiosAplicados = true;
    }

    // Aplicar jerarquía si fue detectada
    if (resultadoIA.jerarquia && !jerarquia.area) {
      const breadcrumb = resultadoIA.jerarquia.area && resultadoIA.jerarquia.subarea
        ? `${resultadoIA.jerarquia.sistema} > ${resultadoIA.jerarquia.area} > ${resultadoIA.jerarquia.subarea}`
        : '';

      setJerarquia({
        sistema: resultadoIA.jerarquia.sistema || 'Banner',
        area: resultadoIA.jerarquia.area || '',
        subarea: resultadoIA.jerarquia.subarea || '',
        reportesRelacionados: resultadoIA.jerarquia.reportesRelacionados || [],
        confianzaDeteccion: resultadoIA.jerarquia.confianza || 0,
        metodoDeteccion: resultadoIA.jerarquia.metodo || 'inferencia_ia',
        breadcrumb: breadcrumb,
        razonamiento: resultadoIA.jerarquia.razonamiento || ''
      });
      cambiosAplicados = true;
    }

    if (cambiosAplicados) {
      setFormData(nuevosData);
      onGuardar(nuevosData);
      cerrarModalIA();
      
      const mensajes = [];
      if (resultadoIA.nombreReporte) mensajes.push('nombre');
      if (resultadoIA.codigoReporte) mensajes.push('código');
      if (resultadoIA.categoria) mensajes.push('categoría');
      if (resultadoIA.objetivo) mensajes.push('objetivo');
      if (resultadoIA.jerarquia) mensajes.push('jerarquía organizacional');
      
      alert(`✅ Información aplicada: ${mensajes.join(', ')}`);
    } else {
      alert('ℹ️ No se aplicaron cambios porque los campos ya estaban llenos');
    }
  };

  // Calcular progreso
  const camposCompletados = Object.values(formData).filter(val => val !== '').length;
  const camposRequeridos = 3;
  const camposRequeridosCompletos = [
    formData.nombreReporte,
    formData.codigoReporte,
    formData.categoria
  ].filter(val => val !== '').length;

  // ===== CONTINÚA EN PARTE 2 (RENDER) =====
  /**
 * =====================================================
 * COMPONENTE: INFORMACIÓN BÁSICA v4.0
 * PARTE 2/2: JSX RENDER COMPLETO
 * 
 * ⭐ NUEVO EN v4.0:
 * - Campo para especificar columnas adicionales opcionales
 * - Mejora en la UI del modal para contexto SQL
 * 
 * ESTE CÓDIGO REEMPLAZA EL "return null;" DE LA PARTE 1
 * =====================================================
 */

// REEMPLAZA EL "return null;" AL FINAL DE LA PARTE 1 CON ESTE CÓDIGO:

return (
  <div className={styles.container}>
    
    <div className={styles.header}>
      <h2 className={styles.titulo}>📋 Información Básica del Reporte</h2>
      <p className={styles.descripcion}>
        Completa los datos principales de tu reporte Power BI
      </p>
    </div>

    {/* Sección IA */}
    <div className={styles.seccionIA}>
      <div className={styles.seccionIAContent}>
        <div className={styles.seccionIATexto}>
          <h3 className={styles.seccionIATitulo}>🤖 Análisis Inteligente Completo</h3>
          <p className={styles.seccionIADescripcion}>
            Sube una captura del dashboard y la IA completará <strong>automáticamente</strong> el nombre, código, categoría, objetivo <strong>y jerarquía organizacional</strong> del reporte
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

    <form className={styles.formulario}>
      
      <div className={styles.formGrid}>
        
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
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

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

      {/* JERARQUÍA */}
      <div className={styles.seccionJerarquia}>
        <div className={styles.jerarquiaHeader}>
          <h3 className={styles.jerarquiaTitulo}>📂 Jerarquía Organizacional</h3>
          <p className={styles.jerarquiaDescripcion}>
            Ubica este reporte en el árbol organizacional de Banner
          </p>
        </div>

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

        {jerarquia.area && (
          <div className={styles.jerarquiaDeteccion}>
            <button
              type="button"
              onClick={limpiarJerarquia}
              className={styles.btnLimpiarJerarquia}
            >
              🔄 Limpiar Jerarquía
            </button>
          </div>
        )}

        <div className={styles.jerarquiaGrid}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Sistema</label>
            <input
              type="text"
              value={jerarquia.sistema}
              readOnly
              className={styles.inputReadonly}
            />
          </div>

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
                <option key={index} value={area}>{area}</option>
              ))}
            </select>
          </div>

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
                <option key={index} value={subarea}>{subarea}</option>
              ))}
            </select>
          </div>

        </div>

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

        {jerarquia.razonamiento && jerarquia.metodoDeteccion === 'inferencia_ia' && (
          <div className={styles.razonamientoIA}>
            <strong>💡 Razonamiento:</strong> {jerarquia.razonamiento}
          </div>
        )}
      </div>

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

    <div className={styles.infoBox}>
      <span className={styles.infoIcon}>ℹ️</span>
      <span>
        Los campos marcados con <span className={styles.requerido}>*</span> son obligatorios
      </span>
    </div>

    {/* ========================================
         ⭐ MODAL MEJORADO V4.0 CON CONTEXTO SQL
         ======================================== */}
    {modalIAVisible && (
      <div className={styles.modalOverlay} onClick={cerrarModalIA}>
        <div className={styles.modalContenido} onClick={(e) => e.stopPropagation()}>
          
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitulo}>
              🤖 Análisis Inteligente Completo
            </h3>
            <button onClick={cerrarModalIA} className={styles.btnCerrarModal}>✕</button>
          </div>

          <div className={styles.modalBody}>
            
            {/* ⭐ PASO 1: INFORMACIÓN BÁSICA (OPCIONAL) */}
            <div className={styles.pasoModal}>
              <h4 className={styles.pasoTitulo}>
                <span className={styles.pasoNumero}>1</span>
                Información Básica (Opcional)
              </h4>
              
              <div className={styles.contextoIA}>
                <div className={styles.contextoExplicacion}>
                  <span className={styles.contextoIcono}>💡</span>
                  <p className={styles.contextoTexto}>
                    Si conoces el código y nombre del reporte, ingrésalos aquí. 
                    <strong> La IA los usará para generar una descripción más específica y precisa.</strong>
                  </p>
                </div>
                
                <div className={styles.contextoForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Código del Reporte
                    </label>
                    <input
                      type="text"
                      value={codigoTemporal}
                      onChange={(e) => setCodigoTemporal(e.target.value)}
                      placeholder="Ej: BNR-AC-AA-15"
                      className={styles.input}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Nombre del Reporte
                    </label>
                    <input
                      type="text"
                      value={nombreTemporal}
                      onChange={(e) => setNombreTemporal(e.target.value)}
                      placeholder="Ej: Alumnos matriculados con créditos y promedios"
                      className={styles.input}
                    />
                  </div>

                  {/* ⭐ NUEVO v4.0: Campo para columnas adicionales */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Columnas Adicionales del Reporte (Opcional)
                      <span className={styles.hint} style={{marginLeft: '8px', fontWeight: 'normal'}}>
                        Lista TODAS las columnas/campos del reporte, incluso las que no se ven en la captura
                      </span>
                    </label>
                    <textarea
                      value={columnasAdicionales}
                      onChange={(e) => setColumnasAdicionales(e.target.value)}
                      placeholder="Ej: CODIGO_ESTUDIANTE, EMAIL_PERSONAL, EMAIL_INSTITUCIONAL, CREDITOS_ACUMULADOS, PROMEDIO_PONDERADO, NUM_MOVIL_PERSONA, ESTADO_FINANCIERO"
                      className={styles.textarea}
                      rows={3}
                    />
                    <span className={styles.hint}>
                      💡 Usa los nombres técnicos de los campos separados por comas. La IA los interpretará para generar una descripción completa del reporte
                    </span>
                  </div>

                  {/* Indicador de campos SQL disponibles */}
                  {datos?.camposDetectados && datos.camposDetectados.length > 0 && (
                    <div className={styles.sqlDisponible}>
                      <span className={styles.sqlDisponibleIcono}>✅</span>
                      <span className={styles.sqlDisponibleTexto}>
                        Se detectaron <strong>{datos.camposDetectados.length} campos SQL</strong> del reporte. 
                        La IA los usará automáticamente como contexto.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PASO 2: SELECCIONAR IMAGEN */}
            <div className={styles.pasoModal}>
              <h4 className={styles.pasoTitulo}>
                <span className={styles.pasoNumero}>2</span>
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
                    
                    {(() => {
                      const info = extraerInfoDesdeNombreArchivo(imagenSeleccionada.name);
                      if (info.codigo || info.nombre) {
                        return (
                          <div className={styles.infoExtraida}>
                            <div className={styles.infoExtraidaIcono}>✅</div>
                            <div className={styles.infoExtraidaTexto}>
                              <strong>Información detectada del archivo:</strong>
                              {info.codigo && <div><strong>Código:</strong> {info.codigo}</div>}
                              {info.nombre && <div><strong>Nombre:</strong> {info.nombre}</div>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
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
                    
                    <div className={styles.pasteHint}>
                      <span className={styles.pasteIcon}>⌨️</span>
                      <span>
                        O presiona <kbd>Ctrl</kbd> + <kbd>V</kbd> para pegar captura
                      </span>
                    </div>
                    
                    <p className={styles.dropZoneHint}>
                      💡 <strong>Tip:</strong> Nombra tu archivo como "BNR-AC-AA-15 Nombre del reporte.png"
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

            {/* PASO 3: ANALIZAR */}
            {imagenSeleccionada && !resultadoIA && (
              <div className={styles.pasoModal}>
                <h4 className={styles.pasoTitulo}>
                  <span className={styles.pasoNumero}>3</span>
                  Analizar con IA
                </h4>
                
                {/* Mostrar contexto que se enviará */}
                {(codigoTemporal || nombreTemporal || columnasAdicionales || (datos?.camposDetectados && datos.camposDetectados.length > 0)) && (
                  <div className={styles.contextoEnviar}>
                    <span className={styles.contextoEnviarIcono}>📤</span>
                    <div className={styles.contextoEnviarTexto}>
                      <strong>Contexto que se enviará a la IA:</strong>
                      {codigoTemporal && <div>• Código: {codigoTemporal}</div>}
                      {nombreTemporal && <div>• Nombre: {nombreTemporal}</div>}
                      {columnasAdicionales && <div>• Columnas adicionales: {columnasAdicionales.split(',').length} especificadas</div>}
                      {datos?.camposDetectados && datos.camposDetectados.length > 0 && (
                        <div>• Campos SQL detectados: {datos.camposDetectados.length} campos</div>
                      )}
                    </div>
                  </div>
                )}
                
                {progresoAnalisis && (
                  <div className={styles.progresoAnalisis}>
                    {progresoAnalisis}
                  </div>
                )}
                
                <button
                  onClick={ejecutarAnalisisIA}
                  disabled={analizandoIA}
                  className={styles.btnAnalizar}
                >
                  {analizandoIA ? (
                    <>
                      <span className={styles.spinner}></span>
                      Analizando con contexto completo...
                    </>
                  ) : (
                    <>🔍 Analizar Dashboard con Contexto SQL</>
                  )}
                </button>
              </div>
            )}

            {/* PASO 4: RESULTADOS */}
            {resultadoIA && (
              <div className={styles.pasoModal}>
                <h4 className={styles.pasoTitulo}>
                  <span className={styles.pasoNumero}>4</span>
                  Resultados del análisis
                </h4>
                
                <div className={styles.resultadosIA}>
                  <div className={styles.seccionResultado}>
                    <h5 className={styles.subtituloResultado}>📊 Dashboard</h5>
                    <div className={styles.resultadoItem}>
                      <strong>Nombre:</strong> {resultadoIA.nombreReporte || 'No detectado'}
                    </div>
                    <div className={styles.resultadoItem}>
                      <strong>Código:</strong> {resultadoIA.codigoReporte || 'No detectado'}
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
                    
                    {/* ⭐ Mostrar observaciones si existen */}
                    {resultadoIA.observaciones && (
                      <div className={styles.resultadoItem} style={{marginTop: '12px'}}>
                        <strong>📝 Observaciones:</strong>
                        <div style={{marginTop: '6px', fontSize: '0.9em', lineHeight: '1.5'}}>
                          {resultadoIA.observaciones}
                        </div>
                      </div>
                    )}
                  </div>

                  {resultadoIA.jerarquia && (
                    <div className={styles.seccionResultado}>
                      <h5 className={styles.subtituloResultado}>🌳 Jerarquía Organizacional</h5>
                      <div className={styles.resultadoItem}>
                        <strong>Área:</strong> {resultadoIA.jerarquia.area || 'No detectada'}
                      </div>
                      <div className={styles.resultadoItem}>
                        <strong>Subárea:</strong> {resultadoIA.jerarquia.subarea || 'No detectada'}
                      </div>
                      <div className={styles.resultadoItem}>
                        <strong>Confianza:</strong> {(resultadoIA.jerarquia.confianza * 100).toFixed(0)}%
                      </div>
                      {resultadoIA.jerarquia.reportesRelacionados?.length > 0 && (
                        <div className={styles.resultadoItem}>
                          <strong>Reportes relacionados:</strong> {resultadoIA.jerarquia.reportesRelacionados.length}
                        </div>
                      )}
                    </div>
                  )}

                  {resultadoIA.confianza && (
                    <div className={styles.resultadoConfianza}>
                      <strong>Confianza general:</strong> {(resultadoIA.confianza * 100).toFixed(0)}%
                    </div>
                  )}
                </div>

                <div className={styles.modalAcciones}>
                  <button onClick={aplicarResultadosIA} className={styles.btnAplicar}>
                    ✅ Aplicar Resultados
                  </button>
                  <button onClick={ejecutarAnalisisIA} className={styles.btnReintentar}>
                    🔄 Reintentar
                  </button>
                </div>
              </div>
            )}

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
// ========================================
// FIN DEL RENDER - NO AGREGUES MÁS CÓDIGO
// ========================================
  return null; // El JSX completo está en la Parte 2
};

export default InfoBasica;