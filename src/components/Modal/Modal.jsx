import React, { useEffect } from 'react';
import styles from './Modal.module.css';

/**
 * COMPONENTE: MODAL GENÉRICO
 * Modal reutilizable con overlay y animaciones
 */

const Modal = ({ isOpen, onClose, children, titulo, maxWidth = '900px' }) => {
  
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    
    // Prevenir scroll del body cuando el modal está abierto
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: maxWidth }}
      >
        {/* Header del modal */}
        <div className={styles.header}>
          <h2 className={styles.titulo}>{titulo}</h2>
          <button 
            className={styles.btnCerrar}
            onClick={onClose}
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Contenido del modal */}
        <div className={styles.contenido}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;