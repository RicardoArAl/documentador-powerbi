/**
 * =====================================================
 * ANALIZAR IMAGEN - UTILIDADES GEMINI VISION (v3.0)
 * 
 * ⭐ NUEVO EN v3.0:
 * - analizarDashboardCompleto ahora recibe CONTEXTO
 * - Prompt mejorado que usa código y nombre para generar
 *   descripciones ESPECÍFICAS en lugar de genéricas
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
 * ⭐ MEJORADO: ANALIZAR DASHBOARD CON CONTEXTO v3.0
 * =====================================================
 * 
 * @param {File} imagen - Captura del dashboard
 * @param {Object} contexto - Contexto opcional del usuario
 * @param {string} contexto.codigoReporte - Código proporcionado por el usuario
 * @param {string} contexto.nombreReporte - Nombre proporcionado por el usuario
 */
export const analizarDashboardCompleto = async (imagen, contexto = {}) => {
  const { codigoReporte, nombreReporte } = contexto;
  
  // ⭐ Construir sección de contexto si está disponible
  let seccionContexto = '';
  
  if (codigoReporte || nombreReporte) {
    seccionContexto = `
**🎯 CONTEXTO PROPORCIONADO POR EL USUARIO:**
${codigoReporte ? `- CÓDIGO DEL REPORTE: "${codigoReporte}"` : ''}
${nombreReporte ? `- NOMBRE DEL REPORTE: "${nombreReporte}"` : ''}

**⚠️ INSTRUCCIÓN CRÍTICA PARA EL OBJETIVO:**
Basándote en el código y/o nombre proporcionado, genera un OBJETIVO ESPECÍFICO Y DETALLADO que explique:
1. QUÉ INFORMACIÓN EXACTA muestra este reporte
2. PARA QUÉ SE UTILIZA específicamente
3. QUÉ DECISIONES o ANÁLISIS permite realizar

**❌ NO USAR FRASES GENÉRICAS como:**
- "Proporciona información sobre..."
- "Permite visualizar datos de..."
- "Muestra información relacionada con..."

**✅ USA EL CONTEXTO DEL NOMBRE para ser ESPECÍFICO:**

Ejemplos de objetivos según el nombre:

📊 Si el nombre es "Alumnos matriculados":
❌ MAL: "Proporciona información sobre estudiantes"
✅ BIEN: "Muestra el listado completo de estudiantes matriculados en el periodo actual, con sus datos personales (documento, nombre, email), información del programa académico al que pertenecen y créditos inscritos. Permite a los coordinadores académicos consultar el detalle de su población estudiantil activa, verificar matrículas y realizar seguimiento individual."

📊 Si el nombre es "Pensum por plan de estudio":
❌ MAL: "Muestra información de pensums"
✅ BIEN: "Presenta la estructura curricular detallada de cada plan de estudio vigente, incluyendo todas las asignaturas organizadas por semestre, créditos académicos, requisitos y correquisitos. Permite a directores de programa y asesores académicos consultar la malla curricular oficial, planear horarios y asesorar estudiantes sobre la secuencia de materias."

📊 Si el nombre es "Recaudos por concepto":
❌ MAL: "Proporciona datos financieros"
✅ BIEN: "Consolida los ingresos recibidos clasificados por concepto de pago (matrícula, derechos de grado, certificados, etc.) en un periodo determinado. Permite al área financiera analizar el comportamiento de recaudo por tipo de ingreso, identificar conceptos con mayor volumen y realizar proyecciones presupuestales."

📊 Si el nombre es "SNIES - Matriculados primer curso":
❌ MAL: "Muestra estudiantes nuevos"
✅ BIEN: "Genera el reporte oficial de estudiantes de primer ingreso (primer curso) según los criterios y definiciones del SNIES (Sistema Nacional de Información de la Educación Superior). Permite al área de planeación preparar los archivos de cargue obligatorios ante el Ministerio de Educación Nacional para el reporte de nuevos matriculados en el periodo."

**SI NO HAY CONTEXTO, analiza la captura cuidadosamente e infiere el objetivo más específico posible.**
`;
  }
  
  const prompt = `Analiza esta captura completa de un reporte/dashboard de Power BI y extrae TODA la información visible.

${seccionContexto}

**ANÁLISIS REQUERIDO (MUY DETALLADO):**

1. **INFORMACIÓN BÁSICA DEL REPORTE:**
   - **Título principal:** Busca el título más prominente (generalmente arriba)
   ${!nombreReporte ? '- Si el usuario NO proporcionó nombre, extrae el título exacto visible en la imagen' : '- Usa el nombre proporcionado por el usuario como prioritario'}
   ${!codigoReporte ? '- **Código o identificador:** Busca patrones tipo "BNR-XX-YY-##" o códigos alfanuméricos' : '- Usa el código proporcionado por el usuario'}
   - **Categoría:** Infiere del contenido (Académico, Financiero, Administrativo, SNIES, etc.)
   - **Objetivo aparente:** ${nombreReporte || codigoReporte ? 'GENERA UN OBJETIVO ESPECÍFICO Y DETALLADO basándote en el contexto proporcionado' : 'Deduce para qué sirve basándote en visuales y filtros'}

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
  "objetivo": "Descripción ESPECÍFICA y DETALLADA del propósito (${nombreReporte || codigoReporte ? 'USA EL CONTEXTO PROPORCIONADO' : '3-5 líneas basadas en análisis visual'})",
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
  "observaciones": "Notas adicionales relevantes"
}

**IMPORTANTE:**
- Sé exhaustivo en el conteo de filtros y visuales
- Si no ves algo claramente, no lo inventes
- La confianza debe reflejar qué tan claro se ve todo
${nombreReporte || codigoReporte ? '- **PRIORIDAD MÁXIMA:** Usa el contexto del usuario para generar un objetivo ESPECÍFICO, no genérico' : ''}`;

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