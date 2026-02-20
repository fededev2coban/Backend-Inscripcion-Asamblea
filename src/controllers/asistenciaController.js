const { query } = require('../config/database');

class AsistenciaController {
  // Marcar asistencia de un participante
  async marcarAsistencia(req, res, next) {
    try {
      const { id } = req.params; // id_registro_evento
      const { estado_asistencia, notas } = req.body;
      const id_usuario = req.user.id; // Del token JWT

      // Validar que el registro existe
      const checkResult = await query(
        'SELECT id_registro_evento, estado_asistencia FROM registro_evento WHERE id_registro_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      const estadoAnterior = checkResult.rows[0].estado_asistencia;

      // Actualizar registro
      await query(
        `UPDATE registro_evento
         SET estado_asistencia = $1,
             fecha_asistencia = CASE 
               WHEN $1 = 'asistio' THEN CURRENT_TIMESTAMP
               ELSE fecha_asistencia
             END,
             id_usuario_asistencia = $2,
             notas = $3,
             updatedat = CURRENT_TIMESTAMP
         WHERE id_registro_evento = $4`,
        [estado_asistencia, id_usuario, notas || null, id]
      );

      // Registrar en bitácora
      await query(
        `INSERT INTO bitacora_asistencia (
            id_registro_evento, accion, estado_anterior, estado_nuevo, 
            id_usuario, fecha_accion, observaciones
          )
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)`,
        [id, 'marca_asistencia', estadoAnterior, estado_asistencia, id_usuario, notas || null]
      );

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

      const result = await query(
        `SELECT * FROM vw_reporte_asistencia
         WHERE id_evento = $1
         ORDER BY 
           CASE estado_asistencia
             WHEN 'asistio' THEN 1
             WHEN 'registrado' THEN 2
             WHEN 'no_asistio' THEN 3
           END,
           apellidos, nombres`,
        [id_evento]
      );

      // Separar por estado
      const rows = result.rows;
      const asistieron = rows.filter(r => r.estado_asistencia === 'asistio');
      const registrados = rows.filter(r => r.estado_asistencia === 'registrado');
      const noAsistieron = rows.filter(r => r.estado_asistencia === 'no_asistio');

      res.json({
        success: true,
        data: {
          total: rows.length,
          asistieron: asistieron,
          registrados: registrados,
          no_asistieron: noAsistieron,
          estadisticas: {
            total_registrados: rows.length,
            total_asistieron: asistieron.length,
            total_no_asistieron: noAsistieron.length,
            total_pendientes: registrados.length,
            porcentaje_asistencia: rows.length > 0 
              ? ((asistieron.length / rows.length) * 100).toFixed(2)
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

      let actualizados = 0;

      // Usamos una transacción para asegurar que todos se actualicen o ninguno
      const client = await getClient();
      
      try {
        await client.query('BEGIN');

        for (const id of registros) {
          await client.query(
            `UPDATE registro_evento
             SET estado_asistencia = $1,
                 fecha_asistencia = CASE 
                   WHEN $1 = 'asistio' THEN CURRENT_TIMESTAMP
                   ELSE fecha_asistencia
                 END,
                 id_usuario_asistencia = $2,
                 updatedat = CURRENT_TIMESTAMP
             WHERE id_registro_evento = $3`,
            [estado_asistencia, id_usuario, id]
          );
          
          actualizados++;
        }

        await client.query('COMMIT');
        
        res.json({
          success: true,
          message: `${actualizados} registros actualizados`,
          data: {
            total_actualizados: actualizados
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  // Obtener bitácora de un registro
  async getBitacora(req, res, next) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT 
            b.*,
            u.nombre_completo AS usuario
          FROM bitacora_asistencia b
          LEFT JOIN usuario u ON b.id_usuario = u.id_usuario
          WHERE b.id_registro_evento = $1
          ORDER BY b.fecha_accion DESC`,
        [id]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AsistenciaController();