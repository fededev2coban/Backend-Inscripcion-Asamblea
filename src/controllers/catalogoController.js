const { query } = require('../config/database');

class CatalogoController {
  // Obtener todas las comisiones
  async getComisiones(req, res, next) {
    try {
      const result = await query('SELECT id_comision, name_comision FROM comision ORDER BY name_comision');
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los puestos
  async getPuestos(req, res, next) {
    try {
      const result = await query('SELECT id_puesto, name_puesto FROM puesto ORDER BY name_puesto');
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear comisión
  async createComision(req, res, next) {
    try {
      const { name_comision } = req.body;
      
      const result = await query(
        `INSERT INTO comision (name_comision, createdat, updatedat)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [name_comision]
      );

      res.status(201).json({
        success: true,
        message: 'Comisión creada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear puesto
  async createPuesto(req, res, next) {
    try {
      const { name_puesto } = req.body;
      
      const result = await query(
        `INSERT INTO puesto (name_puesto, createdat, updatedat)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [name_puesto]
      );

      res.status(201).json({
        success: true,
        message: 'Puesto creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Métodos adicionales útiles para catálogos

  // Actualizar comisión
  async updateComision(req, res, next) {
    try {
      const { id } = req.params;
      const { name_comision } = req.body;

      const checkResult = await query(
        'SELECT id_comision FROM comision WHERE id_comision = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comisión no encontrada'
        });
      }

      const result = await query(
        `UPDATE comision 
         SET name_comision = $1, updatedat = CURRENT_TIMESTAMP
         WHERE id_comision = $2
         RETURNING *`,
        [name_comision, id]
      );

      res.json({
        success: true,
        message: 'Comisión actualizada exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar puesto
  async updatePuesto(req, res, next) {
    try {
      const { id } = req.params;
      const { name_puesto } = req.body;

      const checkResult = await query(
        'SELECT id_puesto FROM puesto WHERE id_puesto = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Puesto no encontrado'
        });
      }

      const result = await query(
        `UPDATE puesto 
         SET name_puesto = $1, updatedat = CURRENT_TIMESTAMP
         WHERE id_puesto = $2
         RETURNING *`,
        [name_puesto, id]
      );

      res.json({
        success: true,
        message: 'Puesto actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar comisión
  async deleteComision(req, res, next) {
    try {
      const { id } = req.params;

      const checkResult = await query(
        'SELECT id_comision FROM comision WHERE id_comision = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Comisión no encontrada'
        });
      }

      await query('DELETE FROM comision WHERE id_comision = $1', [id]);

      res.json({
        success: true,
        message: 'Comisión eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar puesto
  async deletePuesto(req, res, next) {
    try {
      const { id } = req.params;

      const checkResult = await query(
        'SELECT id_puesto FROM puesto WHERE id_puesto = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Puesto no encontrado'
        });
      }

      await query('DELETE FROM puesto WHERE id_puesto = $1', [id]);

      res.json({
        success: true,
        message: 'Puesto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CatalogoController();