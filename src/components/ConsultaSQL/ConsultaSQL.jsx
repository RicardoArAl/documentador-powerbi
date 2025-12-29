import React, { useState } from 'react';
import { parsearResultadosSQL, parsearEstructuraColumnas, combinarDatosColumnas, validarFormatoResultados } from '../../utils/sqlParser';
import styles from './ConsultaSQL.module.css';

const ConsultaSQL = ({ datos, onGuardar }) => {
  // Estado local para los textareas
  const [textoEstructura, setTextoEstructura] = useState('');
  const [textoResultados, setTextoResultados] = useState('');
  const [tablaOrigen, setTablaOrigen] = useState(datos.tablaOrigen || '');
  const [campos, setCampos] = useState(datos.camposDetectados || []);
  const [mensajeValidacion, setMensajeValidacion] = useState('');
  const [mostrarTabla, setMostrarTabla] = useState(false);

  /**
   * Maneja el análisis combinado de estructura + resultados
   */
  const handleAnalizar = () => {
    // Validar que al menos uno de los dos esté lleno
    if (!textoEstructura.trim() && !textoResultados.trim()) {
      setMensajeValidacion('❌ Debes pegar al menos la estructura de columnas o los resultados de datos');
      return;
    }

    try {
      let camposFinales = [];

      // CASO 1: Solo estructura de columnas
      if (textoEstructura.trim() && !textoResultados.trim()) {
        const estructuraParseada = parsearEstructuraColumnas(textoEstructura);
        if (estructuraParseada.length === 0) {
          setMensajeValidacion('❌ No se pudieron detectar columnas de la estructura. Verifica el formato.');
          return;
        }
        camposFinales = estructuraParseada;
        setMensajeValidacion(`✅ Se detectaron ${estructuraParseada.length} columnas desde la estructura`);
      }
      
      // CASO 2: Solo resultados de datos
      else if (!textoEstructura.trim() && textoResultados.trim()) {
        const validacion = validarFormatoResultados(textoResultados);
        if (!validacion.valido) {
          setMensajeValidacion(`❌ ${validacion.mensaje}`);
          return;
        }

        const resultado = parsearResultadosSQL(textoResultados);
        if (resultado.campos.length === 0) {
          setMensajeValidacion('❌ No se pudieron detectar columnas de los resultados. Verifica el formato.');
          return;
        }
        camposFinales = resultado.campos;
        setMensajeValidacion(`✅ Se detectaron ${resultado.campos.length} columnas desde los resultados`);
      }
      
      // CASO 3: Ambos (ÓPTIMO - combina información)
      else {
        const estructuraParseada = parsearEstructuraColumnas(textoEstructura);
        const resultadoParseado = parsearResultadosSQL(textoResultados);
        
        if (estructuraParseada.length === 0 && resultadoParseado.campos.length === 0) {
          setMensajeValidacion('❌ No se pudieron detectar columnas. Verifica ambos formatos.');
          return;
        }

        // Combinar ambas fuentes para obtener la mejor información
        camposFinales = combinarDatosColumnas(estructuraParseada, resultadoParseado.campos);
        setMensajeValidacion(
          `✅ Se combinaron ${camposFinales.length} columnas (estructura + datos de ejemplo)`
        );
      }

      // Actualizar estado
      setCampos(camposFinales);
      setMostrarTabla(true);

      // Guardar en el estado padre
      onGuardar({
        consultaSQL: textoResultados,
        estructuraColumnas: textoEstructura,
        tablaOrigen: tablaOrigen,
        camposDetectados: camposFinales
      });

    } catch (error) {
      console.error('Error analizando datos:', error);
      setMensajeValidacion('❌ Error al procesar los datos. Verifica el formato.');
    }
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
      estructuraColumnas: textoEstructura,
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
      estructuraColumnas: textoEstructura,
      tablaOrigen: tablaOrigen,
      camposDetectados: camposActualizados
    });
  };

  return (
    <div className={styles.container}>
      <h2>📊 Sección 2: Consulta SQL y Estructura</h2>
      
      {/* Paso 1: Tabla Origen */}
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
              estructuraColumnas: textoEstructura,
              tablaOrigen: e.target.value,
              camposDetectados: campos
            });
          }}
          className={styles.inputTabla}
        />
      </div>

      {/* Paso 2: Estructura de Columnas */}
      <div className={styles.seccion}>
        <h3>Paso 2A: Estructura de Columnas (Opcional pero recomendado)</h3>
        <p className={styles.instruccion}>
          🔍 <strong>Query sugerido:</strong> Ejecuta este query en SSMS y pega los resultados aquí:
        </p>
        
        <div className={styles.queryBox}>
          <code>
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE<br/>
            FROM INFORMATION_SCHEMA.COLUMNS<br/>
            WHERE TABLE_NAME = 'TuTabla'<br/>
            ORDER BY ORDINAL_POSITION;
          </code>
        </div>

        <div className={styles.ejemploFormato}>
          <strong>Ejemplo de formato esperado:</strong>
          <pre>
{`COLUMN_NAME           DATA_TYPE    CHARACTER_MAXIMUM_LENGTH    IS_NULLABLE
PERIODO_CODIGO        varchar      10                          NO
PROGRAMA_ID           int          NULL                        NO
PROGRAMA_NOMBRE       varchar      200                         YES`}
          </pre>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Pega aquí la estructura de columnas desde INFORMATION_SCHEMA..."
          value={textoEstructura}
          onChange={(e) => setTextoEstructura(e.target.value)}
          rows={8}
        />
      </div>

      {/* Paso 3: Resultados de Datos */}
      <div className={styles.seccion}>
        <h3>Paso 2B: Resultados de Datos (Opcional)</h3>
        <p className={styles.instruccion}>
          🔍 <strong>Instrucciones:</strong> Ejecuta un SELECT de ejemplo y pega los resultados 
          (incluyendo encabezados). Esto ayuda a inferir mejor los tipos de datos.
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
          placeholder="Pega aquí algunos resultados de ejemplo (SELECT * FROM tabla TOP 10)..."
          value={textoResultados}
          onChange={(e) => setTextoResultados(e.target.value)}
          rows={10}
        />
      </div>

      {/* Botón Analizar */}
      <div className={styles.seccionBoton}>
        <button 
          onClick={handleAnalizar}
          className={styles.btnAnalizar}
          disabled={!textoEstructura.trim() && !textoResultados.trim()}
        >
          🔍 Analizar y Detectar Columnas
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

      {/* Paso 3: Tabla de Campos Detectados */}
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
                  <th>Longitud</th>
                  <th>Acepta Nulos</th>
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
                        <option value="NVARCHAR">NVARCHAR</option>
                        <option value="INT">INT</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="DECIMAL">DECIMAL</option>
                        <option value="NUMERIC">NUMERIC</option>
                        <option value="FLOAT">FLOAT</option>
                        <option value="DATE">DATE</option>
                        <option value="DATETIME">DATETIME</option>
                        <option value="DATETIME2">DATETIME2</option>
                        <option value="BIT">BIT</option>
                        <option value="TEXT">TEXT</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={campo.longitud || ''}
                        onChange={(e) => handleActualizarCampo(index, 'longitud', e.target.value)}
                        className={styles.inputLongitud}
                        placeholder="N/A"
                      />
                    </td>
                    <td className={styles.celdaCheckbox}>
                      <input
                        type="checkbox"
                        checked={campo.aceptaNulos || false}
                        onChange={(e) => handleActualizarCampo(index, 'aceptaNulos', e.target.checked)}
                      />
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
            {' '}{campos.filter(c => c.esLlave).length} llaves identificadas |
            {' '}{campos.filter(c => c.aceptaNulos).length} aceptan nulos
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaSQL;