const { getConnection, sql } = require('../config/database');

class EventoController {
  // Obtener todos los eventos
  async getAll(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            createdAt
          FROM evento 
          ORDER BY fecha_evento DESC, hora_evento DESC
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

  // Obtener evento por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            createdAt
          FROM evento 
          WHERE id_evento = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
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

  // Crear nuevo evento
  async create(req, res, next) {
    try {
      const { nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento } = req.body;
      const pool = await getConnection();

      // Preparar la hora correctamente
      const horaData = new Date(`1970-01-01T${hora_evento}Z`);
      
      await pool.request()
        .input('nombre_evento', sql.VarChar(100), nombre_evento)
        .input('estado_evento', sql.Int, estado_evento)
        .input('fecha_evento', sql.Date, fecha_evento)
        .input('lugar_evento', sql.VarChar(100), lugar_evento)
        .input('hora_evento', sql.Time, horaData)
        .query(`
          INSERT INTO evento (nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento)
          VALUES (@nombre_evento, @estado_evento, @fecha_evento, @lugar_evento, @hora_evento)
        `);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar evento
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento } = req.body;
      const pool = await getConnection();
      const horaData = new Date(`1970-01-01T${hora_evento}Z`);

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_evento FROM evento WHERE id_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const request = pool.request().input('id', sql.Int, id);
      const updates = [];

      if (nombre_evento !== undefined) {
        request.input('nombre_evento', sql.VarChar(100), nombre_evento);
        updates.push('nombre_evento = CAST(@nombre_evento AS VARBINARY(100))');
      }
      if (estado_evento !== undefined) {
        request.input('estado_evento', sql.Int, estado_evento);
        updates.push('estado_evento = @estado_evento');
      }
      if (fecha_evento !== undefined) {
        request.input('fecha_evento', sql.Date, fecha_evento);
        updates.push('fecha_evento = @fecha_evento');
      }
      if (lugar_evento !== undefined) {
        request.input('lugar_evento', sql.VarChar(100), lugar_evento);
        updates.push('lugar_evento = @lugar_evento');
      }
      if (hora_evento !== undefined) {
        request.input('hora_evento', sql.Time, horaData);
        updates.push('hora_evento = @hora_evento');
      }

      if (updates.length > 0) {
        await request.query(`
          UPDATE evento 
          SET ${updates.join(', ')}
          WHERE id_evento = @id
        `);
      }

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            createdAt
          FROM evento 
          WHERE id_evento = @id
        `);

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: result.recordset[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar evento
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_evento FROM evento WHERE id_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM evento WHERE id_evento = @id');

      res.json({
        success: true,
        message: 'Evento eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener eventos activos
  async getActive(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            createdAt
          FROM evento 
          WHERE estado_evento = 1 
          ORDER BY fecha_evento DESC, hora_evento DESC
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

  // Obtener eventos próximos
  async getUpcoming(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            createdAt
          FROM evento 
          WHERE estado_evento = 1 AND fecha_evento >= CAST(GETDATE() AS DATE)
          ORDER BY fecha_evento ASC, hora_evento ASC
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
}

module.exports = new EventoController();
