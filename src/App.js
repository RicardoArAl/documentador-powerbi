import React, { useState } from 'react';
import InfoBasica from './components/InfoBasica/InfoBasica';
import ConsultaSQL from './components/ConsultaSQL/ConsultaSQL';
import Filtros from './components/Filtros/Filtros';
import Visualizaciones from './components/Visualizaciones/Visualizaciones';
import ConsultasAdicionales from './components/ConsultasAdicionales/ConsultasAdicionales';
import InfoAdicional from './components/InfoAdicional/InfoAdicional';
// ===== IMPORTS: OUTPUTS ===== ✅
import VistaResumen from './components/Outputs/VistaResumen';
import DiccionarioDatos from './components/Outputs/DiccionarioDatos';
import ManualTecnico from './components/Outputs/ManualTecnico';
// ===== IMPORTS: IA ===== ✅ NUEVO
import Modal from './components/Modal/Modal';
import Configuracion from './components/Configuracion/Configuracion';
import { tieneApiKey } from './utils/ai/geminiClient';
import './styles/global.css';

/**
 * DOCUMENTADOR DE REPORTES POWER BI
 * Aplicación para documentar reportes de Power BI de forma estructurada
 * 
 * Desarrollado por: Ricardo Aral
 * Email: jho.araque84@gmail.com
 * Versión: 3.0 (CON IA INTEGRADA) ✅
 * Fecha: 2025-01-09
 * 
 * NOVEDADES v3.0:
 * - Integración completa con Google Gemini API
 * - Modal de configuración de IA accesible desde header
 * - Indicador de estado de IA en el header
 */

