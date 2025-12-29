import React, { useState } from 'react';
import { parsearResultadosSQL, validarFormatoResultados } from '../../utils/sqlParser';
import styles from './ConsultaSQL.module.css';

const ConsultaSQL = ({ datos, onGuardar }) => {
  // Estado local para el textarea
  const [textoResultados, setTextoResultados] = useState('');
  const [tablaOrigen, setTablaOrigen] = useState(datos.tablaOrigen || '');
  const [campos, setCampos] = useState(datos.camposDetectados || []);
  const [mensajeValidacion, setMensajeValidacion] = useState('');
  const [mostrarTabla, setMostrarTabla] = useState(false);

  /**
   * Maneja el análisis de los resultados pegados
   */
  const handleAnalizar = () => {
    // Validar formato
    const validacion = validarFormatoResultados(textoResultados);
    
    if (!validacion.valido) {
      setMensajeValidacion(`❌ ${validacion.mensaje}`);
      return;
    }

    // Parsear resultados
    const resultado = parsearResultadosSQL(textoResultados);
    
    if (resultado.campos.length === 0) {
      setMensajeValidacion('❌ No se pudieron detectar columnas. Verifica el formato.');
      return;
    }

    // Actualizar estado
    setCampos(resultado.campos);
    setMensajeValidacion(`✅ Se detectaron ${resultado.campos.length} columnas correctamente`);
    setMostrarTabla(true);

    // Guardar en el estado padre
    onGuardar({
      consultaSQL: textoResultados,
      tablaOrigen: tablaOrigen,
      camposDetectados: resultado.campos
    });
  };

  /**
   * Actualiza un campo específico en la tabla
   */
  const handleActualizarCampo = (index, propiedad, valor) => {
    const camposActualizados = [...campos];
    camposActualizados[index][propiedad] = valor;
    setCampos(camposActualizados);

    // Guardar cambios
    onGuardar({
      consultaSQL: textoResultados,
      tablaOrigen: tablaOrigen,
      camposDetectados: camposActualizados
    });
  };

  /**
   * Elimina un campo de la lista
   */
  const handleEliminarCampo = (index) => {
    const camposActualizados = campos.filter((_, i) => i !== index);
    setCampos(camposActualizados);

    onGuardar({
      consultaSQL: textoResultados,
      tablaOrigen: tablaOrigen,
      camposDetectados: camposActualizados
    });
  };

  return (
    <div className={styles.container}>
      <h2>📊 Sección 2: Consulta SQL y Estructura</h2>
      
      <div className={styles.seccion}>
        <h3>Paso 1: Tabla/Vista Origen</h3>
        <input
          type="text"
          placeholder="Ej: VW_PENSUM_PLAN_ESTUDIOS"
          value={tablaOrigen}
          onChange={(e) => {
            setTablaOrigen(e.target.value);
            onGuardar({
              consultaSQL: textoResultados,
              tablaOrigen: e.target.value,
              camposDetectados: campos
            });
          }}
          className={styles.inputTabla}
        />
      </div>

      <div className={styles.seccion}>
        <h3>Paso 2: Pega los Resultados de tu Consulta SQL</h3>
        <p className={styles.instruccion}>
          🔍 <strong>Instrucciones:</strong> Ejecuta tu consulta en SQL Server Management Studio, 
          selecciona los resultados (incluyendo encabezados) y pégalos aquí.
        </p>

        <div className={styles.ejemploFormato}>
          <strong>Ejemplo de formato esperado:</strong>
          <pre>
{`PERIODO_CODIGO | PROGRAMA_ID | PROGRAMA_NOMBRE           | CREDITOS | TIPO_MATERIA
2024-01        | ING001      | Ingeniería de Sistemas    | 4        | Obligatoria
2024-01        | ING001      | Ingeniería de Sistemas    | 3        | Obligatoria`}
          </pre>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Pega aquí los resultados copiados desde SQL Server..."
          value={textoResultados}
          onChange={(e) => setTextoResultados(e.target.value)}
          rows={12}
        />

        <button 
          onClick={handleAnalizar}
          className={styles.btnAnalizar}
          disabled={!textoResultados.trim()}
        >
          🔍 Analizar Resultados
        </button>

        {mensajeValidacion && (
          <div className={
            mensajeValidacion.startsWith('✅') 
              ? styles.mensajeExito 
              : styles.mensajeError
          }>
            {mensajeValidacion}
          </div>
        )}
      </div>

      {mostrarTabla && campos.length > 0 && (
        <div className={styles.seccion}>
          <h3>Paso 3: Revisa y Ajusta los Campos Detectados</h3>
          <p className={styles.instruccion}>
            ✏️ Puedes editar las descripciones, cambiar tipos de datos o marcar llaves primarias.
          </p>

          <div className={styles.tablaContainer}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo Detectado</th>
                  <th>¿Es Llave?</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campos.map((campo, index) => (
                  <tr key={index}>
                    <td className={styles.celdaNombre}>
                      <code>{campo.nombre}</code>
                    </td>
                    <td>
                      <select
                        value={campo.tipo}
                        onChange={(e) => handleActualizarCampo(index, 'tipo', e.target.value)}
                        className={styles.selectTipo}
                      >
                        <option value="VARCHAR">VARCHAR</option>
                        <option value="INT">INT</option>
                        <option value="DECIMAL">DECIMAL</option>
                        <option value="DATE">DATE</option>
                        <option value="DATETIME">DATETIME</option>
                        <option value="BIT">BIT</option>
                        <option value="TEXT">TEXT</option>
                        <option value="NUMERIC">NUMERIC</option>
                      </select>
                    </td>
                    <td className={styles.celdaCheckbox}>
                      <input
                        type="checkbox"
                        checked={campo.esLlave}
                        onChange={(e) => handleActualizarCampo(index, 'esLlave', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={campo.descripcion}
                        onChange={(e) => handleActualizarCampo(index, 'descripcion', e.target.value)}
                        className={styles.inputDescripcion}
                        placeholder="Describe el campo..."
                      />
                    </td>
                    <td className={styles.celdaAcciones}>
                      <button
                        onClick={() => handleEliminarCampo(index)}
                        className={styles.btnEliminar}
                        title="Eliminar campo"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.resumen}>
            <strong>Resumen:</strong> {campos.length} campos detectados | 
            {' '}{campos.filter(c => c.esLlave).length} llaves identificadas
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaSQL;