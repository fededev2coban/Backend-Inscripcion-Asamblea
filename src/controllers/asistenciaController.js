const { getConnection, sql } = require('../config/database');

class AsistenciaController {
  // Marcar asistencia de un participante
  async marcarAsistencia(req, res, next) {
    try {
      const { id } = req.params; // id_registro_evento
      const { estado_asistencia, notas } = req.body;
      const id_usuario = req.user.id; // Del token JWT

      const pool = await getConnection();

      // Validar que el registro existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_registro_evento, estado_asistencia FROM registro_evento WHERE id_registro_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      const estadoAnterior = checkResult.recordset[0].estado_asistencia;

      // Actualizar registro
      await pool.request()
        .input('id', sql.Int, id)
        .input('estado', sql.VarChar(20), estado_asistencia)
        .input('id_usuario', sql.Int, id_usuario)
        .input('notas', sql.VarChar(500), notas || null)
        .query(`
          UPDATE registro_evento
          SET estado_asistencia = @estado,
              fecha_asistencia = CASE 
                WHEN @estado = 'asistio' THEN GETDATE()
                ELSE fecha_asistencia
              END,
              id_usuario_asistencia = @id_usuario,
              notas = @notas,
              updatedAt = GETDATE()
          WHERE id_registro_evento = @id
        `);

      // Registrar en bitácora
      await pool.request()
        .input('id_registro', sql.Int, id)
        .input('accion', sql.VarChar(50), 'marca_asistencia')
        .input('estado_anterior', sql.VarChar(20), estadoAnterior)
        .input('estado_nuevo', sql.VarChar(20), estado_asistencia)
        .input('id_usuario', sql.Int, id_usuario)
        .input('observaciones', sql.VarChar(500), notas || null)
        .query(`
          INSERT INTO bitacora_asistencia (
            id_registro_evento, accion, estado_anterior, estado_nuevo, 
            id_usuario, fecha_accion, observaciones
          )
          VALUES (
            @id_registro, @accion, @estado_anterior, @estado_nuevo,
            @id_usuario, GETDATE(), @observaciones
          )
        `);

      res.json({
        success: true,
        message: `Asistencia marcada como: ${estado_asistencia}`,
        data: {
          estado_anterior: estadoAnterior,
          estado_nuevo: estado_asistencia,
          fecha: new Date()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener lista de asistencia de un evento
  async getAsistenciaEvento(req, res, next) {
    try {
      const { id_evento } = req.params;

      const pool = await getConnection();

      const result = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query(`
          SELECT * FROM vw_reporte_asistencia
          WHERE id_evento = @id_evento
          ORDER BY 
            CASE estado_asistencia
              WHEN 'asistio' THEN 1
              WHEN 'registrado' THEN 2
              WHEN 'no_asistio' THEN 3
            END,
            apellidos, nombres
        `);

      // Separar por estado
      const asistieron = result.recordset.filter(r => r.estado_asistencia === 'asistio');
      const registrados = result.recordset.filter(r => r.estado_asistencia === 'registrado');
      const noAsistieron = result.recordset.filter(r => r.estado_asistencia === 'no_asistio');

      res.json({
        success: true,
        data: {
          total: result.recordset.length,
          asistieron: asistieron,
          registrados: registrados,
          no_asistieron: noAsistieron,
          estadisticas: {
            total_registrados: result.recordset.length,
            total_asistieron: asistieron.length,
            total_no_asistieron: noAsistieron.length,
            total_pendientes: registrados.length,
            porcentaje_asistencia: result.recordset.length > 0 
              ? ((asistieron.length / result.recordset.length) * 100).toFixed(2)
              : 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar asistencia masiva
  async marcarAsistenciaMasiva(req, res, next) {
    try {
      const { registros, estado_asistencia } = req.body; // array de ids
      const id_usuario = req.user.id;

      const pool = await getConnection();

      let actualizados = 0;

      for (const id of registros) {
        await pool.request()
          .input('id', sql.Int, id)
          .input('estado', sql.VarChar(20), estado_asistencia)
          .input('id_usuario', sql.Int, id_usuario)
          .query(`
            UPDATE registro_evento
            SET estado_asistencia = @estado,
                fecha_asistencia = CASE 
                  WHEN @estado = 'asistio' THEN GETDATE()
                  ELSE fecha_asistencia
                END,
                id_usuario_asistencia = @id_usuario,
                updatedAt = GETDATE()
            WHERE id_registro_evento = @id
          `);
        
        actualizados++;
      }

      res.json({
        success: true,
        message: `${actualizados} registros actualizados`,
        data: {
          total_actualizados: actualizados
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener bitácora de un registro
  async getBitacora(req, res, next) {
    try {
      const { id } = req.params;

      const pool = await getConnection();

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            b.*,
            u.nombre_completo AS usuario
          FROM bitacora_asistencia b
          LEFT JOIN usuario u ON b.id_usuario = u.id_usuario
          WHERE b.id_registro_evento = @id
          ORDER BY b.fecha_accion DESC
        `);

      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AsistenciaController();
