import React, { useState } from 'react';
import styles from './Filtros.module.css';

const Filtros = ({ datos, onGuardar }) => {
  // Estado local para los filtros
  const [filtros, setFiltros] = useState(datos.filtros || []);
  const [editandoIndex, setEditandoIndex] = useState(null);

  // Tipos de controles disponibles
  const tiposControl = [
    'Slicer',
    'Dropdown',
    'Multi-select',
    'Checkbox',
    'Radio Button',
    'Date Picker',
    'Range Slider',
    'Text Input'
  ];

  /**
   * Obtiene las columnas detectadas en la Sección 2
   */
  const columnasDisponibles = datos.camposDetectados?.map(campo => campo.nombre) || [];

  /**
   * Agrega un nuevo filtro vacío
   */
  const handleAgregarFiltro = () => {
    const nuevoFiltro = {
      id: Date.now(), // ID único
      nombre: '',
      campoSQL: '',
      tipoControl: '',
      valores: '',
      descripcion: '',
      imagenReferencia: null,
      imagenPreview: null
    };

    const nuevosFiltros = [...filtros, nuevoFiltro];
    setFiltros(nuevosFiltros);
    setEditandoIndex(nuevosFiltros.length - 1); // Abrir para editar
    guardarEnPadre(nuevosFiltros);
  };

  /**
   * Actualiza un filtro específico
   */
  const handleActualizarFiltro = (index, campo, valor) => {
    const nuevosFiltros = [...filtros];
    nuevosFiltros[index][campo] = valor;
    setFiltros(nuevosFiltros);
    guardarEnPadre(nuevosFiltros);
  };

  /**
   * Maneja la carga de imagen
   */
  const handleCargarImagen = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      // Crear preview de la imagen
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

  /**
   * Elimina la imagen de un filtro
   */
  const handleEliminarImagen = (index) => {
    const nuevosFiltros = [...filtros];
    nuevosFiltros[index].imagenReferencia = null;
    nuevosFiltros[index].imagenPreview = null;
    setFiltros(nuevosFiltros);
    guardarEnPadre(nuevosFiltros);
  };

  /**
   * Elimina un filtro completo
   */
  const handleEliminarFiltro = (index) => {
    const nuevosFiltros = filtros.filter((_, i) => i !== index);
    setFiltros(nuevosFiltros);
    setEditandoIndex(null);
    guardarEnPadre(nuevosFiltros);
  };

  /**
   * Guarda en el estado padre
   */
  const guardarEnPadre = (nuevosFiltros) => {
    onGuardar({
      filtros: nuevosFiltros
    });
  };

  /**
   * Toggle edición de un filtro
   */
  const toggleEdicion = (index) => {
    setEditandoIndex(editandoIndex === index ? null : index);
  };

  return (
    <div className={styles.container}>
      <h2>🔍 Sección 3: Filtros y Parámetros</h2>

      <div className={styles.instruccion}>
        <strong>📌 Instrucciones:</strong> Documenta los filtros y parámetros que tiene tu reporte de Power BI. 
        Puedes agregar tantos filtros como necesites. Las imágenes son opcionales y sirven como referencia visual.
      </div>

      {/* Advertencia si no hay columnas */}
      {columnasDisponibles.length === 0 && (
        <div className={styles.advertencia}>
          ⚠️ No se detectaron columnas en la Sección 2. Por favor, completa primero la sección de Consulta SQL 
          para poder asociar filtros con campos.
        </div>
      )}

      {/* Lista de filtros */}
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
                    onClick={() => toggleEdicion(index)}
                    className={styles.btnEditar}
                    title={editandoIndex === index ? 'Colapsar' : 'Editar'}
                  >
                    {editandoIndex === index ? '▲' : '✏️'}
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

              {/* Contenido del filtro (expandible) */}
              {editandoIndex === index && (
                <div className={styles.filtroContenido}>
                  {/* Nombre del filtro */}
                  <div className={styles.campo}>
                    <label>
                      Nombre del filtro <span className={styles.requerido}>*</span>
                    </label>
                    <input
                      type="text"
                      value={filtro.nombre}
                      onChange={(e) => handleActualizarFiltro(index, 'nombre', e.target.value)}
                      placeholder="Ej: Período Académico"
                      className={styles.input}
                    />
                  </div>

                  {/* Campo SQL asociado */}
                  <div className={styles.campo}>
                    <label>
                      Campo SQL asociado <span className={styles.requerido}>*</span>
                    </label>
                    <select
                      value={filtro.campoSQL}
                      onChange={(e) => handleActualizarFiltro(index, 'campoSQL', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- Selecciona un campo --</option>
                      {columnasDisponibles.map((col, i) => (
                        <option key={i} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de control */}
                  <div className={styles.campo}>
                    <label>
                      Tipo de control <span className={styles.requerido}>*</span>
                    </label>
                    <select
                      value={filtro.tipoControl}
                      onChange={(e) => handleActualizarFiltro(index, 'tipoControl', e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- Selecciona un tipo --</option>
                      {tiposControl.map((tipo, i) => (
                        <option key={i} value={tipo}>
                          {tipo}
                        </option>
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
                      placeholder="Ej: 2024-01, 2024-02, 2025-01"
                      className={styles.input}
                    />
                    <small className={styles.ayuda}>
                      Separa múltiples valores con comas
                    </small>
                  </div>

                  {/* Descripción */}
                  <div className={styles.campo}>
                    <label>Descripción</label>
                    <textarea
                      value={filtro.descripcion}
                      onChange={(e) => handleActualizarFiltro(index, 'descripcion', e.target.value)}
                      placeholder="Describe cómo funciona este filtro..."
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>

                  {/* Imagen de referencia */}
                  <div className={styles.campo}>
                    <label>Imagen de referencia (opcional)</label>
                    
                    {/* Preview de imagen */}
                    {filtro.imagenPreview && (
                      <div className={styles.imagenPreview}>
                        <img src={filtro.imagenPreview} alt="Preview filtro" />
                        <button
                          onClick={() => handleEliminarImagen(index)}
                          className={styles.btnEliminarImagen}
                        >
                          ✕ Eliminar imagen
                        </button>
                      </div>
                    )}

                    {/* Input para cargar imagen */}
                    {!filtro.imagenPreview && (
                      <div className={styles.uploadArea}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCargarImagen(index, e)}
                          className={styles.inputFile}
                          id={`imagen-${index}`}
                        />
                        <label htmlFor={`imagen-${index}`} className={styles.labelFile}>
                          📸 Seleccionar imagen
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vista compacta cuando está colapsado */}
              {editandoIndex !== index && (
                <div className={styles.filtroResumen}>
                  <div className={styles.resumenItem}>
                    <strong>Campo:</strong> {filtro.campoSQL || '(No definido)'}
                  </div>
                  <div className={styles.resumenItem}>
                    <strong>Tipo:</strong> {filtro.tipoControl || '(No definido)'}
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

      {/* Botón para agregar nuevo filtro */}
      <button
        onClick={handleAgregarFiltro}
        className={styles.btnAgregar}
      >
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