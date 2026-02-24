const { query } = require('../config/database');

class RolController {
  // Obtener todos los roles
  async getAll(req, res, next) {
    try {
      const result = await query(
        'SELECT * FROM rol ORDER BY id_rol ASC'
      );
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener rol por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(
        'SELECT * FROM rol WHERE id_rol = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rol no encontrado'
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

  // Crear nuevo rol
  async create(req, res, next) {
    try {
      const { rolname, estado = 1 } = req.body;
      
      // Verificar si ya existe un rol con el mismo nombre
      const checkResult = await query(
        'SELECT id_rol FROM rol WHERE rolname = $1',
        [rolname]
      );

      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un rol con ese nombre'
        });
      }

      // Obtener el siguiente ID disponible (ya que tu tabla no usa SERIAL)
      const maxIdResult = await query('SELECT COALESCE(MAX(id_rol), 0) + 1 as next_id FROM rol');
      const nextId = maxIdResult.rows[0].next_id;

      const result = await query(
        `INSERT INTO rol (id_rol, rolname, estado, createdat, updatedat)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [nextId, rolname, estado]
      );

      res.status(201).json({
        success: true,
        message: 'Rol creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar rol
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { rolname, estado } = req.body;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_rol FROM rol WHERE id_rol = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rol no encontrado'
        });
      }

      // Si se actualiza el nombre, verificar que no exista otro rol con ese nombre
      if (rolname !== undefined) {
        const nameCheck = await query(
          'SELECT id_rol FROM rol WHERE rolname = $1 AND id_rol != $2',
          [rolname, id]
        );

        if (nameCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otro rol con ese nombre'
          });
        }
      }

      // Construir query dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (rolname !== undefined) {
        updates.push(`rolname = $${paramCount}`);
        values.push(rolname);
        paramCount++;
      }
      if (estado !== undefined) {
        updates.push(`estado = $${paramCount}`);
        values.push(estado);
        paramCount++;
      }

      // Agregar updatedat
      updates.push(`updatedat = CURRENT_TIMESTAMP`);

      if (updates.length > 0) {
        values.push(id);
        await query(
          `UPDATE rol 
           SET ${updates.join(', ')}
           WHERE id_rol = $${paramCount}`,
          values
        );
      }

      const result = await query(
        'SELECT * FROM rol WHERE id_rol = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Rol actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar rol
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_rol FROM rol WHERE id_rol = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rol no encontrado'
        });
      }

      // Verificar si hay usuarios usando este rol
      const usuariosCheck = await query(
        'SELECT id_usuario FROM usuario WHERE id_rol = $1 LIMIT 1',
        [id]
      );

      if (usuariosCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar el rol porque tiene usuarios asignados'
        });
      }

      await query('DELETE FROM rol WHERE id_rol = $1', [id]);

      res.json({
        success: true,
        message: 'Rol eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener roles activos
  async getActive(req, res, next) {
    try {
      const result = await query(
        'SELECT * FROM rol WHERE estado = 1 ORDER BY rolname'
      );
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método adicional: Buscar roles por nombre
  async searchByName(req, res, next) {
    try {
      const { nombre } = req.params;
      const result = await query(
        `SELECT * FROM rol 
         WHERE rolname ILIKE $1 
         ORDER BY rolname`,
        [`%${nombre}%`]
      );
      
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

module.exports = new RolController();