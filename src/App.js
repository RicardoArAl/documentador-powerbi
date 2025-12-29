import React, { useState } from 'react';
import InfoBasica from './components/InfoBasica/InfoBasica';
import ConsultaSQL from './components/ConsultaSQL/ConsultaSQL';
import Filtros from './components/Filtros/Filtros';
import Visualizaciones from './components/Visualizaciones/Visualizaciones';
import ConsultasAdicionales from './components/ConsultasAdicionales/ConsultasAdicionales';
import InfoAdicional from './components/InfoAdicional/InfoAdicional';
import './styles/global.css';

/**
 * DOCUMENTADOR DE REPORTES POWER BI
 * Aplicación para documentar reportes de Power BI de forma estructurada
 * 
 * Desarrollado por: Ricardo Aral
 * Email: jho.araque84@gmail.com
 * Versión: 1.1
 * Fecha: 2025-01-08
 * 
 * Estructura:
 * - 6 secciones documentables (TODAS COMPLETADAS ✅)
 * - Sistema de navegación por pasos
 * - Guardado automático
 * - Exportación múltiple (pendiente)
 */

function App() {
  // ============================================
  // ESTADO: Sección actual (navegación)
  // ============================================
  const [seccionActual, setSeccionActual] = useState(1);

  // ============================================
  // ESTADO GLOBAL: Toda la información del reporte
  // ============================================
  const [reportData, setReportData] = useState({
    // ===== SECCIÓN 1: INFORMACIÓN BÁSICA ===== ✅
    nombreReporte: '',
    codigoReporte: '',
    categoria: '',
    subcategoria: '',
    objetivo: '',
    usuarios: '',
    
    // ===== SECCIÓN 2: CONSULTA SQL Y ESTRUCTURA ===== ✅
    consultaSQL: '',              // Query pegada por el usuario
    tablaOrigen: '',              // Nombre de la tabla/vista origen
    camposDetectados: [],         // Array de campos parseados automáticamente
    
    // ===== SECCIÓN 3: FILTROS Y PARÁMETROS ===== ✅
    filtros: [],                  // Array de filtros documentados
    
    // ===== SECCIÓN 4: VISUALIZACIONES ===== ✅
    visualizaciones: [],          // Array de visuales documentados
    
    // ===== SECCIÓN 5: CONSULTAS ADICIONALES ===== ✅
    consultasAdicionales: [],     // Array de stored procedures, functions, etc.
    
    // ===== SECCIÓN 6: INFORMACIÓN ADICIONAL ===== ✅
    reportesRelacionados: '',
    frecuenciaActualizacion: '',
    volumetria: '',
    notasTecnicas: '',
    historialCambios: '',
    
    // ===== METADATOS =====
    documentadoPor: 'Ricardo Aral',
    fechaDocumentacion: new Date().toISOString().split('T')[0],
    versionReporte: 'v1.0',
    estadoReporte: 'Activo'
  });

  // ============================================
  // FUNCIÓN: Cambiar de sección
  // ============================================
  const handleCambiarSeccion = (numeroSeccion) => {
    setSeccionActual(numeroSeccion);
    // Scroll al inicio al cambiar de sección
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // FUNCIONES DE GUARDADO PARA SECCIONES 1-3
  // (Secciones 4-6 usan setReportData directamente)
  // ============================================

  /**
   * Guarda datos de Sección 1: Info Básica
   */
  const handleGuardarInfoBasica = (datosActualizados) => {
    setReportData(prev => ({
      ...prev,
      ...datosActualizados
    }));
  };

  /**
   * Guarda datos de Sección 2: Consulta SQL
   */
  const handleGuardarConsultaSQL = (datosActualizados) => {
    setReportData(prev => ({
      ...prev,
      consultaSQL: datosActualizados.consultaSQL || prev.consultaSQL,
      tablaOrigen: datosActualizados.tablaOrigen || prev.tablaOrigen,
      camposDetectados: datosActualizados.camposDetectados || prev.camposDetectados
    }));
  };

  /**
   * Guarda datos de Sección 3: Filtros
   */
  const handleGuardarFiltros = (datosActualizados) => {
    setReportData(prev => ({
      ...prev,
      filtros: datosActualizados.filtros || prev.filtros
    }));
  };

  // ============================================
  // FUNCIÓN: Renderizar componente según sección
  // ============================================
  const renderSeccion = () => {
    switch(seccionActual) {
      case 1:
        return (
          <InfoBasica 
            datos={reportData}
            onGuardar={handleGuardarInfoBasica}
          />
        );
      
      case 2:
        return (
          <ConsultaSQL 
            datos={reportData}
            onGuardar={handleGuardarConsultaSQL}
          />
        );
      
      case 3:
        return (
          <Filtros 
            datos={reportData}
            onGuardar={handleGuardarFiltros}
          />
        );
      
      case 4:
        return (
          <Visualizaciones 
            reportData={reportData}
            setReportData={setReportData}
          />
        );
      
      case 5:
        return (
          <ConsultasAdicionales 
            reportData={reportData}
            setReportData={setReportData}
          />
        );
      
      case 6:
        return (
          <InfoAdicional 
            reportData={reportData}
            setReportData={setReportData}
          />
        );
      
      default:
        return (
          <InfoBasica 
            datos={reportData}
            onGuardar={handleGuardarInfoBasica}
          />
        );
    }
  };

  // ============================================
  // FUNCIÓN: Calcular progreso de completitud
  // ============================================
  const calcularProgreso = () => {
    let seccionesCompletadas = 0;
    const totalSecciones = 6;

    // Sección 1: Info Básica (requerida)
    if (reportData.nombreReporte && reportData.codigoReporte && reportData.objetivo) {
      seccionesCompletadas++;
    }

    // Sección 2: Consulta SQL (requerida)
    if (reportData.consultaSQL && reportData.camposDetectados.length > 0) {
      seccionesCompletadas++;
    }

    // Sección 3: Filtros (opcional, se cuenta si tiene datos)
    if (reportData.filtros.length > 0) {
      seccionesCompletadas++;
    }

    // Sección 4: Visualizaciones (opcional, se cuenta si tiene datos)
    if (reportData.visualizaciones.length > 0) {
      seccionesCompletadas++;
    }

    // Sección 5: Consultas Adicionales (opcional)
    if (reportData.consultasAdicionales.length > 0) {
      seccionesCompletadas++;
    }

    // Sección 6: Info Adicional (opcional)
    if (reportData.frecuenciaActualizacion || reportData.notasTecnicas || reportData.historialCambios) {
      seccionesCompletadas++;
    }

    return Math.round((seccionesCompletadas / totalSecciones) * 100);
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div className="App">
      
      {/* ========== HEADER ========== */}
      <header className="header">
        <h1>📄 Documentador de Reportes Power BI</h1>
        <p className="subtitle">
          Documenta tus reportes de forma rápida y estructurada
        </p>
        <div className="progress-badge">
          {calcularProgreso()}% completado
        </div>
      </header>

      {/* ========== BARRA DE PROGRESO CON NAVEGACIÓN ========== */}
      <div className="progress-bar">
        <div className="progress-steps">
          
          {/* PASO 1: Información Básica */}
          <div 
            className={`step ${seccionActual === 1 ? 'active' : ''} ${seccionActual > 1 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(1)}
            title="Información Básica del Reporte"
          >
            <span className="step-number">1</span>
            <span className="step-label">Info Básica</span>
          </div>
          
          {/* PASO 2: Consulta SQL */}
          <div 
            className={`step ${seccionActual === 2 ? 'active' : ''} ${seccionActual > 2 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(2)}
            title="Consulta SQL y Estructura de Datos"
          >
            <span className="step-number">2</span>
            <span className="step-label">Consulta SQL</span>
          </div>
          
          {/* PASO 3: Filtros */}
          <div 
            className={`step ${seccionActual === 3 ? 'active' : ''} ${seccionActual > 3 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(3)}
            title="Filtros y Parámetros (Opcional)"
          >
            <span className="step-number">3</span>
            <span className="step-label">Filtros</span>
          </div>
          
          {/* PASO 4: Visualizaciones */}
          <div 
            className={`step ${seccionActual === 4 ? 'active' : ''} ${seccionActual > 4 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(4)}
            title="Visualizaciones del Reporte (Opcional)"
          >
            <span className="step-number">4</span>
            <span className="step-label">Visualizaciones</span>
          </div>
          
          {/* PASO 5: Consultas Adicionales */}
          <div 
            className={`step ${seccionActual === 5 ? 'active' : ''} ${seccionActual > 5 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(5)}
            title="Consultas Adicionales (Opcional)"
          >
            <span className="step-number">5</span>
            <span className="step-label">Consultas</span>
          </div>
          
          {/* PASO 6: Información Adicional */}
          <div 
            className={`step ${seccionActual === 6 ? 'active' : ''}`}
            onClick={() => handleCambiarSeccion(6)}
            title="Información Adicional (Opcional)"
          >
            <span className="step-number">6</span>
            <span className="step-label">Info Adicional</span>
          </div>
          
        </div>
      </div>

      {/* ========== CONTENEDOR PRINCIPAL ========== */}
      <main className="main-content">
        {renderSeccion()}
      </main>

      {/* ========== BOTONES DE NAVEGACIÓN AUXILIARES ========== */}
      <div className="navigation-buttons">
        {seccionActual > 1 && (
          <button 
            className="btn-nav btn-prev"
            onClick={() => handleCambiarSeccion(seccionActual - 1)}
          >
            ← Anterior
          </button>
        )}
        
        {seccionActual < 6 && (
          <button 
            className="btn-nav btn-next"
            onClick={() => handleCambiarSeccion(seccionActual + 1)}
          >
            Siguiente →
          </button>
        )}
      </div>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <p>
          Desarrollado por <strong>Ricardo Aral</strong> | {new Date().getFullYear()}
        </p>
        <p className="footer-links">
          <a href="mailto:jho.araque84@gmail.com">📧 Contacto</a>
          <span className="separator">•</span>
          <span>🗂️ Versión 1.1</span>
        </p>
      </footer>

    </div>
  );
}

export default App;