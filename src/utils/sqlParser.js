/**
 * =====================================================
 * SQL PARSER MEJORADO v2.0
 * =====================================================
 * Ahora soporta 3 modos:
 * 1. Parsear estructura de columnas (INFORMATION_SCHEMA)
 * 2. Parsear resultados de datos (SELECT * FROM)
 * 3. Combinar ambas fuentes para máxima precisión
 * =====================================================
 */

/**
 * NUEVA FUNCIÓN: Parsea la estructura de columnas desde INFORMATION_SCHEMA
 * @param {string} textoEstructura - Resultado del query INFORMATION_SCHEMA.COLUMNS
 * @returns {array} - Array de campos con información detallada
 */
export function parsearEstructuraColumnas(textoEstructura) {
  if (!textoEstructura || textoEstructura.trim() === '') {
    return [];
  }

  try {
    // 1. Dividir en líneas
    const lineas = textoEstructura
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);

    if (lineas.length < 2) {
      return [];
    }

    // 2. Extraer columnas del encabezado
    const columnas = extraerColumnas(lineas[0]);
    
    // Validar que tengamos al menos COLUMN_NAME y DATA_TYPE
    const tieneColumnName = columnas.some(c => c.toUpperCase().includes('COLUMN') || c.toUpperCase().includes('CAMPO'));
    const tieneDataType = columnas.some(c => c.toUpperCase().includes('DATA_TYPE') || c.toUpperCase().includes('TIPO'));
    
    if (!tieneColumnName || !tieneDataType) {
      console.warn('No se detectaron columnas COLUMN_NAME y DATA_TYPE');
      return [];
    }

    // 3. Extraer filas de datos
    const filasDetectadas = extraerFilas(lineas.slice(1), columnas.length);

    // 4. Identificar índices de columnas importantes
    const idxNombre = columnas.findIndex(c => 
      c.toUpperCase().includes('COLUMN_NAME') || c.toUpperCase().includes('CAMPO')
    );
    const idxTipo = columnas.findIndex(c => 
      c.toUpperCase().includes('DATA_TYPE') || c.toUpperCase().includes('TIPO')
    );
    const idxLongitud = columnas.findIndex(c => 
      c.toUpperCase().includes('LENGTH') || c.toUpperCase().includes('LONGITUD')
    );
    const idxNulable = columnas.findIndex(c => 
      c.toUpperCase().includes('NULLABLE') || c.toUpperCase().includes('NULO')
    );

    // 5. Construir campos
    const campos = filasDetectadas.map(fila => {
      const nombreCampo = fila[idxNombre] || '';
      const tipoDato = mapearTipoSQL(fila[idxTipo] || 'VARCHAR');
      const longitud = idxLongitud >= 0 ? (fila[idxLongitud] || '') : '';
      const aceptaNulos = idxNulable >= 0 ? (fila[idxNulable]?.toUpperCase() === 'YES' || fila[idxNulable] === '1') : false;

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
 * @param {string} textoResultados - Texto copiado desde SSMS
 * @returns {object} - Objeto con tabla origen y campos detectados
 */
export function parsearResultadosSQL(textoResultados) {
  if (!textoResultados || textoResultados.trim() === '') {
    return { tablaOrigen: '', campos: [] };
  }

  try {
    // 1. Dividir en líneas
    const lineas = textoResultados
      .split('\n')
      .map(linea => linea.trim())
      .filter(linea => linea.length > 0);

    if (lineas.length < 2) {
      return { tablaOrigen: '', campos: [] };
    }

    // 2. Extraer columnas de la primera línea (encabezados)
    const columnas = extraerColumnas(lineas[0]);

    // 3. Extraer filas de datos (desde línea 2 en adelante)
    const filasDetectadas = extraerFilas(lineas.slice(1), columnas.length);

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
      tablaOrigen: '', // El usuario lo ingresará manualmente o lo detectamos después
      campos: campos,
      datosEjemplo: filasDetectadas.slice(0, 5) // Solo primeras 5 filas
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
  // Si solo tenemos una fuente, retornar esa
  if (camposEstructura.length === 0) return camposResultados;
  if (camposResultados.length === 0) return camposEstructura;

  // Combinar: usar estructura como base y enriquecer con resultados
  const camposCombinados = camposEstructura.map(campoEst => {
    // Buscar campo correspondiente en resultados
    const campoRes = camposResultados.find(cr => 
      cr.nombre.toUpperCase() === campoEst.nombre.toUpperCase()
    );

    if (campoRes) {
      // Combinar: priorizar tipo de estructura, pero enriquecer con inferencia de resultados
      return {
        ...campoEst,
        // Si el tipo inferido es más específico, usarlo
        tipo: campoEst.tipo === 'VARCHAR' && campoRes.tipo !== 'VARCHAR' 
          ? campoRes.tipo 
          : campoEst.tipo,
        // Mantener descripción de estructura
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
 * Mapea tipos de SQL Server a tipos simplificados
 */
function mapearTipoSQL(tipoOriginal) {
  const tipo = tipoOriginal.toUpperCase();
  
  // Mapeo de tipos comunes
  const mapeo = {
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
    'BOOLEAN': 'BIT'
  };

  return mapeo[tipo] || 'VARCHAR';
}

/**
 * Extrae los nombres de columnas de la línea de encabezados
 * Soporta separadores: | (pipe), tabs, múltiples espacios
 */
function extraerColumnas(lineaEncabezado) {
  // Detectar separador más común
  let separador = '|';
  if (lineaEncabezado.includes('|')) {
    separador = '|';
  } else if (lineaEncabezado.includes('\t')) {
    separador = '\t';
  } else {
    // Si no hay separador claro, dividir por múltiples espacios
    return lineaEncabezado
      .split(/\s{2,}/)
      .map(col => col.trim())
      .filter(col => col.length > 0);
  }

  return lineaEncabezado
    .split(separador)
    .map(col => col.trim())
    .filter(col => col.length > 0);
}

/**
 * Extrae las filas de datos
 */
function extraerFilas(lineasDatos, numColumnas) {
  const filas = [];

  for (const linea of lineasDatos) {
    // Detectar separador
    let valores;
    if (linea.includes('|')) {
      valores = linea.split('|').map(v => v.trim());
    } else if (linea.includes('\t')) {
      valores = linea.split('\t').map(v => v.trim());
    } else {
      valores = linea.split(/\s{2,}/).map(v => v.trim());
    }

    // Solo agregar si tiene el número correcto de columnas
    if (valores.length === numColumnas) {
      filas.push(valores);
    }
  }

  return filas;
}

/**
 * Infiere el tipo de dato basándose en los valores de ejemplo
 */
function inferirTipoDato(valores) {
  // Filtrar valores vacíos o NULL
  const valoresValidos = valores.filter(v => v && v !== 'NULL' && v.trim() !== '');

  if (valoresValidos.length === 0) {
    return 'VARCHAR';
  }

  // Contadores para cada tipo
  let esNumeroEntero = 0;
  let esNumeroDecimal = 0;
  let esFecha = 0;
  let esBooleano = 0;

  for (const valor of valoresValidos) {
    const valorLimpio = valor.trim();

    // Verificar si es número entero
    if (/^-?\d+$/.test(valorLimpio)) {
      esNumeroEntero++;
      continue;
    }

    // Verificar si es número decimal
    if (/^-?\d+\.\d+$/.test(valorLimpio)) {
      esNumeroDecimal++;
      continue;
    }

    // Verificar si es fecha (varios formatos)
    if (/^\d{4}-\d{2}-\d{2}/.test(valorLimpio) || 
        /^\d{2}\/\d{2}\/\d{4}/.test(valorLimpio) ||
        /^\d{4}\/\d{2}\/\d{2}/.test(valorLimpio)) {
      esFecha++;
      continue;
    }

    // Verificar si es booleano
    if (/^(true|false|1|0|yes|no|si|no)$/i.test(valorLimpio)) {
      esBooleano++;
      continue;
    }
  }

  // Determinar tipo basado en mayoría
  const total = valoresValidos.length;

  if (esBooleano / total > 0.8) return 'BIT';
  if (esFecha / total > 0.8) return 'DATE';
  if (esNumeroDecimal / total > 0.8) return 'DECIMAL';
  if (esNumeroEntero / total > 0.8) return 'INT';

  // Por defecto VARCHAR
  return 'VARCHAR';
}

/**
 * Detecta si un campo es potencialmente una llave primaria
 */
function detectarSiEsLlave(nombreCampo) {
  const nombreUpper = nombreCampo.toUpperCase();
  
  // Patrones comunes de llaves
  const patronesLlave = [
    /_ID$/,
    /_CODIGO$/,
    /_KEY$/,
    /_PK$/,
    /^ID$/,
    /^CODIGO$/,
    /^KEY$/
  ];

  return patronesLlave.some(patron => patron.test(nombreUpper));
}

/**
 * Genera una descripción legible desde el nombre del campo
 * Convierte SNAKE_CASE a texto normal
 */
function generarDescripcion(nombreCampo) {
  // Convertir SNAKE_CASE a palabras
  const palabras = nombreCampo
    .split('_')
    .map(palabra => {
      // Capitalizar primera letra, resto minúsculas
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    });

  // Construir descripción según sufijos comunes
  const nombreUpper = nombreCampo.toUpperCase();
  
  if (nombreUpper.endsWith('_ID')) {
    return `Identificador de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.endsWith('_CODIGO')) {
    return `Código de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.endsWith('_NOMBRE')) {
    return `Nombre de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }
  
  if (nombreUpper.endsWith('_FECHA')) {
    return `Fecha de ${palabras.slice(0, -1).join(' ').toLowerCase()}`;
  }

  // Por defecto, unir todas las palabras
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