const { query } = require('../config/database');
const { customAlphabet } = require('nanoid');

// Generar IDs únicos para links públicos (solo letras y números)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

class EventoController {
  // Obtener todos los eventos
  async getAll(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          id_evento,
          nombre_evento::VARCHAR(100) as nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento::VARCHAR(20) as hora_evento,
          publicado,
          link_publico,
          createdat
        FROM evento 
        ORDER BY fecha_evento DESC, hora_evento DESC
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

  // Obtener evento por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT 
          id_evento,
          nombre_evento::VARCHAR(100) as nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento::VARCHAR(20) as hora_evento,
          publicado,
          link_publico,
          createdat
        FROM evento 
        WHERE id_evento = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
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

  // Obtener evento por link público
  async getByPublicLink(req, res, next) {
    try {
      const { link } = req.params;
      const result = await query(
        `SELECT 
          id_evento,
          nombre_evento::VARCHAR(100) as nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento::VARCHAR(20) as hora_evento,
          publicado,
          createdat
        FROM evento 
        WHERE link_publico = $1 AND publicado = 1 AND estado_evento = 1`,
        [link]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado o no publicado'
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

  // Crear nuevo evento
  async create(req, res, next) {
    try {
      const { nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento } = req.body;

      const horaFormateada = hora_evento.split(':').length === 2 
        ? `${hora_evento}:00` 
        : hora_evento;

      await query(
        `INSERT INTO evento (nombre_evento, estado_evento, fecha_evento, lugar_evento, hora_evento, publicado)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [nombre_evento, estado_evento, fecha_evento, lugar_evento, horaFormateada]
      );

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

      // Verificar que el evento existe
      const checkResult = await query(
        'SELECT id_evento, publicado, link_publico FROM evento WHERE id_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const evento = checkResult.rows[0];

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
      await query(
        `UPDATE evento 
         SET publicado = 1, link_publico = $1
         WHERE id_evento = $2`,
        [linkPublico, id]
      );

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

      const checkResult = await query(
        'SELECT id_evento FROM evento WHERE id_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      await query(
        'UPDATE evento SET publicado = 0 WHERE id_evento = $1',
        [id]
      );

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

      const checkResult = await query(
        'SELECT id_evento FROM evento WHERE id_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      // Construir query dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (nombre_evento !== undefined) {
        updates.push(`nombre_evento = $${paramCount}`);
        values.push(nombre_evento);
        paramCount++;
      }
      if (estado_evento !== undefined) {
        updates.push(`estado_evento = $${paramCount}`);
        values.push(estado_evento);
        paramCount++;
      }
      if (fecha_evento !== undefined) {
        updates.push(`fecha_evento = $${paramCount}`);
        values.push(fecha_evento);
        paramCount++;
      }
      if (lugar_evento !== undefined) {
        updates.push(`lugar_evento = $${paramCount}`);
        values.push(lugar_evento);
        paramCount++;
      }
      if (hora_evento !== undefined) {
        const horaFormateada = hora_evento.split(':').length === 2 
          ? `${hora_evento}:00` 
          : hora_evento;
        updates.push(`hora_evento = $${paramCount}`);
        values.push(horaFormateada);
        paramCount++;
      }

      if (updates.length > 0) {
        values.push(id);
        await query(
          `UPDATE evento 
           SET ${updates.join(', ')}
           WHERE id_evento = $${paramCount}`,
          values
        );
      }

      const result = await query(
        `SELECT 
          id_evento,
          nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento,
          publicado,
          link_publico,
          createdat
        FROM evento 
        WHERE id_evento = $1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar evento
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const checkResult = await query(
        'SELECT id_evento FROM evento WHERE id_evento = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      await query('DELETE FROM evento WHERE id_evento = $1', [id]);

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
      const result = await query(`
        SELECT 
          id_evento,
          nombre_evento::VARCHAR(100) as nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento::VARCHAR(20) as hora_evento,
          publicado,
          link_publico,
          createdat
        FROM evento 
        WHERE estado_evento = 1 
        ORDER BY fecha_evento DESC, hora_evento DESC
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

  // Obtener eventos próximos
  async getUpcoming(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          id_evento,
          nombre_evento::VARCHAR(100) as nombre_evento,
          estado_evento,
          fecha_evento,
          lugar_evento,
          hora_evento::VARCHAR(20) as hora_evento,
          publicado,
          link_publico,
          createdat
        FROM evento 
        WHERE estado_evento = 1 AND fecha_evento >= CURRENT_DATE
        ORDER BY fecha_evento ASC, hora_evento ASC
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
}

module.exports = new EventoController();