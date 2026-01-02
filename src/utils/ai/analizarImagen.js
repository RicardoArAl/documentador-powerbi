/**
 * =====================================================
 * ANALIZAR IMAGEN - UTILIDADES GEMINI VISION (v2.0)
 * 
 * Funciones para analizar diferentes tipos de imágenes
 * usando Gemini Vision API con PROMPTS MEJORADOS
 * 
 * MEJORAS v2.0:
 * - Detección múltiple de campos SQL concatenados
 * - Análisis exhaustivo de visualizaciones
 * - Dashboard completo con inventario detallado
 * - Matching inteligente con campos disponibles
 * =====================================================
 */

import { obtenerClienteGemini } from './geminiClient';

/**
 * Convierte un archivo de imagen a base64
 * @param {File} archivo - Archivo de imagen
 * @returns {Promise<string>} - String base64 de la imagen
 */
export const convertirImagenABase64 = (archivo) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extraer solo la parte base64 (sin el prefijo data:image/...)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(archivo);
  });
};

/**
 * Función genérica para analizar una imagen con Gemini Vision
 * @param {File} imagen - Archivo de imagen
 * @param {string} prompt - Prompt para Gemini
 * @param {string} mimeType - Tipo MIME de la imagen (default: image/jpeg)
 * @returns {Promise<Object>} - Respuesta parseada de Gemini
 */
export const analizarImagenConIA = async (imagen, prompt, mimeType = 'image/jpeg') => {
  try {
    // 1. Obtener cliente de Gemini
    const model = await obtenerClienteGemini();
    
    // 2. Convertir imagen a base64
    const base64Image = await convertirImagenABase64(imagen);
    
    // 3. Crear el objeto de imagen para Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };
    
    // 4. Hacer la petición a Gemini Vision
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // 5. Intentar parsear como JSON
    try {
      // Limpiar markdown si viene con ```json ... ```
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (parseError) {
      // Si no es JSON válido, retornar el texto plano
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
 * CASO 1: ANALIZAR DASHBOARD COMPLETO (MEJORADO v2.0)
 * =====================================================
 * Analiza una imagen de un dashboard/reporte completo
 * con inventario DETALLADO de filtros y visuales
 */
export const analizarDashboardCompleto = async (imagen) => {
  const prompt = `Analiza esta captura completa de un reporte/dashboard de Power BI y extrae TODA la información visible.

**ANÁLISIS REQUERIDO (MUY DETALLADO):**

1. **INFORMACIÓN BÁSICA DEL REPORTE:**
   - **Título principal:** Busca el título más prominente (generalmente arriba)
   - **Código o identificador:** Busca patrones tipo "BNR-XX-YY-##" o códigos alfanuméricos
   - **Categoría:** Infiere del contenido (Académico, Financiero, Administrativo, SNIES, etc.)
   - **Objetivo aparente:** Deduce para qué sirve basándote en visuales y filtros

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
  "nombreReporte": "Nombre descriptivo completo",
  "codigoReporte": "BNR-XX-YY-## (si es visible)",
  "categoria": "Categoría principal",
  "subcategoria": "Subcategoría (si aplica)",
  "objetivo": "Descripción detallada del propósito y uso del reporte (3-5 líneas)",
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
- La confianza debe reflejar qué tan claro se ve todo`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 2: ANALIZAR FILTRO DE POWER BI (MEJORADO v2.0)
 * =====================================================
 * Analiza una imagen de un filtro/slicer con detección
 * MÚLTIPLE de campos SQL concatenados
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
   - Si ves años (2025, 2024), mapea a: COD_PERIODO_ACADEMICO
   - Si ves nombres de sedes (Bogotá, Pereira), mapea a: NOMBRE_SEDE
   - Si ves códigos (001, 002), busca campos tipo CODIGO_* o COD_*

2. **PRIORIDAD DE MATCHING:**
   a) Coincidencia EXACTA del nombre visible con campo SQL
   b) Coincidencia por TIPO DE DATO (fechas → DATE, números → INT, textos → VARCHAR)
   c) Coincidencia por VALORES mostrados (años → periodo, códigos → identificadores)
   d) Coincidencia SEMÁNTICA (Sede/Campus → NOMBRE_SEDE, Año/Year → PERIODO)

3. **FORMATO DE SALIDA:**
   - Si detectas UN solo campo: "COD_PERIODO_ACADEMICO"
   - Si detectas MÚLTIPLES campos: "COD_PERIODO_ACADEMICO + NOMBRE_SEDE + CODIGO_PROGRAMA"
   - Usa el operador " + " (con espacios) para concatenar

4. **ANÁLISIS DE VALORES:**
   - Examina los valores mostrados en el filtro (ej: lista de opciones)
   - Valores numéricos 4 dígitos (2025, 2024) → probablemente PERIODO/AÑO
   - Valores texto largos (Bogotá D.C., Pereira) → probablemente NOMBRES
   - Valores alfanuméricos cortos (BG-01, PE-02) → probablemente CÓDIGOS
   - Fechas (DD/MM/YYYY) → campos tipo DATE

5. **CONFIANZA DEL MATCH:**
   - Alta (0.85-1.0): Coincidencia exacta o múltiples evidencias
   - Media (0.70-0.84): Coincidencia por tipo de dato o semántica
   - Baja (<0.70): Suposición basada en contexto

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombre": "Nombre descriptivo del filtro",
  "tipoControl": "Slicer - Lista | Dropdown | Multi-select | Date Picker | etc.",
  "valores": "Lista de valores visibles separados por comas",
  "campoSQL": "CAMPO1 + CAMPO2 + CAMPO3 (si aplica concatenación)",
  "descripcion": "Descripción funcional del filtro y su propósito",
  "confianza": 0.XX,
  "razonamiento": "Explica por qué elegiste estos campos SQL específicos"
}

