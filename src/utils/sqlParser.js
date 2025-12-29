/**
 * =====================================================
 * SQL PARSER MEJORADO v2.1
 * =====================================================
 * Mejoras:
 * - Soporte optimizado para TABS (Oracle SQL Developer/SSMS)
 * - Detección automática de VARCHAR2 (Oracle)
 * - Mejor manejo de espacios y saltos de línea
 * - Soporte para NUMBER (Oracle)
 * =====================================================
 */

/**
 * FUNCIÓN MEJORADA: Parsea la estructura de columnas desde INFORMATION_SCHEMA
 * Ahora soporta mejor el formato con TABS de Oracle
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
 * Función principal que parsea el texto completo pegado por el usuario
 * Mejorada para manejar TABS de Oracle
 * @param {string} textoResultados - Texto copiado desde SSMS/SQL Developer
 * @returns {object} - Objeto con tabla origen y campos detectados
 */
export function parsearResultadosSQL(textoResultados) {
  if (!textoResultados || textoResultados.trim() === '') {
    return { tablaOrigen: '', campos: [] };
  }

  try {
    // 1. Dividir en líneas y limpiar
    const lineas = textoResultados
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0)
      .filter(linea => !linea.match(/^[-=]+$/)); // Eliminar separadores

    if (lineas.length < 2) {
      return { tablaOrigen: '', campos: [] };
    }

    // 2. Extraer columnas de la primera línea (encabezados)
    const columnas = extraerColumnas(lineas[0]);

    console.log('Columnas de resultados:', columnas);

    // 3. Extraer filas de datos (desde línea 2 en adelante)
    const filasDetectadas = extraerFilas(lineas.slice(1), columnas.length);

    console.log('Filas de resultados:', filasDetectadas.length);

    // 4. Inferir tipos de datos analizando los valores
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
      datosEjemplo: filasDetectadas.slice(0, 5)
    };

  } catch (error) {
    console.error('Error parseando resultados:', error);
    return { tablaOrigen: '', campos: [] };
  }
}

/**
 * NUEVA FUNCIÓN: Combina datos de estructura + resultados para máxima precisión
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
 * FUNCIÓN MEJORADA: Mapea tipos de SQL Server y Oracle a tipos simplificados
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
    
    // Oracle (NUEVOS)
    'VARCHAR2': 'VARCHAR2',
    'NVARCHAR2': 'NVARCHAR',
    'CHAR': 'VARCHAR',
    'NCHAR': 'NVARCHAR',
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
 * FUNCIÓN MEJORADA: Extrae los nombres de columnas de la línea de encabezados
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
 * FUNCIÓN MEJORADA: Extrae las filas de datos
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
 * FUNCIÓN MEJORADA: Infiere el tipo de dato basándose en los valores de ejemplo
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
 * FUNCIÓN MEJORADA: Detecta si un campo es potencialmente una llave primaria
 * Ahora incluye más patrones comunes de Oracle
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
    /^COD_/,  // Común en Oracle (COD_PERIODO, COD_PROGRAMA)
    /_NUM$/,  // Común para números identificadores
  ];

  return patronesLlave.some(patron => patron.test(nombreUpper));
}

/**
 * Genera una descripción legible desde el nombre del campo
 */
function generarDescripcion(nombreCampo) {
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
  
  if (lineas.length < 2) {
    return { 
      valido: false, 
      mensaje: 'Se necesitan al menos 2 líneas (encabezados y una fila de datos)' 
    };
  }

  return { valido: true, mensaje: 'Formato válido' };
}