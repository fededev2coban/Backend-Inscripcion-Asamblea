const { getConnection, sql } = require('../config/database');

class UsuarioController {
  // Obtener todas las personas
  async getAll(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query(`
          SELECT 
            u.*,
            r.rolname
          FROM usuario u
          LEFT JOIN rol r ON u.id_rol = r.id_rol
          ORDER BY u.id_usuario ASC
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

  // Obtener persona por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            u.*,
            r.rolname
          FROM usuario u
          LEFT JOIN rol r ON u.id_rol = r.id_rol
          ORDER BY u.id_usuario ASC
          WHERE u.id_usuario = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
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

  // Crear nueva persona
  async create(req, res, next) {
  try {
    const { 
      nombres, apellidos, email, dpi, telefono, 
      id_rol, institucion, puesto 
    } = req.body;
    
    const pool = await getConnection();
    
    // 1. Verificar DPI usando BigInt o VarChar para evitar desbordamiento
    const dpiCheck = await pool.request()
      .input('dpi', sql.BigInt, dpi) // Cambiado a BigInt por los 13 dígitos
      .query('SELECT id_persona FROM persona WHERE dpi = @dpi');

    if (dpiCheck.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una persona registrada con ese DPI'
      });
    }

    // 2. Insertar y obtener el ID en un solo paso
    // Nota: Eliminamos id_persona del INSERT asumiendo que es IDENTITY
    const insertRequest = pool.request()
      .input('nombres', sql.VarChar(50), nombres)
      .input('apellidos', sql.VarChar(50), apellidos)
      .input('email', sql.VarChar(100), email || null)
      .input('dpi', sql.BigInt, dpi)
      .input('telefono', sql.VarChar(20), telefono || null) // Teléfono mejor como VarChar
      .input('id_rol', sql.Int, id_rol || null)
      .input('institucion', sql.VarChar(100), institucion || null)
      .input('puesto', sql.VarChar(50), puesto);

    const insertResult = await insertRequest.query(`
      INSERT INTO persona (nombres, apellidos, email, dpi, telefono, id_rol, institucion, puesto)
      VALUES (@nombres, @apellidos, @email, @dpi, @telefono, @id_rol, @institucion, @puesto);
      
      SELECT SCOPE_IDENTITY() AS id; -- Obtiene el ID que se acaba de generar
    `);

    const newId = insertResult.recordset[0].id;

    // 3. Devolver los datos completos con el JOIN
    const result = await pool.request()
      .input('id', sql.Int, newId)
      .query(`
        SELECT p.*, c.name_cooperativa
        FROM persona p
        LEFT JOIN cooperativa c ON p.id_rol = c.id_rol
        WHERE p.id_persona = @id
      `);

    res.status(201).json({
      success: true,
      message: 'Persona creada exitosamente',
      data: result.recordset[0]
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
        id_rol, 
        institucion, 
        puesto 
      } = req.body;
      
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_persona FROM persona WHERE id_persona = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      // Si se actualiza el DPI, verificar que no exista en otra persona
      if (dpi !== undefined) {
        const dpiCheck = await pool.request()
          .input('dpi', sql.Int, dpi)
          .input('id', sql.Int, id)
          .query('SELECT id_persona FROM persona WHERE dpi = @dpi AND id_persona != @id');

        if (dpiCheck.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otra persona registrada con ese DPI'
          });
        }
      }

      const request = pool.request().input('id', sql.Int, id);
      const updates = [];

      if (nombres !== undefined) {
        request.input('nombres', sql.VarChar(50), nombres);
        updates.push('nombres = @nombres');
      }
      if (apellidos !== undefined) {
        request.input('apellidos', sql.VarChar(50), apellidos);
        updates.push('apellidos = @apellidos');
      }
      if (email !== undefined) {
        request.input('email', sql.VarChar(100), email);
        updates.push('email = @email');
      }
      if (dpi !== undefined) {
        request.input('dpi', sql.Int, dpi);
        updates.push('dpi = @dpi');
      }
      if (telefono !== undefined) {
        request.input('telefono', sql.Int, telefono);
        updates.push('telefono = @telefono');
      }
      if (id_rol !== undefined) {
        request.input('id_rol', sql.Int, id_rol);
        updates.push('id_rol = @id_rol');
      }
      if (institucion !== undefined) {
        request.input('institucion', sql.VarChar(100), institucion);
        updates.push('institucion = @institucion');
      }
      if (puesto !== undefined) {
        request.input('puesto', sql.VarChar(50), puesto);
        updates.push('puesto = @puesto');
      }

      if (updates.length > 0) {
        await request.query(`
          UPDATE persona 
          SET ${updates.join(', ')}
          WHERE id_persona = @id
        `);
      }

      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            p.*,
            c.name_cooperativa
          FROM persona p
          LEFT JOIN cooperativa c ON p.id_rol = c.id_rol
          WHERE p.id_persona = @id
        `);

      res.json({
        success: true,
        message: 'Persona actualizada exitosamente',
        data: result.recordset[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar persona
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const pool = await getConnection();

      // Verificar que existe
      const checkResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id_persona FROM persona WHERE id_persona = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
        });
      }

      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM persona WHERE id_persona = @id');

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
      const pool = await getConnection();
      const result = await pool.request()
        .input('dpi', sql.Int, dpi)
        .query(`
          SELECT 
            p.*,
            c.name_cooperativa
          FROM persona p
          LEFT JOIN cooperativa c ON p.id_rol = c.id_rol
          WHERE p.dpi = @dpi
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Persona no encontrada'
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

  // Obtener usuarios por roles
  async getByRol(req, res, next) {
    try {
      const { id_rol } = req.params;
      const pool = await getConnection();
      const result = await pool.request()
        .input('id_rol', sql.Int, id_rol)
        .query(`
          SELECT 
            u.*,
            r.rolname
          FROM usuario u
          LEFT JOIN rol c ON u.id_rol = r.id_rol
          WHERE u.id_rol = @id_rol
          ORDER BY c.username
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

module.exports = new UsuarioController();
