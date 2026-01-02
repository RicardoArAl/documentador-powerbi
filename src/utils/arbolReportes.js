/**
 * Árbol jerárquico completo de reportes Banner
 * Estructura organizacional estática que la IA usa como contexto
 * para detectar automáticamente la ubicación de cada reporte
 */

export const ARBOL_REPORTES_BANNER = {
  sistema: "Banner",
  areas: [
    {
      nombre: "Gestión Académica",
      subareas: [
        {
          nombre: "Administración Académica",
          reportes: [
            { codigo: "BNR-AC-AA-02", nombre: "PENSUM por plan de estudio" },
            { codigo: "BNR-AC-AA-08", nombre: "Asistencia por periodo" },
            { codigo: "BNR-AC-AA-09", nombre: "Datos básicos de estudiantes" },
            { codigo: "BNR-AC-AA-13", nombre: "Informe de reajustes por perdido" },
            { codigo: "BNR-AC-AA-15", nombre: "Alumnos matriculado con créditos y promedios" },
            { codigo: "BNR-AC-AA-19", nombre: "Historia académica" },
            { codigo: "BNR-AC-AA-22", nombre: "Lista de clases con notas" },
            { codigo: "BNR-AC-AA-23", nombre: "Notas parciales sin acumulado" },
            { codigo: "BNR-AC-AA-27", nombre: "Estado Solicitud Certificaciones" },
            { codigo: "BNR-AC-AA-29", nombre: "Reporte estudiante SENA-transferencia-programa de procedencia" },
            { codigo: "BNR-AC-AA-33", nombre: "Estudiantes por estados" },
            { codigo: "BNR-AC-AA-36", nombre: "Estudiantes saber 11" },
            { codigo: "BNR-AC-AA-39", nombre: "Estudiantes con plan de estudio finalizado no graduados" },
            { codigo: "BNR-AC-AA-40", nombre: "SNIES Actualizar documento participante" },
            { codigo: "BNR-AC-AA-41", nombre: "SNIES Admitidos" },
            { codigo: "BNR-AC-AA-42", nombre: "SNIES Apoyo Financieros académicos" },
            { codigo: "BNR-AC-AA-43", nombre: "Estudiantes Primer Curso" },
            { codigo: "BNR-AC-AA-44", nombre: "SNIES Graduados" },
            { codigo: "BNR-AC-AA-45", nombre: "SNIES Inscritos Relacion Inscritos" },
            { codigo: "BNR-AC-AA-46", nombre: "SNIES Matriculados" },
            { codigo: "BNR-AC-AA-47", nombre: "SNIES Participante completos por IES" },
            { codigo: "BNR-AC-AA-48", nombre: "SNIES Retiros estudiantes" },
            { codigo: "BNR-AC-AA-50", nombre: "SNIES Inscritos por programa" },
            { codigo: "BNR-AC-AA-52", nombre: "Estudiantes activos con requisitos de grado" },
            { codigo: "BNR-AC-AA-54", nombre: "SNIES Alumnos matriculados y Materias" }
          ]
        },
        {
          nombre: "Educación Continua",
          reportes: [
            { codigo: "BNR-EC-AC-01", nombre: "Inscritos Matriculados Educacion Continua" },
            { codigo: "BNR-EC-AC-02", nombre: "Notas Educación Continua" },
            { codigo: "BNR-EC-AC-03", nombre: "Plan académico del estudiante Educacion Continua" }
          ]
        },
        {
          nombre: "Programación Académica",
          reportes: [
            { codigo: "BNR-AC-PA-02", nombre: "Programa" },
            { codigo: "BNR-AC-PA-03", nombre: "Alumnos matriculados y materias asociadas" }
          ]
        },
        {
          nombre: "Reclutamiento y Admisión",
          reportes: [
            { codigo: "BNR-AC-RA-03", nombre: "Admisión" },
            { codigo: "BNR-AC-RA-06", nombre: "Inscritos" }
          ]
        },
        {
          nombre: "Titulación",
          reportes: [
            { codigo: "BNR-AC-TI-02", nombre: "Graduados" },
            { codigo: "BNR-AC-TI-03", nombre: "Listado de Egresados en Tramite de Grado Graduado" },
            { codigo: "BNR-AC-TI-04", nombre: "Inscritos a grados" }
          ]
        }
      ]
    },
    {
      nombre: "Gestión Académica y Financiera",
      subareas: [
        {
          nombre: "Matrícula Financiera - Administración Académica",
          reportes: [
            { codigo: "BNR-AF-FA-01", nombre: "Boletos de pago o liquidación de matrícula" },
            { codigo: "BNR-AF-FA-01-EC", nombre: "Boletos de pago o liquidación de matrícula EC" },
            { codigo: "BNR-AF-FA-01-H", nombre: "Boletos de pago o liquidación de matrícula Histórico" },
            { codigo: "BNR-AF-FA-02", nombre: "Bloqueos de estudiantes" },
            { codigo: "BNR-AF-FA-03", nombre: "Boletos auditoria" },
            { codigo: "BNR-AF-FA-04", nombre: "DAFE" }
          ]
        }
      ]
    },
    {
      nombre: "Gestión Financiera",
      subareas: [
        {
          nombre: "Cobranza",
          reportes: [
            { codigo: "BNR-FI-CB-01", nombre: "Centrales riesgo" },
            { codigo: "BNR-FI-CB-02", nombre: "Cartera" }
          ]
        },
        {
          nombre: "Contratos",
          reportes: [
            { codigo: "BNR-FI-CO-01", nombre: "Contratos" }
          ]
        },
        {
          nombre: "Exenciones",
          reportes: [
            { codigo: "BNR-FI-EX-01", nombre: "Exenciones" }
          ]
        },
        {
          nombre: "Matrícula Financiera",
          reportes: [
            { codigo: "BNR-FI-MF-02", nombre: "Base Valor Matrícula" },
            { codigo: "BNR-FI-MF-03", nombre: "Formas de pago estudiantes" }
          ]
        },
        {
          nombre: "Plan de Pagos",
          reportes: [
            { codigo: "BNR-FI-PP-01", nombre: "Cartera" }
          ]
        }
      ]
    }
  ]
};

