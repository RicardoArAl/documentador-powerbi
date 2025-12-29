/**
 * =====================================================
 * GEMINI CLIENT - Cliente Base para Google Gemini API
 * =====================================================
 * 
 * Este módulo gestiona la conexión con la API de Gemini.
 * Maneja la configuración, API key, y proporciona funciones
 * base para hacer llamadas a los modelos de IA.
 * 
 * Modelos disponibles:
 * - gemini-1.5-flash: Rápido y económico (imágenes + texto)
 * - gemini-1.5-pro: Más potente (análisis complejos)
 * 
 * Autor: Ricardo Aral
 * Fecha: 2025-01-09
 * =====================================================
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// =====================================================
// CONSTANTES
// =====================================================

const STORAGE_KEY = 'gemini_api_key';
const MODEL_FLASH = 'gemini-1.5-flash'; // Para imágenes y tareas rápidas
const MODEL_PRO = 'gemini-1.5-pro';     // Para análisis complejos

// =====================================================
// GESTIÓN DE API KEY
// =====================================================

/**
 * Guarda la API key en localStorage
 * @param {string} apiKey - La API key de Google Gemini
 * @returns {boolean} - true si se guardó correctamente
 */
export function guardarApiKey(apiKey) {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('La API key no puede estar vacía');
    }
    
    localStorage.setItem(STORAGE_KEY, apiKey.trim());
    console.log('✅ API key guardada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error guardando API key:', error);
    return false;
  }
}

/**
 * Obtiene la API key desde localStorage
 * @returns {string|null} - La API key o null si no existe
 */
export function obtenerApiKey() {
  try {
    const apiKey = localStorage.getItem(STORAGE_KEY);
    return apiKey || null;
  } catch (error) {
    console.error('❌ Error obteniendo API key:', error);
    return null;
  }
}

/**
 * Elimina la API key de localStorage
 * @returns {boolean} - true si se eliminó correctamente
 */
export function eliminarApiKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ API key eliminada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando API key:', error);
    return false;
  }
}

/**
 * Verifica si existe una API key configurada
 * @returns {boolean} - true si existe API key
 */
export function tieneApiKey() {
  const apiKey = obtenerApiKey();
  return apiKey !== null && apiKey.length > 0;
}

// =====================================================
// INICIALIZACIÓN DEL CLIENTE
// =====================================================

/**
 * Inicializa el cliente de Gemini con la API key
 * @param {string} modelName - Nombre del modelo ('flash' o 'pro')
 * @returns {Object|null} - Cliente inicializado o null si hay error
 */
export function inicializarCliente(modelName = 'flash') {
  try {
    const apiKey = obtenerApiKey();
    
    if (!apiKey) {
      throw new Error('No hay API key configurada. Por favor configura tu API key primero.');
    }

    // Crear instancia de GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Seleccionar modelo
    const modelo = modelName === 'pro' ? MODEL_PRO : MODEL_FLASH;
    
    // Obtener el modelo generativo
    const model = genAI.getGenerativeModel({ model: modelo });
    
    console.log(`✅ Cliente Gemini inicializado con modelo: ${modelo}`);
    
    return model;
  } catch (error) {
    console.error('❌ Error inicializando cliente Gemini:', error);
    return null;
  }
}

// =====================================================
// VALIDACIÓN DE API KEY
// =====================================================

/**
 * Valida que la API key funciona haciendo una petición de prueba
 * @returns {Promise<Object>} - { valida: boolean, mensaje: string }
 */
export async function validarApiKey() {
  try {
    const apiKey = obtenerApiKey();
    
    if (!apiKey) {
      return {
        valida: false,
        mensaje: 'No hay API key configurada'
      };
    }

    // Intentar inicializar el cliente
    const model = inicializarCliente('flash');
    
    if (!model) {
      return {
        valida: false,
        mensaje: 'Error al inicializar el cliente'
      };
    }

    // Hacer una petición simple de prueba
    const prompt = "Responde solo con la palabra: OK";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Si llegamos aquí, la API key funciona
    console.log('✅ API key validada correctamente');
    
    return {
      valida: true,
      mensaje: 'API key válida y funcional'
    };

  } catch (error) {
    console.error('❌ Error validando API key:', error);
    
    // Analizar el tipo de error
    let mensaje = 'Error desconocido al validar la API key';
    
    if (error.message?.includes('API_KEY_INVALID')) {
      mensaje = 'La API key no es válida';
    } else if (error.message?.includes('quota')) {
      mensaje = 'Se excedió la cuota de uso de la API';
    } else if (error.message?.includes('network')) {
      mensaje = 'Error de conexión. Verifica tu internet.';
    }

    return {
      valida: false,
      mensaje: mensaje
    };
  }
}

// =====================================================
// FUNCIONES DE GENERACIÓN (BASE)
// =====================================================

