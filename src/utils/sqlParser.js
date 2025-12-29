/**
 * =====================================================
 * SQL PARSER MEJORADO v2.2
 * =====================================================
 * Mejoras:
 * - Detecta automáticamente si la primera línea son encabezados o datos
 * - Genera nombres automáticos de columnas si no hay encabezados
 * - Mejor manejo de resultados sin encabezados de SSMS
 * =====================================================
 */

/**
 * Parsea la estructura de columnas desde INFORMATION_SCHEMA
 * @param {string} textoEstructura - Resultado del query INFORMATION_SCHEMA.COLUMNS
 * @returns {array} - Array de campos con información detallada
 */
export function parsearEstructuraColumnas(textoEstructura) {
  if (!textoEstructura || textoEstructura.trim() === '') {
    return [];
  }

  try {
    // 1. Dividir en líneas y limpiar
    const lineas = textoEstructura
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);

    if (lineas.length < 2) {
      return [];
    }

    // 2. Extraer columnas del encabezado
    const columnas = extraerColumnas(lineas[0]);
    
    console.log('Columnas detectadas:', columnas);
    
    // Validar que tengamos al menos COLUMN_NAME y DATA_TYPE
    const tieneColumnName = columnas.some(c => c.toUpperCase().includes('COLUMN') || c.toUpperCase().includes('CAMPO'));
    const tieneDataType = columnas.some(c => c.toUpperCase().includes('DATA_TYPE') || c.toUpperCase().includes('TIPO'));
    
    if (!tieneColumnName || !tieneDataType) {
      console.warn('No se detectaron columnas COLUMN_NAME y DATA_TYPE');
      return [];
    }

    // 3. Extraer filas de datos (saltear líneas de separadores si existen)
    const filasDetectadas = extraerFilas(
      lineas.slice(1).filter(l => !l.match(/^[-=]+$/)), 
      columnas.length
    );

    console.log('Filas detectadas:', filasDetectadas.length);

    // 4. Identificar índices de columnas importantes
    const idxNombre = columnas.findIndex(c => 
      c.toUpperCase().includes('COLUMN_NAME') || c.toUpperCase().includes('CAMPO')
    );
    const idxTipo = columnas.findIndex(c => 
      c.toUpperCase().includes('DATA_TYPE') || c.toUpperCase().includes('TIPO')
    );
    const idxLongitud = columnas.findIndex(c => 
      c.toUpperCase().includes('LENGTH') || c.toUpperCase().includes('LONGITUD') || c.toUpperCase().includes('MAXIMUM')
    );
    const idxNulable = columnas.findIndex(c => 
      c.toUpperCase().includes('NULLABLE') || c.toUpperCase().includes('NULO')
    );

    // 5. Construir campos
    const campos = filasDetectadas.map(fila => {
      const nombreCampo = fila[idxNombre] || '';
      const tipoDato = mapearTipoSQL(fila[idxTipo] || 'VARCHAR');
      const longitud = idxLongitud >= 0 ? (fila[idxLongitud] || '') : '';
      const aceptaNulos = idxNulable >= 0 ? (fila[idxNulable]?.toUpperCase() === 'YES' || fila[idxNulable]?.toUpperCase() === 'Y' || fila[idxNulable] === '1') : false;

      return {
        nombre: nombreCampo,
        tipo: tipoDato,
        longitud: longitud === 'NULL' ? '' : longitud,
        aceptaNulos: aceptaNulos,
        esLlave: detectarSiEsLlave(nombreCampo),
        descripcion: generarDescripcion(nombreCampo),
        usadoEnVisuales: [],
        participaEnFiltros: false,
        esMetrica: false
      };
    });

    return campos;

  } catch (error) {
    console.error('Error parseando estructura de columnas:', error);
    return [];
  }
}

/**
 * FUNCIÓN PRINCIPAL MEJORADA: Parsea resultados con detección automática de encabezados
 * @param {string} textoResultados - Texto copiado desde SSMS/SQL Developer
 * @returns {object} - Objeto con campos detectados y advertencias
 */
