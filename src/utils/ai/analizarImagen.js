/**
 * =====================================================
 * ANALIZAR IMAGEN - UTILIDADES GEMINI VISION (v4.0)
 * 
 * ⭐ NUEVO EN v4.0:
 * - Recibe CONTEXTO SQL (nombres de campos disponibles)
 * - Prompt mejorado que infiere columnas no visibles
 * - Genera descripciones más específicas usando SQL
 * - Instrucciones para manejar tablas con scroll
 * =====================================================
 */

import { obtenerClienteGemini } from './geminiClient';

/**
 * Convierte un archivo de imagen a base64
 */
export const convertirImagenABase64 = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
};

/**
 * Función genérica para analizar una imagen con Gemini Vision
 */
export const analizarImagenConIA = async (imagen, prompt, mimeType = 'image/jpeg') => {
  try {
    const model = await obtenerClienteGemini();
    const base64Image = await convertirImagenABase64(imagen);
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.warn('La respuesta no es JSON válido, retornando texto:', text);
      return { textoRespuesta: text };
    }
    
  } catch (error) {
    console.error('❌ Error al analizar imagen con IA:', error);
    throw new Error(`Error al analizar imagen: ${error.message}`);
  }
};

/**
 * =====================================================
 * ⭐ v4.0: ANALIZAR DASHBOARD CON CONTEXTO COMPLETO
 * =====================================================
 * 
 * @param {File} imagen - Captura del dashboard
 * @param {Object} contexto - Contexto del usuario
 * @param {string} contexto.codigoReporte - Código del reporte
 * @param {string} contexto.nombreReporte - Nombre del reporte
 * @param {Array} contexto.camposSQL - Array de campos SQL disponibles
 */
