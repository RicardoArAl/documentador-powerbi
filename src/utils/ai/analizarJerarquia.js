/**
 * Análisis de jerarquía de reportes con IA
 * Detecta automáticamente la ubicación de un reporte en el árbol organizacional
 */

import { generarContenidoTexto } from './geminiClient.js';
import { ARBOL_REPORTES_BANNER, buscarReportePorCodigo, obtenerReportesRelacionados } from '../arbolReportes.js';

/**
 * Detecta la jerarquía de un reporte usando IA
 * Primero intenta búsqueda directa, si falla usa IA para inferir
 * 
 * @param {string} codigoReporte - Código del reporte (ej: "BNR-AC-AA-15")
 * @param {string} nombreReporte - Nombre del reporte (opcional, mejora precisión)
 * @returns {Promise<Object>} Objeto con sistema, area, subarea, reportesRelacionados, confianza
 */
export const detectarJerarquiaDesdeArbol = async (codigoReporte, nombreReporte = '') => {
  try {
    // PASO 1: Búsqueda directa en el árbol (sin IA)
    const ubicacionDirecta = buscarReportePorCodigo(codigoReporte);
    
    if (ubicacionDirecta) {
      // Encontrado directamente en el árbol
      const relacionados = obtenerReportesRelacionados(codigoReporte);
      
      return {
        sistema: ubicacionDirecta.sistema,
        area: ubicacionDirecta.area,
        subarea: ubicacionDirecta.subarea,
        reportesRelacionados: relacionados.slice(0, 5), // Máximo 5 relacionados
        confianza: 1.0, // 100% de confianza (búsqueda exacta)
        metodo: 'busqueda_directa'
      };
    }
    
    // PASO 2: Si no se encuentra, usar IA para inferir (reporte no registrado)
    console.log('Reporte no encontrado en árbol. Usando IA para inferir ubicación...');
    
    const prompt = `
Eres un experto en organización de reportes de sistemas académicos y financieros.

TAREA: Determina la ubicación jerárquica de este reporte en el árbol organizacional de Banner.

DATOS DEL REPORTE:
- Código: "${codigoReporte}"
${nombreReporte ? `- Nombre: "${nombreReporte}"` : ''}

ÁRBOL ORGANIZACIONAL COMPLETO:
${JSON.stringify(ARBOL_REPORTES_BANNER, null, 2)}

INSTRUCCIONES:
1. Analiza el código del reporte (estructura: BNR-[PREFIJO]-[AREA]-[NUMERO])
2. Encuentra la ubicación más probable basándote en:
   - Patrones de códigos existentes (ej: BNR-AC-AA = Administración Académica)
   - Nombre del reporte (si está disponible)
   - Contexto de reportes similares
3. Identifica reportes relacionados (misma área/subárea)
4. Asigna un nivel de confianza (0.0 a 1.0)

RESPONDE SOLO CON ESTE JSON (sin markdown, sin texto adicional):
{
  "sistema": "Banner",
  "area": "Gestión Académica",
  "subarea": "Administración Académica",
  "reportesRelacionados": [
    {
      "codigo": "BNR-AC-AA-15",
      "nombre": "Alumnos matriculado con créditos y promedios"
    }
  ],
  "confianza": 0.85,
  "razonamiento": "Breve explicación de por qué se eligió esta ubicación"
}

REGLAS:
- "sistema" siempre debe ser "Banner"
- "area" debe ser exactamente uno de los nombres de área del árbol
- "subarea" debe ser exactamente uno de los nombres de subárea del árbol
- "confianza" entre 0.5 (baja) y 0.95 (alta) - NUNCA 1.0 (eso es solo para búsqueda directa)
- Máximo 5 reportes relacionados
- Si no puedes determinar con certeza, usa confianza baja (0.5-0.7)
`;

    const respuestaIA = await generarContenidoTexto(prompt);
    
    // Extraer JSON de la respuesta
    const jsonMatch = respuestaIA.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de IA');
    }
    
    const resultado = JSON.parse(jsonMatch[0]);
    
    // Validar estructura del resultado
    if (!resultado.sistema || !resultado.area || !resultado.subarea) {
      throw new Error('Respuesta de IA incompleta');
    }
    
    // Validar confianza
    if (typeof resultado.confianza !== 'number' || resultado.confianza < 0 || resultado.confianza > 1) {
      resultado.confianza = 0.5; // Confianza por defecto
    }
    
    // Asegurar que reportesRelacionados sea array
    if (!Array.isArray(resultado.reportesRelacionados)) {
      resultado.reportesRelacionados = [];
    }
    
    return {
      sistema: resultado.sistema,
      area: resultado.area,
      subarea: resultado.subarea,
      reportesRelacionados: resultado.reportesRelacionados.slice(0, 5),
      confianza: resultado.confianza,
      razonamiento: resultado.razonamiento || '',
      metodo: 'inferencia_ia'
    };
    
  } catch (error) {
    console.error('Error al detectar jerarquía:', error);
    
    // Fallback: Intentar inferir básicamente del código
    const fallback = inferirJerarquiaBasica(codigoReporte);
    
    return {
      ...fallback,
      confianza: 0.3,
      metodo: 'fallback_basico',
      error: error.message
    };
  }
};