export function parsearResultadosSQL(textoResultados) {
  if (!textoResultados || textoResultados.trim() === '') {
    return { tablaOrigen: '', campos: [], advertencia: null };
  }

  try {
    // 1. Dividir en líneas y limpiar
    const lineas = textoResultados
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0)
      .filter(linea => !linea.match(/^[-=]+$/)); // Eliminar separadores

    if (lineas.length < 1) {
      return { tablaOrigen: '', campos: [], advertencia: 'No hay datos suficientes' };
    }

    // 2. Extraer primera línea
    const primeraLinea = extraerColumnas(lineas[0]);
    
    // 3. DETECTAR SI LA PRIMERA LÍNEA SON ENCABEZADOS O DATOS
    const tieneEncabezados = detectarSiSonEncabezados(primeraLinea);
    
    let columnas;
    let filasDetectadas;
    let advertencia = null;

    if (tieneEncabezados) {
      // CASO A: Primera línea son encabezados
      console.log('✅ Se detectaron encabezados en la primera línea');
      columnas = primeraLinea;
      filasDetectadas = lineas.length > 1 ? extraerFilas(lineas.slice(1), columnas.length) : [];
    } else {
      // CASO B: Primera línea son DATOS, no hay encabezados
      console.log('⚠️ No se detectaron encabezados. Generando nombres automáticos...');
      const numColumnas = primeraLinea.length;
      columnas = generarNombresColumnas(numColumnas);
      filasDetectadas = extraerFilas(lineas, columnas.length);
      advertencia = `⚠️ No se detectaron encabezados de columna. Se generaron nombres automáticos (COL_1, COL_2, etc.). Se recomienda incluir los encabezados en el resultado copiado.`;
    }

    console.log('Columnas finales:', columnas);
    console.log('Filas de datos:', filasDetectadas.length);

    // 4. Si no hay filas de datos, no podemos inferir tipos
    if (filasDetectadas.length === 0) {
      return {
        tablaOrigen: '',
        campos: columnas.map((nombreColumna, index) => ({
          nombre: nombreColumna,
          tipo: 'VARCHAR',
          longitud: '',
          aceptaNulos: false,
          esLlave: detectarSiEsLlave(nombreColumna),
          descripcion: generarDescripcion(nombreColumna),
          usadoEnVisuales: [],
          participaEnFiltros: false,
          esMetrica: false
        })),
        advertencia: advertencia || 'No hay filas de datos para inferir tipos'
      };
    }

    // 5. Inferir tipos de datos analizando los valores
    const campos = columnas.map((nombreColumna, index) => {
      // Obtener todos los valores de esta columna
      const valoresColumna = filasDetectadas.map(fila => fila[index]);
      
      return {
        nombre: nombreColumna,
        tipo: inferirTipoDato(valoresColumna),
        longitud: '',
        aceptaNulos: false,
        esLlave: detectarSiEsLlave(nombreColumna),
        descripcion: generarDescripcion(nombreColumna),
        usadoEnVisuales: [],
        participaEnFiltros: false,
        esMetrica: false
      };
    });

    return {
      tablaOrigen: '',
      campos: campos,
      datosEjemplo: filasDetectadas.slice(0, 5),
      advertencia: advertencia
    };

  } catch (error) {
    console.error('Error parseando resultados:', error);
    return { tablaOrigen: '', campos: [], advertencia: 'Error al parsear los datos' };
  }
}

/**
 * NUEVA FUNCIÓN: Detecta si una línea contiene encabezados o datos
 * Heurística: Los encabezados generalmente tienen:
 * - Letras con guiones bajos (COLUMN_NAME, DATA_TYPE)
 * - No son 100% numéricos
 * - Longitudes razonables (< 50 caracteres)
 * - Patrones comunes de nombres de campos
 */
