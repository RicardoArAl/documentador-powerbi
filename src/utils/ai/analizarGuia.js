/**
 * GENERADOR DE GUÍA DE RECONSTRUCCIÓN POWER BI
 * 
 * Genera paso a paso detallado para recrear un reporte en Power BI
 * usando toda la información documentada
 * 
 * Versión: 1.0 - CORREGIDO
 * Fecha: 2026-01-01
 */

import { generarContenidoTexto, extraerJSON } from './geminiClient';

// Modelo a usar (hardcoded porque MODELO_PRINCIPAL está en el export default, no en named exports)
const MODELO_A_USAR = 'gemini-2.5-flash';

/**
 * Genera la guía completa para reconstruir el reporte en Power BI
 * @param {Object} reportData - Objeto con toda la información documentada
 * @returns {Promise<Object>} - { exito, guia, error }
 */
export async function generarGuiaPowerBI(reportData) {
  try {
    console.log('🤖 Iniciando generación de guía...');

    // Validar que hay datos mínimos
    if (!reportData.nombreReporte || !reportData.codigoReporte) {
      throw new Error('Se requiere al menos nombre y código del reporte (Sección 1)');
    }

    if (!reportData.camposDetectados || reportData.camposDetectados.length === 0) {
      throw new Error('Se requiere al menos un campo detectado (Sección 2)');
    }

    // Construir contexto completo
    const contexto = construirContexto(reportData);

    // Crear prompt
    const prompt = crearPromptGuia(contexto);

    // Llamar a Gemini con el modelo correcto
    console.log(`🤖 Usando modelo: ${MODELO_A_USAR}`);
    const respuesta = await generarContenidoTexto(prompt, MODELO_A_USAR);

    if (!respuesta || !respuesta.trim()) {
      throw new Error('La IA no devolvió respuesta');
    }

    console.log('📥 Respuesta recibida, extrayendo JSON...');

    // Extraer y parsear JSON
    const guiaJSON = extraerJSON(respuesta);

    if (!guiaJSON || !guiaJSON.pasos) {
      console.error('❌ JSON inválido:', respuesta.substring(0, 200));
      throw new Error('El JSON devuelto no tiene el formato esperado. Verifica que la IA devuelva un objeto con la propiedad "pasos"');
    }

    // Enriquecer pasos con capturas de referencia
    const guiaEnriquecida = enriquecerConCapturas(guiaJSON, reportData);

    // Inicializar estados de completado
    guiaEnriquecida.pasosCompletados = new Array(guiaEnriquecida.pasos.length).fill(false);

    console.log('✅ Guía generada exitosamente');

    return {
      exito: true,
      guia: guiaEnriquecida,
      error: null
    };

  } catch (error) {
    console.error('❌ Error al generar guía:', error);
    
    // Mensajes de error más específicos
    let mensajeError = error.message;
    
    if (error.message.includes('API key')) {
      mensajeError = 'Error de API Key. Configura tu API Key de Gemini en el botón del header.';
    } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      mensajeError = 'Has excedido tu cuota de Gemini. Espera unos minutos e intenta de nuevo.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      mensajeError = 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    } else if (error.message.includes('JSON')) {
      mensajeError = 'La IA no devolvió un formato válido. Intenta regenerar la guía.';
    }
    
    return {
      exito: false,
      guia: null,
      error: mensajeError
    };
  }
}

/**
 * Construye el contexto completo del reporte
 */
function construirContexto(reportData) {
  const contexto = {
    // Info Básica
    nombreReporte: reportData.nombreReporte || 'Sin nombre',
    codigoReporte: reportData.codigoReporte || 'Sin código',
    categoria: reportData.categoria || 'General',
    objetivo: reportData.objetivo || 'No especificado',

    // Datos
    tablaOrigen: reportData.tablaOrigen || 'No especificada',
    consultaSQL: reportData.consultaSQL || '',
    totalCampos: reportData.camposDetectados?.length || 0,
    campos: reportData.camposDetectados || [],

    // Filtros
    totalFiltros: reportData.filtros?.length || 0,
    filtros: reportData.filtros || [],

    // Visualizaciones
    totalVisuales: reportData.visualizaciones?.length || 0,
    visualizaciones: reportData.visualizaciones || [],

    // Consultas Adicionales
    consultasAdicionales: reportData.consultasAdicionales || [],

    // Metadata
    frecuencia: reportData.frecuenciaActualizacion || 'No especificada',
    volumetria: reportData.volumetria || 'No especificada'
  };

  return contexto;
}