function App() {
  // ============================================
  // ESTADO: Sección actual (navegación)
  // ============================================
  const [seccionActual, setSeccionActual] = useState(1);

  // ============================================
  // ESTADO: Sub-sección de Outputs
  // ============================================
  const [outputActivo, setOutputActivo] = useState('resumen');

  // ============================================
  // ESTADO: Modal de Configuración IA ✅ NUEVO
  // ============================================
  const [modalConfiguracionAbierto, setModalConfiguracionAbierto] = useState(false);

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
    consultaSQL: '',
    estructuraColumnas: '',
    tablaOrigen: '',
    camposDetectados: [],
    
    // ===== SECCIÓN 3: FILTROS Y PARÁMETROS ===== ✅
    filtros: [],
    
    // ===== SECCIÓN 4: VISUALIZACIONES ===== ✅
    visualizaciones: [],
    
    // ===== SECCIÓN 5: CONSULTAS ADICIONALES ===== ✅
    consultasAdicionales: [],
    
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
    if (numeroSeccion === 7) {
      setOutputActivo('resumen');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // FUNCIONES DE GUARDADO
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
      estructuraColumnas: datosActualizados.estructuraColumnas || prev.estructuraColumnas,
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
  // FUNCIONES DE EXPORTACIÓN PARA OUTPUTS
  // ============================================

  const handleExportarDiccionario = () => {
    setOutputActivo('diccionario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportarManual = () => {
    setOutputActivo('manual');
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
      
      case 7:
        return renderOutputs();
      
      default:
        return (
          <InfoBasica 
            datos={reportData}
            onGuardar={handleGuardarInfoBasica}
          />
        );
    }
  };

  /**
   * Renderiza la sección de Outputs con sus 3 sub-componentes
   */
  const renderOutputs = () => {
    return (
      <div>
        {/* Selector de output */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setOutputActivo('resumen')}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '700',
              border: outputActivo === 'resumen' ? '2px solid #667eea' : '2px solid #e5e7eb',
              background: outputActivo === 'resumen' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
              color: outputActivo === 'resumen' ? 'white' : '#4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: outputActivo === 'resumen' ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            📊 Vista Resumen
          </button>

          <button
            onClick={() => setOutputActivo('diccionario')}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '700',
              border: outputActivo === 'diccionario' ? '2px solid #43a047' : '2px solid #e5e7eb',
              background: outputActivo === 'diccionario' ? 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)' : 'white',
              color: outputActivo === 'diccionario' ? 'white' : '#4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: outputActivo === 'diccionario' ? '0 4px 15px rgba(67, 160, 71, 0.3)' : 'none'
            }}
          >
            📋 Diccionario Excel
          </button>

          <button
            onClick={() => setOutputActivo('manual')}
            style={{
              padding: '0.8rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '700',
              border: outputActivo === 'manual' ? '2px solid #3f51b5' : '2px solid #e5e7eb',
              background: outputActivo === 'manual' ? 'linear-gradient(135deg, #3f51b5 0%, #1a237e 100%)' : 'white',
              color: outputActivo === 'manual' ? 'white' : '#4b5563',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: outputActivo === 'manual' ? '0 4px 15px rgba(63, 81, 181, 0.3)' : 'none'
            }}
          >
            📄 Manual PDF
          </button>
        </div>

        {/* Renderizar componente según selección */}
        {outputActivo === 'resumen' && (
          <VistaResumen 
            reportData={reportData}
            onExportarDiccionario={handleExportarDiccionario}
            onExportarManual={handleExportarManual}
          />
        )}

        {outputActivo === 'diccionario' && (
          <DiccionarioDatos reportData={reportData} />
        )}

        {outputActivo === 'manual' && (
          <ManualTecnico reportData={reportData} />
        )}
      </div>
    );
  };

  // ============================================
  // FUNCIÓN: Calcular progreso de completitud
  // ============================================
  const calcularProgreso = () => {
    let seccionesCompletadas = 0;
    const totalSecciones = 6;

    if (reportData.nombreReporte && reportData.codigoReporte && reportData.objetivo) {
      seccionesCompletadas++;
    }

    if (reportData.consultaSQL && reportData.camposDetectados.length > 0) {
      seccionesCompletadas++;
    }

    if (reportData.filtros.length > 0) {
      seccionesCompletadas++;
    }

    if (reportData.visualizaciones.length > 0) {
      seccionesCompletadas++;
    }

    if (reportData.consultasAdicionales.length > 0) {
      seccionesCompletadas++;
    }

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
      
      {/* ========== HEADER CON BOTÓN DE IA ========== */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📄 Documentador de Reportes Power BI</h1>
            <p className="subtitle">
              Documenta tus reportes de forma rápida y estructurada
            </p>
          </div>
          
          <div className="header-right">
            <div className="progress-badge">
              {calcularProgreso()}% completado
            </div>
            
            {/* ✅ NUEVO: Botón de Configuración IA */}
            <button 
              className="btn-config-ia"
              onClick={() => setModalConfiguracionAbierto(true)}
              title="Configurar Inteligencia Artificial"
            >
              <span className="icon">🤖</span>
              <span className="text">Configurar IA</span>
              {tieneApiKey() && <span className="badge-activo">✓</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ========== BARRA DE PROGRESO CON NAVEGACIÓN ========== */}
      <div className="progress-bar">
        <div className="progress-steps">
          
          <div 
            className={`step ${seccionActual === 1 ? 'active' : ''} ${seccionActual > 1 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(1)}
            title="Información Básica del Reporte"
          >
            <span className="step-number">1</span>
            <span className="step-label">Info Básica</span>
          </div>
          
          <div 
            className={`step ${seccionActual === 2 ? 'active' : ''} ${seccionActual > 2 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(2)}
            title="Consulta SQL y Estructura de Datos"
          >
            <span className="step-number">2</span>
            <span className="step-label">Consulta SQL</span>
          </div>
          
          <div 
            className={`step ${seccionActual === 3 ? 'active' : ''} ${seccionActual > 3 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(3)}
            title="Filtros y Parámetros (Opcional)"
          >
            <span className="step-number">3</span>
            <span className="step-label">Filtros</span>
          </div>
          
          <div 
            className={`step ${seccionActual === 4 ? 'active' : ''} ${seccionActual > 4 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(4)}
            title="Visualizaciones del Reporte (Opcional)"
          >
            <span className="step-number">4</span>
            <span className="step-label">Visualizaciones</span>
          </div>
          
          <div 
            className={`step ${seccionActual === 5 ? 'active' : ''} ${seccionActual > 5 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(5)}
            title="Consultas Adicionales (Opcional)"
          >
            <span className="step-number">5</span>
            <span className="step-label">Consultas</span>
          </div>
          
          <div 
            className={`step ${seccionActual === 6 ? 'active' : ''} ${seccionActual > 6 ? 'completed' : ''}`}
            onClick={() => handleCambiarSeccion(6)}
            title="Información Adicional (Opcional)"
          >
            <span className="step-number">6</span>
            <span className="step-label">Info Adicional</span>
          </div>

          <div 
            className={`step ${seccionActual === 7 ? 'active' : ''}`}
            onClick={() => handleCambiarSeccion(7)}
            title="Exportaciones y Resumen Final"
          >
            <span className="step-number">7</span>
            <span className="step-label">Outputs</span>
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
        
        {seccionActual < 7 && (
          <button 
            className="btn-nav btn-next"
            onClick={() => handleCambiarSeccion(seccionActual + 1)}
          >
            Siguiente →
          </button>
        )}
      </div>

      {/* ========== MODAL DE CONFIGURACIÓN IA ========== ✅ NUEVO */}
      <Modal
        isOpen={modalConfiguracionAbierto}
        onClose={() => setModalConfiguracionAbierto(false)}
        titulo="⚙️ Configuración de Inteligencia Artificial"
        maxWidth="900px"
      >
        <Configuracion />
      </Modal>

      {/* ========== FOOTER ========== */}
      <footer className="footer">
        <p>
          Desarrollado por <strong>Ricardo Aral</strong> | {new Date().getFullYear()}
        </p>
        <p className="footer-links">
          <a href="mailto:jho.araque84@gmail.com">📧 Contacto</a>
          <span className="separator">•</span>
          <span>🗂️ Versión 3.0 (CON IA INTEGRADA)</span>
        </p>
      </footer>

    </div>
  );
}

export default App;