function detectarSiSonEncabezados(valores) {
  if (!valores || valores.length === 0) return false;

  let puntajeEncabezado = 0;
  let totalValores = valores.length;

  for (const valor of valores) {
    const valorLimpio = valor.trim();
    
    // Si está vacío o es NULL, no aporta
    if (!valorLimpio || valorLimpio === 'NULL') continue;

    // 1. ¿Contiene guiones bajos? (común en nombres de columnas)
    if (/_/.test(valorLimpio)) {
      puntajeEncabezado += 2;
    }

    // 2. ¿Es puramente numérico? (probablemente dato, no encabezado)
    if (/^\d+$/.test(valorLimpio)) {
      puntajeEncabezado -= 2;
    }

    // 3. ¿Es una fecha? (probablemente dato)
    if (/^\d{4}-\d{2}-\d{2}/.test(valorLimpio) || /^\d{2}\/\d{2}\/\d{4}/.test(valorLimpio)) {
      puntajeEncabezado -= 2;
    }

    // 4. ¿Contiene palabras comunes de encabezados?
    const palabrasEncabezado = ['CODIGO', 'CODE', 'NOMBRE', 'NAME', 'FECHA', 'DATE', 'TIPO', 'TYPE', 'ID', 'NUM', 'COD'];
    if (palabrasEncabezado.some(palabra => valorLimpio.toUpperCase().includes(palabra))) {
      puntajeEncabezado += 1;
    }

    // 5. ¿Longitud excesiva? (>50 chars probablemente es dato)
    if (valorLimpio.length > 50) {
      puntajeEncabezado -= 1;
    }

    // 6. ¿Todo mayúsculas con guiones? (patrón común en SQL)
    if (/^[A-Z_]+$/.test(valorLimpio) && valorLimpio.length > 2) {
      puntajeEncabezado += 1;
    }

    // 7. ¿Es un email? (probablemente dato)
    if (/@/.test(valorLimpio) && /\./.test(valorLimpio)) {
      puntajeEncabezado -= 2;
    }
  }

  // Si el puntaje es positivo, probablemente son encabezados
  console.log(`Puntaje detección encabezados: ${puntajeEncabezado} (${totalValores} valores)`);
  return puntajeEncabezado > 0;
}

/**
 * NUEVA FUNCIÓN: Genera nombres automáticos de columnas
 * @param {number} cantidad - Número de columnas a generar
 * @returns {array} - Array de nombres generados
 */
function generarNombresColumnas(cantidad) {
  const nombres = [];
  for (let i = 1; i <= cantidad; i++) {
    nombres.push(`COL_${i}`);
  }
  return nombres;
}

/**
 * Combina datos de estructura + resultados para máxima precisión
 * @param {array} camposEstructura - Campos parseados desde INFORMATION_SCHEMA
 * @param {array} camposResultados - Campos parseados desde SELECT
 * @returns {array} - Campos combinados con la mejor información de ambas fuentes
 */
export function combinarDatosColumnas(camposEstructura, camposResultados) {
  if (camposEstructura.length === 0) return camposResultados;
  if (camposResultados.length === 0) return camposEstructura;

  // Combinar: usar estructura como base y enriquecer con resultados
  const camposCombinados = camposEstructura.map(campoEst => {
    const campoRes = camposResultados.find(cr => 
      cr.nombre.toUpperCase() === campoEst.nombre.toUpperCase()
    );

    if (campoRes) {
      return {
        ...campoEst,
        // Si el tipo inferido es más específico, usarlo
        tipo: campoEst.tipo === 'VARCHAR' && campoRes.tipo !== 'VARCHAR' 
          ? campoRes.tipo 
          : campoEst.tipo,
        descripcion: campoEst.descripcion || campoRes.descripcion
      };
    }

    return campoEst;
  });

  // Agregar campos que existan en resultados pero no en estructura
  camposResultados.forEach(campoRes => {
    const existeEnEstructura = camposCombinados.some(c => 
      c.nombre.toUpperCase() === campoRes.nombre.toUpperCase()
    );
    if (!existeEnEstructura) {
      camposCombinados.push(campoRes);
    }
  });

  return camposCombinados;
}

/**
 * Mapea tipos de SQL Server y Oracle a tipos simplificados
 */
