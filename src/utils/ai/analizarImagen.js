/**
 * =====================================================
 * ANALIZAR IMAGEN - UTILIDADES GEMINI VISION
 * 
 * Funciones para analizar diferentes tipos de imágenes
 * usando Gemini Vision API
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
 * CASO 1: ANALIZAR FILTRO DE POWER BI
 * =====================================================
 * Analiza una imagen de un filtro/slicer de Power BI
 * y extrae información estructurada
 */
export const analizarFiltroDeImagen = async (imagen, camposDisponibles = []) => {
  const prompt = `
Eres un experto en Power BI. Analiza esta imagen de un FILTRO o SLICER de Power BI.

**CONTEXTO DE CAMPOS SQL DISPONIBLES:**
${camposDisponibles.length > 0 
  ? camposDisponibles.map(c => `- ${c.nombre} (${c.tipo}): ${c.descripcion || 'Sin descripción'}`).join('\n')
  : 'No hay campos disponibles'}

**INSTRUCCIONES:**
1. Identifica el NOMBRE del filtro (título visible)
2. Detecta el TIPO DE CONTROL usado (lista, dropdown, segmentación, etc.)
3. Extrae todos los VALORES VISIBLES en la lista/dropdown
4. Si hay campos SQL disponibles, sugiere el CAMPO SQL más probable que corresponde
5. Genera una DESCRIPCIÓN funcional del filtro

**IMPORTANTE:** 
- Si ves fechas, extrae el rango completo
- Si ves códigos, anótalos exactamente
- Si no puedes leer algo, indica "No visible"

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombre": "Nombre del filtro detectado",
  "tipoControl": "Tipo de control (ej: Lista, Dropdown, Segmentación)",
  "valores": "Valores separados por comas (ej: 2024, 2025, 2026)",
  "campoSQLSugerido": "Nombre del campo SQL más probable o null",
  "descripcion": "Descripción funcional del filtro",
  "confianza": 0.95
}
`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 2: ANALIZAR VISUALIZACIÓN DE POWER BI
 * =====================================================
 * Analiza una imagen de un visual/gráfico de Power BI
 * y extrae información estructurada
 */
export const analizarVisualizacionDeImagen = async (imagen, camposDisponibles = []) => {
  const prompt = `
Eres un experto en Power BI. Analiza esta imagen de una VISUALIZACIÓN (gráfico, tabla, KPI, etc.).

**CONTEXTO DE CAMPOS SQL DISPONIBLES:**
${camposDisponibles.length > 0 
  ? camposDisponibles.map(c => `- ${c.nombre} (${c.tipo}): ${c.descripcion || 'Sin descripción'}`).join('\n')
  : 'No hay campos disponibles'}

**INSTRUCCIONES:**
1. Identifica el TÍTULO del visual (si es visible)
2. Detecta el TIPO DE VISUALIZACIÓN exacto (Tabla, Gráfico de Barras, KPI Card, etc.)
3. Identifica las COLUMNAS/CAMPOS visibles en el visual
4. Si hay campos SQL disponibles, haz match con los campos detectados
5. Detecta MÉTRICAS CALCULADAS si hay agregaciones (SUM, COUNT, AVG, etc.)
6. Genera una DESCRIPCIÓN del propósito del visual

**TIPOS DE VISUALIZACIÓN VÁLIDOS:**
- Tabla
- Matriz
- Gráfico de Barras Verticales
- Gráfico de Barras Horizontales
- Gráfico de Líneas
- Gráfico de Áreas
- Gráfico Circular (Pie)
- Gráfico de Anillos (Donut)
- KPI Card
- Tarjeta de Múltiples Filas
- Medidor (Gauge)
- Gráfico de Dispersión
- Mapa
- Segmentación (Slicer)
- Otro

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "titulo": "Título del visual detectado o sugerido",
  "tipo": "Tipo de visualización detectado",
  "camposVisibles": ["CAMPO1", "CAMPO2", "CAMPO3"],
  "metricasCalculadas": "Fórmulas detectadas (ej: Total = SUM(CREDITOS))",
  "descripcion": "Descripción del propósito y contenido del visual",
  "confianza": 0.90
}
`;

  return await analizarImagenConIA(imagen, prompt);
};

/**
 * =====================================================
 * CASO 3: ANALIZAR DASHBOARD COMPLETO
 * =====================================================
 * Analiza una imagen de un dashboard/reporte completo
 * y extrae información general
 */
export const analizarDashboardCompleto = async (imagen) => {
  const prompt = `
Eres un experto en Power BI. Analiza esta imagen de un DASHBOARD o REPORTE COMPLETO.

**INSTRUCCIONES:**
1. Identifica el NOMBRE/TÍTULO del reporte (generalmente en la parte superior)
2. Detecta la CATEGORÍA/TEMÁTICA del reporte (Académico, Financiero, Ventas, etc.)
3. Infiere el OBJETIVO principal del reporte basándote en los visuales presentes
4. Cuenta aproximadamente cuántos FILTROS se ven
5. Cuenta aproximadamente cuántos VISUALES hay
6. Detecta si hay INDICADORES CLAVE (KPIs) visibles

**CATEGORÍAS VÁLIDAS:**
- Académico
- Financiero
- Ventas
- Operativo
- Recursos Humanos
- Marketing
- Inventario
- Calidad
- Otro

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "nombreReporte": "Nombre del reporte detectado",
  "categoria": "Categoría sugerida",
  "objetivo": "Objetivo inferido del reporte (2-3 oraciones)",
  "cantidadFiltros": 3,
  "cantidadVisuales": 5,
  "tieneKPIs": true,
  "descripcionGeneral": "Descripción general del dashboard",
  "confianza": 0.85
}
`;

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