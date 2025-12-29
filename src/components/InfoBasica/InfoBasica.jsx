import React, { useState } from 'react';
import styles from './InfoBasica.module.css';

const InfoBasica = ({ datos, onGuardar }) => {
  // Estado local del formulario
  const [formData, setFormData] = useState({
    nombreReporte: datos?.nombreReporte || '',
    codigoReporte: datos?.codigoReporte || '',
    categoria: datos?.categoria || '',
    subcategoria: datos?.subcategoria || '',
    objetivo: datos?.objetivo || '',
    usuarios: datos?.usuarios || ''
  });

  // Opciones para el dropdown de categoría
  const categorias = [
    'Gestión Académica',
    'Gestión Financiera',
    'Gestión Administrativa',
    'Recursos Humanos',
    'Ventas y Marketing',
    'Operaciones',
    'Otra'
  ];

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
    
    // Guardar en el estado padre inmediatamente
    onGuardar(nuevosData);
  };

  return (
    <div className={styles.container}>
      <h2>📋 Sección 1: Información Básica del Reporte</h2>
      
      <form className={styles.formulario}>
        {/* Nombre del Reporte */}
        <div className={styles.campo}>
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
        <div className={styles.campo}>
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
        <div className={styles.campo}>
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
        <div className={styles.campo}>
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

        {/* Objetivo */}
        <div className={styles.campo}>
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
        </div>

        {/* Usuarios */}
        <div className={styles.campo}>
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
        </div>

        {/* Mensaje de información */}
        <div className={styles.infoBox}>
          <strong>ℹ️ Información:</strong> Los campos marcados con 
          <span className={styles.requerido}>*</span> son obligatorios.
        </div>
      </form>
    </div>
  );
};

export default InfoBasica;