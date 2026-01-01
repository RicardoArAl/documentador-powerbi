/**
 * =====================================================
 * GEMINI CLIENT - Cliente para Google Gemini API
 * =====================================================
 * 
 * Este módulo gestiona la conexión con la API de Gemini.
 * Actualizado para usar los modelos correctos de Enero 2026.
 * 
 * MODELOS DISPONIBLES (Enero 2026):
 * ✅ gemini-3-flash-preview      → Último modelo (Nov 2025)
 * ✅ gemini-3-pro-preview        → Más potente (Nov 2025)
 * ✅ gemini-2.5-flash            → Stable (Jun 2025)
 * ✅ gemini-2.5-flash-lite       → Más rápido (Jul 2025)
 * ✅ gemini-2.5-pro              → Thinking avanzado (Jun 2025)
 * ✅ gemini-2.0-flash            → Generación anterior (Feb 2025)
 * 
 * ❌ gemini-2.0-flash-exp        → YA NO EXISTE (era experimental)
 * ❌ gemini-1.5-flash            → DEPRECADO
 * ❌ gemini-1.5-pro              → DEPRECADO
 * ❌ gemini-pro                  → DEPRECADO
 * 
 * Documentación oficial: https://ai.google.dev/gemini-api/docs/models
 * 
 * Autor: Ricardo Aral
 * Fecha: 2025-01-01
 * Versión: 4.0 (ACTUALIZADO - Modelos Enero 2026)
 * =====================================================
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// =====================================================
// CONSTANTES - MODELOS ACTUALIZADOS (Enero 2026)
// =====================================================

const STORAGE_KEY = 'gemini_api_key';

// Lista de modelos en orden de prioridad (del más nuevo al más antiguo)
const MODELOS_DISPONIBLES = [
  'gemini-3-flash-preview',      // ← 1ra opción: Último modelo (Dic 2025)
  'gemini-2.5-flash',             // ← 2da opción: Stable y balanceado (Jun 2025)
  'gemini-2.5-flash-lite',        // ← 3ra opción: Más rápido (Jul 2025)
  'gemini-2.0-flash',             // ← 4ta opción: Generación anterior (Feb 2025)
];

// Modelo principal para inicialización
const MODELO_PRINCIPAL = 'gemini-2.5-flash'; // Stable y confiable

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
 * @param {string} modelName - Nombre del modelo (opcional, usa el principal por defecto)
 * @returns {Object|null} - Cliente inicializado o null si hay error
 */
export function inicializarCliente(modelName = MODELO_PRINCIPAL) {
  try {
    const apiKey = obtenerApiKey();
    
    if (!apiKey) {
      throw new Error('No hay API key configurada. Por favor configura tu API key primero.');
    }

    // Crear instancia de GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Validar que el modelo solicitado existe
    const modeloAUsar = MODELOS_DISPONIBLES.includes(modelName) 
      ? modelName 
      : MODELO_PRINCIPAL;
    
    // Obtener el modelo generativo
    const model = genAI.getGenerativeModel({ model: modeloAUsar });
    
    console.log(`✅ Cliente Gemini inicializado con modelo: ${modeloAUsar}`);
    
    return model;
  } catch (error) {
    console.error('❌ Error inicializando cliente Gemini:', error);
    return null;
  }
}

/**
 * ⚠️ ALIAS PARA COMPATIBILIDAD ⚠️
 * Esta función es requerida por analizarImagen.js
 */
export async function obtenerClienteGemini() {
  return inicializarCliente(MODELO_PRINCIPAL);
}

// =====================================================
// VALIDACIÓN DE API KEY
// =====================================================