/**
 * Crea el prompt para Gemini
 */
function crearPromptGuia(contexto) {
  return `
Eres un experto en Power BI Desktop. Tu tarea es generar una GUÍA PASO A PASO DETALLADA para recrear un reporte de Business Intelligence basándote en su documentación completa.

# CONTEXTO DEL REPORTE:

**Información General:**
- Nombre: ${contexto.nombreReporte}
- Código: ${contexto.codigoReporte}
- Categoría: ${contexto.categoria}
- Objetivo: ${contexto.objetivo}

**Estructura de Datos:**
- Tabla/Vista Origen: ${contexto.tablaOrigen}
- Total de Campos: ${contexto.totalCampos}
- Consulta SQL Base: ${contexto.consultaSQL ? 'SÍ (disponible)' : 'NO'}

**Campos Detectados (${contexto.totalCampos}):**
${contexto.campos.map((c, idx) => `${idx + 1}. ${c.nombre} (${c.tipo}) ${c.esLlave ? '[PK]' : ''} - ${c.descripcion || 'Sin descripción'}`).join('\n')}

**Filtros/Parámetros (${contexto.totalFiltros}):**
${contexto.filtros.length > 0 ? contexto.filtros.map((f, idx) => 
  `${idx + 1}. ${f.nombre} - Tipo: ${f.tipoControl} - Campo SQL: ${f.campoSQL} - Valores: ${f.valores || 'Dinámicos'}`
).join('\n') : 'Sin filtros definidos'}

**Visualizaciones (${contexto.totalVisuales}):**
${contexto.visualizaciones.length > 0 ? contexto.visualizaciones.map((v, idx) => 
  `${idx + 1}. ${v.titulo || 'Visual ' + (idx + 1)} - Tipo: ${v.tipo} - Campos: ${v.camposUtilizados?.join(', ') || 'No especificados'}`
).join('\n') : 'Sin visualizaciones definidas'}

**Consultas SQL Adicionales:**
${contexto.consultasAdicionales.length > 0 ? contexto.consultasAdicionales.map((c, idx) => 
  `${idx + 1}. ${c.nombre} (${c.tipo})`
).join('\n') : 'Ninguna'}

**Metadata:**
- Frecuencia Actualización: ${contexto.frecuencia}
- Volumetría: ${contexto.volumetria}

---

# INSTRUCCIONES:

Genera una guía COMPLETA Y DETALLADA con los siguientes criterios:

1. **ESTRUCTURA COMPLETA:** La guía debe tener TODOS los pasos necesarios desde cero (abrir Power BI Desktop) hasta el reporte final.

2. **ORDEN LÓGICO:** Sigue este flujo:
   - Conexión a datos
   - Importación de consultas SQL
   - Creación de relaciones (si aplica)
   - Configuración de filtros/parámetros
   - Creación de visualizaciones (una por una)
   - Formato y diseño final
   - Publicación/guardado

3. **NIVEL DE DETALLE:** Cada paso debe incluir:
   - Título descriptivo
   - Descripción clara del objetivo
   - Instrucciones numeradas específicas (clicks, menús, opciones)
   - Código SQL si aplica
   - Configuraciones detalladas
   - Tips y mejores prácticas

4. **CÓDIGO SQL:** Cuando proporciones código SQL:
   - Usa la consulta base documentada
   - Adapta según sea necesario
   - Incluye comentarios explicativos
   - Formatea correctamente

5. **VISUALIZACIONES:** Para cada visual:
   - Especifica tipo exacto (Tabla, Gráfico de Barras, KPI, etc.)
   - Lista todos los campos que van en cada eje/valor/leyenda
   - Incluye configuraciones de formato
   - Menciona métricas calculadas si existen

6. **FILTROS:** Para cada filtro:
   - Especifica tipo de control (Slicer, Dropdown, etc.)
   - Indica el campo SQL exacto
   - Explica cómo configurar valores
   - Menciona interacciones con visuales

7. **COMPLEJIDAD:** Evalúa la complejidad del reporte como:
   - "Baja": Pocos campos, 1-3 visuales, sin filtros complejos
   - "Media": Varios campos, 4-8 visuales, algunos filtros
   - "Alta": Muchos campos, 9+ visuales, filtros complejos, múltiples consultas

8. **TIEMPO ESTIMADO:** Calcula el tiempo realista que tomaría recrear el reporte.

9. **PREREQUISITOS:** Lista todo lo necesario antes de empezar (accesos BD, Power BI Desktop, etc.)

10. **NOTAS FINALES:** Incluye validaciones, pruebas y mejores prácticas.

---

# FORMATO DE SALIDA (JSON):

Responde ÚNICAMENTE con un objeto JSON con esta estructura EXACTA (sin markdown, sin explicaciones):

{
  "complejidad": "Baja",
  "tiempoEstimado": "2-3 horas",
  "prerequisitos": [
    "Power BI Desktop instalado (versión más reciente)",
    "Acceso a la base de datos SQL Server"
  ],
  "pasos": [
    {
      "titulo": "Conectar a SQL Server",
      "icono": "🔌",
      "descripcion": "Establecer la conexión con la base de datos SQL Server que contiene los datos del reporte",
      "instrucciones": [
        "Abre Power BI Desktop",
        "En la pestaña Inicio, click en Obtener datos",
        "Selecciona SQL Server de la lista",
        "Ingresa el servidor y base de datos",
        "Click en Aceptar"
      ],
      "configuracion": [
        "Modo de conectividad: DirectQuery o Import según necesidad",
        "Autenticación: Windows o SQL Server"
      ],
      "tips": [
        "Usa DirectQuery si los datos cambian frecuentemente",
        "Usa Import si necesitas mejor rendimiento"
      ]
    }
  ],
  "notasFinales": [
    "Valida los datos antes de publicar",
    "Configura actualización programada si usas Import"
  ]
}

REGLAS CRÍTICAS:
1. NO uses markdown
2. NO incluyas texto antes o después del JSON
3. Responde SOLO con el objeto JSON válido
4. TODOS los arrays deben tener al menos 1 elemento
5. Incluye AL MENOS 8 pasos detallados
6. Si un paso no necesita código SQL, NO incluyas el campo codigoSQL (omítelo completamente)
7. Cada paso DEBE tener: titulo, icono, descripcion, instrucciones
8. Instrucciones deben ser MUY específicas (menús, botones, clicks exactos)
`;
}

