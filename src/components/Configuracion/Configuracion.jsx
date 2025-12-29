import React, { useState, useEffect } from 'react';
import styles from './Configuracion.module.css';
import {
  guardarApiKey,
  obtenerApiKey,
  eliminarApiKey,
  tieneApiKey,
  validarApiKey
} from '../../utils/ai/geminiClient';

/**
 * COMPONENTE: CONFIGURACIÓN DE IA
 * Gestiona la API key de Google Gemini
 */

const Configuracion = () => {
  // Estado local
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [validando, setValidando] = useState(false);
  const [estadoApiKey, setEstadoApiKey] = useState({
    configurada: false,
    validada: false
  });

  // Cargar estado inicial
  useEffect(() => {
    const keyExistente = obtenerApiKey();
    if (keyExistente) {
      setApiKey(keyExistente);
      setEstadoApiKey({
        configurada: true,
        validada: false
      });
    }
  }, []);

  /**
   * Guarda la API key
   */
  const handleGuardar = async () => {
    try {
      if (!apiKey || apiKey.trim() === '') {
        setMensaje({
          tipo: 'error',
          texto: 'Por favor ingresa una API key válida'
        });
        return;
      }

      // Guardar en localStorage
      const guardado = guardarApiKey(apiKey);

      if (guardado) {
        setMensaje({
          tipo: 'success',
          texto: '✅ API key guardada correctamente'
        });
        
        setEstadoApiKey({
          configurada: true,
          validada: false
        });

        // Auto-validar después de guardar
        setTimeout(() => {
          handleValidar();
        }, 500);
      } else {
        setMensaje({
          tipo: 'error',
          texto: '❌ Error al guardar la API key'
        });
      }
    } catch (error) {
      console.error('Error guardando API key:', error);
      setMensaje({
        tipo: 'error',
        texto: `❌ Error: ${error.message}`
      });
    }
  };

  /**
   * Valida que la API key funcione
   */
  const handleValidar = async () => {
    try {
      setValidando(true);
      setMensaje({
        tipo: 'info',
        texto: '🔄 Validando API key con Google Gemini...'
      });

      const resultado = await validarApiKey();

      if (resultado.valida) {
        setMensaje({
          tipo: 'success',
          texto: `✅ ${resultado.mensaje}. ¡Listo para usar IA!`
        });
        setEstadoApiKey({
          configurada: true,
          validada: true
        });
      } else {
        setMensaje({
          tipo: 'error',
          texto: `❌ ${resultado.mensaje}`
        });
        setEstadoApiKey({
          configurada: true,
          validada: false
        });
      }
    } catch (error) {
      console.error('Error validando API key:', error);
      setMensaje({
        tipo: 'error',
        texto: `❌ Error al validar: ${error.message}`
      });
    } finally {
      setValidando(false);
    }
  };

  /**
   * Elimina la API key
   */
  const handleEliminar = () => {
    if (window.confirm('¿Estás seguro de eliminar la API key? Perderás acceso a las funciones de IA.')) {
      const eliminado = eliminarApiKey();
      
      if (eliminado) {
        setApiKey('');
        setMensaje({
          tipo: 'info',
          texto: '🗑️ API key eliminada correctamente'
        });
        setEstadoApiKey({
          configurada: false,
          validada: false
        });
      }
    }
  };

  /**
   * Toggle visibilidad de API key
   */
  const toggleVisibilidad = () => {
    setApiKeyVisible(!apiKeyVisible);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>⚙️ Configuración de Inteligencia Artificial</h2>
        <p className={styles.descripcion}>
          Configura tu API key de Google Gemini para habilitar las funciones de autocompletado inteligente.
        </p>
      </div>

      {/* Estado de la API Key */}
      <div className={styles.estadoContainer}>
        <div className={styles.estadoItem}>
          <span className={styles.estadoLabel}>Estado de configuración:</span>
          <span className={`${styles.estadoBadge} ${estadoApiKey.configurada ? styles.activo : styles.inactivo}`}>
            {estadoApiKey.configurada ? '✅ Configurada' : '⚪ No configurada'}
          </span>
        </div>
        
        {estadoApiKey.configurada && (
          <div className={styles.estadoItem}>
            <span className={styles.estadoLabel}>Estado de validación:</span>
            <span className={`${styles.estadoBadge} ${estadoApiKey.validada ? styles.activo : styles.pendiente}`}>
              {estadoApiKey.validada ? '✅ Validada' : '⏳ Pendiente de validar'}
            </span>
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className={styles.formContainer}>
        
        {/* Campo de API Key */}
        <div className={styles.formGroup}>
          <label htmlFor="apiKey">
            🔑 API Key de Google Gemini <span className={styles.requerido}>*</span>
          </label>
          
          <div className={styles.inputWrapper}>
            <input
              type={apiKeyVisible ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSyAMEgAd7q9_v9AZts4o_VzpoHjNwmG5O2c"
              className={styles.input}
            />
            <button
              type="button"
              onClick={toggleVisibilidad}
              className={styles.btnToggle}
              title={apiKeyVisible ? 'Ocultar' : 'Mostrar'}
            >
              {apiKeyVisible ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <small className={styles.ayuda}>
            Tu API key se guarda solo en tu navegador (localStorage). No se envía a ningún servidor.
          </small>
        </div>

        {/* Mensaje de feedback */}
        {mensaje.texto && (
          <div className={`${styles.mensaje} ${styles[mensaje.tipo]}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Botones de acción */}
        <div className={styles.botonesAccion}>
          <button
            onClick={handleGuardar}
            disabled={!apiKey || apiKey.trim() === ''}
            className={styles.btnPrimario}
          >
            💾 Guardar API Key
          </button>

          {estadoApiKey.configurada && (
            <>
              <button
                onClick={handleValidar}
                disabled={validando}
                className={styles.btnSecundario}
              >
                {validando ? '🔄 Validando...' : '🔍 Validar API Key'}
              </button>

              <button
                onClick={handleEliminar}
                className={styles.btnPeligro}
              >
                🗑️ Eliminar API Key
              </button>
            </>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className={styles.instrucciones}>
        <h3>📖 ¿Cómo obtener tu API Key?</h3>
        <ol>
          <li>
            Ve a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
          </li>
          <li>Inicia sesión con tu cuenta de Google</li>
          <li>Haz clic en <strong>"Create API Key"</strong></li>
          <li>Selecciona un proyecto o crea uno nuevo</li>
          <li>Copia la API key generada</li>
          <li>Pégala en el campo de arriba y haz clic en "Guardar"</li>
        </ol>

        <div className={styles.nota}>
          <strong>💡 Nota:</strong> La API de Google Gemini tiene un nivel gratuito generoso. 
          Para uso personal y pruebas es suficiente. Revisa los límites en la 
          <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer"> documentación oficial</a>.
        </div>
      </div>

      {/* Características habilitadas */}
      <div className={styles.funcionalidades}>
        <h3>✨ Funcionalidades habilitadas con IA:</h3>
        <ul>
          <li>🔍 <strong>Análisis de imágenes:</strong> Extrae información de capturas de filtros y visualizaciones</li>
          <li>📝 <strong>Generación de descripciones:</strong> Crea descripciones automáticas de campos y visuales</li>
          <li>🎯 <strong>Detección inteligente:</strong> Identifica tipos de controles, métricas y relaciones</li>
          <li>🔗 <strong>Matching con SQL:</strong> Relaciona automáticamente elementos visuales con campos de base de datos</li>
          <li>💡 <strong>Sugerencias contextuales:</strong> Recomienda filtros, métricas y documentación</li>
          <li>🤖 <strong>Análisis de código SQL:</strong> Documenta automáticamente queries, SPs y funciones</li>
        </ul>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>🔒 <strong>Seguridad:</strong> Tu API key se almacena localmente en tu navegador y nunca se envía a servidores externos (excepto a la API oficial de Google Gemini para las consultas de IA).</p>
      </div>
    </div>
  );
};

export default Configuracion;