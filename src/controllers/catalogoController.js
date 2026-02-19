const { getConnection, sql } = require('../config/database');

class CatalogoController {
  // Obtener todas las comisiones
  async getComisiones(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT id_comision, name_comision FROM comision ORDER BY name_comision');
      
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los puestos
  async getPuestos(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT id_puesto, name_puesto FROM puesto ORDER BY name_puesto');
      
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear comisión
  async createComision(req, res, next) {
    try {
      const { name_comision } = req.body;
      const pool = await getConnection();
      
      await pool.request()
        .input('name', sql.VarChar(50), name_comision)
        .query(`
          INSERT INTO comision (name_comision, createdAt, updatedAt)
          VALUES (@name, GETDATE(), GETDATE())
        `);

      res.status(201).json({
        success: true,
        message: 'Comisión creada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear puesto
  async createPuesto(req, res, next) {
    try {
      const { name_puesto } = req.body;
      const pool = await getConnection();
      
      await pool.request()
        .input('name', sql.VarChar(50), name_puesto)
        .query(`
          INSERT INTO puesto (name_puesto, createdAt, updatedAt)
          VALUES (@name, GETDATE(), GETDATE())
        `);

      res.status(201).json({
        success: true,
        message: 'Puesto creado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CatalogoController();
