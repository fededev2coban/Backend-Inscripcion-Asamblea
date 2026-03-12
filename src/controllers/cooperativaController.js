const { query } = require('../config/database');

class CooperativaController {
  // Obtener todas las cooperativas
  async getAll(req, res, next) {
    try {
      const result = await query('SELECT * FROM cooperativa ORDER BY id_cooperativa ASC');
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener cooperativa por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(
        'SELECT * FROM cooperativa WHERE id_cooperativa = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
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

  // Crear nueva cooperativa
  async create(req, res, next) {
    try {
      const { name_cooperativa, afiliado = 1, estado = 1 } = req.body;
      
      const result = await query(
        `INSERT INTO cooperativa (name_cooperativa, afiliado, estado)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name_cooperativa, afiliado, estado]
      );

      res.status(201).json({
        success: true,
        message: 'Cooperativa creada exitosamente',
        data: result.rows[0]
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

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_cooperativa FROM cooperativa WHERE id_cooperativa = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      // Construir query dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name_cooperativa !== undefined) {
        updates.push(`name_cooperativa = $${paramCount}`);
        values.push(name_cooperativa);
        paramCount++;
      }
      if (afiliado !== undefined) {
        updates.push(`afiliado = $${paramCount}`);
        values.push(afiliado);
        paramCount++;
      }
      if (estado !== undefined) {
        updates.push(`estado = $${paramCount}`);
        values.push(estado);
        paramCount++;
      }

      // Agregar updatedAt con CURRENT_TIMESTAMP de PostgreSQL
      updates.push(`updatedat = CURRENT_TIMESTAMP`);

      if (updates.length > 0) {
        values.push(id);
        await query(
          `UPDATE cooperativa 
           SET ${updates.join(', ')}
           WHERE id_cooperativa = $${paramCount}`,
          values
        );
      }

      const result = await query(
        'SELECT * FROM cooperativa WHERE id_cooperativa = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Cooperativa actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar cooperativa
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_cooperativa FROM cooperativa WHERE id_cooperativa = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Cooperativa no encontrada'
        });
      }

      await query('DELETE FROM cooperativa WHERE id_cooperativa = $1', [id]);

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
      const result = await query(
        'SELECT * FROM cooperativa WHERE estado = 1 ORDER BY name_cooperativa'
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

module.exports = new CooperativaController();