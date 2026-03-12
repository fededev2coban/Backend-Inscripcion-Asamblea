const { query } = require('../config/database');

class PersonaController {
  // Obtener todas las personas
  async getAll(req, res, next) {
    try {
      const result = await query(`
         SELECT 
          
          * FROM persona 
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

  // Obtener persona por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(`
        SELECT 
          p.*,
          c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.id_persona = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
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

  // Crear nueva persona
  async create(req, res, next) {
    try {
      const { 
        nombres, apellidos, email, dpi, telefono, 
        id_cooperativa, institucion, puesto 
      } = req.body;
      
      // 1. Verificar DPI - En PostgreSQL se usa BIGINT para números grandes
      const dpiCheck = await query(
        'SELECT id_persona FROM persona WHERE dpi = $1',
        [dpi]
      );

      if (dpiCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una persona registrada con ese DPI'
        });
      }

      // 2. Insertar y obtener el ID usando RETURNING
      const insertResult = await query(`
        INSERT INTO persona (
          nombres, apellidos, email, dpi, telefono, 
          id_cooperativa, institucion, puesto, createdat, updatedat
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id_persona
      `, [
        nombres, 
        apellidos, 
        email || null, 
        dpi, 
        telefono || null, 
        id_cooperativa || null, 
        institucion || null, 
        puesto
      ]);

      const newId = insertResult.rows[0].id_persona;

      // 3. Devolver los datos completos con el JOIN
      const result = await query(`
        SELECT p.*, c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.id_persona = $1
      `, [newId]);

      res.status(201).json({
        success: true,
        message: 'Persona creada exitosamente',
        data: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }

  // Actualizar persona
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        nombres, 
        apellidos, 
        email, 
        dpi, 
        telefono, 
        id_cooperativa, 
        institucion, 
        puesto 
      } = req.body;
      
      // Verificar que existe
      const checkResult = await query(
        'SELECT id_persona FROM persona WHERE id_persona = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      // Si se actualiza el DPI, verificar que no exista en otra persona
      if (dpi !== undefined) {
        const dpiCheck = await query(
          'SELECT id_persona FROM persona WHERE dpi = $1 AND id_persona != $2',
          [dpi, id]
        );

        if (dpiCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otra persona registrada con ese DPI'
          });
        }
      }

      // Construir query dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (nombres !== undefined) {
        updates.push(`nombres = $${paramCount}`);
        values.push(nombres);
        paramCount++;
      }
      if (apellidos !== undefined) {
        updates.push(`apellidos = $${paramCount}`);
        values.push(apellidos);
        paramCount++;
      }
      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }
      if (dpi !== undefined) {
        updates.push(`dpi = $${paramCount}`);
        values.push(dpi);
        paramCount++;
      }
      if (telefono !== undefined) {
        updates.push(`telefono = $${paramCount}`);
        values.push(telefono);
        paramCount++;
      }
      if (id_cooperativa !== undefined) {
        updates.push(`id_cooperativa = $${paramCount}`);
        values.push(id_cooperativa);
        paramCount++;
      }
      if (institucion !== undefined) {
        updates.push(`institucion = $${paramCount}`);
        values.push(institucion);
        paramCount++;
      }
      if (puesto !== undefined) {
        updates.push(`puesto = $${paramCount}`);
        values.push(puesto);
        paramCount++;
      }

      // Agregar updatedat
      updates.push(`updatedat = CURRENT_TIMESTAMP`);

      if (updates.length > 0) {
        values.push(id);
        await query(
          `UPDATE persona 
           SET ${updates.join(', ')}
           WHERE id_persona = $${paramCount}`,
          values
        );
      }

      const result = await query(`
        SELECT 
          p.*,
          c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.id_persona = $1
      `, [id]);

      res.json({
        success: true,
        message: 'Persona actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar persona
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_persona FROM persona WHERE id_persona = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      await query('DELETE FROM persona WHERE id_persona = $1', [id]);

      res.json({
        success: true,
        message: 'Persona eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar personas por DPI
  async searchByDpi(req, res, next) {
    try {
      const { dpi } = req.params;
      const result = await query(`
        SELECT 
          p.*,
          c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.dpi = $1
      `, [dpi]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
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

  // Obtener personas por cooperativa
  async getByCooperativa(req, res, next) {
    try {
      const { id_cooperativa } = req.params;
      const result = await query(`
        SELECT 
          p.*,
          c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.id_cooperativa = $1
        ORDER BY p.apellidos, p.nombres
      `, [id_cooperativa]);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método adicional: Buscar por email
  async searchByEmail(req, res, next) {
    try {
      const { email } = req.params;
      const result = await query(`
        SELECT 
          p.*,
          c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_cooperativa = c.id_cooperativa
        WHERE p.email = $1
      `, [email]);
      
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

module.exports = new PersonaController();