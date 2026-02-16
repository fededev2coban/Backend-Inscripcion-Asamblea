const { getConnection, sql } = require('../config/database');
const { customAlphabet } = require('nanoid');

// Generar IDs únicos para links públicos (solo letras y números)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

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
            publicado,
            link_publico,
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
            publicado,
            link_publico,
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

  // Obtener evento por link público
  async getByPublicLink(req, res, next) {
    try {
      const { link } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('link', sql.VarChar(100), link)
        .query(`
          SELECT 
            id_evento,
            CAST(nombre_evento AS VARCHAR(100)) as nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            CAST(hora_evento AS VARCHAR(20)) as hora_evento,
            publicado,
            createdAt
          FROM evento 
          WHERE link_publico = @link AND publicado = 1 AND estado_evento = 1
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado o no publicado'
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

      const horaFormateada = hora_evento.split(':').length === 2 
        ? `${hora_evento}:00` 
        : hora_evento;

      await pool.request()
        .input('nombre_evento', sql.VarChar(100), nombre_evento)
        .input('estado_evento', sql.Int, estado_evento)
        .input('fecha_evento', sql.Date, fecha_evento)
        .input('lugar_evento', sql.VarChar(100), lugar_evento)
        .input('hora_evento', sql.VarChar(8), horaFormateada)
        .query(`
          INSERT INTO evento (nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento, publicado)
          VALUES (@nombre_evento, @estado_evento, @fecha_evento, @lugar_evento, @hora_evento, 0)
        `);

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // Publicar evento y generar link público
  async publish(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

      // Verificar que el evento existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_evento, publicado, link_publico FROM evento WHERE id_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const evento = checkResult.recordset[0];

      // Si ya está publicado, devolver el link existente
      if (evento.publicado === 1 && evento.link_publico) {
        return res.json({
          success: true,
          message: 'Evento ya publicado',
          data: {
            publicado: true,
            link_publico: evento.link_publico,
            url_completa: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/registro/${evento.link_publico}`
          }
        });
      }

      // Generar nuevo link único
      const linkPublico = nanoid();

      // Actualizar evento
      await pool.request()
        .input('id', sql.Int, id)
        .input('link', sql.VarChar(100), linkPublico)
        .query(`
          UPDATE evento 
          SET publicado = 1, link_publico = @link
          WHERE id_evento = @id
        `);

      res.json({
        success: true,
        message: 'Evento publicado exitosamente',
        data: {
          publicado: true,
          link_publico: linkPublico,
          url_completa: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/registro/${linkPublico}`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Despublicar evento
  async unpublish(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

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
        .query('UPDATE evento SET publicado = 0 WHERE id_evento = @id');

      res.json({
        success: true,
        message: 'Evento despublicado exitosamente',
        data: {
          publicado: false
        }
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

      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_evento FROM evento WHERE id_evento = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const horaFormateada = hora_evento.split(':').length === 2 
        ? `${hora_evento}:00` 
        : hora_evento;

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
        request.input('hora_evento', sql.VarChar(8), horaFormateada);
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
            nombre_evento,
            estado_evento,
            fecha_evento,
            lugar_evento,
            hora_evento,
            publicado,
            link_publico,
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
            publicado,
            link_publico,
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
            publicado,
            link_publico,
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
