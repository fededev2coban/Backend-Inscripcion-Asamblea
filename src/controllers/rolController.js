const { getConnection, sql } = require('../config/database');

class RolController {
  // Obtener todas las rol
  async getAll(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT * FROM rol ORDER BY id_rol ASC');
      
      res.json({
        success: true,
        data: result.recordset,
        count: result.recordset.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener cooperativa por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM rol WHERE id_rol = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Rol no encontrada'
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

  // Crear nueva cooperativa
  async create(req, res, next) {
    try {
      const { rolname, afiliado = 1, estado = 1 } = req.body;
      const pool = await getConnection();
      
      const result = await pool.request()
        
        .input('rolname', sql.VarChar(50), rolname)
        .input('afiliado', sql.Int, afiliado)
        .input('estado', sql.Int, estado)
        .query(`
          INSERT INTO cooperativa (rolname, afiliado, estado)
          VALUES (@rolname, @afiliado, @estado);
        `);

      res.status(201).json({
        success: true,
        message: 'Cooperativa creada exitosamente',

      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar cooperativa
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { rolname, afiliado, estado } = req.body;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_rol FROM rol WHERE id_rol = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      const request = pool.request().input('id', sql.Int, id);
      const updates = [];

      if (rolname !== undefined) {
        request.input('rolname', sql.VarChar(50), rolname);
        updates.push('rolname = @rolname');
      }
      if (afiliado !== undefined) {
        request.input('afiliado', sql.Int, afiliado);
        updates.push('afiliado = @afiliado');
      }
      if (estado !== undefined) {
        request.input('estado', sql.Int, estado);
        updates.push('estado = @estado');
      }

      updates.push('updatedAt = GETDATE()');

      await request.query(`
        UPDATE cooperativa 
        SET ${updates.join(', ')}
        WHERE id_rol = @id
      `);

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM rol WHERE id_rol = @id');

      res.json({
        success: true,
        message: 'Cooperativa actualizada exitosamente',
        data: result.recordset[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar cooperativa
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_rol FROM rol WHERE id_rol = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM rol WHERE id_rol = @id');

      res.json({
        success: true,
        message: 'Cooperativa eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener cooperativas activas
  async getActive(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT * FROM rol WHERE estado = 1 ORDER BY rolname');
      
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

module.exports = new RolController();
