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
  const prompt = `Analiza esta imagen de un FILTRO o SLICER de Power BI y extrae su información.

**CONTEXTO CRÍTICO - CAMPOS SQL DISPONIBLES:**
${camposDisponibles.length > 0 
  ? camposDisponibles.map(c => `- ${c.nombre} (${c.tipo}): ${c.descripcion || 'Sin descripción'}`).join('\n')
  : 'No hay campos disponibles'}

**INSTRUCCIONES ESPECIALES PARA CAMPOS SQL:**

1. **DETECCIÓN MÚLTIPLE DE CAMPOS:**
   - Un filtro puede usar VARIOS campos SQL concatenados
   - Busca en la imagen etiquetas, encabezados o valores que coincidan con MÚLTIPLES campos
   - Ejemplo: Si ves "Periodo - Sede - Programa", mapea a: PERIODO + SEDE + PROGRAMA

2. **PRIORIDAD DE MATCHING:**
   a) Coincidencia EXACTA del nombre visible con campo SQL
   b) Coincidencia por TIPO DE DATO (fechas → DATE, números → INT, textos → VARCHAR)
   c) Coincidencia por VALORES mostrados (años → periodo, códigos → identificadores)
   d) Coincidencia SEMÁNTICA (Sede/Campus → NOMBRE_SEDE, Año/Year → PERIODO)

3. **FORMATO DE SALIDA:**
   - Si detectas UN solo campo: "COD_PERIODO_ACADEMICO"
   - Si detectas MÚLTIPLES campos: "COD_PERIODO_ACADEMICO + NOMBRE_SEDE + CODIGO_PROGRAMA"
   - Usa el operador " + " (con espacios) para concatenar

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombre": "Nombre descriptivo del filtro",
  "tipoControl": "Slicer - Lista | Dropdown | Multi-select | Date Picker | etc.",
  "valores": "Lista de valores visibles separados por comas",
  "campoSQL": "CAMPO1 + CAMPO2 + CAMPO3 (si aplica concatenación)",
  "descripcion": "Descripción funcional del filtro y su propósito",
  "confianza": 0.XX,
  "razonamiento": "Explica por qué elegiste estos campos SQL específicos"
}`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 3: ANALIZAR VISUALIZACIÓN (MEJORADO v2.0)
 * =====================================================
 */
export const analizarVisualizacionDeImagen = async (imagen, camposDisponibles = []) => {
  const prompt = `Analiza esta imagen de una visualización de Power BI y extrae su información técnica completa.

**CONTEXTO - CAMPOS SQL DISPONIBLES EN EL REPORTE:**
${camposDisponibles.length > 0 
  ? camposDisponibles.map(c => `- ${c.nombre} (${c.tipo}) ${c.esLlave ? '[PK]' : ''}`).join('\n')
  : 'No hay campos disponibles'}

**INSTRUCCIONES DE ANÁLISIS EXHAUSTIVO:**

1. **DETECCIÓN DE TIPO DE VISUAL:**
   Identifica el tipo exacto entre:
   - Tabla, Matriz, Gráfico de Barras, Gráfico de Columnas, Gráfico de Líneas
   - Gráfico de Áreas, Gráfico Circular, Gráfico de Anillo, KPI Card, Medidor
   - Cascada, Embudo, Dispersión, Mapa, Gráfico Combinado

2. **EXTRACCIÓN COMPLETA DE CAMPOS:**
   
   **A) Para TABLAS/MATRICES:**
   - Identifica CADA columna visible por su encabezado
   - Diferencia entre campos directos y calculados/agregados
   - Busca matching con campos SQL disponibles

   **B) Para GRÁFICOS:**
   - **Eje X:** ¿Qué campo se usa?
   - **Eje Y:** ¿Qué métricas se muestran?
   - **Leyenda:** ¿Hay series múltiples?
   - **Tooltips:** ¿Qué campos aparecen?

3. **IDENTIFICACIÓN DE MÉTRICAS CALCULADAS:**
   - COUNT, SUM, AVG, MIN/MAX, %, Diferencias
   - Formato: "SUM(CREDITOS_APROBADOS)" o "COUNT(DISTINCT CODIGO_ESTUDIANTE)"

4. **MATCHING INTELIGENTE CON CAMPOS SQL:**
   - Coincidencia directa, por abreviación, por tipo, semántica

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "titulo": "Título descriptivo del visual",
  "tipo": "Tipo exacto del visual",
  "camposVisibles": ["CAMPO_SQL_1", "CAMPO_SQL_2", "CAMPO_SQL_3"],
  "metricasCalculadas": "Descripción de agregaciones: SUM(...), COUNT(...), AVG(...)",
  "descripcion": "Descripción funcional: qué muestra, para qué sirve, qué insights proporciona",
  "confianza": 0.XX,
  "detallesCampos": {
    "ejeX": "Campo usado en eje X (para gráficos)",
    "ejeY": "Métricas en eje Y (para gráficos)",
    "leyenda": "Campo de series (si aplica)",
    "columnas": ["Lista de columnas (para tablas)"],
    "agrupaciones": ["Campos de jerarquía/grupo (si aplica)"]
  },
  "razonamiento": "Explica cómo identificaste cada campo"
}`;

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