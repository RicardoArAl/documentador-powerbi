import React from 'react'; // Eliminamos useState de previews porque usaremos el estado global
import styles from './Visualizaciones.module.css';

/**
 * SECCIÓN 4: VISUALIZACIONES
 * Componente para documentar los gráficos, tablas y visuales del reporte Power BI
 */

const Visualizaciones = ({ reportData, setReportData }) => {
  
  // Tipos de visualización predefinidos
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

  /**
   * Agregar nueva visualización vacía
   */
  const handleAgregarVisualizacion = () => {
    const nuevaVisualizacion = {
      id: Date.now(),
      titulo: '',
      tipo: '',
      imagen: null, // Aquí guardaremos el Base64 string
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
   * CORRECCIÓN: Manejar carga de imagen y convertir a Base64
   */
  const handleImagenChange = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB');
        return;
      }

      // LEER COMO BASE64
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Guardamos el string Base64 directamente en el estado global
        handleCambioVisualizacion(id, 'imagen', reader.result);
      };

      reader.onerror = () => {
        alert('Error al leer el archivo');
      };

      reader.readAsDataURL(file); // Esto dispara el onloadend con el Base64
    }
  };

  /**
   * Eliminar imagen (ahora simplemente borra el string del estado)
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
                
                {/* Upload de imagen */}
                <div className={styles.formGroup}>
                  <label>Captura del visual</label>
                  <div className={styles.uploadArea}>
                    {/* CAMBIO: Usamos visual.imagen directamente porque ahora es Base64 */}
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
    </div>
  );
};

export default Visualizaciones;