/**
 * Enriquece los pasos con capturas de referencia de filtros y visuales
 */
function enriquecerConCapturas(guia, reportData) {
  const guiaEnriquecida = { ...guia };

  // Buscar pasos que mencionen filtros y agregar capturas
  if (reportData.filtros && reportData.filtros.length > 0) {
    guiaEnriquecida.pasos = guiaEnriquecida.pasos.map(paso => {
      const pasoEnriquecido = { ...paso };
      
      // Si el paso menciona filtros, agregar las capturas
      if (paso.titulo && (
        paso.titulo.toLowerCase().includes('filtro') ||
        paso.titulo.toLowerCase().includes('slicer') ||
        paso.titulo.toLowerCase().includes('parámetro')
      )) {
        // Agregar todas las capturas de filtros disponibles
        const capturasRelevantes = reportData.filtros
          .filter(f => f.imagenPreview)
          .map(f => f.imagenPreview);
        
        if (capturasRelevantes.length > 0) {
          pasoEnriquecido.capturaReferencia = capturasRelevantes[0]; // Primera captura disponible
        }
      }

      return pasoEnriquecido;
    });
  }

  // Buscar pasos que mencionen visualizaciones y agregar capturas
  if (reportData.visualizaciones && reportData.visualizaciones.length > 0) {
    guiaEnriquecida.pasos = guiaEnriquecida.pasos.map(paso => {
      const pasoEnriquecido = { ...paso };
      
      // Si el paso menciona visualizaciones, agregar las capturas
      if (paso.titulo && (
        paso.titulo.toLowerCase().includes('visual') ||
        paso.titulo.toLowerCase().includes('gráfico') ||
        paso.titulo.toLowerCase().includes('tabla') ||
        paso.titulo.toLowerCase().includes('kpi')
      )) {
        // Buscar capturas de visuales que coincidan con el tipo mencionado
        const visualRelevante = reportData.visualizaciones.find(v => {
          const tituloLower = paso.titulo.toLowerCase();
          const tipoLower = v.tipo.toLowerCase();
          return tituloLower.includes(tipoLower) || 
                 (v.titulo && tituloLower.includes(v.titulo.toLowerCase()));
        });

        if (visualRelevante && visualRelevante.imagen) {
          pasoEnriquecido.capturaReferencia = visualRelevante.imagen;
        }
      }

      return pasoEnriquecido;
    });
  }

  return guiaEnriquecida;
}

export default generarGuiaPowerBI;