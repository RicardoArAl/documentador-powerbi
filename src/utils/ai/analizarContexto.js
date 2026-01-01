/**
 * =====================================================
 * ANALIZAR CONTEXTO - SUGERENCIAS AUTOMÁTICAS (FASE 4)
 * 
 * Funciones para generar sugerencias inteligentes basadas
 * en el contexto completo del reporte documentado
 * 
 * Autor: Ricardo Aral
 * Fecha: 2025-12-29
 * =====================================================
 */

import { generarContenidoTexto, extraerJSON } from './geminiClient';

/**
 * =====================================================
 * FUNCIÓN 1: GENERAR SUGERENCIAS COMPLETAS
 * =====================================================
 * Analiza todo el reporte y genera sugerencias para
 * todos los campos de información adicional
 * 
 * @param {Object} reportData - Estado completo del reporte
 * @returns {Promise<Object>} - Sugerencias estructuradas
 */
export const generarSugerenciasCompletas = async (reportData) => {
  const prompt = `
Eres un experto en documentación de reportes y análisis de datos. Analiza este reporte de Power BI y genera sugerencias inteligentes para completar la documentación.

**CONTEXTO DEL REPORTE:**

**Información Básica:**
- Nombre: ${reportData.nombreReporte || 'No especificado'}
- Código: ${reportData.codigoReporte || 'No especificado'}
- Categoría: ${reportData.categoria || 'No especificada'}
- Objetivo: ${reportData.objetivo || 'No especificado'}

**Estructura de Datos:**
- Tabla origen: ${reportData.tablaOrigen || 'No especificada'}
- Cantidad de campos: ${reportData.camposDetectados?.length || 0}
- Campos con fechas: ${reportData.camposDetectados?.filter(c => c.tipo?.includes('DATE')).length || 0}
- Campos llave: ${reportData.camposDetectados?.filter(c => c.esLlave).length || 0}

**Componentes:**
- Filtros: ${reportData.filtros?.length || 0}
- Visualizaciones: ${reportData.visualizaciones?.length || 0}
- Consultas adicionales: ${reportData.consultasAdicionales?.length || 0}

**INSTRUCCIONES:**
Basándote en este contexto, genera sugerencias para:

1. **Reportes Relacionados:** Sugiere 2-3 reportes que podrían estar relacionados (nombres genéricos)
2. **Frecuencia de Actualización:** Determina con qué frecuencia debería actualizarse
3. **Volumetría Estimada:** Estima cuántos registros/filas podría procesar
4. **Notas Técnicas:** Menciona consideraciones técnicas importantes
5. **Historial de Cambios:** Genera una plantilla de entrada para historial

**RESPONDE ÚNICAMENTE CON JSON EN ESTE FORMATO:**
{
  "reportesRelacionados": "Reporte de X, Reporte de Y, Dashboard de Z",
  "frecuenciaActualizacion": "Diaria | Semanal | Mensual | Tiempo real | Bajo demanda",
  "volumetria": "Estimación de registros procesados (ej: ~50,000 registros/mes)",
  "notasTecnicas": "2-3 oraciones con consideraciones técnicas importantes",
  "historialCambios": "Plantilla de entrada inicial para historial",
  "razonamiento": "Breve explicación de por qué se eligieron estas sugerencias",
  "confianza": 0.85
}

**IMPORTANTE:**
- Sé específico y práctico
- Basa las sugerencias en el contexto real del reporte
- La frecuencia debe ser coherente con los tipos de datos
- La volumetría debe ser realista
`;

  try {
    console.log('🤖 Generando sugerencias automáticas...');
    
    const respuestaTexto = await generarContenidoTexto(prompt, 'pro'); // Usar PRO para mejor calidad
    const resultado = extraerJSON(respuestaTexto);
    
    if (!resultado) {
      throw new Error('No se pudo parsear la respuesta de la IA como JSON');
    }
    
    console.log('✅ Sugerencias generadas correctamente');
    return resultado;
    
  } catch (error) {
    console.error('❌ Error al generar sugerencias:', error);
    throw new Error(`Error al generar sugerencias: ${error.message}`);
  }
};

/**
 * =====================================================
 * FUNCIÓN 2: SUGERIR FRECUENCIA DE ACTUALIZACIÓN
 * =====================================================
 * Determina la frecuencia óptima basada en los tipos
 * de datos y el propósito del reporte
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<Object>} - Frecuencia sugerida con razón
 */