/**
 * Valida que la API key funciona haciendo una petición de prueba
 * Prueba modelos en orden hasta encontrar uno funcional
 * @returns {Promise<Object>} - { valida: boolean, mensaje: string, modeloUsado?: string, error?: string }
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

    // Validar formato básico
    if (apiKey.length < 20) {
      return {
        valida: false,
        mensaje: 'La API key parece inválida (muy corta)'
      };
    }

    console.log('🔍 Validando API key con Gemini (Enero 2026)...');
    console.log('📋 Modelos a probar:', MODELOS_DISPONIBLES);

    // Crear cliente
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let modeloFuncional = null;
    let ultimoError = null;

    // Probar cada modelo hasta encontrar uno que funcione
    for (const nombreModelo of MODELOS_DISPONIBLES) {
      try {
        console.log(`🔄 Probando modelo: ${nombreModelo}...`);
        
        const model = genAI.getGenerativeModel({ model: nombreModelo });
        
        // Configuración de generación mínima para validación
        const generationConfig = {
          maxOutputTokens: 10,
          temperature: 0.1,
        };

        // Timeout de 15 segundos
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('TIMEOUT')), 15000);
        });

        // Prompt de prueba simple
        const generationPromise = model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: 'Di solo: OK' }]
          }],
          generationConfig
        });
        
        const result = await Promise.race([generationPromise, timeoutPromise]);
        const response = result.response;
        const text = response.text();

        console.log(`✅ Modelo funcional encontrado: ${nombreModelo}`);
        console.log('📝 Respuesta de prueba:', text.substring(0, 50));
        
        modeloFuncional = nombreModelo;
        break; // Salir del loop si encontramos un modelo funcional
        
      } catch (error) {
        console.warn(`❌ Modelo ${nombreModelo} no disponible:`, error.message);
        ultimoError = error;
        continue; // Probar siguiente modelo
      }
    }

    if (modeloFuncional) {
      return {
        valida: true,
        mensaje: `✅ API key válida`,
        modeloUsado: modeloFuncional
      };
    } else {
      // Si ningún modelo funciona
      throw ultimoError || new Error('Ningún modelo de Gemini disponible');
    }

  } catch (error) {
    console.error('❌ Error completo al validar:', error);

    let mensaje = 'Error desconocido al validar la API key';
    let errorDetallado = error.message || error.toString();

    // Análisis de errores comunes
    if (errorDetallado.includes('API_KEY_INVALID') || errorDetallado.includes('invalid api key')) {
      mensaje = '❌ La API key no es válida. Verifica que la copiaste correctamente desde https://aistudio.google.com/apikey';
    } 
    else if (errorDetallado.includes('API key not valid')) {
      mensaje = '❌ La API key no es válida. Crea una nueva en https://aistudio.google.com/apikey';
    }
    else if (errorDetallado.includes('quota') || errorDetallado.includes('RESOURCE_EXHAUSTED') || errorDetallado.includes('429')) {
      mensaje = '⚠️ Se excedió la cuota de uso. Posibles causas:\n' +
                '1. Has hecho demasiadas peticiones (espera 1 minuto)\n' +
                '2. Límite diario alcanzado (espera 24 horas)\n' +
                '3. Cuenta nueva sin quota asignada (espera 24-48 horas o habilita billing)';
    }
    else if (errorDetallado.includes('You exceeded your current quota, please check your plan')) {
      mensaje = '⚠️ Quota excedida. Tu cuenta tiene límite 0 en free tier.\n' +
                'Soluciones:\n' +
                '1. Espera 24-48 horas (cuentas nuevas necesitan "madurar")\n' +
                '2. Habilita billing en Google Cloud (sin cargos automáticos)\n' +
                '3. Crea una API Key nueva desde https://aistudio.google.com/apikey';
    }
    else if (errorDetallado.includes('PERMISSION_DENIED')) {
      mensaje = '❌ Permiso denegado. Verifica que:\n' +
                '1. La API key tenga los permisos correctos\n' +
                '2. Tu país esté soportado (Colombia SÍ está soportado)\n' +
                '3. La API "Generative Language API" esté habilitada';
    }
    else if (errorDetallado.includes('Failed to fetch') || errorDetallado.includes('network')) {
      mensaje = '🌐 Error de conexión. Verifica:\n' +
                '1. Tu conexión a internet\n' +
                '2. No estés usando VPN o proxy\n' +
                '3. El firewall no esté bloqueando la conexión';
    }
    else if (errorDetallado.includes('TIMEOUT')) {
      mensaje = '⏱️ Timeout de conexión. La API de Gemini está tardando mucho. Intenta nuevamente en 1 minuto.';
    }
    else if (errorDetallado.includes('404') || errorDetallado.includes('not found')) {
      mensaje = '❌ Modelo no encontrado. Esto puede indicar:\n' +
                '1. Tu API key no tiene acceso a modelos Gemini\n' +
                '2. Necesitas crear una API key nueva desde https://aistudio.google.com/apikey\n' +
                '3. La API "Generative Language API" no está habilitada';
    }
    else if (errorDetallado.includes('Ningún modelo')) {
      mensaje = '❌ Ningún modelo de Gemini disponible para tu API Key.\n' +
                'Soluciones:\n' +
                '1. Crea una API Key NUEVA desde https://aistudio.google.com/apikey\n' +
                '2. Elimina todas las API Keys antiguas\n' +
                '3. Prueba primero en la interfaz web de AI Studio antes de usar en código';
    }
    else if (errorDetallado.includes('500') || errorDetallado.includes('internal')) {
      mensaje = '🔧 Error interno del servidor de Google. Intenta más tarde (5-10 minutos).';
    }
    else if (errorDetallado.includes('blocked')) {
      mensaje = '🚫 Solicitud bloqueada por políticas de seguridad. Verifica el contenido de tus prompts.';
    }

    return {
      valida: false,
      mensaje: mensaje,
      error: errorDetallado
    };
  }
}

// =====================================================
// FUNCIONES DE GENERACIÓN
// =====================================================

/**
 * Genera contenido con solo texto (sin imágenes)
 * @param {string} prompt - El prompt de texto
 * @param {string} modelType - Tipo de modelo (opcional)
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function generarContenidoTexto(prompt, modelType = MODELO_PRINCIPAL) {
  try {
    const model = inicializarCliente(modelType);
    
    if (!model) {
      throw new Error('No se pudo inicializar el cliente');
    }

    console.log(`📤 Enviando prompt a Gemini (${modelType})...`);
    
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });
    
    const response = result.response;
    const text = response.text();

    console.log('📥 Respuesta recibida');
    
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
 * @param {string} mimeType - Tipo MIME de la imagen
 * @returns {Promise<string>} - Respuesta de la IA
 */
