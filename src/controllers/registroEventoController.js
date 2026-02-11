const { getConnection, sql } = require('../config/database');

class RegistroEventoController {
  // Obtener todos los registros
  async getAll(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            re.*,
            CAST(e.nombre_evento AS VARCHAR(100)) as nombre_evento,
            e.fecha_evento,
            e.lugar_evento,
            p.nombres,
            p.apellidos,
            p.email,
            p.dpi,
            p.telefono,
            p.puesto,
            c.name_cooperativa
          FROM registro_evento re
          INNER JOIN evento e ON re.id_evento = e.id_evento
          INNER JOIN persona p ON re.id_persona = p.id_persona
          LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
          ORDER BY re.createdAt DESC
        `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener registro por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            re.*,
            CAST(e.nombre_evento AS VARCHAR(100)) as nombre_evento,
            e.fecha_evento,
            e.lugar_evento,
            e.hora_evento,
            p.nombres,
            p.apellidos,
            p.email,
            p.dpi,
            p.telefono,
            p.puesto,
            c.name_cooperativa
          FROM registro_evento re
          INNER JOIN evento e ON re.id_evento = e.id_evento
          INNER JOIN persona p ON re.id_persona = p.id_persona
          LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
          WHERE re.id_registro_evento = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      res.json({
        success: true,
        data: result.recordset[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear nuevo registro (inscribir persona a evento)
  async create(req, res, next) {
    try {
      const { id_evento, id_persona } = req.body;
      const pool = await getConnection();
      
      // Verificar que el evento existe y está activo
      const eventoCheck = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query('SELECT id_evento, estado_evento FROM evento WHERE id_evento = @id_evento');

      if (eventoCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      if (eventoCheck.recordset[0].estado_evento !== 1) {
        return res.status(400).json({
          success: false,
          error: 'El evento no está activo'
        });
      }

      // Verificar que la persona existe
      const personaCheck = await pool.request()
        .input('id_persona', sql.Int, id_persona)
        .query('SELECT id_persona FROM persona WHERE id_persona = @id_persona');

      if (personaCheck.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      // Verificar si ya está registrado en este evento
      const registroCheck = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .input('id_persona', sql.Int, id_persona)
        .query(`
          SELECT id_registro_evento 
          FROM registro_evento 
          WHERE id_evento = @id_evento AND id_persona = @id_persona
        `);

      if (registroCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'La persona ya está registrada en este evento'
        });
      }

      // Obtener el siguiente ID
      const maxIdResult = await pool.request()
        .query('SELECT ISNULL(MAX(id_registro_evento), 0) + 1 as nextId FROM registro_evento');
      const nextId = maxIdResult.recordset[0].nextId;

      await pool.request()
        .input('id_registro_evento', sql.Int, nextId)
        .input('id_evento', sql.Int, id_evento)
        .input('id_persona', sql.Int, id_persona)
        .query(`
          INSERT INTO registro_evento (id_registro_evento, id_evento, id_persona)
          VALUES (@id_registro_evento, @id_evento, @id_persona, GETDATE(), GETDATE())
        `);

      const result = await pool.request()
        .input('id', sql.Int, nextId)
        .query(`
          SELECT 
            re.*,
            CAST(e.nombre_evento AS VARCHAR(100)) as nombre_evento,
            e.fecha_evento,
            e.lugar_evento,
            p.nombres,
            p.apellidos,
            p.email,
            p.dpi,
            p.telefono,
            p.puesto,
            c.name_cooperativa
          FROM registro_evento re
          INNER JOIN evento e ON re.id_evento = e.id_evento
          INNER JOIN persona p ON re.id_persona = p.id_persona
          LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
          WHERE re.id_registro_evento = @id
        `);

      res.status(201).json({
        success: true,
        message: 'Persona inscrita al evento exitosamente',
        data: result.recordset[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar registro (cancelar inscripción)
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_registro_evento FROM registro_evento WHERE id_registro_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Registro no encontrado'
        });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM registro_evento WHERE id_registro_evento = @id');

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
      const { id_evento } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query(`
          SELECT 
            re.*,
            p.nombres,
            p.apellidos,
            p.email,
            p.dpi,
            p.telefono,
            p.puesto,
            p.institucion,
            c.name_cooperativa
          FROM registro_evento re
          INNER JOIN persona p ON re.id_persona = p.id_persona
          LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
          WHERE re.id_evento = @id_evento
          ORDER BY p.apellidos, p.nombres
        `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener registros por persona
  async getByPersona(req, res, next) {
    try {
      const { id_persona } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id_persona', sql.Int, id_persona)
        .query(`
          SELECT 
            re.*,
            CAST(e.nombre_evento AS VARCHAR(100)) as nombre_evento,
            e.fecha_evento,
            e.lugar_evento,
            CAST(e.hora_evento AS VARCHAR(20)) as hora_evento,
            e.estado_evento
          FROM registro_evento re
          INNER JOIN evento e ON re.id_evento = e.id_evento
          WHERE re.id_persona = @id_persona
          ORDER BY e.fecha_evento DESC
        `);
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener estadísticas de un evento
  async getEventoStats(req, res, next) {
    try {
      const { id_evento } = req.params;
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query(`
          SELECT 
            COUNT(*) as total_inscritos,
            COUNT(DISTINCT p.id_cooperativa) as total_cooperativas,
            COUNT(CASE WHEN p.id_cooperativa IS NOT NULL THEN 1 END) as inscritos_con_cooperativa,
            COUNT(CASE WHEN p.id_cooperativa IS NULL THEN 1 END) as inscritos_sin_cooperativa
          FROM registro_evento re
          INNER JOIN persona p ON re.id_persona = p.id_persona
          WHERE re.id_evento = @id_evento
        `);

      const cooperativasResult = await pool.request()
        .input('id_evento', sql.Int, id_evento)
        .query(`
          SELECT 
            c.name_cooperativa,
            COUNT(*) as cantidad
          FROM registro_evento re
          INNER JOIN persona p ON re.id_persona = p.id_persona
          INNER JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
          WHERE re.id_evento = @id_evento
          GROUP BY c.name_cooperativa
          ORDER BY cantidad DESC
        `);

      res.json({
        success: true,
        data: {
          estadisticas: result.recordset[0],
          por_cooperativa: cooperativasResult.recordset
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistroEventoController();
