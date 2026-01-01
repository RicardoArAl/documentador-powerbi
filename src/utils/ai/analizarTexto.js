/**
 * =====================================================
 * ANALIZAR TEXTO - UTILIDADES GEMINI PARA CÓDIGO SQL
 * 
 * Funciones para analizar código SQL (Stored Procedures,
 * Functions, Views, Queries) usando Gemini Text API
 * 
 * Autor: Ricardo Aral
 * Fecha: 2025-12-29
 * =====================================================
 */

import { generarContenidoTexto, extraerJSON } from './geminiClient';

/**
 * =====================================================
 * FUNCIÓN 1: ANALIZAR CÓDIGO SQL COMPLETO
 * =====================================================
 * Analiza un código SQL (SP, Function, View, Query)
 * y extrae información estructurada
 * 
 * @param {string} codigoSQL - Código SQL completo
 * @param {string} tipo - Tipo de objeto ('Stored Procedure', 'Function', etc.)
 * @returns {Promise<Object>} - Información estructurada del código
 */
export const analizarCodigoSQL = async (codigoSQL, tipo = 'Query') => {
  const prompt = `
Eres un experto en SQL Server y bases de datos. Analiza este código SQL y extrae información estructurada.

**TIPO DE OBJETO:** ${tipo}

**CÓDIGO SQL:**
\`\`\`sql
${codigoSQL}
\`\`\`

**INSTRUCCIONES:**
1. Identifica el NOMBRE del objeto (procedimiento, función, view, etc.)
2. Confirma o corrige el TIPO de objeto
3. Extrae todos los PARÁMETROS de entrada con sus tipos
4. Identifica las TABLAS INVOLUCRADAS (tanto de entrada como de salida)
5. Detecta los CAMPOS/COLUMNAS que retorna (si aplica)
6. Genera una DESCRIPCIÓN funcional de lo que hace el código
7. Identifica dependencias o consideraciones importantes

**TIPOS VÁLIDOS:**
- Stored Procedure
- Function
- View
- Query
- Table-Valued Function
- Scalar Function
- Trigger
- Otro

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombre": "Nombre del objeto detectado (sin CREATE, ALTER, etc.)",
  "tipo": "Tipo correcto del objeto",
  "parametros": "@Param1 INT, @Param2 VARCHAR(50)",
  "tablasEntrada": ["TBL_TABLA1", "TBL_TABLA2"],
  "tablasSalida": ["COLUMNA1", "COLUMNA2", "COLUMNA3"],
  "descripcion": "Descripción funcional detallada de lo que hace el código",
  "dependencias": "Menciona si depende de otros objetos o tiene consideraciones especiales",
  "confianza": 0.92
}

**IMPORTANTE:**
- Si el código no tiene parámetros, usa: "Sin parámetros"
- Si no retorna columnas, usa: []
- Sé específico en la descripción
- La confianza debe ser entre 0.0 y 1.0
`;

  try {
    console.log('🔍 Analizando código SQL con IA...');
    
    // Llamar a Gemini con el prompt
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    
    // Extraer JSON de la respuesta
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado) {
      throw new Error('No se pudo parsear la respuesta de la IA como JSON');
    }
    
    console.log('✅ Código SQL analizado correctamente');
    return resultado;
    
  } catch (error) {
    console.error('❌ Error al analizar código SQL:', error);
    throw new Error(`Error al analizar código SQL: ${error.message}`);
  }
};

/**
 * =====================================================
 * FUNCIÓN 2: DETECTAR PARÁMETROS DE UN CÓDIGO SQL
 * =====================================================
 * Extrae solo los parámetros de entrada de un código SQL
 * usando RegEx + IA para mejor precisión
 * 
 * @param {string} codigoSQL - Código SQL completo
 * @returns {Promise<Array>} - Array de objetos con parámetros
 */
export const detectarParametros = async (codigoSQL) => {
  const prompt = `
Eres un experto en SQL Server. Analiza este código SQL y extrae ÚNICAMENTE los parámetros de entrada.

**CÓDIGO SQL:**
\`\`\`sql
${codigoSQL}
\`\`\`

**INSTRUCCIONES:**
1. Identifica TODOS los parámetros de entrada (empiezan con @)
2. Para cada parámetro extrae: nombre, tipo de dato, valor por defecto (si tiene)
3. NO incluyas variables locales, solo parámetros de entrada

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "parametros": [
    {
      "nombre": "@ProgramaID",
      "tipo": "INT",
      "valorDefecto": null,
      "descripcion": "ID del programa académico"
    },
    {
      "nombre": "@PeriodoID",
      "tipo": "VARCHAR(10)",
      "valorDefecto": null,
      "descripcion": "Código del período académico"
    }
  ],
  "confianza": 0.95
}

**IMPORTANTE:**
- Si no hay parámetros, retorna array vacío: []
- Incluye el @ en el nombre
- Sé específico en las descripciones
`;

  try {
    console.log('🔍 Detectando parámetros con IA...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado || !resultado.parametros) {
      return [];
    }
    
    console.log(`✅ Detectados ${resultado.parametros.length} parámetros`);
    return resultado.parametros;
    
  } catch (error) {
    console.error('❌ Error detectando parámetros:', error);
    return [];
  }
};