/**
 * Inferencia básica de jerarquía basada solo en el código
 * Sin usar IA - solo análisis de patrones
 * 
 * @param {string} codigoReporte - Código del reporte
 * @returns {Object} Objeto con sistema, area, subarea, reportesRelacionados
 */
const inferirJerarquiaBasica = (codigoReporte) => {
  const codigo = codigoReporte.toUpperCase();
  
  // Patrones conocidos en los códigos
  const patrones = {
    'BNR-AC-AA': { area: 'Gestión Académica', subarea: 'Administración Académica' },
    'BNR-EC-AC': { area: 'Gestión Académica', subarea: 'Educación Continua' },
    'BNR-AC-PA': { area: 'Gestión Académica', subarea: 'Programación Académica' },
    'BNR-AC-RA': { area: 'Gestión Académica', subarea: 'Reclutamiento y Admisión' },
    'BNR-AC-TI': { area: 'Gestión Académica', subarea: 'Titulación' },
    'BNR-AF-FA': { area: 'Gestión Académica y Financiera', subarea: 'Matrícula Financiera - Administración Académica' },
    'BNR-FI-CB': { area: 'Gestión Financiera', subarea: 'Cobranza' },
    'BNR-FI-CO': { area: 'Gestión Financiera', subarea: 'Contratos' },
    'BNR-FI-EX': { area: 'Gestión Financiera', subarea: 'Exenciones' },
    'BNR-FI-MF': { area: 'Gestión Financiera', subarea: 'Matrícula Financiera' },
    'BNR-FI-PP': { area: 'Gestión Financiera', subarea: 'Plan de Pagos' }
  };
  
  // Buscar patrón coincidente
  for (const [patron, ubicacion] of Object.entries(patrones)) {
    if (codigo.startsWith(patron)) {
      return {
        sistema: 'Banner',
        area: ubicacion.area,
        subarea: ubicacion.subarea,
        reportesRelacionados: []
      };
    }
  }
  
  // Si no coincide con ningún patrón, ubicación genérica
  return {
    sistema: 'Banner',
    area: 'Gestión Académica',
    subarea: 'Administración Académica',
    reportesRelacionados: []
  };
};

/**
 * Valida si una jerarquía es válida dentro del árbol
 * 
 * @param {string} area - Nombre del área
 * @param {string} subarea - Nombre de la subárea
 * @returns {boolean} true si la combinación existe en el árbol
 */
export const validarJerarquia = (area, subarea) => {
  const areaEncontrada = ARBOL_REPORTES_BANNER.areas.find(a => a.nombre === area);
  if (!areaEncontrada) return false;
  
  const subareaEncontrada = areaEncontrada.subareas.find(s => s.nombre === subarea);
  return !!subareaEncontrada;
};

/**
 * Obtiene sugerencias de jerarquía basadas en el código parcial
 * Útil para autocompletado
 * 
 * @param {string} codigoParcial - Código parcial del reporte
 * @returns {Array<Object>} Lista de sugerencias con {area, subarea, ejemplos}
 */
export const obtenerSugerenciasJerarquia = (codigoParcial) => {
  const codigo = codigoParcial.toUpperCase();
  const sugerencias = [];
  
  for (const area of ARBOL_REPORTES_BANNER.areas) {
    for (const subarea of area.subareas) {
      // Buscar reportes que coincidan con el código parcial
      const ejemplos = subarea.reportes
        .filter(r => r.codigo.toUpperCase().startsWith(codigo))
        .slice(0, 3); // Máximo 3 ejemplos
      
      if (ejemplos.length > 0) {
        sugerencias.push({
          area: area.nombre,
          subarea: subarea.nombre,
          ejemplos: ejemplos.map(e => e.codigo)
        });
      }
    }
  }
  
  return sugerencias;
};