export async function generarContenidoConImagen(prompt, imagenBase64, mimeType = 'image/png') {
  try {
    const model = inicializarCliente(MODELO_PRINCIPAL);
    
    if (!model) {
      throw new Error('No se pudo inicializar el cliente');
    }

    console.log('📤 Enviando imagen + prompt a Gemini Vision...');

    // Limpiar el Base64
    const base64Limpio = imagenBase64.includes('base64,')
      ? imagenBase64.split('base64,')[1]
      : imagenBase64;

    // Preparar partes del mensaje
    const imagePart = {
      inlineData: {
        data: base64Limpio,
        mimeType: mimeType
      }
    };

    const textPart = {
      text: prompt
    };

    // Generar contenido con imagen + texto
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [textPart, imagePart]
      }]
    });
    
    const response = result.response;
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
 * Extrae JSON de una respuesta que puede contener markdown
 * @param {string} textoRespuesta - Respuesta de la IA
 * @returns {Object|null} - Objeto JSON parseado o null
 */
export function extraerJSON(textoRespuesta) {
  try {
    // Intentar parsear directo
    try {
      return JSON.parse(textoRespuesta);
    } catch {
      // Continuar con regex
    }

    // Buscar JSON en bloques ```json
    const matchJson = textoRespuesta.match(/```json\s*([\s\S]*?)\s*```/);
    if (matchJson) {
      return JSON.parse(matchJson[1]);
    }

    // Buscar JSON en bloques ```
    const matchCode = textoRespuesta.match(/```\s*([\s\S]*?)\s*```/);
    if (matchCode) {
      return JSON.parse(matchCode[1]);
    }

    // Buscar cualquier objeto JSON
    const matchObject = textoRespuesta.match(/\{[\s\S]*\}/);
    if (matchObject) {
      return JSON.parse(matchObject[0]);
    }

    throw new Error('No se encontró JSON válido');

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
  
  return 'image/png'; // Por defecto
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
    modeloPrincipal: MODELO_PRINCIPAL,
    modelosDisponibles: MODELOS_DISPONIBLES,
    storageKey: STORAGE_KEY,
    version: '4.0',
    fechaActualizacion: '2025-01-01'
  };
}

/**
 * Muestra información de debug en consola
 */
export function mostrarDebugInfo() {
  console.log('=== GEMINI CLIENT DEBUG (v4.0 - Enero 2026) ===');
  console.log('API Key configurada:', tieneApiKey());
  console.log('Longitud API Key:', obtenerApiKey()?.length || 0);
  console.log('Modelo principal:', MODELO_PRINCIPAL);
  console.log('Modelos disponibles:', MODELOS_DISPONIBLES);
  console.log('================================================');
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
  obtenerClienteGemini,
  
  // Generación
  generarContenidoTexto,
  generarContenidoConImagen,
  
  // Utilidades
  extraerJSON,
  detectarMimeType,
  obtenerInfoConfiguracion,
  mostrarDebugInfo,
  
  // Constantes (para acceso externo si es necesario)
  MODELOS_DISPONIBLES,
  MODELO_PRINCIPAL
};