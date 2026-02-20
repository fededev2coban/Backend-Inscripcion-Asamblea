const { query } = require('../config/database');

class RegistroEventoController {
  // Obtener todos los registros
  async getAll(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          re.*,
          e.nombre_evento::VARCHAR(100) as nombre_evento,
          e.fecha_evento,
          e.lugar_evento,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          c.name_cooperativa
        FROM registro_evento re
        INNER JOIN evento e ON re.id_evento = e.id_evento
        LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
        LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
        LEFT JOIN persona p ON (ri.id_persona = p.id_persona OR rex.id_persona = p.id_persona)
        LEFT JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        ORDER BY re.createdat DESC
      `);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener registro por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(`
        SELECT 
          re.*,
          e.nombre_evento::VARCHAR(100) as nombre_evento,
          e.fecha_evento,
          e.lugar_evento,
          e.hora_evento,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          c.name_cooperativa
        FROM registro_evento re
        INNER JOIN evento e ON re.id_evento = e.id_evento
        LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
        LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
        LEFT JOIN persona p ON (ri.id_persona = p.id_persona OR rex.id_persona = p.id_persona)
        LEFT JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        WHERE re.id_registro_evento = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo registro (inscribir persona a evento)
  async create(req, res, next) {
    try {
      const { id_evento, id_persona } = req.body;
      
      // Verificar que el evento existe y está activo
      const eventoCheck = await query(
        'SELECT id_evento, estado_evento FROM evento WHERE id_evento = $1',
        [id_evento]
      );

      if (eventoCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      if (eventoCheck.rows[0].estado_evento !== 1) {
        return res.status(400).json({
          success: false,
          error: 'El evento no está activo'
        });
      }

      // Verificar que la persona existe
      const personaCheck = await query(
        'SELECT id_persona FROM persona WHERE id_persona = $1',
        [id_persona]
      );

      if (personaCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      // Verificar si ya está registrado en este evento
      const registroCheck = await query(
        `SELECT re.id_registro_evento 
         FROM registro_evento re
         LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
         LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
         WHERE re.id_evento = $1 
           AND (ri.id_persona = $2 OR rex.id_persona = $2)`,
        [id_evento, id_persona]
      );

      if (registroCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'La persona ya está registrada en este evento'
        });
      }

      // Crear el registro
      const newRegistro = await query(
        `INSERT INTO registro_evento (id_evento, createdat, updatedat)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id_registro_evento`,
        [id_evento]
      );

      const idRegistro = newRegistro.rows[0].id_registro_evento;

      const result = await query(`
        SELECT 
          re.*,
          e.nombre_evento::VARCHAR(100) as nombre_evento,
          e.fecha_evento,
          e.lugar_evento,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          c.name_cooperativa
        FROM registro_evento re
        INNER JOIN evento e ON re.id_evento = e.id_evento
        LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
        LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
        LEFT JOIN persona p ON (ri.id_persona = p.id_persona OR rex.id_persona = p.id_persona)
        LEFT JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        WHERE re.id_registro_evento = $1
      `, [idRegistro]);

      res.status(201).json({
        success: true,
        message: 'Persona inscrita al evento exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar registro (cancelar inscripción)
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_registro_evento FROM registro_evento WHERE id_registro_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      await query('DELETE FROM registro_evento WHERE id_registro_evento = $1', [id]);

      res.json({
        success: true,
        message: 'Inscripción cancelada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener registros por evento
  async getByEvento(req, res, next) {
    try {
      const { id } = req.params;

      // Obtener inscritos internos
      const internosResult = await query(`
        SELECT 
          re.id_registro_evento,
          p.id_persona,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          c.name_cooperativa,
          com.name_comision,
          pu.name_puesto,
          re.createdat
        FROM registro_evento re
        INNER JOIN registro_internos ri ON re.id_interno = ri.id_interno
        INNER JOIN persona p ON ri.id_persona = p.id_persona
        INNER JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        INNER JOIN comision com ON ri.id_comision = com.id_comision
        INNER JOIN puesto pu ON ri.id_puesto = pu.id_puesto
        WHERE re.id_evento = $1 AND re.id_interno IS NOT NULL
        ORDER BY p.apellidos, p.nombres
      `, [id]);

      // Obtener inscritos externos
      const externosResult = await query(`
        SELECT 
          re.id_registro_evento,
          p.id_persona,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          rex.institucion,
          rex.puesto,
          re.createdat
        FROM registro_evento re
        INNER JOIN registro_externo rex ON re.id_externo = rex.id_externo
        INNER JOIN persona p ON rex.id_persona = p.id_persona
        WHERE re.id_evento = $1 AND re.id_externo IS NOT NULL
        ORDER BY p.apellidos, p.nombres
      `, [id]);

      // Obtener total de inscritos con todos los datos combinados
      const totalResult = await query(`
        SELECT 
          re.id_registro_evento,
          p.id_persona,
          p.nombres,
          p.apellidos,
          p.email,
          p.dpi,
          p.telefono,
          -- Fusionamos Institución y Cooperativa
          COALESCE(rex.institucion, c.name_cooperativa) AS institucion,
          -- Fusionamos los dos tipos de puestos
          COALESCE(rex.puesto, pu.name_puesto) AS puesto,
          -- La comisión solo existe para internos (será NULL para externos)
          COALESCE(com.name_comision, 'N/A') AS comision,
          re.createdat
        FROM registro_evento re
        LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
        LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
        INNER JOIN persona p ON (rex.id_persona = p.id_persona OR ri.id_persona = p.id_persona)
        LEFT JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        LEFT JOIN comision com ON ri.id_comision = com.id_comision
        LEFT JOIN puesto pu ON ri.id_puesto = pu.id_puesto
        WHERE re.id_evento = $1
        ORDER BY p.apellidos, p.nombres
      `, [id]);

      res.json({
        success: true,
        data: {
          internos: internosResult.rows,
          externos: externosResult.rows,
          inscritostotal: totalResult.rows,
          total: internosResult.rows.length + externosResult.rows.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener registros por persona
  async getByPersona(req, res, next) {
    try {
      const { id_persona } = req.params;
      const result = await query(`
        SELECT 
          re.*,
          e.nombre_evento::VARCHAR(100) as nombre_evento,
          e.fecha_evento,
          e.lugar_evento,
          e.hora_evento::VARCHAR(20) as hora_evento,
          e.estado_evento
        FROM registro_evento re
        INNER JOIN evento e ON re.id_evento = e.id_evento
        LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
        LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
        WHERE ri.id_persona = $1 OR rex.id_persona = $1
        ORDER BY e.fecha_evento DESC
      `, [id_persona]);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas del evento
  async getEventoStats(req, res, next) {
    try {
      const { id } = req.params;

      // Total de inscritos
      const totalResult = await query(
        'SELECT COUNT(*) as total FROM registro_evento WHERE id_evento = $1',
        [id]
      );

      // Total internos
      const internosResult = await query(
        'SELECT COUNT(*) as total FROM registro_evento WHERE id_evento = $1 AND id_interno IS NOT NULL',
        [id]
      );

      // Total externos
      const externosResult = await query(
        'SELECT COUNT(*) as total FROM registro_evento WHERE id_evento = $1 AND id_externo IS NOT NULL',
        [id]
      );

      // Por cooperativa
      const porCooperativaResult = await query(`
        SELECT 
          c.name_cooperativa as cooperativa,
          COUNT(*) as cantidad
        FROM registro_evento re
        INNER JOIN registro_internos ri ON re.id_interno = ri.id_interno
        INNER JOIN cooperativa c ON ri.id_cooperativa = c.id_cooperativa
        WHERE re.id_evento = $1
        GROUP BY c.name_cooperativa
        ORDER BY cantidad DESC
      `, [id]);

      // Por comisión
      const porComisionResult = await query(`
        SELECT 
          com.name_comision as comision,
          COUNT(*) as cantidad
        FROM registro_evento re
        INNER JOIN registro_internos ri ON re.id_interno = ri.id_interno
        INNER JOIN comision com ON ri.id_comision = com.id_comision
        WHERE re.id_evento = $1
        GROUP BY com.name_comision
        ORDER BY cantidad DESC
      `, [id]);

      res.json({
        success: true,
        data: {
          total_inscritos: parseInt(totalResult.rows[0].total),
          total_internos: parseInt(internosResult.rows[0].total),
          total_externos: parseInt(externosResult.rows[0].total),
          por_cooperativa: porCooperativaResult.rows,
          por_comision: porComisionResult.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistroEventoController();