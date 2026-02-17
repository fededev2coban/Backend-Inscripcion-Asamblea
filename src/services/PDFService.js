const PDFDocument = require('pdfkit');
const path = require('path');

class PDFService {
  static async generarReporteAsistencia(res, evento, participantes) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER', 
          margins: { top: 50, bottom: 50, left: 50, right: 50 }, 
          bufferPages: true 
        });

        doc.on('error', reject);
        res.on('finish', resolve);

        // --- SOLUCIÓN AL ERROR DE REPLACE ---
        // Usamos un nombre por defecto si nombre_evento no existe por alguna razón
        const nombreEventoRaw = evento.nombre_evento || 'Reporte';
        const nombreLimpio = nombreEventoRaw.toString().replace(/[^a-z0-9]/gi, '_');
        const fileName = `Asistencia_${nombreLimpio}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        doc.pipe(res);

        // --- Construcción ---
        this._insertarLogo(doc);
        this._escribirEncabezado(doc, evento, participantes.length);
        this._escribirTabla(doc, participantes);
        this._escribirPieDePagina(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static _insertarLogo(doc) {
    try {
      // Ajusta esta ruta según la ubicación real de tu archivo
      const logoPath = path.join(__dirname, '..', 'assets', 'img', 'logo', 'logotipo.png');
      doc.image(logoPath, 50, 40, { width: 50 });
    } catch (err) {
      console.warn("Imagen no encontrada, continuando sin logo...");
    }
  }

  static _escribirEncabezado(doc, evento, total) {
    // Título principal centrado
    doc.fillColor('#003B7A')
       .font('Helvetica-Bold')
       .fontSize(20)
       .text('FEDECOVERA', { align: 'center' });

    doc.fillColor('#333333')
       .fontSize(14)
       .text('LISTA DE ASISTENCIA', { align: 'center' });

    doc.moveDown(1.5); // Espacio después del título

    // Cuadro de información del evento
    const infoY = doc.y;
    doc.fontSize(10).fillColor('#000000');
    
    doc.font('Helvetica-Bold').text(`Evento: `, 50, infoY, { continued: true })
       .font('Helvetica').text(evento.nombre_evento);
    
    doc.font('Helvetica-Bold').text(`Fecha: `, { continued: true })
       .font('Helvetica').text(new Date(evento.fecha_evento).toLocaleDateString('es-GT', { dateStyle: 'long' }));
    
    doc.font('Helvetica-Bold').text(`Lugar: `, { continued: true })
       .font('Helvetica').text(evento.lugar_evento);

    doc.font('Helvetica-Bold').text(`Total Asistentes: `, { continued: true })
       .font('Helvetica').text(total);

    doc.moveDown(1);
  }

static _escribirTabla(doc, participantes) {
    const colPositions = [50, 80, 190, 290, 410, 510];
    const colWidths = [30, 110, 100, 120, 100, 70];
    let y = doc.y;

    const drawHeader = (posY) => {
      doc.rect(50, posY, 530, 22).fill('#003B7A');
      doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
      const headers = ['No.', 'Nombre Completo', 'DPI', 'Institución', 'Cargo', 'Firma'];
      headers.forEach((h, i) => doc.text(h, colPositions[i], posY + 7, { width: colWidths[i], align: i === 0 ? 'center' : 'left' }));
      return posY + 22;
    };

    y = drawHeader(y);

    participantes.forEach((p, i) => {
      const rowHeight = 25;

      if (y > 680) { // Bajamos un poco el límite para que no choque con el pie
        doc.addPage();
        y = drawHeader(50); 
      }

      if (i % 2 === 0) doc.rect(50, y, 530, rowHeight).fill('#F2F5F8');

      doc.fillColor('#000000').fontSize(8).font('Helvetica');
      
      const institucion = p.tipo_participante === 'interno' ? p.cooperativa : p.institucion;
      const cargo = p.tipo_participante === 'interno' ? p.puesto_interno : p.puesto_externo;

      // --- CAMBIO AQUÍ: Quitamos el .toUpperCase() ---
      doc.text(i + 1, colPositions[0], y + 8, { width: colWidths[0], align: 'center' });
      doc.text(`${p.nombres} ${p.apellidos}`, colPositions[1], y + 8, { width: colWidths[1] });
      doc.text(p.dpi || 'N/A', colPositions[2], y + 8, { width: colWidths[2] });
      doc.text(institucion || '-', colPositions[3], y + 8, { width: colWidths[3] });
      doc.text(cargo || '-', colPositions[4], y + 8, { width: colWidths[4] });

      doc.moveTo(colPositions[5], y + 20).lineTo(colPositions[5] + 65, y + 20).strokeColor('#BBBBBB').lineWidth(0.5).stroke();
      
      y += rowHeight;
    });
  }

static _escribirPieDePagina(doc) {
    const range = doc.bufferedPageRange(); // Obtiene el total de páginas generadas
    
    for (let i = range.start; i < (range.start + range.count); i++) {
      // 1. Saltamos a la página 'i'
      doc.switchToPage(i);
      
      // 2. Definimos la posición vertical (Y) fija al fondo
      // LETTER height es 792. Al restarle 50, escribirá en el punto 742.
      const posicionFijaFondo = doc.page.height - 60; 

      // 3. Dibujamos una línea divisoria tenue (Opcional, se ve muy bien)
      doc.moveTo(50, posicionFijaFondo - 10)
         .lineTo(562, posicionFijaFondo - 10)
         .strokeColor('#EEEEEE')
         .lineWidth(0.5)
         .stroke();

      // 4. Escribimos el texto
      doc.fontSize(7)
         .fillColor('#777777')
         .text(
           `FEDECOVERA - Reporte de Asistencia | Página ${i + 1} de ${range.count} | Generado: ${new Date().toLocaleString('es-GT')}`,
           50,              // X
           posicionFijaFondo, // Y (Posición forzada)
           { 
             align: 'center', 
             width: 512 
           }
         );
    }
  }
}

module.exports = PDFService;