export const sugerirFrecuenciaActualizacion = async (reportData) => {
  const prompt = `
Analiza este reporte y sugiere la frecuencia de actualización óptima.

**ANÁLISIS:**
- Campos con fechas: ${reportData.camposDetectados?.filter(c => c.tipo?.includes('DATE')).length || 0}
- Categoría: ${reportData.categoria || 'No especificada'}
- Tiene filtros de período: ${reportData.filtros?.some(f => f.nombre?.toLowerCase().includes('periodo') || f.nombre?.toLowerCase().includes('fecha')) ? 'Sí' : 'No'}

**OPCIONES VÁLIDAS:**
- Tiempo real
- Diaria
- Semanal
- Mensual
- Bajo demanda
- Otro

**RESPONDE CON JSON:**
{
  "frecuencia": "Una de las opciones válidas",
  "razon": "Explicación breve (1-2 oraciones)",
  "confianza": 0.90
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    return extraerJSON(respuestaTexto);
  } catch (error) {
    console.error('Error sugiriendo frecuencia:', error);
    return {
      frecuencia: 'Diaria',
      razon: 'Frecuencia por defecto sugerida',
      confianza: 0.5
    };
  }
};

/**
 * =====================================================
 * FUNCIÓN 3: SUGERIR VOLUMETRÍA ESTIMADA
 * =====================================================
 * Estima la cantidad de datos que procesa el reporte
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<Object>} - Volumetría estimada
 */
export const sugerirVolumetria = async (reportData) => {
  const prompt = `
Estima la volumetría de este reporte de Power BI.

**CONTEXTO:**
- Cantidad de campos: ${reportData.camposDetectados?.length || 0}
- Cantidad de filtros: ${reportData.filtros?.length || 0}
- Cantidad de visuales: ${reportData.visualizaciones?.length || 0}
- Categoría: ${reportData.categoria || 'No especificada'}
- Tiene agregaciones: ${reportData.visualizaciones?.some(v => v.metricasCalculadas) ? 'Sí' : 'No'}

**RESPONDE CON JSON:**
{
  "volumetria": "Estimación clara (ej: ~10,000 registros/día, 50 MB de datos)",
  "detalles": "Breve explicación de cómo se calculó",
  "confianza": 0.75
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    return extraerJSON(respuestaTexto);
  } catch (error) {
    console.error('Error sugiriendo volumetría:', error);
    return {
      volumetria: 'Volumetría a determinar según uso real',
      detalles: 'Requiere análisis con datos reales',
      confianza: 0.5
    };
  }
};

/**
 * =====================================================
 * FUNCIÓN 4: SUGERIR NOTAS TÉCNICAS
 * =====================================================
 * Genera notas técnicas relevantes basadas en el
 * análisis del reporte
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<Object>} - Notas técnicas sugeridas
 */
export const sugerirNotasTecnicas = async (reportData) => {
  const prompt = `
Genera notas técnicas importantes para este reporte.

**ANÁLISIS DEL REPORTE:**
- Campos llave: ${reportData.camposDetectados?.filter(c => c.esLlave).length || 0}
- Consultas adicionales: ${reportData.consultasAdicionales?.length || 0}
- Tipos de visuales: ${reportData.visualizaciones?.map(v => v.tipo).join(', ') || 'Ninguno'}
- Tiene métricas calculadas: ${reportData.visualizaciones?.some(v => v.metricasCalculadas) ? 'Sí' : 'No'}

**INSTRUCCIONES:**
Menciona:
1. Consideraciones de rendimiento
2. Dependencias importantes
3. Requisitos de seguridad (si aplica)
4. Recomendaciones de mantenimiento

**RESPONDE CON JSON:**
{
  "notas": "2-4 oraciones con notas técnicas importantes",
  "prioridad": "Alta | Media | Baja",
  "confianza": 0.80
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    return extraerJSON(respuestaTexto);
  } catch (error) {
    console.error('Error sugiriendo notas técnicas:', error);
    return {
      notas: 'Notas técnicas a determinar según implementación',
      prioridad: 'Media',
      confianza: 0.5
    };
  }
};

/**
 * =====================================================
 * FUNCIÓN 5: SUGERIR REPORTES RELACIONADOS
 * =====================================================
 * Sugiere reportes que podrían estar relacionados
 * basándose en categoría y campos
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<Object>} - Reportes relacionados sugeridos
 */
export const sugerirReportesRelacionados = async (reportData) => {
  const prompt = `
Sugiere reportes que podrían estar relacionados con este.

**CONTEXTO:**
- Categoría: ${reportData.categoria || 'No especificada'}
- Nombre: ${reportData.nombreReporte || 'No especificado'}
- Objetivo: ${reportData.objetivo || 'No especificado'}
- Campos principales: ${reportData.camposDetectados?.slice(0, 5).map(c => c.nombre).join(', ') || 'No especificados'}

**INSTRUCCIONES:**
Sugiere 2-3 nombres de reportes relacionados (genéricos pero coherentes con la categoría)

**RESPONDE CON JSON:**
{
  "reportes": ["Nombre Reporte 1", "Nombre Reporte 2", "Nombre Reporte 3"],
  "razon": "Por qué están relacionados (1 oración)",
  "confianza": 0.70
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    return extraerJSON(respuestaTexto);
  } catch (error) {
    console.error('Error sugiriendo reportes relacionados:', error);
    return {
      reportes: ['A determinar según contexto organizacional'],
      razon: 'Requiere conocimiento de reportes existentes',
      confianza: 0.5
    };
  }
};