/**
 * Obtiene todas las áreas únicas del árbol
 * @returns {Array<string>} Lista de nombres de áreas
 */
export const obtenerAreas = () => {
  return ARBOL_REPORTES_BANNER.areas.map(area => area.nombre);
};

/**
 * Obtiene todas las subáreas de un área específica
 * @param {string} nombreArea - Nombre del área
 * @returns {Array<string>} Lista de nombres de subáreas
 */
export const obtenerSubareas = (nombreArea) => {
  const area = ARBOL_REPORTES_BANNER.areas.find(a => a.nombre === nombreArea);
  return area ? area.subareas.map(subarea => subarea.nombre) : [];
};

/**
 * Obtiene todos los reportes de una subárea específica
 * @param {string} nombreArea - Nombre del área
 * @param {string} nombreSubarea - Nombre de la subárea
 * @returns {Array<Object>} Lista de reportes con {codigo, nombre}
 */
export const obtenerReportes = (nombreArea, nombreSubarea) => {
  const area = ARBOL_REPORTES_BANNER.areas.find(a => a.nombre === nombreArea);
  if (!area) return [];
  
  const subarea = area.subareas.find(s => s.nombre === nombreSubarea);
  return subarea ? subarea.reportes : [];
};

/**
 * Busca un reporte por su código en todo el árbol
 * @param {string} codigoReporte - Código del reporte (ej: "BNR-AC-AA-15")
 * @returns {Object|null} {area, subarea, reporte} o null si no se encuentra
 */
export const buscarReportePorCodigo = (codigoReporte) => {
  for (const area of ARBOL_REPORTES_BANNER.areas) {
    for (const subarea of area.subareas) {
      const reporte = subarea.reportes.find(r => r.codigo === codigoReporte);
      if (reporte) {
        return {
          sistema: ARBOL_REPORTES_BANNER.sistema,
          area: area.nombre,
          subarea: subarea.nombre,
          reporte: reporte
        };
      }
    }
  }
  return null;
};

/**
 * Obtiene reportes relacionados (misma subárea)
 * @param {string} codigoReporte - Código del reporte actual
 * @returns {Array<Object>} Lista de reportes relacionados (excluye el actual)
 */
export const obtenerReportesRelacionados = (codigoReporte) => {
  const ubicacion = buscarReportePorCodigo(codigoReporte);
  if (!ubicacion) return [];
  
  const reportes = obtenerReportes(ubicacion.area, ubicacion.subarea);
  return reportes.filter(r => r.codigo !== codigoReporte);
};

/**
 * Genera un string de breadcrumb navegable
 * @param {string} codigoReporte - Código del reporte
 * @returns {string} "Banner > Gestión Académica > Administración Académica"
 */
export const generarBreadcrumb = (codigoReporte) => {
  const ubicacion = buscarReportePorCodigo(codigoReporte);
  if (!ubicacion) return "";
  
  return `${ubicacion.sistema} > ${ubicacion.area} > ${ubicacion.subarea}`;
};