export const analizarDashboardCompleto = async (imagen, contexto = {}) => {
  const { codigoReporte, nombreReporte, camposSQL = [] } = contexto;
  
  // ⭐ Construir sección de CONTEXTO SQL
  let seccionSQL = '';
  if (camposSQL && camposSQL.length > 0) {
    const listaCampos = camposSQL
      .slice(0, 50) // Limitar a 50 para no saturar el prompt
      .map(c => `- ${c.nombre} (${c.tipo}${c.longitud ? `(${c.longitud})` : ''})${c.descripcion ? `: ${c.descripcion}` : ''}`)
      .join('\n');
    
    seccionSQL = `
**📊 CONTEXTO SQL DISPONIBLE:**
Esta captura corresponde a un reporte que utiliza los siguientes campos de la base de datos:

${listaCampos}
${camposSQL.length > 50 ? `\n... y ${camposSQL.length - 50} campos más` : ''}

**⚠️ INSTRUCCIÓN CRÍTICA PARA TABLAS CON SCROLL:**
La tabla visible puede tener MÁS COLUMNAS a la derecha que no se ven en la captura.
Basándote en los CAMPOS SQL DISPONIBLES y en el NOMBRE del reporte:

1. **Identifica** qué columnas están visibles en la captura
2. **Infiere** qué otras columnas probablemente existen pero no se ven
3. **Menciona** en el objetivo las métricas/columnas clave del reporte completo

Ejemplo:
- Si el nombre dice "con créditos y promedios" pero NO ves esas columnas en la imagen,
  **DEBES MENCIONAR** que el reporte incluye esas métricas aunque no estén visibles.
- Si en el SQL hay campos como CREDITOS_ACUMULADOS, PROMEDIO_PONDERADO,
  **MENCIÓNALOS** en el objetivo aunque no aparezcan en la captura.
`;
  }
  
  // ⭐ Construir sección de contexto del usuario
  let seccionContextoUsuario = '';
  if (codigoReporte || nombreReporte) {
    seccionContextoUsuario = `
**🎯 CONTEXTO PROPORCIONADO POR EL USUARIO:**
${codigoReporte ? `- CÓDIGO DEL REPORTE: "${codigoReporte}"` : ''}
${nombreReporte ? `- NOMBRE DEL REPORTE: "${nombreReporte}"` : ''}

**⚠️ INSTRUCCIÓN CRÍTICA PARA EL OBJETIVO:**
Basándote en el código, nombre y campos SQL disponibles, genera un OBJETIVO ESPECÍFICO Y DETALLADO que explique:
1. QUÉ INFORMACIÓN EXACTA muestra este reporte (incluyendo columnas no visibles)
2. PARA QUÉ SE UTILIZA específicamente
3. QUÉ DECISIONES o ANÁLISIS permite realizar
4. QUÉ MÉTRICAS CLAVE contiene (aunque no estén todas visibles en la imagen)

**❌ NO USAR FRASES GENÉRICAS como:**
- "Proporciona información sobre..."
- "Permite visualizar datos de..."
- "Muestra información relacionada con..."

**✅ USA EL CONTEXTO COMPLETO (nombre + SQL) para ser ESPECÍFICO:**

Ejemplo MALO:
"Proporciona información sobre estudiantes matriculados"

Ejemplo BUENO (usando contexto SQL):
"Muestra el listado completo de estudiantes actualmente matriculados, incluyendo sus datos de identificación (tipo documento, número documento, ID Banner), información de contacto (email personal, email institucional), contexto académico (periodo académico, programa, modalidad, sede) y métricas de rendimiento académico (créditos acumulados, créditos del periodo, promedio ponderado acumulado). Permite a coordinadores académicos consultar la población estudiantil activa, verificar matrículas individuales, analizar el progreso crediticio de cada alumno y realizar seguimiento del rendimiento académico."

**SI NO HAY CONTEXTO, analiza la captura cuidadosamente e infiere el objetivo más específico posible.**
`;
  }
  
  const prompt = `Analiza esta captura completa de un reporte/dashboard de Power BI y extrae TODA la información visible.

${seccionSQL}
${seccionContextoUsuario}

**ANÁLISIS REQUERIDO (MUY DETALLADO):**

1. **INFORMACIÓN BÁSICA DEL REPORTE:**
   - **Título principal:** Busca el título más prominente (generalmente arriba)
   ${!nombreReporte ? '- Si el usuario NO proporcionó nombre, extrae el título exacto visible en la imagen' : '- Usa el nombre proporcionado por el usuario como prioritario'}
   ${!codigoReporte ? '- **Código o identificador:** Busca patrones tipo "BNR-XX-YY-##" o códigos alfanuméricos' : '- Usa el código proporcionado por el usuario'}
   - **Categoría:** Infiere del contenido (Académico, Financiero, Administrativo, SNIES, etc.)
   - **Objetivo:** ${nombreReporte || codigoReporte || camposSQL.length > 0 ? 'GENERA UN OBJETIVO ESPECÍFICO, COMPLETO Y DETALLADO usando TODO el contexto disponible (nombre + campos SQL). Menciona las columnas/métricas clave del reporte COMPLETO, aunque no todas sean visibles en la captura' : 'Deduce para qué sirve basándote en visuales y filtros'}

2. **INVENTARIO COMPLETO DE FILTROS:**
   - Cuenta TODOS los slicers/filtros visibles
   - Lista sus nombres (no valores, solo el label del filtro)
   - Identifica tipos de control:
     * Dropdown/combo
     * Slicer de lista
     * Slicer con búsqueda
     * Date picker
     * Range slider
     * Botones/toggles
   
   **Formato esperado:**
   \`\`\`json
   "filtrosDetectados": [
     {"nombre": "Periodo Académico", "tipo": "Slicer - Lista"},
     {"nombre": "Sede", "tipo": "Dropdown"},
     {"nombre": "Programa", "tipo": "Slicer con búsqueda"}
   ]
   \`\`\`

3. **INVENTARIO COMPLETO DE VISUALIZACIONES:**
   - Cuenta TODOS los visuales (tablas, gráficos, KPIs, tarjetas)
   - Lista sus títulos si son visibles
   - Identifica tipo de cada uno
   ${camposSQL.length > 0 ? '\n   - **IMPORTANTE:** Si ves una tabla, intenta mapear sus columnas visibles con los campos SQL disponibles' : ''}
   
   **Formato esperado:**
   \`\`\`json
   "visualesDetectados": [
     {"titulo": "Listado de Estudiantes", "tipo": "Tabla"},
     {"titulo": "Distribución por Programa", "tipo": "Gráfico de Barras"},
     {"titulo": "Total Matriculados", "tipo": "KPI Card"}
   ]
   \`\`\`

4. **ESTRUCTURA Y LAYOUT:**
   - ¿Cómo está organizado? (columnas, secciones, tabs)
   - ¿Hay KPIs destacados arriba? (indica métricas principales)
   - ¿Hay tablas de detalle abajo? (indica drill-down)
   - ¿Hay múltiples páginas/tabs visibles?

5. **ELEMENTOS ADICIONALES:**
   - Logotipos o branding visible
   - Fecha de última actualización
   - Notas o disclaimers
   - Botones de acción (exportar, imprimir, etc.)

6. **ANÁLISIS CONTEXTUAL:**
   - ¿Es un reporte de seguimiento? (tiene tendencias/comparaciones)
   - ¿Es un reporte operativo? (lista transaccional/detalle)
   - ¿Es un reporte ejecutivo? (KPIs y resúmenes)
   - ¿Es un reporte regulatorio? (SNIES, ministerio, etc.)

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombreReporte": "${nombreReporte || 'Nombre descriptivo completo extraído de la imagen'}",
  "codigoReporte": "${codigoReporte || 'BNR-XX-YY-## (si es visible en la imagen)'}",
  "categoria": "Categoría principal",
  "subcategoria": "Subcategoría (si aplica)",
  "objetivo": "Descripción ESPECÍFICA, COMPLETA y DETALLADA del propósito. ${nombreReporte || codigoReporte || camposSQL.length > 0 ? 'USA TODO EL CONTEXTO DISPONIBLE (nombre + campos SQL) para mencionar las métricas/columnas clave del reporte COMPLETO, aunque no todas sean visibles en la captura. Por ejemplo, si el nombre menciona créditos y promedios o si hay campos SQL de ese tipo, MENCIÓNALOS aunque no se vean en la imagen.' : 'Basado en análisis visual'}",
  "cantidadFiltros": 7,
  "filtrosDetectados": [
    {"nombre": "...", "tipo": "..."}
  ],
  "cantidadVisuales": 5,
  "visualesDetectados": [
    {"titulo": "...", "tipo": "..."}
  ],
  "tieneKPIs": true,
  "estructuraLayout": "Descripción de cómo está organizado visualmente",
  "tipoReporte": "Operativo | Ejecutivo | Analítico | Regulatorio",
  "fuenteDatos": "Banner | DWH | Otro (si es visible)",
  "confianza": 0.XX,
  "observaciones": "Notas adicionales relevantes${camposSQL.length > 0 ? '. Si detectaste columnas no visibles basándote en el contexto SQL, menciónalo aquí.' : ''}"
}

**IMPORTANTE:**
- Sé exhaustivo en el conteo de filtros y visuales
- Si no ves algo claramente, no lo inventes
- La confianza debe reflejar qué tan claro se ve todo
${nombreReporte || codigoReporte || camposSQL.length > 0 ? '- **PRIORIDAD MÁXIMA:** Usa TODO el contexto disponible (nombre + campos SQL) para generar un objetivo COMPLETO y ESPECÍFICO que mencione las funcionalidades del reporte COMPLETO, incluyendo columnas/métricas que probablemente existen pero no se ven en la captura' : ''}`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 2: ANALIZAR FILTRO DE POWER BI (MEJORADO v2.0)
 * =====================================================
 */
export const analizarFiltroDeImagen = async (imagen, camposDisponibles = []) => {
  
  // ====== ANÁLISIS DE CONTEXTO SQL ======
  const tieneContextoSQL = camposDisponibles.length > 0;
  
  // Clasificar campos por tipo
  const camposPorTipo = {
    fechas: [],
    numericos: [],
    textos: [],
    llaves: [],
    booleanos: []
  };
  
  if (tieneContextoSQL) {
    camposDisponibles.forEach(campo => {
      const tipo = campo.tipo?.toUpperCase() || '';
      const nombre = campo.nombre?.toUpperCase() || '';
      
      // Clasificar por tipo de dato
      if (tipo.includes('DATE') || tipo.includes('TIME') || 
          nombre.includes('FECHA') || nombre.includes('PERIODO')) {
        camposPorTipo.fechas.push(campo);
      } else if (tipo.includes('INT') || tipo.includes('DECIMAL') || 
                 tipo.includes('NUMERIC') || tipo.includes('FLOAT')) {
        camposPorTipo.numericos.push(campo);
      } else if (tipo.includes('BIT') || tipo.includes('BOOL')) {
        camposPorTipo.booleanos.push(campo);
      } else {
        camposPorTipo.textos.push(campo);
      }
      
      // Identificar llaves primarias
      if (campo.esLlave || nombre.includes('CODIGO') || nombre.includes('COD_')) {
        camposPorTipo.llaves.push(campo);
      }
    });
  }
  
  // ====== GENERAR SECCIÓN DE CONTEXTO DINÁMICO ======
  let seccionContextoSQL = '';
  
  if (tieneContextoSQL) {
    // Lista completa de campos (limitada a 30 para no saturar)
    const listaCampos = camposDisponibles
      .slice(0, 30)
      .map(c => {
        const extras = [];
        if (c.esLlave) extras.push('🔑 Llave');
        if (c.descripcion) extras.push(`"${c.descripcion}"`);
        
        return `   - ${c.nombre} (${c.tipo})${extras.length > 0 ? ' → ' + extras.join(' | ') : ''}`;
      })
      .join('\n');
    
    seccionContextoSQL = `
**📊 CONTEXTO SQL - ${camposDisponibles.length} CAMPOS DISPONIBLES:**

${listaCampos}
${camposDisponibles.length > 30 ? `\n   ... y ${camposDisponibles.length - 30} campos más` : ''}

**📂 CAMPOS CLASIFICADOS POR TIPO:**
${camposPorTipo.fechas.length > 0 ? `   🗓️ Fechas/Periodos (${camposPorTipo.fechas.length}): ${camposPorTipo.fechas.map(c => c.nombre).join(', ')}` : ''}
${camposPorTipo.numericos.length > 0 ? `   🔢 Numéricos (${camposPorTipo.numericos.length}): ${camposPorTipo.numericos.map(c => c.nombre).join(', ')}` : ''}
${camposPorTipo.llaves.length > 0 ? `   🔑 Códigos/IDs (${camposPorTipo.llaves.length}): ${camposPorTipo.llaves.map(c => c.nombre).join(', ')}` : ''}
${camposPorTipo.textos.length > 0 ? `   📝 Textos/Descripciones (${camposPorTipo.textos.length}): ${camposPorTipo.textos.slice(0, 10).map(c => c.nombre).join(', ')}${camposPorTipo.textos.length > 10 ? '...' : ''}` : ''}
`;
  } else {
    seccionContextoSQL = `
**⚠️ NO HAY CONTEXTO SQL DISPONIBLE**
El usuario aún no ha documentado campos en la Sección 2.
Genera el mejor análisis posible basándote ÚNICAMENTE en lo visible en la imagen.
`;
  }
  
  // ====== GENERAR EJEMPLOS DINÁMICOS ======
  let seccionEjemplos = '';
  
  if (tieneContextoSQL) {
    const ejemplosFecha = camposPorTipo.fechas.length > 0 
      ? `\n   📅 Si ves años o fechas → Campos candidatos: ${camposPorTipo.fechas.slice(0, 3).map(c => c.nombre).join(', ')}`
      : '';
    
    const ejemplosCodigo = camposPorTipo.llaves.length > 0
      ? `\n   🔑 Si ves códigos o IDs → Campos candidatos: ${camposPorTipo.llaves.slice(0, 3).map(c => c.nombre).join(', ')}`
      : '';
    
    const ejemplosConcatenados = camposDisponibles.length > 1
      ? `\n   ➕ Si el filtro muestra "Código - Nombre" o similar → Usa concatenación: "${camposDisponibles[0].nombre} + ${camposDisponibles[1]?.nombre || 'OTRO_CAMPO'}"`
      : '';
    
    seccionEjemplos = `
**💡 EJEMPLOS CONTEXTUALES PARA ESTE REPORTE:**
${ejemplosFecha}${ejemplosCodigo}${ejemplosConcatenados}

**IMPORTANTE:** Los ejemplos son solo orientación. Analiza la imagen y usa los campos SQL que REALMENTE correspondan.
`;
  }
  
  // ====== GENERAR INSTRUCCIONES DINÁMICAS DE MATCHING ======
  let instruccionesMatching = '';
  
  if (tieneContextoSQL) {
    instruccionesMatching = `
**🎯 ESTRATEGIA DE MATCHING INTELIGENTE (PRIORIDAD DESCENDENTE):**

1️⃣ **MATCHING DIRECTO (Prioridad Alta):**
   - Compara el TEXTO VISIBLE en el filtro con los NOMBRES de campos SQL
   - Busca coincidencias EXACTAS o muy similares
   - Ejemplo: Si ves "Periodo Académico" → busca "PERIODO_ACADEMICO" o "COD_PERIODO"
   - Ignora diferencias de mayúsculas/minúsculas y guiones/underscores

2️⃣ **MATCHING POR TIPO DE DATO (Prioridad Media-Alta):**
   ${camposPorTipo.fechas.length > 0 ? `- Si el filtro muestra AÑOS (2024, 2025) o FECHAS → Usa campos tipo DATE: ${camposPorTipo.fechas[0]?.nombre}` : ''}
   ${camposPorTipo.numericos.length > 0 ? `- Si el filtro muestra NÚMEROS o RANGOS → Usa campos numéricos: ${camposPorTipo.numericos[0]?.nombre}` : ''}
   ${camposPorTipo.textos.length > 0 ? `- Si el filtro muestra TEXTOS DESCRIPTIVOS → Usa campos VARCHAR: ${camposPorTipo.textos[0]?.nombre}` : ''}

3️⃣ **MATCHING POR VALORES VISIBLES (Prioridad Media):**
   - Analiza los VALORES que se muestran en el filtro
   - Si ves códigos cortos (P001, A01) → probablemente campos COD_xxx
   - Si ves nombres largos descriptivos → probablemente campos NOM_xxx o DESCRIPCION_xxx
   - Si ves combinaciones "Código - Nombre" → concatenación de ambos campos

4️⃣ **MATCHING SEMÁNTICO (Prioridad Baja):**
   - Usa el CONTEXTO y DESCRIPCIÓN de los campos SQL
   - Ejemplo: "Filtro de Sede" puede corresponder a NOMBRE_SEDE, DESCRIPCION_SEDE, COD_SEDE, etc.
   - Lee las DESCRIPCIONES de los campos SQL para hacer mejor matching

5️⃣ **CONCATENACIÓN INTELIGENTE:**
   - Si el filtro muestra DOS tipos de información (código + descripción), usa el formato:
     **"CAMPO_CODIGO + CAMPO_NOMBRE"**
   - Ejemplo: "P001 - Ingeniería de Sistemas" → "COD_PROGRAMA + NOM_PROGRAMA"
   - Usa el operador " + " (CON ESPACIOS antes y después)
   - Orden lógico: primero código, luego nombre/descripción

⚠️ **REGLAS CRÍTICAS:**
- Si NO encuentras coincidencia clara → usa "campoSQL": "Campo no identificado - [descripción de lo visible]"
- Si tienes DUDA entre varios campos → elige el más específico y menciona alternativas en "razonamiento"
- SIEMPRE explica en "razonamiento" por qué elegiste ese campo
`;
  } else {
    instruccionesMatching = `
**⚠️ SIN CONTEXTO SQL - MODO DESCRIPTIVO:**
Ya que no hay campos SQL disponibles, DESCRIBE lo que ves en el filtro de la forma más específica posible:
- Nombre del filtro
- Tipo de control
- Valores visibles
- Para "campoSQL" usa: "Campo no disponible - [descripción de lo que filtra]"
`;
  }
  
  // ====== GENERAR INSTRUCCIONES DE TIPO DE CONTROL ======
  const instruccionesTipoControl = `
**🎨 IDENTIFICACIÓN DE TIPO DE CONTROL (MUY IMPORTANTE):**

Analiza CUIDADOSAMENTE la imagen y clasifica el control en UNO de estos tipos:

**TIPOS DISPONIBLES:**
1. **"Segmentación (Slicer) - Lista"**
   - Lista vertical u horizontal de opciones
   - Permite selección única o múltiple
   - Se ven varias opciones a la vez

2. **"Segmentación (Slicer) - Menú desplegable"**
   - Dropdown/combo box
   - Solo se ve la opción seleccionada
   - Tiene flecha hacia abajo (▼)

3. **"Segmentación (Slicer) - Mosaico/Botones"**
   - Botones rectangulares o cuadrados
   - Estilo visual tipo "tiles" o "chips"
   - Cada opción es un botón independiente

4. **"Segmentación (Slicer) - Entre (Fechas/Números)"**
   - Control de rango (desde-hasta)
   - Típico para fechas o números
   - Tiene dos campos o un slider

5. **"Filtro Panel Lateral"**
   - Filtro que está en el panel derecho de Power BI
   - NO es un slicer visual en el canvas

6. **"Filtro URL"**
   - Filtro aplicado mediante parámetros URL
   - Generalmente NO visible en la interfaz

**IMPORTANTE:** Elige EL TIPO MÁS ESPECÍFICO que corresponda a lo que ves.
`;
  
  // ====== CONSTRUIR PROMPT COMPLETO DINÁMICO ======
  const prompt = `Eres un experto analista de reportes de Power BI. Tu tarea es analizar la imagen de un FILTRO o SLICER y extraer TODA su información con MÁXIMA PRECISIÓN.

${seccionContextoSQL}
${seccionEjemplos}
${instruccionesMatching}
${instruccionesTipoControl}

**📝 INFORMACIÓN A EXTRAER:**

1. **Nombre del Filtro:**
   - Extrae el texto que identifica al filtro (usualmente arriba del control)
   - Si no hay texto visible, genera un nombre descriptivo basado en los valores

2. **Tipo de Control:**
   - Usa la clasificación detallada arriba
   - Sé específico (no uses solo "Slicer")

3. **Valores Visibles:**
   - Lista TODOS los valores que veas en el filtro
   - Sepáralos con comas
   - Incluye valores seleccionados y no seleccionados
   - Si hay muchos valores (>10), lista los primeros 10 y añade "..."

4. **Campo(s) SQL:**
   ${tieneContextoSQL 
     ? '- USA LAS INSTRUCCIONES DE MATCHING para identificar el/los campo(s) correcto(s)\n   - Si detectas concatenación, usa formato: "CAMPO1 + CAMPO2"'
     : '- Como no hay contexto SQL, describe lo que filtra: "Campo no disponible - [descripción]"'
   }

5. **Descripción Funcional:**
   - Explica PARA QUÉ sirve este filtro en el contexto del reporte
   - Menciona qué información del reporte se verá afectada al cambiar este filtro
   - Sé específico y orientado al usuario final

6. **Razonamiento:**
   - Explica CÓMO identificaste el campo SQL
   - Menciona las pistas visuales que usaste
   - Si hay ambigüedad, indica campos alternativos posibles

**🎯 FORMATO DE RESPUESTA (JSON ESTRICTO):**

{
  "nombre": "Nombre exacto del filtro extraído de la imagen",
  "tipoControl": "Tipo específico según clasificación (ej: Segmentación (Slicer) - Lista)",
  "valores": "Valor1, Valor2, Valor3, ... (todos los visibles)",
  "campoSQL": "${tieneContextoSQL ? 'NOMBRE_CAMPO_SQL o CAMPO1 + CAMPO2 si hay concatenación' : 'Campo no disponible - [descripción]'}",
  "descripcion": "Descripción funcional completa del filtro y su propósito en el reporte",
  "confianza": ${tieneContextoSQL ? '0.80' : '0.60'} (número decimal entre 0 y 1),
  "razonamiento": "Explicación detallada de cómo identificaste el campo SQL: qué pistas usaste, por qué descartaste otros campos, etc."
}

**⚠️ INSTRUCCIONES FINALES:**
- Responde SOLO con el JSON, sin texto adicional
- Si algo no es visible o no estás seguro, indica baja confianza
- Sé honesto: si no puedes identificar el campo SQL con certeza, dilo en el razonamiento
- Prioriza PRECISIÓN sobre inventar información
${tieneContextoSQL ? '- USA TODO EL CONTEXTO SQL disponible para hacer el mejor matching posible' : ''}

**ANALIZA LA IMAGEN AHORA:**`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 3: ANALIZAR VISUALIZACIÓN (MEJORADO v2.0)
 * =====================================================
 */
export const analizarVisualizacionDeImagen = async (imagen, camposDisponibles = []) => {
  
  // ====== ANÁLISIS DE CONTEXTO SQL ======
  const tieneContextoSQL = camposDisponibles.length > 0;
  
  // Clasificar campos por categoría funcional
  const camposPorCategoria = {
    dimensiones: [],      // Campos para agrupar/categorizar
    metricas: [],         // Campos numéricos para agregar
    fechas: [],          // Campos temporales
    textos: [],          // Campos descriptivos
    identificadores: [], // Códigos/IDs/PKs
    booleanos: []        // Campos Si/No
  };
  
  if (tieneContextoSQL) {
    camposDisponibles.forEach(campo => {
      const tipo = campo.tipo?.toUpperCase() || '';
      const nombre = campo.nombre?.toUpperCase() || '';
      
      // Clasificación inteligente
      if (tipo.includes('DATE') || tipo.includes('TIME') || 
          nombre.includes('FECHA') || nombre.includes('PERIODO')) {
        camposPorCategoria.fechas.push(campo);
      } else if (tipo.includes('BIT') || tipo.includes('BOOL')) {
        camposPorCategoria.booleanos.push(campo);
      } else if (tipo.includes('INT') || tipo.includes('DECIMAL') || 
                 tipo.includes('NUMERIC') || tipo.includes('FLOAT') || tipo.includes('MONEY')) {
        if (campo.esLlave || nombre.includes('CODIGO') || nombre.includes('COD_') || nombre.includes('ID')) {
          camposPorCategoria.identificadores.push(campo);
        } else {
          camposPorCategoria.metricas.push(campo);
        }
      } else {
        // VARCHAR/TEXT
        if (campo.esLlave || nombre.includes('CODIGO') || nombre.includes('COD_')) {
          camposPorCategoria.identificadores.push(campo);
        } else if (nombre.includes('NOMBRE') || nombre.includes('NOM_') || 
                   nombre.includes('DESCRIPCION') || nombre.includes('DESC_')) {
          camposPorCategoria.dimensiones.push(campo);
        } else {
          camposPorCategoria.textos.push(campo);
        }
      }
    });
  }
  
  // ====== GENERAR SECCIÓN DE CONTEXTO DINÁMICO ======
  let seccionContextoSQL = '';
  
  if (tieneContextoSQL) {
    const listaCampos = camposDisponibles
      .slice(0, 40)
      .map(c => {
        const badges = [];
        if (c.esLlave) badges.push('🔑');
        if (c.tipo?.includes('INT') || c.tipo?.includes('DECIMAL')) badges.push('🔢');
        if (c.tipo?.includes('DATE')) badges.push('📅');
        
        return `   ${badges.join('')} ${c.nombre} (${c.tipo})${c.descripcion ? ` - ${c.descripcion}` : ''}`;
      })
      .join('\n');
    
    seccionContextoSQL = `
**📊 CONTEXTO SQL - ${camposDisponibles.length} CAMPOS DISPONIBLES EN EL REPORTE:**

${listaCampos}
${camposDisponibles.length > 40 ? `\n   ... y ${camposDisponibles.length - 40} campos más` : ''}

**📂 CAMPOS CLASIFICADOS POR USO EN VISUALES:**

${camposPorCategoria.dimensiones.length > 0 ? `   📊 DIMENSIONES (para agrupar/categorizar): ${camposPorCategoria.dimensiones.map(c => c.nombre).slice(0, 8).join(', ')}${camposPorCategoria.dimensiones.length > 8 ? '...' : ''}` : ''}

${camposPorCategoria.metricas.length > 0 ? `   📈 MÉTRICAS NUMÉRICAS (para agregar/sumar): ${camposPorCategoria.metricas.map(c => c.nombre).slice(0, 8).join(', ')}${camposPorCategoria.metricas.length > 8 ? '...' : ''}` : ''}

${camposPorCategoria.fechas.length > 0 ? `   📅 TEMPORALES (para series de tiempo): ${camposPorCategoria.fechas.map(c => c.nombre).join(', ')}` : ''}

${camposPorCategoria.identificadores.length > 0 ? `   🔑 IDENTIFICADORES: ${camposPorCategoria.identificadores.map(c => c.nombre).slice(0, 6).join(', ')}${camposPorCategoria.identificadores.length > 6 ? '...' : ''}` : ''}

${camposPorCategoria.textos.length > 0 ? `   📝 TEXTOS DESCRIPTIVOS: ${camposPorCategoria.textos.map(c => c.nombre).slice(0, 6).join(', ')}${camposPorCategoria.textos.length > 6 ? '...' : ''}` : ''}
`;
  } else {
    seccionContextoSQL = `
**⚠️ NO HAY CONTEXTO SQL DISPONIBLE**
El usuario aún no ha documentado campos en la Sección 2.
Extrae SOLO la información visible en la imagen, sin inventar campos SQL.
`;
  }
  
  // ====== GENERAR GUÍA DE IDENTIFICACIÓN DE TIPOS ======
  const guiaTiposVisuales = `
**🎨 GUÍA DE IDENTIFICACIÓN DE TIPOS DE VISUALES:**

Analiza CUIDADOSAMENTE la imagen y clasifica el visual en el tipo MÁS ESPECÍFICO:

**TABLAS Y MATRICES:**
1. **"Tabla"** 
   - Filas y columnas simples
   - Datos tabulares sin jerarquía
   - Headers en la primera fila
   - Puede tener totales abajo

2. **"Matriz"**
   - Tabla con agrupaciones jerárquicas
   - Botones de expansión (+/-)
   - Puede tener totales por filas Y columnas
   - Estructura más compleja que tabla simple

**GRÁFICOS DE BARRAS:**
3. **"Gráfico de Barras Horizontales"**
   - Barras que crecen de izquierda a derecha
   - Categorías en eje Y (vertical)
   - Valores en eje X (horizontal)

4. **"Gráfico de Barras Verticales"** (también llamado Columnas)
   - Barras que crecen de abajo hacia arriba
   - Categorías en eje X (horizontal)
   - Valores en eje Y (vertical)

**GRÁFICOS DE LÍNEAS Y ÁREAS:**
5. **"Gráfico de Líneas"**
   - Líneas conectando puntos de datos
   - Típico para series de tiempo
   - Puede tener múltiples series (líneas)

6. **"Gráfico de Áreas"**
   - Similar a líneas pero con área rellena debajo
   - Puede ser apilado (stacked)

**GRÁFICOS CIRCULARES:**
7. **"Gráfico Circular (Pie)"**
   - Círculo dividido en sectores
   - Cada sector representa proporción del total
   - Muestra porcentajes o valores

8. **"Gráfico de Anillo (Donut)"**
   - Similar al circular pero con hueco en el centro
   - A veces muestra total en el centro

**VISUALES DE INSIGHTS:**
9. **"KPI Card"** (Tarjeta de KPI)
   - Muestra UN número grande destacado
   - Puede tener indicador de tendencia (↑↓)
   - A veces incluye mini gráfico (sparkline)
   - Fondo generalmente de color sólido

10. **"Medidor (Gauge)"**
    - Visual semicircular o circular
    - Aguja que apunta a un valor
    - Rangos de colores (verde/amarillo/rojo)
    - Similar a velocímetro

**OTROS TIPOS:**
11. **"Gráfico de Dispersión"**
    - Puntos distribuidos en cuadrante
    - Dos ejes numéricos
    - Muestra correlación entre variables

12. **"Mapa"**
    - Representación geográfica
    - Puntos, burbujas o regiones coloreadas
    - Se ve un mapa claramente

13. **"Embudo (Funnel)"**
    - Forma de embudo invertido
    - Etapas que se reducen progresivamente
    - Típico para procesos de conversión

14. **"Cascada (Waterfall)"**
    - Barras flotantes
    - Muestra incrementos/decrementos
    - Conectores entre barras

15. **"Treemap"**
    - Rectángulos anidados
    - Tamaño proporcional a valor
    - Jerarquía visual por áreas

16. **"Otro"**
    - Si no coincide con ninguna categoría anterior
    - ESPECIFICA qué tipo de visual es en la descripción

**⚠️ IMPORTANTE:** Si dudas entre dos tipos, elige el MÁS ESPECÍFICO y menciona la ambigüedad en el razonamiento.
`;
  
  // ====== INSTRUCCIONES DE ANÁLISIS ESTRUCTURADO ======
  const instruccionesAnalisis = `
**🔍 PROCESO DE ANÁLISIS PASO A PASO:**

**PASO 1: IDENTIFICAR TIPO DE VISUAL**
- Usa la guía de tipos arriba
- Observa la FORMA y ESTRUCTURA del visual
- Identifica elementos clave (ejes, leyendas, barras, líneas, etc.)

**PASO 2: EXTRAER TÍTULO**
- Busca el texto más prominente encima o dentro del visual
- Si no hay título visible, genera uno descriptivo basado en lo que muestra
- Ejemplo: Si ves una tabla de estudiantes → "Listado de Estudiantes"

**PASO 3: IDENTIFICAR CAMPOS UTILIZADOS**
${tieneContextoSQL ? `
**CON CONTEXTO SQL - USA MATCHING INTELIGENTE:**

Para TABLAS/MATRICES:
1. Lee los ENCABEZADOS de columnas
2. Compara cada encabezado con los campos SQL disponibles
3. Usa matching flexible:
   - Exacto: "Programa" → NOMBRE_PROGRAMA
   - Por tipo: Columna con números → campos numéricos
   - Semántico: "Créditos" → CREDITOS_ACUMULADOS, CREDITOS_APROBADOS
4. Lista TODOS los campos que identificaste

Para GRÁFICOS:
1. **EJE X:** ¿Qué campo se usa para categorizar? (dimensión)
   - En barras horizontales → eje Y
   - En barras verticales → eje X
   - Busca en: ${camposPorCategoria.dimensiones.map(c => c.nombre).slice(0, 5).join(', ')}

2. **EJE Y / VALORES:** ¿Qué métrica se muestra? (medida)
   - Generalmente campos numéricos agregados
   - Busca en: ${camposPorCategoria.metricas.map(c => c.nombre).slice(0, 5).join(', ')}

3. **LEYENDA:** ¿Hay series múltiples? ¿Por qué campo se agrupan?
   - Campo que crea las categorías de colores
   - Busca en dimensiones o identificadores

4. **TOOLTIPS:** Si ves tooltips en la imagen, ¿qué campos muestran?

**ESTRATEGIA DE MATCHING POR PRIORIDAD:**
1️⃣ Coincidencia EXACTA (ignorando mayúsculas/minúsculas)
2️⃣ Coincidencia PARCIAL (includes/contains)
3️⃣ Matching por TIPO de dato (número → numérico, fecha → temporal)
4️⃣ Matching SEMÁNTICO (Programa → NOMBRE_PROGRAMA, Código → COD_xxx)
5️⃣ Matching por CONTEXTO (columnas de totales → campos de métricas)
` : `
**SIN CONTEXTO SQL - MODO DESCRIPTIVO:**
- DESCRIBE los campos que ves (no inventes nombres SQL)
- Ejemplo: "camposVisibles": ["Nombre visible en columna 1", "Nombre visible en columna 2"]
- Sé literal con lo que ves en la imagen
`}

**PASO 4: IDENTIFICAR MÉTRICAS CALCULADAS**
${tieneContextoSQL ? `
Identifica si hay AGREGACIONES visibles:

**Indicadores de agregación:**
- Totales al final de tablas → SUM(campo_numérico)
- Promedios → AVG(campo_numérico)
- Conteos → COUNT(*) o COUNT(DISTINCT campo)
- Porcentajes → (valor/total)*100
- Máximos/Mínimos → MAX/MIN(campo)

**Formato de salida:**
"SUM(${camposPorCategoria.metricas[0]?.nombre || 'CAMPO_NUMERICO'}), COUNT(DISTINCT ${camposPorCategoria.identificadores[0]?.nombre || 'ID_CAMPO'})"

**Pistas visuales:**
- Columna "Total" → SUM
- Columna "Cantidad" → COUNT
- Columna "Promedio" → AVG
- Símbolo % → cálculo de porcentaje
` : `
Describe las métricas que veas sin nombres SQL:
"Total de registros, Suma de valores, Promedio calculado"
`}

**PASO 5: GENERAR DESCRIPCIÓN FUNCIONAL**
Responde estas preguntas en la descripción:
1. ¿QUÉ muestra este visual? (qué datos exactos)
2. ¿PARA QUÉ sirve? (propósito funcional)
3. ¿QUÉ INSIGHTS permite obtener? (qué decisiones apoya)
4. ¿CÓMO se usa? (interactivo, drill-down, tooltips, etc.)

**Ejemplo de descripción completa:**
"Tabla que presenta el listado completo de estudiantes matriculados, mostrando su información personal (documento, nombre), contexto académico (programa, periodo, sede) y métricas de rendimiento (créditos acumulados, promedio). Permite a coordinadores consultar el detalle individual de cada alumno, verificar su estado de matrícula, y analizar su progreso crediticio. El visual es interactivo y permite ordenar por cualquier columna."
`;
  
  // ====== INSTRUCCIONES DE DETALLES TÉCNICOS ======
  const instruccionesDetalles = `
**🔧 SECCIÓN "detallesCampos" - ANÁLISIS TÉCNICO:**

Esta sección captura la ESTRUCTURA interna del visual para poder recrearlo.

**Para GRÁFICOS (Barras, Líneas, Áreas, Circular, etc.):**
{
  "ejeX": "${camposPorCategoria.dimensiones[0]?.nombre || 'Campo de categoría'}", 
  "ejeY": "${camposPorCategoria.metricas[0]?.nombre || 'Métrica numérica'}",
  "leyenda": "${camposPorCategoria.dimensiones[1]?.nombre || 'Campo de series (si aplica)'} o null",
  "tooltips": ["Campo1", "Campo2"] // Campos adicionales que aparecen al hacer hover
}

**Para TABLAS:**
{
  "columnas": ["CAMPO_SQL_1", "CAMPO_SQL_2", "CAMPO_SQL_3", ...],
  "tieneTotal": true o false,
  "ordenamiento": "Columna por la que parece estar ordenada"
}

**Para MATRICES:**
{
  "columnasFilas": ["Campo agrupación filas"],
  "columnasColumnas": ["Campo agrupación columnas"],
  "valores": ["Métricas en el centro"],
  "nivelExpansion": "Expandido o Colapsado"
}

**Para KPI CARDS:**
{
  "metricaPrincipal": "${camposPorCategoria.metricas[0]?.nombre || 'Métrica destacada'}",
  "tieneTendencia": true o false,
  "tieneComparacion": true o false (vs periodo anterior, vs meta)
}
`;
  
  // ====== CONSTRUIR PROMPT COMPLETO DINÁMICO ======
  const prompt = `Eres un experto analista de visualizaciones de Power BI. Tu tarea es analizar esta imagen de un VISUAL (gráfico, tabla, KPI, etc.) y extraer TODA su información con MÁXIMA PRECISIÓN TÉCNICA.

${seccionContextoSQL}

${guiaTiposVisuales}

${instruccionesAnalisis}

${instruccionesDetalles}

**🎯 FORMATO DE RESPUESTA (JSON ESTRICTO):**

{
  "titulo": "Título exacto del visual (o generado si no es visible)",
  "tipo": "Tipo ESPECÍFICO según la guía (ej: Gráfico de Barras Horizontales)",
  "camposVisibles": [
    "${tieneContextoSQL ? camposDisponibles[0]?.nombre || 'CAMPO_SQL_1' : 'Nombre visible en imagen'}",
    "${tieneContextoSQL ? camposDisponibles[1]?.nombre || 'CAMPO_SQL_2' : 'Nombre visible en imagen'}",
    "..."
  ],
  "metricasCalculadas": "${tieneContextoSQL ? 'SUM(CAMPO_NUMERICO), COUNT(DISTINCT ID_CAMPO)' : 'Descripción de métricas visibles'}",
  "descripcion": "Descripción funcional COMPLETA: qué muestra, para qué sirve, qué insights proporciona, cómo se usa. MÍNIMO 3 oraciones.",
  "confianza": 0.XX (decimal entre 0 y 1),
  "detallesCampos": {
    "ejeX": "Campo del eje X (para gráficos) o null",
    "ejeY": "Métrica del eje Y (para gráficos) o null",
    "leyenda": "Campo de series (si aplica) o null",
    "columnas": ["Lista de columnas (para tablas)"] o null,
    "agrupaciones": ["Campos de jerarquía (para matrices)"] o null,
    "tooltips": ["Campos en tooltips (si visibles)"] o null
  },
  "razonamiento": "Explicación DETALLADA de cómo identificaste: (1) el tipo de visual, (2) los campos SQL matcheados, (3) las métricas calculadas. Menciona pistas visuales específicas que usaste."
}

**⚠️ REGLAS CRÍTICAS:**

1. **TIPO DE VISUAL:** Usa el nombre EXACTO de la guía (no inventes tipos)
2. **CAMPOS SQL:** 
   ${tieneContextoSQL 
     ? '- USA MATCHING INTELIGENTE con los campos disponibles\n   - Si no encuentras match claro, indica "Campo no identificado - [descripción]"\n   - NUNCA inventes nombres de campos SQL que no existan en el contexto'
     : '- Usa los nombres LITERALES que ves en la imagen\n   - NO inventes nombres SQL'
   }
3. **MÉTRICAS:** Identifica TODAS las agregaciones visibles (SUM, COUNT, AVG, etc.)
4. **DESCRIPCIÓN:** Debe ser FUNCIONAL (para qué sirve), no solo DESCRIPTIVA (qué es)
5. **DETALLES TÉCNICOS:** Completa "detallesCampos" según el tipo de visual
6. **RAZONAMIENTO:** Explica TU PROCESO de análisis, menciona pistas visuales
7. **CONFIANZA:** 
   - Alta (0.8-1.0): Todo claro, matching perfecto
   - Media (0.6-0.8): Algunas ambigüedades, matching parcial
   - Baja (0.0-0.6): Muchas incertidumbres, sin matching

**RESPONDE SOLO CON EL JSON. NO INCLUYAS TEXTO ADICIONAL NI MARKDOWN.**

**ANALIZA LA IMAGEN AHORA:**`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * FUNCIÓN DE VALIDACIÓN
 * =====================================================
 */
export const validarRespuestaIA = (respuesta, confianzaMinima = 0.7) => {
  if (!respuesta) {
    return { valida: false, mensaje: 'No se recibió respuesta de la IA' };
  }
  
  if (respuesta.confianza && respuesta.confianza < confianzaMinima) {
    return { 
      valida: false, 
      mensaje: `Confianza baja (${(respuesta.confianza * 100).toFixed(0)}%). Revisa los resultados cuidadosamente.` 
    };
  }
  
  return { valida: true, mensaje: 'Respuesta válida' };
};