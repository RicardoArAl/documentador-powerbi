import React, { useState, useEffect } from 'react';
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
  
  // Estado para mostrar/ocultar queries de ayuda
  const [mostrarQueryBasico, setMostrarQueryBasico] = useState(false);
  const [mostrarQueryCompleto, setMostrarQueryCompleto] = useState(false);
  const [mostrarQueryPKs, setMostrarQueryPKs] = useState(false);
  const [mostrarQueryEjemplo, setMostrarQueryEjemplo] = useState(false);

  /**
   * Cargar datos guardados cuando el componente se monta
   */
  useEffect(() => {
    if (datos.estructuraColumnas) {
      setTextoEstructura(datos.estructuraColumnas);
    }
    if (datos.consultaSQL) {
      setTextoResultados(datos.consultaSQL);
    }
    if (datos.tablaOrigen) {
      setTablaOrigen(datos.tablaOrigen);
    }
    if (datos.camposDetectados && datos.camposDetectados.length > 0) {
      setCampos(datos.camposDetectados);
      setMostrarTabla(true);
    }
  }, []);

  /**
   * Copia un query al portapapeles
   */
  const copiarQuery = (query) => {
    navigator.clipboard.writeText(query);
    setMensajeValidacion('✅ Query copiado al portapapeles');
    setTimeout(() => setMensajeValidacion(''), 3000);
  };

  /**
   * Genera el query básico con el nombre de tabla actual
   */
  const generarQueryBasico = () => {
    const nombreTabla = tablaOrigen.trim() || 'TuTabla';
    return `SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = '${nombreTabla}'
ORDER BY ORDINAL_POSITION;`;
  };

  /**
   * Genera el query completo con el nombre de tabla actual
   */
  const generarQueryCompleto = () => {
    const nombreTabla = tablaOrigen.trim() || 'TuTabla';
    return `SELECT 
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.CHARACTER_MAXIMUM_LENGTH,
    c.NUMERIC_PRECISION,
    c.NUMERIC_SCALE,
    c.IS_NULLABLE,
    c.COLUMN_DEFAULT,
    ISNULL(ep.value, '') AS DESCRIPCION
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN sys.extended_properties ep
    ON ep.major_id = OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME)
    AND ep.minor_id = c.ORDINAL_POSITION
    AND ep.name = 'MS_Description'
WHERE c.TABLE_NAME = '${nombreTabla}'
ORDER BY c.ORDINAL_POSITION;`;
  };

  /**
   * Genera el query con PKs con el nombre de tabla actual
   */
  const generarQueryPKs = () => {
    const nombreTabla = tablaOrigen.trim() || 'TuTabla';
    return `SELECT 
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.CHARACTER_MAXIMUM_LENGTH,
    c.IS_NULLABLE,
    CASE 
        WHEN pk.COLUMN_NAME IS NOT NULL THEN 'SI'
        ELSE 'NO'
    END AS ES_LLAVE_PRIMARIA
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN (
    SELECT ku.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
        ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
    WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        AND ku.TABLE_NAME = '${nombreTabla}'
) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
WHERE c.TABLE_NAME = '${nombreTabla}'
ORDER BY c.ORDINAL_POSITION;`;
  };

  /**
   * Genera el query de ejemplo de datos
   */
  const generarQueryEjemplo = () => {
    const nombreTabla = tablaOrigen.trim() || 'TuTabla';
    return `SELECT TOP 10 * FROM ${nombreTabla};`;
  };

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
      let mensajeFinal = '';

      // CASO 1: Solo estructura de columnas
      if (textoEstructura.trim() && !textoResultados.trim()) {
        const estructuraParseada = parsearEstructuraColumnas(textoEstructura);
        if (estructuraParseada.length === 0) {
          setMensajeValidacion('❌ No se pudieron detectar columnas de la estructura. Verifica el formato.');
          return;
        }
        camposFinales = estructuraParseada;
        mensajeFinal = `✅ Se detectaron ${estructuraParseada.length} columnas desde la estructura`;
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
        
        // MOSTRAR ADVERTENCIA SI NO HAY ENCABEZADOS
        if (resultado.advertencia) {
          mensajeFinal = resultado.advertencia;
        } else {
          mensajeFinal = `✅ Se detectaron ${resultado.campos.length} columnas desde los resultados`;
        }
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
        
        // Mostrar advertencia si hay
        if (resultadoParseado.advertencia) {
          mensajeFinal = `✅ Se combinaron ${camposFinales.length} columnas. ${resultadoParseado.advertencia}`;
        } else {
          mensajeFinal = `✅ Se combinaron ${camposFinales.length} columnas (estructura + datos de ejemplo)`;
        }
      }

      // Actualizar estado
      setCampos(camposFinales);
      setMostrarTabla(true);
      setMensajeValidacion(mensajeFinal);

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
   * Limpia todos los campos
   */
  const handleLimpiar = () => {
    if (window.confirm('¿Estás seguro de limpiar todos los datos? Esta acción no se puede deshacer.')) {
      setTextoEstructura('');
      setTextoResultados('');
      setCampos([]);
      setMensajeValidacion('');
      setMostrarTabla(false);
      
      // Limpiar también en el estado padre
      onGuardar({
        consultaSQL: '',
        estructuraColumnas: '',
        tablaOrigen: tablaOrigen,
        camposDetectados: []
      });
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
    if (window.confirm(`¿Eliminar el campo "${campos[index].nombre}"?`)) {
      const camposActualizados = campos.filter((_, i) => i !== index);
      setCampos(camposActualizados);

      onGuardar({
        consultaSQL: textoResultados,
        estructuraColumnas: textoEstructura,
        tablaOrigen: tablaOrigen,
        camposDetectados: camposActualizados
      });
    }
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
        <p className={styles.helper}>
          💡 Ingresa el nombre de la tabla o vista que alimenta tu reporte de Power BI
        </p>
      </div>

      {/* Paso 2: Estructura de Columnas */}
      <div className={styles.seccion}>
        <h3>Paso 2A: Estructura de Columnas (Opcional pero recomendado)</h3>
        <p className={styles.instruccion}>
          🔍 <strong>Queries sugeridos:</strong> Ejecuta alguno de estos queries en SSMS y pega los resultados aquí:
        </p>

        {/* Botones para mostrar queries */}
        <div className={styles.botonesQuery}>
          <button 
            onClick={() => setMostrarQueryBasico(!mostrarQueryBasico)}
            className={styles.btnQuery}
          >
            {mostrarQueryBasico ? '▼' : '▶'} Query Básico (Recomendado)
          </button>
          <button 
            onClick={() => setMostrarQueryCompleto(!mostrarQueryCompleto)}
            className={styles.btnQuery}
          >
            {mostrarQueryCompleto ? '▼' : '▶'} Query Completo
          </button>
          <button 
            onClick={() => setMostrarQueryPKs(!mostrarQueryPKs)}
            className={styles.btnQuery}
          >
            {mostrarQueryPKs ? '▼' : '▶'} Query con PKs
          </button>
        </div>

        {/* Query Básico */}
        {mostrarQueryBasico && (
          <div className={styles.queryBox}>
            <div className={styles.queryHeader}>
              <strong>Query Básico - Estructura de Columnas:</strong>
              <button 
                onClick={() => copiarQuery(generarQueryBasico())}
                className={styles.btnCopiarQuery}
                title="Copiar query"
              >
                📋 Copiar
              </button>
            </div>
            <pre>{generarQueryBasico()}</pre>
          </div>
        )}

        {/* Query Completo */}
        {mostrarQueryCompleto && (
          <div className={styles.queryBox}>
            <div className={styles.queryHeader}>
              <strong>Query Completo - Con descripciones:</strong>
              <button 
                onClick={() => copiarQuery(generarQueryCompleto())}
                className={styles.btnCopiarQuery}
                title="Copiar query"
              >
                📋 Copiar
              </button>
            </div>
            <pre>{generarQueryCompleto()}</pre>
          </div>
        )}

        {/* Query con PKs */}
        {mostrarQueryPKs && (
          <div className={styles.queryBox}>
            <div className={styles.queryHeader}>
              <strong>Query con Llaves Primarias:</strong>
              <button 
                onClick={() => copiarQuery(generarQueryPKs())}
                className={styles.btnCopiarQuery}
                title="Copiar query"
              >
                📋 Copiar
              </button>
            </div>
            <pre>{generarQueryPKs()}</pre>
          </div>
        )}

        <div className={styles.ejemploFormato}>
          <strong>Ejemplo de formato esperado (separado por TABS):</strong>
          <pre>
{`COLUMN_NAME           DATA_TYPE    CHARACTER_MAXIMUM_LENGTH    IS_NULLABLE
COD_PERIODO_ACADEMICO VARCHAR2     24                          N
COD_TIPO_DOCUMENTO    VARCHAR2     16                          Y
NUM_DOC_PERSONA       VARCHAR2     200                         Y`}
          </pre>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Pega aquí la estructura de columnas desde INFORMATION_SCHEMA...
Los datos pueden estar separados por TABS (recomendado) o espacios múltiples."
          value={textoEstructura}
          onChange={(e) => setTextoEstructura(e.target.value)}
          rows={8}
        />
      </div>

      {/* Paso 3: Resultados de Datos */}
      <div className={styles.seccion}>
        <h3>Paso 2B: Resultados de Datos (Opcional)</h3>
        
        <div className={styles.advertenciaImportante}>
          <strong>⚠️ IMPORTANTE:</strong> Para mejores resultados, copia <strong>CON ENCABEZADOS</strong>:
          <ul>
            <li>En <strong>SSMS</strong>: Click derecho → <strong>Copy with Headers</strong></li>
            <li>En <strong>Oracle SQL Developer</strong>: Selecciona TODO incluyendo los nombres de columnas</li>
          </ul>
          Si pegas solo datos sin encabezados, se generarán nombres automáticos (COL_1, COL_2, etc.)
        </div>

        <p className={styles.instruccion}>
          🔍 <strong>Instrucciones:</strong> Ejecuta un SELECT de ejemplo y pega los resultados 
          (incluyendo encabezados). Esto ayuda a inferir mejor los tipos de datos.
        </p>

        {/* Botón para mostrar query de ejemplo */}
        <div className={styles.botonesQuery}>
          <button 
            onClick={() => setMostrarQueryEjemplo(!mostrarQueryEjemplo)}
            className={styles.btnQuery}
          >
            {mostrarQueryEjemplo ? '▼' : '▶'} Query de Ejemplo de Datos
          </button>
        </div>

        {/* Query de Ejemplo */}
        {mostrarQueryEjemplo && (
          <div className={styles.queryBox}>
            <div className={styles.queryHeader}>
              <strong>Query de Ejemplo - Primeras 10 filas:</strong>
              <button 
                onClick={() => copiarQuery(generarQueryEjemplo())}
                className={styles.btnCopiarQuery}
                title="Copiar query"
              >
                📋 Copiar
              </button>
            </div>
            <pre>{generarQueryEjemplo()}</pre>
          </div>
        )}

        <div className={styles.ejemploFormato}>
          <strong>Ejemplo CORRECTO (con encabezados):</strong>
          <pre>
{`COD_PERIODO_ACADEMICO COD_TIPO_DOCUMENTO NUM_DOC_PERSONA CODIGO_ESTUDIANTE
202110                CC                 1046908774      105580587
202110                CC                 1234567890      105580588`}
          </pre>
          <strong style={{ color: '#e74c3c' }}>Ejemplo INCORRECTO (sin encabezados - se detectarán automáticamente):</strong>
          <pre style={{ color: '#7f8c8d' }}>
{`202110                CC                 1046908774      105580587
202110                CC                 1234567890      105580588`}
          </pre>
        </div>

        <textarea
          className={styles.textarea}
          placeholder="Pega aquí algunos resultados de ejemplo (SELECT TOP 10 * FROM tabla)...
Los datos pueden estar separados por TABS (recomendado) o espacios múltiples.
IMPORTANTE: Incluye los encabezados de columna para mejores resultados."
          value={textoResultados}
          onChange={(e) => setTextoResultados(e.target.value)}
          rows={10}
        />
      </div>

      {/* Botones de Acción */}
      <div className={styles.seccionBoton}>
        <button 
          onClick={handleAnalizar}
          className={styles.btnAnalizar}
          disabled={!textoEstructura.trim() && !textoResultados.trim()}
        >
          🔍 Analizar y Detectar Columnas
        </button>

        {campos.length > 0 && (
          <button 
            onClick={handleLimpiar}
            className={styles.btnLimpiar}
          >
            🗑️ Limpiar Todo
          </button>
        )}

        {mensajeValidacion && (
          <div className={
            mensajeValidacion.startsWith('✅') 
              ? styles.mensajeExito 
              : mensajeValidacion.startsWith('⚠️')
              ? styles.mensajeAdvertencia
              : styles.mensajeError
          }>
            {mensajeValidacion}
          </div>
        )}
      </div>

      {/* Paso 4: Tabla de Campos Detectados */}
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
                  <th>#</th>
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
                    <td className={styles.celdaNumero}>{index + 1}</td>
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
                        <option value="VARCHAR2">VARCHAR2</option>
                        <option value="NVARCHAR">NVARCHAR</option>
                        <option value="INT">INT</option>
                        <option value="BIGINT">BIGINT</option>
                        <option value="NUMBER">NUMBER</option>
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