**EJEMPLO CON MÚLTIPLES CAMPOS:**
{
  "nombre": "Periodo - Sede",
  "tipoControl": "Slicer - Lista jerárquica",
  "valores": "2025 - Bogotá, 2025 - Pereira, 2024 - Bogotá",
  "campoSQL": "COD_PERIODO_ACADEMICO + NOMBRE_SEDE",
  "descripcion": "Filtro combinado que permite seleccionar periodo académico y sede institucional simultáneamente",
  "confianza": 0.90,
  "razonamiento": "Detecté valores de años (2025, 2024) que mapean a COD_PERIODO_ACADEMICO y nombres de ciudades que mapean a NOMBRE_SEDE. La presentación jerárquica confirma concatenación."
}`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 3: ANALIZAR VISUALIZACIÓN (MEJORADO v2.0)
 * =====================================================
 * Analiza una imagen de un visual con extracción
 * EXHAUSTIVA de campos y matching inteligente
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
   - Tabla (filas y columnas planas)
   - Matriz (con jerarquías/agrupaciones)
   - Gráfico de Barras (horizontal)
   - Gráfico de Columnas (vertical)
   - Gráfico de Líneas (temporal)
   - Gráfico de Áreas (con relleno)
   - Gráfico Circular (pie chart)
   - Gráfico de Anillo (donut)
   - KPI Card (valor único destacado)
   - Medidor (gauge/velocímetro)
   - Cascada (waterfall)
   - Embudo (funnel)
   - Dispersión (scatter plot)
   - Mapa (geográfico)
   - Gráfico Combinado (múltiples tipos)

2. **EXTRACCIÓN COMPLETA DE CAMPOS:**
   
   **A) Para TABLAS/MATRICES:**
   - Identifica CADA columna visible por su encabezado
   - Diferencia entre:
     * Campos directos (COD_ESTUDIANTE, NOMBRE_COMPLETO)
     * Campos calculados/agregados (Total, Promedio, %)
   - Busca matching con campos SQL disponibles por:
     * Nombre exacto del encabezado
     * Nombre similar/abreviado (Código → COD_*, Nombre → NOM_*)
     * Tipo de dato visible (números enteros → INT, textos → VARCHAR, fechas → DATE)
   
   **B) Para GRÁFICOS:**
   - **Eje X:** ¿Qué campo se usa? (generalmente categorías/fechas)
   - **Eje Y:** ¿Qué métricas se muestran? (generalmente valores numéricos)
   - **Leyenda:** ¿Hay series múltiples? (campo adicional)
   - **Tooltips:** ¿Qué campos aparecen al pasar el mouse? (visibles en la imagen)
   
   **C) Para KPIs/TARJETAS:**
   - Campo principal mostrado
   - Campos de comparación (si hay)
   - Tendencia o variación (campo de diferencia)

3. **IDENTIFICACIÓN DE MÉTRICAS CALCULADAS:**
   
   Detecta si hay agregaciones o cálculos:
   - **COUNT:** "Total de...", "Cantidad de...", "N° de..."
   - **SUM:** "Total...", "Suma de...", "Acumulado..."
   - **AVG:** "Promedio...", "Media de..."
   - **MIN/MAX:** "Mínimo", "Máximo"
   - **% o Porcentaje:** Cálculos de proporción
   - **Diferencias:** Campos tipo "Variación", "Cambio", "Diferencia"
   
   Formato: "SUM(CREDITOS_APROBADOS)" o "COUNT(DISTINCT CODIGO_ESTUDIANTE)"

4. **ANÁLISIS DE AGRUPACIONES:**
   - ¿Hay niveles jerárquicos? (Periodo > Sede > Programa)
   - ¿Hay subtotales o totales generales?
   - Esto indica campos de agrupación adicionales

5. **MATCHING INTELIGENTE CON CAMPOS SQL:**
   
   **Estrategias de coincidencia:**
   
   a) **Coincidencia directa:**
   - "Código Estudiante" → CODIGO_ESTUDIANTE o COD_ESTUDIANTE
   - "Email" → EMAIL_PERSONAL o EMAIL_INSTITUCIONAL
   
   b) **Coincidencia por abreviación:**
   - "Cód. Período" → COD_PERIODO_ACADEMICO
   - "Num. Doc." → NUMERO_DOCUMENTO_PERSONA
   
   c) **Coincidencia por tipo:**
   - Columna con números 10 dígitos → probablemente NUMERO_DOCUMENTO
   - Columna con emails → probablemente EMAIL_*
   - Columna con fechas → probablemente FECHA_*
   
   d) **Coincidencia semántica:**
   - "Estudiante" → NOM_COMPLETO_PERSONA o NOMBRE_ESTUDIANTE
   - "Programa" → NOMBRE_PROGRAMA o DESC_PROGRAMA
   - "Sede" → NOMBRE_SEDE o DESC_SEDE

6. **NIVEL DE CONFIANZA:**
   - 0.90-1.0: Todos los campos identificados con alta certeza
   - 0.75-0.89: Mayoría de campos identificados, algunos por deducción
   - 0.60-0.74: Identificación parcial o campos ambiguos
   - <0.60: Muchos campos no pudieron mapearse

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "titulo": "Título descriptivo del visual",
  "tipo": "Tipo exacto del visual (de la lista)",
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
  "razonamiento": "Explica cómo identificaste cada campo y por qué los elegiste"
}

**EJEMPLO COMPLETO:**
{
  "titulo": "Listado Detallado de Estudiantes Matriculados",
  "tipo": "Tabla",
  "camposVisibles": [
    "COD_PERIODO_ACADEMICO",
    "NUMERO_DOCUMENTO_PERSONA",
    "NOM_COMPLETO_PERSONA",
    "EMAIL_PERSONAL",
    "NOMBRE_PROGRAMA",
    "CODIGO_ESTUDIANTE"
  ],
  "metricasCalculadas": "COUNT(DISTINCT CODIGO_ESTUDIANTE) como 'Total Estudiantes'",
  "descripcion": "Tabla que presenta información detallada de estudiantes matriculados, incluyendo datos personales (documento, nombre, email), información académica (programa) y periodo. Permite filtrado y búsqueda. La columna 'Total' al final muestra un conteo agregado.",
  "confianza": 0.92,
  "detallesCampos": {
    "columnas": [
      "Periodo (COD_PERIODO_ACADEMICO)",
      "Documento (NUMERO_DOCUMENTO_PERSONA)",
      "Nombre Completo (NOM_COMPLETO_PERSONA)",
      "Email (EMAIL_PERSONAL)",
      "Programa (NOMBRE_PROGRAMA)",
      "Código (CODIGO_ESTUDIANTE)",
      "Total (métrica calculada)"
    ]
  },
  "razonamiento": "Identifiqué 7 columnas en la tabla. Las primeras 6 mapean directamente a campos SQL por nombre y tipo de dato. La columna 'Total' es una métrica calculada (COUNT) que no existe en la fuente. Alta confianza por coincidencia exacta de nombres."
}`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * FUNCIÓN DE VALIDACIÓN
 * =====================================================
 * Valida que una respuesta de IA tenga nivel de confianza aceptable
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