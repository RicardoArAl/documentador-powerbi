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
export const analizarVisualizacionDeImagen = async (
  imagen, 
  camposDisponibles = [],
  contextoAdicional = '' // ⭐ NUEVO PARÁMETRO
) => {
  
  // ====== ANÁLISIS DE CONTEXTO SQL ======
  const tieneContextoSQL = camposDisponibles.length > 0;
  const tieneContextoAdicional = contextoAdicional && contextoAdicional.trim().length > 0;
  
  // Clasificar campos por categoría funcional
  const camposPorCategoria = {
    dimensiones: [],
    metricas: [],
    fechas: [],
    textos: [],
    identificadores: [],
    booleanos: []
  };
  
  if (tieneContextoSQL) {
    camposDisponibles.forEach(campo => {
      const tipo = campo.tipo?.toUpperCase() || '';
      const nombre = campo.nombre?.toUpperCase() || '';
      
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
  
  // ====== ⭐ NUEVA SECCIÓN: PROCESAMIENTO DE CONTEXTO ADICIONAL ======
  let seccionContextoAdicional = '';
  
  if (tieneContextoAdicional) {
    const lineasContexto = contextoAdicional
      .trim()
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    const cantidadLineas = lineasContexto.length;
    const primerasLineas = lineasContexto.slice(0, 20).join('\n   ');
    
    seccionContextoAdicional = `
**⭐ CONTEXTO ADICIONAL PROPORCIONADO POR EL USUARIO:**

El usuario ha indicado que este visual contiene **${cantidadLineas} columnas/campos adicionales** 
que NO son completamente visibles en la imagen por scroll horizontal u otras limitaciones de espacio.

**LISTA COMPLETA DE COLUMNAS/CAMPOS:**
   ${primerasLineas}
   ${cantidadLineas > 20 ? `\n   ... y ${cantidadLineas - 20} campos más` : ''}

**⚠️ INSTRUCCIONES CRÍTICAS PARA EL ANÁLISIS:**

1. **CAMPOS VISIBLES EN IMAGEN:**
   - Identifica y extrae las columnas/campos que VES CLARAMENTE en la captura
   - Mapéalas con los campos SQL disponibles usando matching inteligente

2. **CAMPOS NO VISIBLES PERO EXISTENTES:**
   - Los campos del contexto adicional QUE NO APARECEN EN LA IMAGEN también forman parte del visual
   - **DEBES incluirlos** en "camposVisibles" junto con los que sí ves
   - Marca claramente en el "razonamiento" cuáles son visibles vs cuáles vienen del contexto

3. **DESCRIPCIÓN COMPLETA:**
   - Tu descripción DEBE mencionar TODOS los campos (visibles + contexto adicional)
   - Usa frases como: "Este visual contiene ${cantidadLineas} columnas en total. 
     En la captura son visibles X columnas: [lista], pero también incluye columnas 
     adicionales no visibles por scroll horizontal: [lista de contexto adicional]"
   - Sé ESPECÍFICO sobre qué información muestra el visual COMPLETO

4. **RAZONAMIENTO DETALLADO:**
   - Explica cuántas columnas identificaste visualmente en la imagen
   - Explica cuántas columnas adicionales fueron proporcionadas por el usuario
   - Menciona si hay columnas en el contexto adicional que NO matchean con campos SQL
   - Indica el nivel de completitud del análisis

**EJEMPLO DE RESPUESTA CORRECTA:**
{
  "titulo": "Tabla de Estudiantes Matriculados",
  "tipo": "Tabla",
  "camposVisibles": [
    "PERIODO_CODIGO",           // ← Visible en imagen
    "NOMBRE_COMPLETO",          // ← Visible en imagen  
    "DOCUMENTO_IDENTIDAD",      // ← Visible en imagen
    "EMAIL_INSTITUCIONAL",      // ← Del contexto adicional
    "EMAIL_PERSONAL",           // ← Del contexto adicional
    "CREDITOS_MATRICULADOS",    // ← Del contexto adicional
    "CREDITOS_APROBADOS",       // ← Del contexto adicional
    "PROMEDIO_ACUMULADO"        // ← Del contexto adicional
  ],
  "descripcion": "Tabla exhaustiva con información completa de estudiantes matriculados. Contiene 8 columnas en total: en la captura son visibles 3 columnas (periodo, nombre, documento), pero el visual también incluye columnas adicionales no visibles por scroll horizontal: email institucional, email personal, créditos matriculados, créditos aprobados y promedio acumulado. Permite consultar datos personales, contacto y rendimiento académico de cada alumno.",
  "razonamiento": "Identificadas 3 columnas visibles directamente en la imagen: PERIODO_CODIGO (superior izquierda), NOMBRE_COMPLETO (centro) y DOCUMENTO_IDENTIDAD (derecha). El usuario proporcionó 5 columnas adicionales mediante contexto adicional, todas ellas matchean perfectamente con campos SQL disponibles. El análisis está completo al 100% gracias al contexto proporcionado."
}

**NUNCA IGNORES EL CONTEXTO ADICIONAL. Es información REAL que complementa lo que ves en la imagen.**
`;
  }
  
  // ====== GENERAR SECCIÓN DE CONTEXTO SQL ======
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
  
  // ====== GENERAR GUÍA DE TIPOS (Mantenida igual) ======
  const guiaTiposVisuales = `
**🎨 GUÍA DE IDENTIFICACIÓN DE TIPOS DE VISUALES:**

Analiza CUIDADOSAMENTE la imagen y clasifica el visual en el tipo MÁS ESPECÍFICO:

**TABLAS Y MATRICES:**
1. **"Tabla"** - Filas y columnas simples, datos tabulares sin jerarquía
2. **"Matriz"** - Tabla con agrupaciones jerárquicas, botones de expansión (+/-)

**GRÁFICOS DE BARRAS:**
3. **"Gráfico de Barras Horizontales"** - Barras de izquierda a derecha
4. **"Gráfico de Barras Verticales"** - Barras de abajo hacia arriba

**GRÁFICOS DE LÍNEAS Y ÁREAS:**
5. **"Gráfico de Líneas"** - Líneas conectando puntos
6. **"Gráfico de Áreas"** - Líneas con área rellena debajo

**GRÁFICOS CIRCULARES:**
7. **"Gráfico Circular (Pie)"** - Círculo dividido en sectores
8. **"Gráfico de Anillo (Donut)"** - Similar al circular con hueco central

**VISUALES DE INSIGHTS:**
9. **"KPI Card"** - Un número grande destacado, posible indicador de tendencia
10. **"Medidor (Gauge)"** - Visual semicircular/circular con aguja

**OTROS TIPOS:**
11. **"Gráfico de Dispersión"** - Puntos distribuidos en cuadrante
12. **"Mapa"** - Representación geográfica
13. **"Embudo (Funnel)"** - Forma de embudo invertido
14. **"Cascada (Waterfall)"** - Barras flotantes con incrementos/decrementos
15. **"Treemap"** - Rectángulos anidados
16. **"Otro"** - Si no coincide con ninguna categoría
`;
  
  // ====== INSTRUCCIONES DE ANÁLISIS ACTUALIZADAS ======
  const instruccionesAnalisis = `
**🔍 PROCESO DE ANÁLISIS PASO A PASO:**

**PASO 1: IDENTIFICAR TIPO DE VISUAL**
- Usa la guía de tipos arriba
- Observa la FORMA y ESTRUCTURA del visual

**PASO 2: EXTRAER TÍTULO**
- Busca el texto más prominente encima o dentro del visual
- Si no hay título visible, genera uno descriptivo

**PASO 3: IDENTIFICAR CAMPOS UTILIZADOS**
${tieneContextoSQL ? `
**CON CONTEXTO SQL - USA MATCHING INTELIGENTE:**

${tieneContextoAdicional ? `
**⚠️ MODO ANÁLISIS HÍBRIDO (IMAGEN + CONTEXTO ADICIONAL):**

A. **CAMPOS VISIBLES EN IMAGEN:**
   1. Lee los ENCABEZADOS de columnas que VES en la imagen
   2. Compara cada encabezado con los campos SQL disponibles
   3. Usa matching flexible: exacto, parcial, por tipo, semántico
   
B. **CAMPOS DEL CONTEXTO ADICIONAL:**
   1. El usuario proporcionó una lista de columnas ADICIONALES
   2. Estas columnas EXISTEN en el visual pero NO son visibles en la imagen
   3. **DEBES incluirlas TODAS** en "camposVisibles"
   4. Intenta matchearlas también con los campos SQL disponibles
   
C. **COMBINACIÓN FINAL:**
   - "camposVisibles" debe contener: [campos visibles en imagen] + [campos del contexto adicional]
   - Total esperado: aproximadamente ${tieneContextoAdicional ? contextoAdicional.trim().split('\n').filter(l => l.trim()).length : 'N/A'} campos según el contexto proporcionado
   - Si la imagen muestra solo 5 columnas pero el contexto tiene 15, tu respuesta debe incluir las 20

` : `
Para TABLAS/MATRICES:
1. Lee los ENCABEZADOS de columnas
2. Compara cada encabezado con los campos SQL disponibles
3. Usa matching flexible: exacto, parcial, por tipo, semántico
4. Lista TODOS los campos que identificaste

Para GRÁFICOS:
1. **EJE X:** ¿Qué campo se usa para categorizar?
2. **EJE Y / VALORES:** ¿Qué métrica se muestra?
3. **LEYENDA:** ¿Hay series múltiples? ¿Por qué campo se agrupan?
4. **TOOLTIPS:** Si ves tooltips, ¿qué campos muestran?
`}

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
${tieneContextoAdicional ? '- IMPORTANTE: Incluye también los campos del contexto adicional proporcionado por el usuario' : ''}
`}

**PASO 4: IDENTIFICAR MÉTRICAS CALCULADAS**
${tieneContextoSQL ? `
Identifica si hay AGREGACIONES visibles:
- Totales al final de tablas → SUM(campo_numérico)
- Promedios → AVG(campo_numérico)
- Conteos → COUNT(*) o COUNT(DISTINCT campo)
- Porcentajes → (valor/total)*100
` : `
Describe las métricas que veas sin nombres SQL:
"Total de registros, Suma de valores, Promedio calculado"
`}

**PASO 5: GENERAR DESCRIPCIÓN FUNCIONAL**
${tieneContextoAdicional ? `
**⚠️ CRÍTICO - TU DESCRIPCIÓN DEBE SER COMPLETA:**

Tu descripción DEBE reflejar el visual COMPLETO, no solo lo visible en la imagen:

✅ CORRECTO:
"Tabla exhaustiva con información completa de estudiantes. Contiene ${contextoAdicional.trim().split('\n').filter(l => l.trim()).length} columnas en total: en la captura son visibles X columnas ([lista columnas visibles]), pero el visual también incluye columnas adicionales no visibles por scroll horizontal: [lista columnas de contexto adicional]. Permite consultar..."

❌ INCORRECTO:
"Tabla que muestra estudiantes con las columnas X, Y, Z" ← ¡FALTA MENCIONAR LAS COLUMNAS ADICIONALES!

` : ''}
Responde estas preguntas en la descripción:
1. ¿QUÉ muestra este visual? (qué datos exactos, incluyendo lo no visible)
2. ¿PARA QUÉ sirve? (propósito funcional)
3. ¿QUÉ INSIGHTS permite obtener?
4. ¿CÓMO se usa? (interactivo, drill-down, tooltips)
`;
  
  // ====== CONSTRUIR PROMPT COMPLETO ======
  const prompt = `Eres un experto analista de visualizaciones de Power BI. Tu tarea es analizar esta imagen de un VISUAL y extraer TODA su información con MÁXIMA PRECISIÓN TÉCNICA.

${seccionContextoSQL}

${seccionContextoAdicional}

${guiaTiposVisuales}

${instruccionesAnalisis}

**🎯 FORMATO DE RESPUESTA (JSON ESTRICTO):**

{
  "titulo": "Título exacto del visual (o generado si no es visible)",
  "tipo": "Tipo ESPECÍFICO según la guía",
  "camposVisibles": [
    ${tieneContextoAdicional 
      ? '"Campo1_visible_en_imagen", "Campo2_visible_en_imagen", "Campo3_del_contexto_adicional", "Campo4_del_contexto_adicional", ...'
      : '"CAMPO_SQL_1", "CAMPO_SQL_2", ...'
    }
  ],
  "metricasCalculadas": "SUM(...), COUNT(...), AVG(...) o null",
  "descripcion": "Descripción funcional COMPLETA que menciona TODOS los campos (visibles + contexto adicional). MÍNIMO 3 oraciones. ${tieneContextoAdicional ? 'DEBE indicar cuántas columnas totales tiene el visual y cuáles no son visibles en la captura.' : ''}",
  "confianza": 0.XX,
  "detallesCampos": {
    "ejeX": "..." o null,
    "ejeY": "..." o null,
    "leyenda": "..." o null,
    "columnas": [...] o null,
    "tooltips": [...] o null
  },
  "razonamiento": "Explicación DETALLADA de: (1) tipo de visual identificado, (2) campos matcheados de la imagen, ${tieneContextoAdicional ? '(3) campos adicionales del contexto proporcionado, (4) nivel de completitud del análisis.' : '(3) métricas calculadas.'}"
}

**⚠️ REGLAS CRÍTICAS:**

1. **TIPO DE VISUAL:** Usa el nombre EXACTO de la guía
2. **CAMPOS SQL:** 
   ${tieneContextoSQL 
     ? '- USA MATCHING INTELIGENTE\n   - NUNCA inventes nombres de campos SQL'
     : '- Usa los nombres LITERALES que ves'
   }
3. **${tieneContextoAdicional ? '⭐ CONTEXTO ADICIONAL: OBLIGATORIO incluir todos los campos proporcionados por el usuario' : 'Sin contexto adicional'}**
4. **DESCRIPCIÓN:** ${tieneContextoAdicional ? 'Debe mencionar el TOTAL de columnas y cuáles no son visibles' : 'Debe ser FUNCIONAL, no solo descriptiva'}
5. **RAZONAMIENTO:** ${tieneContextoAdicional ? 'Explica cuántas columnas vienen de la imagen vs contexto adicional' : 'Explica tu proceso de análisis'}
6. **CONFIANZA:** Alta (0.8-1.0) | Media (0.6-0.8) | Baja (0.0-0.6)

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