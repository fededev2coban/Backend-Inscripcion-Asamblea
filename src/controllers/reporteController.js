const { getConnection, sql } = require('../config/database');
const ExcelJS = require('exceljs');
const PDFService = require('../services/PDFService');

class ReporteController {
  // Generar reporte Excel de asistencia
  async generarExcel(req, res, next) {
    try {
      const { id_evento } = req.params;
      const pool = await getConnection();

      // Obtener datos del evento
      const eventoResult = await pool.request()
        .input('id', sql.Int, id_evento)
        .query('SELECT * FROM evento WHERE id_evento = @id');

      if (eventoResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const evento = eventoResult.recordset[0];

      // Obtener participantes que asistieron
      const participantesResult = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query(`
          SELECT * FROM vw_reporte_asistencia
          WHERE id_evento = @id_evento AND estado_asistencia = 'asistio'
          ORDER BY apellidos, nombres
        `);

      const participantes = participantesResult.recordset;

      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lista de Asistencia');

      // Configurar columnas
      worksheet.columns = [
        { header: 'No.', key: 'numero', width: 8 },
        { header: 'Nombres y Apellidos', key: 'nombre_completo', width: 35 },
        { header: 'DPI', key: 'dpi', width: 18 },
        { header: 'Cooperativa/Institución', key: 'entidad', width: 30 },
        { header: 'Cargo/Puesto', key: 'puesto', width: 25 },
        { header: 'Firma', key: 'firma', width: 30 }
      ];

      // Encabezado del reporte
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'FEDECOVERA';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF003B7A' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F4FF' }
      };

      worksheet.mergeCells('A2:F2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'LISTA DE ASISTENCIA';
      subtitleCell.font = { size: 14, bold: true };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Información del evento
      worksheet.mergeCells('A3:F3');
      const eventoCell = worksheet.getCell('A3');
      eventoCell.value = `Evento: ${evento.nombre_evento}`;
      eventoCell.font = { size: 12, bold: true };

      worksheet.mergeCells('A4:C4');
      worksheet.getCell('A4').value = `Fecha: ${new Date(evento.fecha_evento).toLocaleDateString('es-GT', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })}`;
      worksheet.getCell('A4').font = { size: 11 };

      worksheet.mergeCells('D4:F4');
      worksheet.getCell('D4').value = `Hora: ${evento.hora_evento}`;
      worksheet.getCell('D4').font = { size: 11 };

      worksheet.mergeCells('A5:F5');
      worksheet.getCell('A5').value = `Lugar: ${evento.lugar_evento}`;
      worksheet.getCell('A5').font = { size: 11 };

      worksheet.mergeCells('A6:F6');
      worksheet.getCell('A6').value = `Total de Asistentes: ${participantes.length}`;
      worksheet.getCell('A6').font = { size: 11, bold: true };

      // Espacio
      worksheet.addRow([]);

      // Headers de la tabla
      const headerRow = worksheet.addRow(['No.', 'Nombres y Apellidos', 'DPI', 'Cooperativa/Institución', 'Cargo/Puesto', 'Firma']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003B7A' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Datos de participantes
      participantes.forEach((p, index) => {
        const row = worksheet.addRow({
          numero: index + 1,
          nombre_completo: `${p.nombres} ${p.apellidos}`,
          dpi: p.dpi,
          entidad: p.tipo_participante === 'interno' ? p.cooperativa : p.institucion,
          puesto: p.tipo_participante === 'interno' ? p.puesto_interno : p.puesto_externo,
          firma: ''
        });

        row.height = 25;
        row.alignment = { vertical: 'middle' };
        
        // Bordes
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Pie de página
      const footerRow = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${footerRow}:F${footerRow}`);
      worksheet.getCell(`A${footerRow}`).value = `Generado el: ${new Date().toLocaleString('es-GT')}`;
      worksheet.getCell(`A${footerRow}`).font = { size: 9, italic: true };
      worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'right' };

      // Configurar respuesta
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=Asistencia_${evento.nombre_evento.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      next(error);
    }
  }

  // Generar reporte PDF de asistencia
  async generarPDF(req, res, next) {
      try {
        const { id_evento } = req.params;
        const pool = await getConnection();

        // 1. Obtener el evento
        const eventoResult = await pool.request()
          .input('id', sql.Int, id_evento)
          .query('SELECT * FROM evento WHERE id_evento = @id');

        const evento = eventoResult.recordset[0];

        // VALIDACIÓN: Si no hay evento, mandamos error antes de intentar hacer el PDF
        if (!evento) {
          return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        }

        // 2. Obtener participantes
        const participantesResult = await pool.request()
          .input('id_evento', sql.Int, id_evento)
          .query(`SELECT * FROM vw_reporte_asistencia WHERE id_evento = @id_evento AND estado_asistencia = 'asistio'`);
        
        const participantes = participantesResult.recordset;

        // 3. ENVIAR AL SERVICIO DE PDF
        // Aquí es donde sucede la magia: le pasamos 'res' y los datos
        await PDFService.generarReporteAsistencia(res, evento, participantes);

      } catch (error) {
        console.error("Error detallado:", error);
        next(error);
      }
    }
}

module.exports = new ReporteController();