/**
 * =====================================================
 * FUNCIÓN 6: GENERAR PLANTILLA HISTORIAL
 * =====================================================
 * Genera una entrada inicial para el historial de cambios
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<string>} - Plantilla de historial
 */
export const generarPlantillaHistorial = async (reportData) => {
  const prompt = `
Genera una entrada inicial para el historial de cambios de este reporte.

**CONTEXTO:**
- Nombre: ${reportData.nombreReporte || 'Reporte'}
- Código: ${reportData.codigoReporte || 'N/A'}
- Versión: ${reportData.versionReporte || 'v1.0'}
- Documentado por: ${reportData.documentadoPor || 'Usuario'}
- Fecha: ${reportData.fechaDocumentacion || new Date().toISOString().split('T')[0]}

**FORMATO ESPERADO:**
[FECHA] - [VERSIÓN] - [AUTOR]
- Descripción breve del cambio o creación inicial

**RESPONDE CON JSON:**
{
  "historial": "Texto de la entrada inicial del historial",
  "confianza": 0.95
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    const resultado = extraerJSON(respuestaTexto);
    return resultado?.historial || `${reportData.fechaDocumentacion || new Date().toISOString().split('T')[0]} - v1.0 - ${reportData.documentadoPor || 'Usuario'}
- Creación inicial del reporte y documentación completa`;
  } catch (error) {
    console.error('Error generando plantilla historial:', error);
    return `${reportData.fechaDocumentacion || new Date().toISOString().split('T')[0]} - v1.0 - ${reportData.documentadoPor || 'Usuario'}
- Creación inicial del reporte`;
  }
};

/**
 * =====================================================
 * FUNCIÓN 7: VALIDAR CONTEXTO DEL REPORTE
 * =====================================================
 * Valida que el reporte tenga suficiente información
 * para generar sugerencias de calidad
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Object} - Resultado de validación
 */
export const validarContextoReporte = (reportData) => {
  const errores = [];
  const advertencias = [];
  
  // Validaciones críticas
  if (!reportData.nombreReporte) {
    errores.push('Falta el nombre del reporte');
  }
  
  if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) {
    errores.push('No hay campos detectados en Sección 2');
  }
  
  // Advertencias
  if (!reportData.categoria) {
    advertencias.push('No hay categoría definida (Sección 1)');
  }
  
  if (!reportData.filtros || reportData.filtros.length === 0) {
    advertencias.push('No hay filtros documentados (Sección 3)');
  }
  
  if (!reportData.visualizaciones || reportData.visualizaciones.length === 0) {
    advertencias.push('No hay visualizaciones documentadas (Sección 4)');
  }
  
  const esValido = errores.length === 0;
  const calidad = esValido ? 
    (advertencias.length === 0 ? 'Alta' : advertencias.length <= 2 ? 'Media' : 'Baja') : 
    'Insuficiente';
  
  return {
    valido: esValido,
    calidad: calidad,
    errores: errores,
    advertencias: advertencias,
    mensaje: esValido ? 
      `Contexto ${calidad.toLowerCase()} para generar sugerencias` : 
      'No hay suficiente información para generar sugerencias de calidad'
  };
};

/**
 * =====================================================
 * FUNCIÓN 8: ANÁLISIS RÁPIDO (SIN DETALLES)
 * =====================================================
 * Versión simplificada que genera solo las sugerencias
 * más críticas
 * 
 * @param {Object} reportData - Estado del reporte
 * @returns {Promise<Object>} - Sugerencias básicas
 */
export const generarSugerenciasRapidas = async (reportData) => {
  const prompt = `
Genera sugerencias rápidas para este reporte:

**Info básica:**
- Categoría: ${reportData.categoria || 'No especificada'}
- Campos: ${reportData.camposDetectados?.length || 0}
- Visuales: ${reportData.visualizaciones?.length || 0}

**Solo responde con:**
{
  "frecuencia": "Diaria | Semanal | Mensual",
  "volumetria": "Estimación breve",
  "confianza": 0.75
}
`;

  try {
    const respuestaTexto = await generarContenidoTexto(prompt, 'flash');
    return extraerJSON(respuestaTexto);
  } catch (error) {
    console.error('Error en sugerencias rápidas:', error);
    return {
      frecuencia: 'Diaria',
      volumetria: 'A determinar',
      confianza: 0.5
    };
  }
};

// =====================================================
// EXPORTACIONES
// =====================================================

export default {
  generarSugerenciasCompletas,
  sugerirFrecuenciaActualizacion,
  sugerirVolumetria,
  sugerirNotasTecnicas,
  sugerirReportesRelacionados,
  generarPlantillaHistorial,
  validarContextoReporte,
  generarSugerenciasRapidas
};