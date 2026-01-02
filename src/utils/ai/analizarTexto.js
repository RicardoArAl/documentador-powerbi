/**
 * =====================================================
 * ANALIZAR TEXTO - UTILIDADES GEMINI PARA CÓDIGO SQL (v2.0)
 * 
 * Funciones para analizar código SQL (Stored Procedures,
 * Functions, Views, Queries) usando Gemini Text API
 * 
 * MEJORAS v2.0:
 * - Prompts mucho más detallados y específicos
 * - Mejor contexto académico (Banner, SNIES, etc.)
 * - Análisis de patrones comunes
 * - Descripciones más ricas y contextuales
 * 
 * Autor: Ricardo Aral
 * Fecha Actualización: 2026-01-01
 * =====================================================
 */

import { generarContenidoTexto, extraerJSON } from './geminiClient';

/**
 * =====================================================
 * FUNCIÓN 1: ANALIZAR CÓDIGO SQL COMPLETO (MEJORADO v2.0)
 * =====================================================
 */
export const analizarCodigoSQL = async (codigoSQL, tipo = 'Query') => {
  const prompt = `Eres un experto en SQL Server, Oracle y análisis de código SQL para sistemas académicos (Banner, SNIES).

**TIPO DE OBJETO:** ${tipo}

**CÓDIGO SQL A ANALIZAR:**
\`\`\`sql
${codigoSQL}
\`\`\`

**INSTRUCCIONES DETALLADAS:**

1. **IDENTIFICACIÓN PRECISA:**
   - Extrae el NOMBRE exacto del objeto (sin CREATE, ALTER, DROP)
   - Confirma o corrige el TIPO de objeto
   - Identifica el esquema si está presente (dbo, SATURN, GENERAL, etc.)

2. **PARÁMETROS COMPLETOS:**
   - Lista TODOS los parámetros de entrada con sus tipos
   - Indica si son obligatorios (@Param INT) u opcionales (@Param INT = NULL)
   - Incluye valores por defecto si existen
   - Formato: "@ProgramaID INT, @PeriodoID VARCHAR(10) = NULL"

3. **TABLAS Y VISTAS INVOLUCRADAS:**
   
   **Tablas de ENTRADA (FROM, JOIN, WHERE):**
   - Incluye prefijos de esquema si están presentes
   - Identifica patrones Banner: SATURN_*, GENERAL_*, FINANCE_*, etc.
   - Menciona aliases si hay JOINs complejos
   
   **Tablas de SALIDA (INSERT, UPDATE, DELETE, SELECT INTO):**
   - Si hace INSERT/UPDATE/DELETE, lista las tablas modificadas
   - Si retorna un SELECT, lista las columnas del resultado
   - Si crea tablas temporales (#temp, @table), inclúyelas

4. **DESCRIPCIÓN FUNCIONAL DETALLADA:**
   - ¿Qué hace el código en lenguaje natural? (3-5 líneas)
   - ¿Cuál es el flujo principal?
   - ¿Qué transformaciones aplica?
   - ¿Qué validaciones o filtros tiene?
   - ¿Para qué se usa típicamente?

5. **CONTEXTO ACADÉMICO (SI APLICA):**
   - Si usa tablas Banner (SATURN, GENERAL, etc.), menciona el módulo
   - Si es para SNIES, indica qué reporte genera
   - Si procesa datos académicos (estudiantes, programas, etc.), explica el contexto

6. **DEPENDENCIAS Y CONSIDERACIONES:**
   - ¿Llama a otros SPs, Functions o Views?
   - ¿Usa triggers o jobs?
   - ¿Tiene consideraciones de performance?
   - ¿Requiere permisos especiales?

**PATRONES RECONOCIDOS:**

**Banner (ERP Educativo):**
- SATURN_*: Módulo académico (estudiantes, cursos, registro)
- GENERAL_*: Datos generales (personas, direcciones)
- PAYROLL_*: Nómina
- FINANCE_*: Finanzas
- Prefijos: SA, GB, FI en funciones públicas

**SNIES (Colombia - Educación Superior):**
- Reportes: Inscritos, Admitidos, Matriculados, Graduados
- Campos comunes: SNIES_CODIGO, PROGRAMA_CODIGO, PERIODO

**SQL Server:**
- SP con "SP_" o "USP_": Stored Procedure personalizado
- FN con "FN_" o "UDF_": User-Defined Function
- Tablas con "#": Temporales locales
- Tablas con "##": Temporales globales
- Tablas con "@": Variables tipo tabla

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombre": "Nombre limpio del objeto (sin CREATE/ALTER)",
  "tipo": "Stored Procedure | Function | View | Query | Table-Valued Function | Scalar Function | Trigger",
  "esquema": "dbo | SATURN | GENERAL | otro (si es visible)",
  "descripcion": "Descripción funcional detallada de qué hace y para qué sirve (3-5 líneas). Incluye contexto académico si aplica.",
  "parametros": [
    {
      "nombre": "@Parametro1",
      "tipo": "INT | VARCHAR(50) | DATE | etc.",
      "obligatorio": true,
      "valorDefecto": null,
      "descripcion": "Para qué sirve este parámetro"
    }
  ],
  "tablasEntrada": [
    {
      "nombre": "SATURN.SFRSTCR",
      "esquema": "SATURN",
      "tipo": "Table",
      "uso": "FROM - Registro de estudiantes en cursos",
      "contexto": "Banner - Módulo académico"
    }
  ],
  "tablasSalida": [
    {
      "nombre": "ResultSet | TablaNombre",
      "operacion": "SELECT | INSERT | UPDATE",
      "columnas": ["COL1", "COL2"] o "Retorna dataset completo"
    }
  ],
  "logicaNegocio": "Descripción paso a paso del flujo completo del código",
  "contextoAcademico": "Si aplica: menciona si es para Banner, SNIES, qué módulo, qué proceso académico",
  "dependencias": ["SP_OtroProc", "FN_Calcular", "Job_Carga"] o "Ninguna",
  "complejidad": "Baja | Media | Alta",
  "notasPerformance": "Consideraciones de rendimiento y optimización",
  "confianza": 0.XX,
  "advertencias": ["Posibles problemas detectados o mejoras sugeridas"]
}

**EJEMPLO COMPLETO:**
{
  "nombre": "SP_ObtenerPensumEstudiante",
  "tipo": "Stored Procedure",
  "esquema": "dbo",
  "descripcion": "Procedimiento que retorna el pensum completo de un estudiante específico en un periodo académico. Consolida información de múltiples tablas Banner (SATURN) incluyendo materias cursadas, aprobadas, pendientes y equivalencias. Calcula créditos totales, aprobados y porcentaje de avance. Usado por el módulo de seguimiento académico para generar reportes de progreso estudiantil.",
  "parametros": [
    {
      "nombre": "@CodigoEstudiante",
      "tipo": "VARCHAR(20)",
      "obligatorio": true,
      "valorDefecto": null,
      "descripcion": "Identificador único del estudiante en Banner (PIDM o código institucional)"
    },
    {
      "nombre": "@PeriodoAcademico",
      "tipo": "VARCHAR(10)",
      "obligatorio": false,
      "valorDefecto": "NULL",
      "descripcion": "Código del periodo académico (formato: YYYYT donde T=1,2,3). Si es NULL, retorna todos los periodos."
    }
  ],
  "tablasEntrada": [
    {
      "nombre": "SATURN.SFRSTCR",
      "esquema": "SATURN",
      "tipo": "Table",
      "uso": "FROM - Consulta principal de registro de cursos",
      "contexto": "Banner - Student Registration: contiene inscripciones de estudiantes"
    },
    {
      "nombre": "SATURN.SSBSECT",
      "esquema": "SATURN",
      "tipo": "Table",
      "uso": "JOIN - Información de secciones",
      "contexto": "Banner - Section Schedule: datos de horarios y secciones"
    },
    {
      "nombre": "SATURN.SCBCRSE",
      "esquema": "SATURN",
      "tipo": "Table",
      "uso": "JOIN - Catálogo de cursos",
      "contexto": "Banner - Course Catalog: información de materias"
    }
  ],
  "tablasSalida": [
    {
      "nombre": "ResultSet",
      "operacion": "SELECT",
      "columnas": ["PeriodoCodigo", "MateriacodeCodigo", "MateriaNombre", "Creditos", "Calificacion", "Estado", "CreditosAprobados", "PorcentajeAvance"]
    }
  ],
  "logicaNegocio": "1) Valida existencia del estudiante mediante JOIN con SPRIDEN. 2) Consulta inscripciones en SFRSTCR filtrando por @CodigoEstudiante y opcionalmente por @PeriodoAcademico. 3) Cruza con catálogo de cursos SCBCRSE para obtener nombres y créditos. 4) Calcula créditos aprobados usando CASE sobre calificaciones finales. 5) Identifica prerrequisitos pendientes mediante subconsulta a SCRPRLE. 6) Ordena resultado por periodo DESC y materia ASC. 7) Retorna dataset completo con información del pensum.",
  "contextoAcademico": "Sistema Banner (Ellucian) - Módulo Student Records (SATURN). Usado para seguimiento de avance académico estudiantil. Genera datos para reportes de progreso curricular y detección de estudiantes próximos a graduación.",
  "dependencias": ["FN_CalcularPromedioAcumulado", "VW_EstudiantesActivos"],
  "complejidad": "Media",
  "notasPerformance": "Usa índices en SFRSTCR.PIDM y SFRSTCR.TERM_CODE para optimizar búsqueda. Evita cursores. Si el estudiante tiene más de 20 periodos, considerar paginación. Performance óptimo para consultas individuales (<500ms). Para procesamiento masivo, considerar tabla temporal.",
  "confianza": 0.92,
  "advertencias": [
    "No valida permisos FERPA para acceso a datos estudiantiles",
    "Calificación 'I' (Incompleto) no está manejada en el cálculo de aprobados",
    "No incluye cursos de transferencia externa"
  ]
}

Analiza el código SQL y responde SOLO con el JSON.`;

  try {
    console.log('🔍 Analizando código SQL con IA (v2.0 mejorado)...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
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
 * FUNCIÓN 2: MEJORAR DESCRIPCIONES DE CAMPOS (MEJORADO v2.0)
 * =====================================================
 */
export const mejorarDescripcionesCampos = async (campos, contexto = '') => {
  const prompt = `Eres un experto en bases de datos académicas (Banner, SNIES) y documentación técnica.

**CONTEXTO:** ${contexto || 'Campos de una tabla/vista de base de datos para reportes Power BI'}

**CAMPOS A MEJORAR:**
${campos.map((c, i) => `${i + 1}. ${c.nombre} (${c.tipo}) - Descripción actual: "${c.descripcion || 'Sin descripción'}"`).join('\n')}

**INSTRUCCIONES PARA DESCRIPCIONES MEJORADAS:**

1. **CONTEXTO ACADÉMICO BANNER:**
   - Si es código (COD_*, CODIGO_*): Explica qué identifica (estudiante, programa, periodo)
   - Si es nombre (NOM_*, NOMBRE_*): Especifica qué entidad describe
   - Si es fecha (FECHA_*, FEC_*): Indica qué evento registra
   - Si es email: Diferencia personal vs institucional
   - Si es documento: Menciona tipos válidos (CC, TI, CE, Pasaporte)

2. **PATRONES COMUNES BANNER:**
   - **COD_PERIODO_ACADEMICO**: Periodo académico (semestre/trimestre)
   - **PIDM**: Person Identification Master (ID único Banner)
   - **SPRIDEN_ID**: ID institucional del estudiante
   - **TERM_CODE**: Código de término académico (YYYYT)
   - **CRN**: Course Reference Number
   - **STPERKOT_***: Tablas de check-out
   - **SATURN_***: Módulo estudiantes
   - **GENERAL_***: Datos generales

3. **PATRONES SNIES (COLOMBIA):**
   - **SNIES_CODIGO**: Código SNIES del programa
   - **NIVEL_FORMACION**: Pregrado, Especialización, Maestría, Doctorado
   - **MODALIDAD**: Presencial, Distancia, Virtual
   - **JORNADA**: Diurna, Nocturna, Mixta

4. **DETALLES TÉCNICOS:**
   - Menciona si es llave primaria [PK] o foránea [FK]
   - Indica formato esperado: "Formato: YYYY-MM-DD" o "Formato: XXX-####"
   - Menciona valores típicos o rangos
   - Indica si es único, obligatorio, etc.

5. **EJEMPLOS CONCRETOS:**
   - Incluye ejemplos reales entre paréntesis
   - "Código del periodo académico. Formato: YYYYP (ej: 20251 = Año 2025, Periodo 1). [PK]"
   - "Correo electrónico personal del estudiante. Formato: usuario@dominio.com. Usado para notificaciones externas."

6. **LONGITUD Y ESTILO:**
   - Entre 20-50 palabras (conciso pero completo)
   - Evita redundancia con el nombre del campo
   - Usa lenguaje técnico pero claro
   - NO copies la descripción actual, MEJÓRALA

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "campos": [
    {
      "nombre": "CAMPO1",
      "descripcionMejorada": "Nueva descripción detallada con formato, contexto y ejemplos",
      "mejoras": "Breve nota de qué se agregó o cambió respecto a la descripción original"
    }
  ],
  "confianza": 0.XX,
  "observaciones": "Notas generales sobre los campos analizados (opcional)"
}

**EJEMPLO COMPLETO:**
{
  "campos": [
    {
      "nombre": "COD_PERIODO_ACADEMICO",
      "descripcionMejorada": "Código único que identifica el periodo académico (semestre/trimestre) en formato YYYYP, donde YYYY es el año y P el periodo (1=Primer semestre, 2=Segundo semestre, 3=Intersemestre). Ejemplo: 20251 = Primer semestre 2025. [PK]. Usado en todas las consultas temporales para filtrar información académica.",
      "mejoras": "Se agregó: formato específico, ejemplos concretos, indicación de llave primaria, y caso de uso común"
    },
    {
      "nombre": "EMAIL_PERSONAL",
      "descripcionMejorada": "Dirección de correo electrónico personal del estudiante, distinto al correo institucional. Formato: usuario@dominio.com. Longitud máxima 512 caracteres. Usado para comunicaciones externas, recuperación de contraseña y notificaciones cuando no está disponible en campus. Puede ser NULL si el estudiante no lo ha registrado.",
      "mejoras": "Se especificó: diferencia con email institucional, formato, longitud, casos de uso y posibilidad de NULL"
    },
    {
      "nombre": "NUM_DOC_PERSONA",
      "descripcionMejorada": "Número de documento de identificación oficial de la persona. Tipos válidos según COD_TIPO_DOCUMENTO: CC (Cédula Ciudadanía), TI (Tarjeta Identidad), CE (Cédula Extranjería), PA (Pasaporte), RC (Registro Civil). Longitud máxima 200 caracteres. Único por persona y tipo de documento. Usado como identificador alternativo al PIDM de Banner.",
      "mejoras": "Se agregó: tipos de documentos válidos con siglas, restricción de unicidad, longitud, y relación con PIDM Banner"
    }
  ],
  "confianza": 0.95,
  "observaciones": "Los campos analizados son típicos de sistemas académicos Banner. Se identificaron patrones estándar de nomenclatura."
}

Analiza los ${campos.length} campos y responde SOLO con el JSON.`;

  try {
    console.log('🔍 Mejorando descripciones de campos con IA (v2.0 mejorado)...');
    
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
 * FUNCIONES AUXILIARES (SE MANTIENEN IGUAL)
 * =====================================================
 */

export const detectarParametros = async (codigoSQL) => {
  const prompt = `Extrae SOLO los parámetros de entrada de este código SQL:

\`\`\`sql
${codigoSQL}
\`\`\`

Identifica TODOS los parámetros (empiezan con @), su tipo y valor por defecto.

Responde SOLO con JSON:
{
  "parametros": [
    {
      "nombre": "@Param1",
      "tipo": "INT",
      "valorDefecto": null,
      "descripcion": "Breve descripción"
    }
  ],
  "confianza": 0.95
}`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    return resultado?.parametros || [];
  } catch (error) {
    console.error('❌ Error detectando parámetros:', error);
    return [];
  }
};

export const extraerTablas = async (codigoSQL) => {
  const prompt = `Identifica TODAS las tablas involucradas en este código SQL:

\`\`\`sql
${codigoSQL}
\`\`\`

Separa tablas de entrada (FROM, JOIN) y salida (INSERT, UPDATE, SELECT INTO).

Responde SOLO con JSON:
{
  "tablasEntrada": ["TABLA1", "TABLA2"],
  "tablasSalida": ["TABLA3"],
  "confianza": 0.90
}`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    return resultado || { tablasEntrada: [], tablasSalida: [] };
  } catch (error) {
    console.error('❌ Error extrayendo tablas:', error);
    return { tablasEntrada: [], tablasSalida: [] };
  }
};

export const generarDescripcionSQL = async (codigoSQL) => {
  const prompt = `Genera una descripción en lenguaje natural de qué hace este código SQL:

\`\`\`sql
${codigoSQL}
\`\`\`

Máximo 3-4 oraciones. Enfócate en el objetivo funcional.

Responde SOLO con JSON:
{
  "descripcion": "Descripción clara y concisa",
  "confianza": 0.88
}`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    return resultado?.descripcion || 'Descripción no disponible';
  } catch (error) {
    console.error('❌ Error generando descripción:', error);
    return 'Descripción no disponible (error al generar con IA)';
  }
};

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

export const analizarCodigoSQLRapido = async (codigoSQL) => {
  const prompt = `Analiza este código SQL brevemente:

\`\`\`sql
${codigoSQL}
\`\`\`

Responde SOLO con JSON:
{
  "nombre": "Nombre del objeto",
  "tipo": "Tipo (SP, Function, View, Query)",
  "descripcion": "Descripción en 1-2 oraciones",
  "confianza": 0.90
}`;

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