/**
 * Genera contenido con solo texto (sin imágenes)
 * @param {string} prompt - El prompt de texto
 * @param {string} modelType - 'flash' o 'pro'
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function generarContenidoTexto(prompt, modelType = 'flash') {
  try {
    const model = inicializarCliente(modelType);
    
    if (!model) {
      throw new Error('No se pudo inicializar el cliente');
    }

    console.log(`📤 Enviando prompt a Gemini ${modelType}...`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📥 Respuesta recibida de Gemini');
    
    return text;

  } catch (error) {
    console.error('❌ Error generando contenido:', error);
    throw error;
  }
}

/**
 * Genera contenido con imagen + texto
 * @param {string} prompt - El prompt de texto
 * @param {string} imagenBase64 - Imagen en formato Base64
 * @param {string} mimeType - Tipo MIME de la imagen (ej: 'image/png')
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function generarContenidoConImagen(prompt, imagenBase64, mimeType = 'image/png') {
  try {
    const model = inicializarCliente('flash'); // Flash es mejor para imágenes
    
    if (!model) {
      throw new Error('No se pudo inicializar el cliente');
    }

    console.log('📤 Enviando imagen + prompt a Gemini Vision...');

    // Limpiar el Base64 (quitar el prefijo data:image/...)
    const base64Limpio = imagenBase64.includes('base64,')
      ? imagenBase64.split('base64,')[1]
      : imagenBase64;

    // Preparar las partes del mensaje
    const imagePart = {
      inlineData: {
        data: base64Limpio,
        mimeType: mimeType
      }
    };

    // Generar contenido con imagen + texto
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('📥 Respuesta recibida de Gemini Vision');
    
    return text;

  } catch (error) {
    console.error('❌ Error generando contenido con imagen:', error);
    throw error;
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Extrae JSON de una respuesta de texto que puede contener markdown
 * @param {string} textoRespuesta - Respuesta de la IA
 * @returns {Object|null} - Objeto JSON parseado o null si hay error
 */
export function extraerJSON(textoRespuesta) {
  try {
    // Intentar parsear directo
    try {
      return JSON.parse(textoRespuesta);
    } catch {
      // Si falla, buscar bloques de código
    }

    // Buscar JSON dentro de bloques ```json ... ```
    const matchJson = textoRespuesta.match(/```json\s*([\s\S]*?)\s*```/);
    if (matchJson) {
      return JSON.parse(matchJson[1]);
    }

    // Buscar JSON dentro de bloques ``` ... ```
    const matchCode = textoRespuesta.match(/```\s*([\s\S]*?)\s*```/);
    if (matchCode) {
      return JSON.parse(matchCode[1]);
    }

    // Buscar cualquier objeto JSON en el texto
    const matchObject = textoRespuesta.match(/\{[\s\S]*\}/);
    if (matchObject) {
      return JSON.parse(matchObject[0]);
    }

    throw new Error('No se encontró JSON válido en la respuesta');

  } catch (error) {
    console.error('❌ Error extrayendo JSON:', error);
    return null;
  }
}

/**
 * Detecta el tipo MIME de una imagen Base64
 * @param {string} base64String - String Base64 de la imagen
 * @returns {string} - Tipo MIME detectado
 */
export function detectarMimeType(base64String) {
  if (base64String.startsWith('data:image/png')) return 'image/png';
  if (base64String.startsWith('data:image/jpeg')) return 'image/jpeg';
  if (base64String.startsWith('data:image/jpg')) return 'image/jpeg';
  if (base64String.startsWith('data:image/webp')) return 'image/webp';
  if (base64String.startsWith('data:image/gif')) return 'image/gif';
  
  // Por defecto, asumir PNG
  return 'image/png';
}

// =====================================================
// INFORMACIÓN Y DEBUG
// =====================================================

/**
 * Obtiene información sobre la configuración actual
 * @returns {Object} - Información de configuración
 */
export function obtenerInfoConfiguracion() {
  return {
    tieneApiKey: tieneApiKey(),
    apiKeyLength: obtenerApiKey()?.length || 0,
    modeloFlash: MODEL_FLASH,
    modeloPro: MODEL_PRO,
    storageKey: STORAGE_KEY
  };
}

/**
 * Muestra información de debug en consola
 */
export function mostrarDebugInfo() {
  console.log('=== GEMINI CLIENT DEBUG ===');
  console.log('API Key configurada:', tieneApiKey());
  console.log('Longitud API Key:', obtenerApiKey()?.length || 0);
  console.log('Modelo Flash:', MODEL_FLASH);
  console.log('Modelo Pro:', MODEL_PRO);
  console.log('===========================');
}

// =====================================================
// EXPORTACIONES
// =====================================================

export default {
  // Gestión de API Key
  guardarApiKey,
  obtenerApiKey,
  eliminarApiKey,
  tieneApiKey,
  validarApiKey,
  
  // Cliente
  inicializarCliente,
  
  // Generación
  generarContenidoTexto,
  generarContenidoConImagen,
  
  // Utilidades
  extraerJSON,
  detectarMimeType,
  obtenerInfoConfiguracion,
  mostrarDebugInfo
};