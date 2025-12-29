import React, { useState, useEffect } from 'react';
import styles from './Filtros.module.css';

const Filtros = ({ datos, onGuardar }) => {
  // Estado local para los filtros
  const [filtros, setFiltros] = useState(datos.filtros || []);
  
  // CAMBIO: Usamos ID en lugar de Index para evitar errores al agregar/borrar
  const [editandoId, setEditandoId] = useState(null);
  
  const [campoTemporal, setCampoTemporal] = useState('');

  // Sincronizar estado si los datos cambian desde fuera
  useEffect(() => {
    if (datos.filtros) {
      setFiltros(datos.filtros);
    }
  }, [datos.filtros]);

  const tiposControl = [
    'Segmentación (Slicer) - Lista',
    'Segmentación (Slicer) - Menú desplegable',
    'Segmentación (Slicer) - Mosaico/Botones',
    'Segmentación (Slicer) - Entre (Fechas/Números)',
    'Filtro Panel Lateral',
    'Filtro URL'
  ];

  const columnasDisponibles = datos.camposDetectados?.map(campo => campo.nombre) || [];

  /**
   * Agrega un nuevo filtro vacío y LO ABRE AUTOMÁTICAMENTE
   */
  const handleAgregarFiltro = () => {
    const nuevoId = Date.now(); // Generamos ID único
    
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
    
    // CAMBIO: Forzamos la edición usando el ID único recién creado
    setEditandoId(nuevoId); 
    
    guardarEnPadre(nuevosFiltros);
    
    // Scroll suave al final para ver el nuevo filtro
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
    // Si eliminamos el que se estaba editando, cerramos la edición
    if (editandoId === filtros[index].id) {
        setEditandoId(null);
    }
    guardarEnPadre(nuevosFiltros);
  };

  const guardarEnPadre = (nuevosFiltros) => {
    onGuardar({ filtros: nuevosFiltros });
  };

  // CAMBIO: Toggle usando ID
  const toggleEdicion = (id) => {
    setEditandoId(editandoId === id ? null : id);
    setCampoTemporal('');
  };

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
                    onClick={() => toggleEdicion(filtro.id)} // USAMOS ID
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

              {/* Contenido Expandible (Check por ID) */}
              {editandoId === filtro.id && (
                <div className={styles.filtroContenido}>
                  
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
    </div>
  );
};

export default Filtros;