/**
 * =====================================================
 * FUNCIÓN 3: EXTRAER TABLAS INVOLUCRADAS
 * =====================================================
 * Identifica todas las tablas que se usan en el código SQL
 * (tanto de entrada como de salida)
 * 
 * @param {string} codigoSQL - Código SQL completo
 * @returns {Promise<Object>} - Objeto con tablas de entrada y salida
 */
export const extraerTablas = async (codigoSQL) => {
  const prompt = `
Eres un experto en SQL Server. Analiza este código SQL e identifica TODAS las tablas involucradas.

**CÓDIGO SQL:**
\`\`\`sql
${codigoSQL}
\`\`\`

**INSTRUCCIONES:**
1. Identifica tablas de ENTRADA (FROM, JOIN, WHERE)
2. Identifica tablas de SALIDA (INSERT INTO, UPDATE, SELECT INTO)
3. NO incluyas variables temporales (empiezan con #)
4. Incluye views si se usan

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "tablasEntrada": ["TBL_PROGRAMAS", "TBL_PERIODOS", "VW_ESTUDIANTES"],
  "tablasSalida": ["TBL_PENSUM"],
  "confianza": 0.90
}

**IMPORTANTE:**
- Si no hay tablas, usa arrays vacíos: []
- Usa los nombres completos de las tablas
- NO incluyas alias
`;

  try {
    console.log('🔍 Extrayendo tablas con IA...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado) {
      return { tablasEntrada: [], tablasSalida: [] };
    }
    
    console.log(`✅ Detectadas ${resultado.tablasEntrada?.length || 0} tablas de entrada`);
    return resultado;
    
  } catch (error) {
    console.error('❌ Error extrayendo tablas:', error);
    return { tablasEntrada: [], tablasSalida: [] };
  }
};

/**
 * =====================================================
 * FUNCIÓN 4: GENERAR DESCRIPCIÓN DE CÓDIGO SQL
 * =====================================================
 * Genera una descripción en lenguaje natural de lo que
 * hace un código SQL
 * 
 * @param {string} codigoSQL - Código SQL completo
 * @returns {Promise<string>} - Descripción generada
 */
export const generarDescripcionSQL = async (codigoSQL) => {
  const prompt = `
Eres un experto en SQL Server. Lee este código SQL y genera una descripción clara y concisa en lenguaje natural de lo que hace.

**CÓDIGO SQL:**
\`\`\`sql
${codigoSQL}
\`\`\`

**INSTRUCCIONES:**
1. Explica el PROPÓSITO principal del código
2. Describe QUÉ DATOS procesa o retorna
3. Menciona CONDICIONES o FILTROS importantes
4. Usa lenguaje simple y directo
5. NO copies el código, EXPLICA lo que hace

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "descripcion": "Este stored procedure obtiene el pensum completo de un programa académico específico para un período dado. Filtra por estado activo y retorna las materias con sus créditos y prerequisitos.",
  "confianza": 0.88
}

**IMPORTANTE:**
- Máximo 3-4 oraciones
- Evita jerga técnica innecesaria
- Enfócate en el objetivo funcional
`;

  try {
    console.log('🔍 Generando descripción con IA...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado || !resultado.descripcion) {
      throw new Error('No se pudo generar descripción');
    }
    
    console.log('✅ Descripción generada correctamente');
    return resultado.descripcion;
    
  } catch (error) {
    console.error('❌ Error generando descripción:', error);
    return 'Descripción no disponible (error al generar con IA)';
  }
};

/**
 * =====================================================
 * FUNCIÓN 5: MEJORAR DESCRIPCIONES DE CAMPOS
 * =====================================================
 * Mejora las descripciones de campos SQL detectados
 * con contexto más detallado usando IA
 * 
 * @param {Array} campos - Array de campos con descripciones básicas
 * @param {string} contexto - Contexto adicional (nombre de tabla, propósito)
 * @returns {Promise<Array>} - Campos con descripciones mejoradas
 */
