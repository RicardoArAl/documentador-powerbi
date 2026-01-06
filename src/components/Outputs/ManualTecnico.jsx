import React, { useState } from 'react';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun, BorderStyle, ImageRun, AlignmentType, ShadingType, VerticalAlign } from 'docx';
import { saveAs } from 'file-saver';
import styles from './ManualTecnico.module.css';

const ManualTecnico = ({ reportData }) => {
  const [generandoWord, setGenerandoWord] = useState(false);
  const [progreso, setProgreso] = useState(0);

  // === PALETA DE COLORES INSTITUCIONAL AREANDINA ===
  const COLORS = {
    primaryHex: "8CC63F",         // Verde Areandina
    secondaryHex: "F0F0F0",       // Gris claro
    textHex: "3C3C3C",            // Gris oscuro
    borderHex: "B4B4B4",          // Borde
    whiteHex: "FFFFFF"
  };

  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return String(texto).replace(/(\r\n|\n|\r)/gm, " ").trim();
  };

  /** =================================================================================
   * FUNCIÓN MEJORADA: Calcular dimensiones óptimas de imagen
   * ================================================================================= */
  const calcularDimensionesOptimas = async (base64String, tipoImagen = 'visual') => {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        const aspectRatio = originalWidth / originalHeight;
        
        // Definir anchos máximos según tipo de imagen
        let maxWidth, maxHeight;
        
        if (tipoImagen === 'filtro') {
          // Filtros: Más pequeños (típicamente son slicers horizontales)
          maxWidth = 450;  // ~11.5 cm
          maxHeight = 200; // ~5 cm
        } else {
          // Visuales: Más grandes
          maxWidth = 600;  // ~15 cm (casi todo el ancho de página)
          maxHeight = 400; // ~10 cm
        }
        
        let finalWidth = originalWidth;
        let finalHeight = originalHeight;
        
        // Escalar proporcionalmente
        if (originalWidth > maxWidth) {
          finalWidth = maxWidth;
          finalHeight = maxWidth / aspectRatio;
        }
        
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = maxHeight * aspectRatio;
        }
        
        // Asegurar mínimos razonables
        const minWidth = tipoImagen === 'filtro' ? 200 : 300;
        const minHeight = tipoImagen === 'filtro' ? 80 : 150;
        
        if (finalWidth < minWidth) {
          finalWidth = minWidth;
          finalHeight = minWidth / aspectRatio;
        }
        
        if (finalHeight < minHeight) {
          finalHeight = minHeight;
          finalWidth = minHeight * aspectRatio;
        }
        
        resolve({
          width: Math.round(finalWidth),
          height: Math.round(finalHeight),
          originalWidth,
          originalHeight,
          aspectRatio: aspectRatio.toFixed(2)
        });
      };
      
      img.onerror = () => {
        // En caso de error, retornar dimensiones por defecto
        resolve({
          width: tipoImagen === 'filtro' ? 350 : 500,
          height: tipoImagen === 'filtro' ? 150 : 300,
          originalWidth: 0,
          originalHeight: 0,
          aspectRatio: 1.67
        });
      };
      
      img.src = base64String;
    });
  };

  /** =================================================================================
   * FUNCIÓN MEJORADA: Crear imagen Word con dimensiones adaptativas
   * ================================================================================= */
  const crearImagenWord = async (base64String, tipoImagen = 'visual') => {
    if (!base64String || base64String.length < 100) {
      return new Paragraph({ 
        text: "[Imagen no disponible]", 
        italics: true, 
        color: "999999",
        alignment: AlignmentType.CENTER 
      });
    }
    
    try {
      // Calcular dimensiones óptimas
      const dimensiones = await calcularDimensionesOptimas(base64String, tipoImagen);
      
      console.log(`📐 Dimensiones calculadas para ${tipoImagen}:`, dimensiones);
      
      const raw = base64String.includes(',') ? base64String.split(',')[1] : base64String;
      const buffer = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      
      return new Paragraph({
        children: [new ImageRun({ 
          data: buffer, 
          transformation: { 
            width: dimensiones.width, 
            height: dimensiones.height 
          } 
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, before: 100 }
      });
    } catch (error) {
      console.error("Error creando imagen Word:", error);
      return new Paragraph({ 
        text: "[Error al cargar imagen]", 
        italics: true, 
        color: "FF0000",
        alignment: AlignmentType.CENTER 
      });
    }
  };

  /** =================================================================================
   * FUNCIONES AUXILIARES PARA TABLAS
   * ================================================================================= */
  const celdaHeader = (texto, widthPercent) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: COLORS.primaryHex, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
      },
      children: [new Paragraph({
        children: [new TextRun({ text: limpiarTexto(texto), bold: true, color: "FFFFFF", size: 18 })],
        alignment: AlignmentType.CENTER
      })],
      verticalAlign: VerticalAlign.CENTER
    });
  };

  const celdaDato = (texto, widthPercent, align = AlignmentType.LEFT, bg = "FFFFFF", bold = false) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: { fill: bg, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
        right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
      },
      children: [new Paragraph({
        children: [new TextRun({ text: limpiarTexto(texto), size: 18, color: COLORS.textHex, bold })],
        alignment: align
      })],
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
  };

  const tituloSeccionWord = (texto) => {
    return new Paragraph({
      children: [new TextRun({ text: texto.toUpperCase(), bold: true, size: 28, color: COLORS.primaryHex })],
      border: {
        top: { color: COLORS.primaryHex, space: 1, value: BorderStyle.SINGLE, size: 12 },
        bottom: { color: COLORS.primaryHex, space: 1, value: BorderStyle.SINGLE, size: 6 }
      },
      spacing: { before: 400, after: 200 }
    });
  };

  /** =================================================================================
   * GENERADOR WORD PRINCIPAL
   * ================================================================================= */
  const handleGenerarWord = async () => {
    setGenerandoWord(true);
    setProgreso(0);

    try {
      const children = [];

      // ========== 1. PORTADA (TABLAS) ==========
      setProgreso(10);

      // Tabla 1: Nombre, Tipo, Objetivo
      const tabla1 = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              celdaHeader("NOMBRE SOLUCIÓN", 35),
              celdaHeader("TIPO DOCUMENTO", 25),
              celdaHeader("OBJETIVO", 40)
            ]
          }),
          new TableRow({
            children: [
              celdaDato(reportData.nombreReporte || "N/A", 35, AlignmentType.LEFT, "FFFFFF", true),
              celdaDato("MANUAL TÉCNICO", 25, AlignmentType.CENTER, "FFFFFF", true),
              celdaDato(reportData.objetivo || "N/A", 40)
            ]
          })
        ]
      });
      children.push(tabla1);
      children.push(new Paragraph({ text: "" }));

      // Tabla 2: Metadatos
      const tabla2 = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: ["FECHA", "VERSIÓN", "CÓDIGO", "AUTOR", "APROBADO POR"].map(h => celdaHeader(h, 20))
          }),
          new TableRow({
            children: [
              reportData.fechaDocumentacion || new Date().toLocaleDateString('es-CO'),
              "1.0",
              reportData.codigoReporte || "N/A",
              reportData.documentadoPor || "Usuario",
              ""
            ].map(d => celdaDato(d, 20, AlignmentType.CENTER))
          })
        ]
      });
      children.push(tabla2);
      children.push(new Paragraph({ text: "" }));

      // ========== 2. INFORMACIÓN GENERAL ==========
      setProgreso(20);
      children.push(tituloSeccionWord("INFORMACIÓN GENERAL"));
      
      children.push(new Paragraph({
        children: [
          new TextRun({ text: "Categoría: ", bold: true, size: 20 }),
          new TextRun({ text: reportData.categoria || "N/A", size: 20 })
        ],
        spacing: { after: 150 }
      }));

      if (reportData.usuarios) {
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "Usuarios: ", bold: true, size: 20 }),
            new TextRun({ text: reportData.usuarios, size: 20 })
          ],
          spacing: { after: 150 }
        }));
      }

      // ========== 3. ESTRUCTURA DE DATOS (TABLA) ==========
      setProgreso(30);
      if (reportData.camposDetectados?.length > 0) {
        children.push(tituloSeccionWord("ESTRUCTURA DE DATOS"));

        if (reportData.tablaOrigen) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Tabla Origen: ", bold: true, size: 20 }),
              new TextRun({ text: reportData.tablaOrigen, size: 20 })
            ],
            spacing: { after: 200 }
          }));
        }

        // Tabla de campos con filas alternas
        const headerRow = new TableRow({
          children: [
            celdaHeader("NOMBRE", 40),
            celdaHeader("TIPO", 18),
            celdaHeader("DESCRIPCIÓN", 42)
          ]
        });

        const dataRows = reportData.camposDetectados.map((campo, index) => {
          const bgColor = index % 2 === 0 ? "FFFFFF" : COLORS.secondaryHex;
          const pk = campo.esLlave ? " (PK)" : "";
          
          return new TableRow({
            children: [
              celdaDato(campo.nombre + pk, 40, AlignmentType.LEFT, bgColor, campo.esLlave),
              celdaDato(campo.tipo, 18, AlignmentType.LEFT, bgColor),
              celdaDato(campo.descripcion || "-", 42, AlignmentType.LEFT, bgColor)
            ]
          });
        });

        children.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [headerRow, ...dataRows]
        }));
        children.push(new Paragraph({ text: "" }));
      }

      // ========== 4. FILTROS Y PARÁMETROS ==========
      setProgreso(50);
      if (reportData.filtros?.length > 0) {
        children.push(tituloSeccionWord("FILTROS Y PARÁMETROS"));

        for (const filtro of reportData.filtros) {
          // Nombre del filtro
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${filtro.nombre}`, bold: true, size: 22, color: COLORS.primaryHex })],
            spacing: { after: 100 }
          }));

          // Bloque de detalles (tabla con fondo gris)
          const detallesRows = [];
          
          detallesRows.push(new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Campo SQL: ", bold: true, size: 18 }),
                    new TextRun({ text: filtro.campoSQL || "N/A", size: 18 })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 100, bottom: 50, left: 100, right: 100 }
            })]
          }));

          detallesRows.push(new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tipo de Control: ", bold: true, size: 18 }),
                    new TextRun({ text: filtro.tipoControl || "N/A", size: 18 })
                  ]
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 50, bottom: 50, left: 100, right: 100 }
            })]
          }));

          if (filtro.valores) {
            detallesRows.push(new TableRow({
              children: [new TableCell({
                shading: { fill: COLORS.secondaryHex },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Valores: ", bold: true, size: 18 }),
                      new TextRun({ text: filtro.valores, size: 18 })
                    ]
                  })
                ],
                borders: {
                  top: { style: BorderStyle.NONE },
                  bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                  left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                  right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
                },
                margins: { top: 50, bottom: 100, left: 100, right: 100 }
              })]
            }));
          }

          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: detallesRows
          }));

          // ⭐ Imagen con dimensiones adaptativas (tipo 'filtro')
          if (filtro.imagenPreview) {
            children.push(await crearImagenWord(filtro.imagenPreview, 'filtro'));
          }

          children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        }
      }

      // ========== 5. VISUALIZACIONES (FICHAS TÉCNICAS) ==========
      setProgreso(70);
      if (reportData.visualizaciones?.length > 0) {
        children.push(tituloSeccionWord("VISUALIZACIONES"));

        for (const visual of reportData.visualizaciones) {
          // ====== FICHA TÉCNICA (TABLA DE 3 FILAS) ======

          // Fila 1: Título (Barra Verde)
          const titleRow = new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.primaryHex },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: visual.titulo || "Visualización", bold: true, color: "FFFFFF", size: 22 })],
                  alignment: AlignmentType.CENTER
                })
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primaryHex },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex }
              },
              margins: { top: 150, bottom: 150 }
            })]
          });

          // Fila 2: Imagen (Centrada con fondo blanco) - ⭐ CON DIMENSIONES ADAPTATIVAS
          const imgParagraph = visual.imagen 
            ? await crearImagenWord(visual.imagen, 'visual')
            : new Paragraph({ text: "[Sin imagen]", italics: true, alignment: AlignmentType.CENTER, color: "999999" });

          const imgRow = new TableRow({
            children: [new TableCell({
              shading: { fill: "FFFFFF" },
              children: [imgParagraph],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 200, bottom: 200 }
            })]
          });

          // Fila 3: Detalles (Bloque Gris)
          const camposStr = visual.camposUtilizados 
            ? (Array.isArray(visual.camposUtilizados) ? visual.camposUtilizados.join(", ") : visual.camposUtilizados)
            : "N/A";

          const detailsRow = new TableRow({
            children: [new TableCell({
              shading: { fill: COLORS.secondaryHex },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Tipo: ", bold: true, size: 18 }),
                    new TextRun({ text: visual.tipo || "N/A", size: 18 }),
                    new TextRun({ text: " | ", size: 18 }),
                    new TextRun({ text: "Métricas: ", bold: true, size: 18 }),
                    new TextRun({ text: visual.metricasCalculadas || "N/A", size: 18 })
                  ]
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: "Campos: ", bold: true, size: 18 }),
                    new TextRun({ text: camposStr, size: 18 })
                  ],
                  spacing: { before: 100 }
                }),
                new Paragraph({
                  children: [new TextRun({ text: visual.descripcion || "", italics: true, size: 16, color: "505050" })],
                  spacing: { before: 150 }
                })
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderHex },
                left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
              },
              margins: { top: 150, bottom: 150, left: 150, right: 150 }
            })]
          });

          // Agregar tabla completa de visualización
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [titleRow, imgRow, detailsRow]
          }));
          children.push(new Paragraph({ text: "", spacing: { after: 300 } }));
        }
      }

      // ========== 6. CONSULTAS SQL ADICIONALES ==========
      setProgreso(85);
      if (reportData.consultasAdicionales?.length > 0) {
        children.push(tituloSeccionWord("CONSULTAS SQL ADICIONALES"));

        for (const consulta of reportData.consultasAdicionales) {
          // Nombre
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${consulta.nombre}`, bold: true, size: 20, color: COLORS.primaryHex })],
            spacing: { after: 100 }
          }));

          // Tipo
          if (consulta.tipo) {
            children.push(new Paragraph({
              children: [
                new TextRun({ text: "Tipo: ", bold: true, size: 18 }),
                new TextRun({ text: consulta.tipo, size: 18 })
              ],
              spacing: { after: 100 }
            }));
          }

          // Código SQL (bloque gris)
          if (consulta.codigoSQL) {
            children.push(new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [new TableCell({
                    shading: { fill: "F5F5F5" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: consulta.codigoSQL, font: "Courier New", size: 16, color: "282828" })]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      bottom: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      left: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex },
                      right: { style: BorderStyle.SINGLE, size: 3, color: COLORS.borderHex }
                    },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 }
                  })]
                })
              ]
            }));
          }

          children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        }
      }

      // ========== 7. INFORMACIÓN ADICIONAL ==========
      setProgreso(95);
      if (reportData.frecuenciaActualizacion || reportData.volumetriaEstimada || reportData.notasTecnicas) {
        children.push(tituloSeccionWord("INFORMACIÓN ADICIONAL"));

        if (reportData.frecuenciaActualizacion) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Frecuencia de Actualización: ", bold: true, size: 18 }),
              new TextRun({ text: reportData.frecuenciaActualizacion, size: 18 })
            ],
            spacing: { after: 150 }
          }));
        }

        if (reportData.volumetriaEstimada) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: "Volumetría Estimada: ", bold: true, size: 18 }),
              new TextRun({ text: reportData.volumetriaEstimada, size: 18 })
            ],
            spacing: { after: 150 }
          }));
        }

        if (reportData.notasTecnicas) {
          children.push(new Paragraph({
            children: [new TextRun({ text: "Notas Técnicas:", bold: true, size: 20 })],
            spacing: { after: 100 }
          }));
          children.push(new Paragraph({
            children: [new TextRun({ text: reportData.notasTecnicas, size: 18 })],
            spacing: { after: 200 }
          }));
        }
      }

      setProgreso(100);

      // Crear documento
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 pulgada
                bottom: 1440,
                left: 1440,
                right: 1440
              }
            }
          },
          children
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Manual_${limpiarTexto(reportData.codigoReporte)}_${Date.now()}.docx`);

    } catch (error) {
      console.error("Error generando Word:", error);
      alert("Error al generar el documento Word. Revise la consola para más detalles.");
    } finally {
      setGenerandoWord(false);
      setProgreso(0);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>📝</div>
        <h2 className={styles.title}>Manual Técnico</h2>
        <p className={styles.subtitle}>Documentación Oficial Areandina</p>
      </div>

      <div className={styles.infoCard}>
        <h3 className={styles.infoTitle}>📋 Contenido del Manual</h3>
        <div className={styles.contenidoList}>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>1</div>
            <div>
              <h4>Portada Institucional</h4>
              <p>Nombre del reporte, objetivo y metadatos</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>2</div>
            <div>
              <h4>Información General</h4>
              <p>Categoría y audiencia objetivo</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>3</div>
            <div>
              <h4>Estructura de Datos</h4>
              <p>Tabla origen y diccionario de campos completo</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>4</div>
            <div>
              <h4>Filtros y Parámetros</h4>
              <p>Controles interactivos con imágenes optimizadas</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>5</div>
            <div>
              <h4>Visualizaciones (Fichas Técnicas)</h4>
              <p>Cada visual con imagen adaptativa, tipo, métricas y descripción</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>6</div>
            <div>
              <h4>Consultas SQL Adicionales</h4>
              <p>Stored Procedures, Functions y código relacionado</p>
            </div>
          </div>
          <div className={styles.contenidoItem}>
            <div className={styles.numero}>7</div>
            <div>
              <h4>Información Adicional</h4>
              <p>Frecuencia, volumetría y notas técnicas</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.exportSection}>
        <button
          className={styles.btnExport}
          onClick={handleGenerarWord}
          disabled={generandoWord || !reportData.nombreReporte}
          style={{ background: 'linear-gradient(135deg, #2b579a 0%, #1a3d6b 100%)' }}
        >
          <span className={styles.btnIcon}>{generandoWord ? '⚙️' : '📝'}</span>
          <span className={styles.btnText}>
            {generandoWord ? `Generando Word... ${progreso}%` : 'Descargar Manual Word'}
          </span>
        </button>

        {generandoWord && (
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progreso}%` }}></div>
          </div>
        )}
      </div>

      <div className={styles.notes}>
        <h3 className={styles.notesTitle}>🎨 Mejoras en v2.0</h3>
        <ul className={styles.notesList}>
          <li><strong>✨ Imágenes Adaptativas:</strong> Las imágenes se redimensionan automáticamente según su aspect ratio original</li>
          <li><strong>📏 Tamaños Inteligentes:</strong> Filtros más pequeños (450x200 máx), Visuales más grandes (600x400 máx)</li>
          <li><strong>🖼️ Preserva Proporciones:</strong> Nunca se deforman las imágenes, siempre mantienen su relación de aspecto</li>
          <li><strong>📐 Mínimos Razonables:</strong> Garantiza que las imágenes no sean demasiado pequeñas (min 200x80 para filtros, 300x150 para visuales)</li>
          <li><strong>🎯 Centrado Perfecto:</strong> Todas las imágenes se centran automáticamente en su contenedor</li>
          <li><strong>🔍 Debugging:</strong> La consola muestra las dimensiones calculadas para cada imagen</li>
          <li><strong>📝 Solo Word:</strong> Simplificado para enfocarse en un solo formato de alta calidad</li>
        </ul>
      </div>

      <div className={styles.notes}>
        <h3 className={styles.notesTitle}>💡 Cómo Funciona el Redimensionamiento</h3>
        <ul className={styles.notesList}>
          <li><strong>Paso 1:</strong> Se carga la imagen y se obtienen sus dimensiones originales</li>
          <li><strong>Paso 2:</strong> Se calcula el aspect ratio (ancho / alto)</li>
          <li><strong>Paso 3:</strong> Se define el tamaño máximo según el tipo (filtro o visual)</li>
          <li><strong>Paso 4:</strong> Se escala proporcionalmente manteniendo el aspect ratio</li>
          <li><strong>Paso 5:</strong> Se aplican mínimos para evitar imágenes muy pequeñas</li>
          <li><strong>Resultado:</strong> Imagen perfectamente ajustada sin deformaciones</li>
        </ul>
      </div>
    </div>
  );
};

export default ManualTecnico;