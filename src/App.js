import React, { useState } from 'react';
import InfoBasica from './components/InfoBasica/InfoBasica';
import ConsultaSQL from './components/ConsultaSQL/ConsultaSQL';
import Filtros from './components/Filtros/Filtros';
import Visualizaciones from './components/Visualizaciones/Visualizaciones';
import './styles/global.css';

/**
 * DOCUMENTADOR DE REPORTES POWER BI
 * Aplicación para documentar reportes de Power BI de forma estructurada
 * Desarrollado por: Ricardo Aral
 * Versión: 1.0
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
    // ===== SECCIÓN 1: INFORMACIÓN BÁSICA =====
    nombreReporte: '',
    codigoReporte: '',
    categoria: '',
    subcategoria: '',
    objetivo: '',
    usuarios: '',
    
    // ===== SECCIÓN 2: CONSULTA SQL Y ESTRUCTURA =====
    consultaSQL: '',              // Query pegada por el usuario
    tablaOrigen: '',              // Nombre de la tabla/vista origen
    camposDetectados: [
      // Array de objetos con estructura:
      // {
      //   nombre: 'PERIODO_CODIGO',
      //   tipo: 'VARCHAR',
      //   esLlave: true,
      //   descripcion: 'Código del período académico',
      //   usadoEnVisuales: [],
      //   participaEnFiltros: false,
      //   esMetrica: false
      // }
    ],
    
    // ===== SECCIÓN 3: FILTROS Y PARÁMETROS =====
    imagenReferenciaFiltros: null,    // File object de screenshot
    imagenPreviewFiltros: null,       // Base64 para preview
    filtros: [
      // Array de objetos con estructura:
      // {
      //   id: 1234567890,
      //   nombre: 'Año',
      //   campoSQL: 'PERIODO_CODIGO',
      //   tipoControl: 'Multi-select buttons',
      //   valores: '2025, 2024, 2023',
      //   descripcion: 'Filtro para seleccionar año académico'
      // }
    ],
    
    // ===== SECCIÓN 4: VISUALIZACIONES =====
    visualizaciones: [
      // Array de objetos con estructura:
      // {
      //   id: 1234567891,
      //   titulo: 'Tabla de Materias',
      //   tipo: 'Tabla',
      //   imagen: null,              // File object
      //   camposUtilizados: ['PROGRAMA_NOMBRE', 'CREDITOS'],
      //   metricasCalculadas: 'Total = SUM(CREDITOS)',
      //   descripcion: 'Muestra todas las materias por programa'
      // }
    ],
    
    // ===== SECCIÓN 5: CONSULTAS ADICIONALES =====
    consultasAdicionales: [
      // Array de objetos con estructura:
      // {
      //   id: 1234567892,
      //   nombre: 'SP_ObtenerPensum',
      //   tipo: 'Stored Procedure',
      //   codigoSQL: 'CREATE PROCEDURE...',
      //   parametros: '@ProgramaID INT, @PeriodoID VARCHAR(10)',
      //   descripcion: 'Obtiene el pensum completo de un programa'
      // }
    ],
    
    // ===== SECCIÓN 6: INFORMACIÓN ADICIONAL =====
    reportesRelacionados: '',         // Nombres de reportes relacionados
    frecuenciaActualizacion: '',      // Diaria, Semanal, Mensual, etc.
    volumetria: '',                   // Estimación de registros
    notasTecnicas: '',                // Notas adicionales
    historialCambios: '',             // Log de cambios del reporte
    
    // ===== METADATOS =====
    documentadoPor: 'Ricardo Aral',
    fechaDocumentacion: new Date().toISOString().split('T')[0],
    versionReporte: 'v1.0',
    estadoReporte: 'Activo'           // Activo, En desarrollo, Deprecado
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
  // FUNCIÓN: Renderizar componente según sección
  // ============================================
  const renderSeccion = () => {
    switch(seccionActual) {
      case 1:
        return (
          <InfoBasica 
            reportData={reportData} 
            setReportData={setReportData} 
          />
        );
      
      case 2:
        return (
          <ConsultaSQL 
            reportData={reportData} 
            setReportData={setReportData} 
          />
        );
      
      case 3:
        return (
          <Filtros 
            reportData={reportData} 
            setReportData={setReportData} 
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
        // PENDIENTE: Componente ConsultasAdicionales
        return (
          <div style={{
            padding: '4rem 2rem', 
            textAlign: 'center',
            background: '#fafafa',
            borderRadius: '12px',
            margin: '2rem'
          }}>
            <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>
              🔄 Sección 5: Consultas Adicionales
            </h2>
            <p style={{color: '#666', fontSize: '1.1rem'}}>
              Esta sección está en desarrollo...
            </p>
            <p style={{color: '#999', fontSize: '0.95rem', marginTop: '0.5rem'}}>
              Aquí podrás documentar stored procedures, funciones y queries adicionales
            </p>
          </div>
        );
      
      case 6:
        // PENDIENTE: Componente InfoAdicional
        return (
          <div style={{
            padding: '4rem 2rem', 
            textAlign: 'center',
            background: '#fafafa',
            borderRadius: '12px',
            margin: '2rem'
          }}>
            <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>
              📝 Sección 6: Información Adicional
            </h2>
            <p style={{color: '#666', fontSize: '1.1rem'}}>
              Esta sección está en desarrollo...
            </p>
            <p style={{color: '#999', fontSize: '0.95rem', marginTop: '0.5rem'}}>
              Aquí podrás agregar reportes relacionados, frecuencia de actualización, etc.
            </p>
          </div>
        );
      
      default:
        return (
          <InfoBasica 
            reportData={reportData} 
            setReportData={setReportData} 
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
    if (reportData.frecuenciaActualizacion || reportData.notasTecnicas) {
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
          <span>🗂️ Versión 1.0</span>
        </p>
      </footer>

    </div>
  );
}

export default App;