function mapearTipoSQL(tipoOriginal) {
  const tipo = tipoOriginal.toUpperCase();
  
  const mapeo = {
    // SQL Server
    'VARCHAR': 'VARCHAR',
    'NVARCHAR': 'NVARCHAR',
    'CHAR': 'VARCHAR',
    'NCHAR': 'NVARCHAR',
    'TEXT': 'TEXT',
    'NTEXT': 'TEXT',
    'INT': 'INT',
    'INTEGER': 'INT',
    'BIGINT': 'BIGINT',
    'SMALLINT': 'INT',
    'TINYINT': 'INT',
    'DECIMAL': 'DECIMAL',
    'NUMERIC': 'NUMERIC',
    'FLOAT': 'FLOAT',
    'REAL': 'FLOAT',
    'MONEY': 'DECIMAL',
    'SMALLMONEY': 'DECIMAL',
    'DATE': 'DATE',
    'DATETIME': 'DATETIME',
    'DATETIME2': 'DATETIME2',
    'SMALLDATETIME': 'DATETIME',
    'TIME': 'DATETIME',
    'BIT': 'BIT',
    'BOOLEAN': 'BIT',
    
    // Oracle
    'VARCHAR2': 'VARCHAR2',
    'NVARCHAR2': 'NVARCHAR',
    'CLOB': 'TEXT',
    'NCLOB': 'TEXT',
    'NUMBER': 'NUMBER',
    'BINARY_INTEGER': 'INT',
    'PLS_INTEGER': 'INT',
    'BINARY_FLOAT': 'FLOAT',
    'BINARY_DOUBLE': 'FLOAT',
    'TIMESTAMP': 'DATETIME2',
    'INTERVAL': 'VARCHAR',
    'RAW': 'VARCHAR',
    'LONG': 'TEXT',
    'BLOB': 'TEXT',
    'BFILE': 'VARCHAR'
  };

  return mapeo[tipo] || 'VARCHAR';
}

/**
 * Extrae los nombres de columnas de la línea de encabezados
 * Prioriza TABS, luego pipes, luego espacios múltiples
 */
function extraerColumnas(lineaEncabezado) {
  // 1. Prioridad: TABS (más común en Oracle SQL Developer y SSMS)
  if (lineaEncabezado.includes('\t')) {
    return lineaEncabezado
      .split('\t')
      .map(col => col.trim())
      .filter(col => col.length > 0);
  }
  
  // 2. Segunda opción: Pipes
  if (lineaEncabezado.includes('|')) {
    return lineaEncabezado
      .split('|')
      .map(col => col.trim())
      .filter(col => col.length > 0);
  }
  
  // 3. Última opción: Múltiples espacios (2 o más)
  return lineaEncabezado
    .split(/\s{2,}/)
    .map(col => col.trim())
    .filter(col => col.length > 0);
}

/**
 * Extrae las filas de datos
 * Mejor manejo de TABS y espacios
 */
function extraerFilas(lineasDatos, numColumnas) {
  const filas = [];

  for (const linea of lineasDatos) {
    let valores;
    
    // 1. Prioridad: TABS
    if (linea.includes('\t')) {
      valores = linea.split('\t').map(v => v.trim());
    }
    // 2. Pipes
    else if (linea.includes('|')) {
      valores = linea.split('|').map(v => v.trim());
    }
    // 3. Espacios múltiples
    else {
      valores = linea.split(/\s{2,}/).map(v => v.trim());
    }

    // Validar que tenga sentido (al menos 50% de las columnas esperadas)
    if (valores.length >= Math.floor(numColumnas * 0.5)) {
      // Rellenar con vacíos si falta alguna columna
      while (valores.length < numColumnas) {
        valores.push('');
      }
      
      // Recortar si hay más columnas de las esperadas
      valores = valores.slice(0, numColumnas);
      
      filas.push(valores);
    }
  }

  return filas;
}

/**
 * Infiere el tipo de dato basándose en los valores de ejemplo
 */
