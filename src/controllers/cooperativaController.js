const { getConnection, sql } = require('../config/database');

class CooperativaController {
  // Obtener todas las cooperativas
  async getAll(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT * FROM cooperativa ORDER BY id_cooperativa DESC');
      
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
        .query('SELECT * FROM cooperativa WHERE id_cooperativa = @id');
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
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
      const { name_cooperativa, afiliado = 1, estado = 1 } = req.body;
      const pool = await getConnection();
      
      const result = await pool.request()
        
        .input('name_cooperativa', sql.VarChar(50), name_cooperativa)
        .input('afiliado', sql.Int, afiliado)
        .input('estado', sql.Int, estado)
        .query(`
          INSERT INTO cooperativa (name_cooperativa, afiliado, estado)
          VALUES (@name_cooperativa, @afiliado, @estado);
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
      const { name_cooperativa, afiliado, estado } = req.body;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_cooperativa FROM cooperativa WHERE id_cooperativa = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      const request = pool.request().input('id', sql.Int, id);
      const updates = [];

      if (name_cooperativa !== undefined) {
        request.input('name_cooperativa', sql.VarChar(50), name_cooperativa);
        updates.push('name_cooperativa = @name_cooperativa');
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
        WHERE id_cooperativa = @id
      `);

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM cooperativa WHERE id_cooperativa = @id');

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
        .query('SELECT id_cooperativa FROM cooperativa WHERE id_cooperativa = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM cooperativa WHERE id_cooperativa = @id');

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
        .query('SELECT * FROM cooperativa WHERE estado = 1 ORDER BY name_cooperativa');
      
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

module.exports = new CooperativaController();