export const mejorarDescripcionesCampos = async (campos, contexto = '') => {
  const prompt = `
Eres un experto en bases de datos y documentación. Mejora las descripciones de estos campos SQL haciéndolas más claras y contextuales.

**CONTEXTO:** ${contexto || 'Campos de una tabla de base de datos'}

**CAMPOS A MEJORAR:**
${campos.map((c, i) => `${i + 1}. ${c.nombre} (${c.tipo}) - ${c.descripcion || 'Sin descripción'}`).join('\n')}

**INSTRUCCIONES:**
1. Para cada campo, genera una descripción CLARA y CONTEXTUAL
2. Menciona el PROPÓSITO del campo
3. Si es un código, explica su FORMATO (ej: YYYY-MM, NNNNNN, etc.)
4. Si es una llave, menciona qué identifica
5. Máximo 1-2 oraciones por campo

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "campos": [
    {
      "nombre": "COD_PERIODO_ACADEMICO",
      "descripcionMejorada": "Código único que identifica el período académico (semestre/año). Formato: YYYY-S (ejemplo: 2025-1 para primer semestre de 2025)"
    },
    {
      "nombre": "COD_TIPO_DOCUMENTO",
      "descripcionMejorada": "Tipo de documento de identificación (CC, TI, CE, etc.). Clave foránea referenciada de la tabla de tipos de documento"
    }
  ],
  "confianza": 0.92
}

**IMPORTANTE:**
- Mantén la precisión técnica
- Sé conciso pero informativo
- NO inventes información que no esté implícita
`;

  try {
    console.log('🔍 Mejorando descripciones de campos con IA...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'pro'); // Usar PRO para mejor calidad
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado || !resultado.campos) {
      throw new Error('No se pudieron mejorar las descripciones');
    }
    
    // Combinar campos originales con descripciones mejoradas
    const camposMejorados = campos.map(campo => {
      const mejorado = resultado.campos.find(c => c.nombre === campo.nombre);
      return {
        ...campo,
        descripcion: mejorado?.descripcionMejorada || campo.descripcion
      };
    });
    
    console.log(`✅ Mejoradas ${camposMejorados.length} descripciones`);
    return camposMejorados;
    
  } catch (error) {
    console.error('❌ Error mejorando descripciones:', error);
    // Retornar campos originales si falla
    return campos;
  }
};

/**
 * =====================================================
 * FUNCIÓN 6: VALIDAR RESPUESTA DE ANÁLISIS SQL
 * =====================================================
 * Valida que una respuesta de análisis SQL tenga
 * nivel de confianza aceptable
 * 
 * @param {Object} respuesta - Respuesta del análisis
 * @param {number} confianzaMinima - Umbral mínimo (default: 0.7)
 * @returns {Object} - { valida: boolean, mensaje: string }
 */
export const validarRespuestaSQL = (respuesta, confianzaMinima = 0.7) => {
  if (!respuesta) {
    return { 
      valida: false, 
      mensaje: 'No se recibió respuesta de la IA' 
    };
  }
  
  if (respuesta.confianza && respuesta.confianza < confianzaMinima) {
    return { 
      valida: false, 
      mensaje: `Confianza baja (${(respuesta.confianza * 100).toFixed(0)}%). Revisa los resultados manualmente.` 
    };
  }
  
  return { 
    valida: true, 
    mensaje: 'Análisis completado con confianza alta' 
  };
};

/**
 * =====================================================
 * FUNCIÓN 7: ANALIZAR CÓDIGO SQL RÁPIDO (SIN DETALLES)
 * =====================================================
 * Versión simplificada que solo detecta nombre, tipo y descripción
 * útil para análisis rápidos
 * 
 * @param {string} codigoSQL - Código SQL completo
 * @returns {Promise<Object>} - Información básica del código
 */
export const analizarCodigoSQLRapido = async (codigoSQL) => {
  const prompt = `
Analiza este código SQL y extrae SOLO: nombre, tipo y descripción breve.

**CÓDIGO SQL:**
\`\`\`sql
${codigoSQL}
\`\`\`

**RESPONDE ÚNICAMENTE CON JSON:**
{
  "nombre": "Nombre del objeto",
  "tipo": "Tipo (SP, Function, View, Query)",
  "descripcion": "Descripción en 1-2 oraciones",
  "confianza": 0.90
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    return resultado || { nombre: 'Desconocido', tipo: 'Query', descripcion: 'No disponible' };
  } catch (error) {
    console.error('❌ Error en análisis rápido:', error);
    return { nombre: 'Desconocido', tipo: 'Query', descripcion: 'Error al analizar' };
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

export default {
  analizarCodigoSQL,
  detectarParametros,
  extraerTablas,
  generarDescripcionSQL,
  mejorarDescripcionesCampos,
  validarRespuestaSQL,
  analizarCodigoSQLRapido
};