function inferirTipoDato(valores) {
  const valoresValidos = valores.filter(v => v && v !== 'NULL' && v.trim() !== '');

  if (valoresValidos.length === 0) {
    return 'VARCHAR';
  }

  let esNumeroEntero = 0;
  let esNumeroDecimal = 0;
  let esFecha = 0;
  let esBooleano = 0;

  for (const valor of valoresValidos) {
    const valorLimpio = valor.trim();

    // Número entero
    if (/^-?\d+$/.test(valorLimpio)) {
      esNumeroEntero++;
      continue;
    }

    // Número decimal
    if (/^-?\d+[\.,]\d+$/.test(valorLimpio)) {
      esNumeroDecimal++;
      continue;
    }

    // Fecha (varios formatos)
    if (/^\d{4}-\d{2}-\d{2}/.test(valorLimpio) || 
        /^\d{2}\/\d{2}\/\d{4}/.test(valorLimpio) ||
        /^\d{4}\/\d{2}\/\d{2}/.test(valorLimpio) ||
        /^\d{8}$/.test(valorLimpio)) {
      esFecha++;
      continue;
    }

    // Booleano
    if (/^(true|false|1|0|yes|no|si|no|y|n)$/i.test(valorLimpio)) {
      esBooleano++;
      continue;
    }
  }

  const total = valoresValidos.length;

  if (esBooleano / total > 0.8) return 'BIT';
  if (esFecha / total > 0.8) return 'DATE';
  if (esNumeroDecimal / total > 0.8) return 'DECIMAL';
  if (esNumeroEntero / total > 0.8) {
    // Detectar si es BIGINT por el tamaño
    const tieneGrandes = valoresValidos.some(v => {
      const num = parseInt(v);
      return !isNaN(num) && (num > 2147483647 || num < -2147483648);
    });
    return tieneGrandes ? 'BIGINT' : 'INT';
  }

  return 'VARCHAR';
}

/**
 * Detecta si un campo es potencialmente una llave primaria
 */
function detectarSiEsLlave(nombreCampo) {
  const nombreUpper = nombreCampo.toUpperCase();
  
  const patronesLlave = [
    /_ID$/,
    /_CODIGO$/,
    /_CODE$/,
    /_KEY$/,
    /_PK$/,
    /^ID$/,
    /^CODIGO$/,
    /^CODE$/,
    /^KEY$/,
    /^COD_/,
    /_NUM$/,
  ];

  return patronesLlave.some(patron => patron.test(nombreUpper));
}

/**
 * Genera una descripción legible desde el nombre del campo
 */
function generarDescripcion(nombreCampo) {
  // Si es un nombre generado automáticamente, dar descripción genérica
  if (/^COL_\d+$/.test(nombreCampo)) {
    return `Columna ${nombreCampo.split('_')[1]}`;
  }

  const palabras = nombreCampo
    .split('_')
    .map(palabra => {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    });

  const nombreUpper = nombreCampo.toUpperCase();
  
  if (nombreUpper.endsWith('_ID')) {
    return `Identificador de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.startsWith('COD_') || nombreUpper.endsWith('_CODIGO')) {
    return `Código de ${palabras.filter(p => p.toUpperCase() !== 'COD' && p.toUpperCase() !== 'CODIGO').join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.endsWith('_NOMBRE') || nombreUpper.startsWith('NOM_')) {
    return `Nombre de ${palabras.filter(p => p.toUpperCase() !== 'NOM' && p.toUpperCase() !== 'NOMBRE').join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.endsWith('_FECHA')) {
    return `Fecha de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }

  if (nombreUpper.startsWith('NUM_')) {
    return `Número de ${palabras.slice(1).join(' ').toLowerCase()}`;
  }

  return palabras.join(' ');
}

/**
 * Valida el formato del texto pegado
 */
export function validarFormatoResultados(texto) {
  if (!texto || texto.trim() === '') {
    return { valido: false, mensaje: 'El texto está vacío' };
  }

  const lineas = texto.split('\n').filter(l => l.trim().length > 0);
  
  if (lineas.length < 1) {
    return { 
      valido: false, 
      mensaje: 'Se necesita al menos 1 línea de datos' 
    };
  }

  return { valido: true, mensaje: 'Formato válido' };
}