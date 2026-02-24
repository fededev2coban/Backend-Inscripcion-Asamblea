const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class UsuarioController {
  // Obtener todos los usuarios
  async getAll(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        ORDER BY u.id_usuario ASC
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

  // Obtener usuario por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
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

  // Crear nuevo usuario
  async create(req, res, next) {
    try {
      const { 
        username,
        password,
        nombre_completo,
        estado,
        id_rol
      } = req.body;
      
      // 1. Verificar si el username ya existe
      const usernameCheck = await query(
        'SELECT id_usuario FROM usuario WHERE username = $1',
        [username]
      );

      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un usuario con ese nombre de usuario'
        });
      }

      // 2. Encriptar password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Insertar usuario
      const insertResult = await query(`
        INSERT INTO usuario (
          username,
          password_hash,
          nombre_completo,
          estado,
          id_rol,
          createdat,
          updatedat
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id_usuario
      `, [
        username,
        passwordHash,
        nombre_completo,
        estado || 1,
        id_rol
      ]);

      const newId = insertResult.rows[0].id_usuario;

      // 4. Devolver los datos completos
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1
      `, [newId]);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: result.rows[0]
      });

    } catch (error) {
      next(error);
    }
  }

  // Actualizar usuario
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        username,
        password,
        nombre_completo,
        estado,
        id_rol
      } = req.body;
      
      // Verificar que existe
      const checkResult = await query(
        'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      // Si se actualiza el username, verificar que no exista en otro usuario
      if (username !== undefined) {
        const usernameCheck = await query(
          'SELECT id_usuario FROM usuario WHERE username = $1 AND id_usuario != $2',
          [username, id]
        );

        if (usernameCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya existe otro usuario con ese nombre de usuario'
          });
        }
      }

      // Construir query dinámica
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (username !== undefined) {
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }
      
      if (password !== undefined && password !== '') {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        updates.push(`password_hash = $${paramCount}`);
        values.push(passwordHash);
        paramCount++;
      }
      
      if (nombre_completo !== undefined) {
        updates.push(`nombre_completo = $${paramCount}`);
        values.push(nombre_completo);
        paramCount++;
      }
      
      if (estado !== undefined) {
        updates.push(`estado = $${paramCount}`);
        values.push(estado);
        paramCount++;
      }
      
      if (id_rol !== undefined) {
        updates.push(`id_rol = $${paramCount}`);
        values.push(id_rol);
        paramCount++;
      }

      // Agregar updatedat
      updates.push(`updatedat = CURRENT_TIMESTAMP`);

      if (updates.length > 0) {
        values.push(id);
        await query(
          `UPDATE usuario 
           SET ${updates.join(', ')}
           WHERE id_usuario = $${paramCount}`,
          values
        );
      }

      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = $1
      `, [id]);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar usuario
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que existe
      const checkResult = await query(
        'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      await query('DELETE FROM usuario WHERE id_usuario = $1', [id]);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  // Buscar usuarios por username
  async searchByUsername(req, res, next) {
    try {
      const { username } = req.params;
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.username ILIKE $1
        ORDER BY u.username
      `, [`%${username}%`]);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuarios por rol
  async getByRol(req, res, next) {
    try {
      const { id_rol } = req.params;
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.estado,
          u.nombre_completo,
          u.id_rol,
          r.rolname,
          u.createdat,
          u.updatedat
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.id_rol = $1
        ORDER BY u.username
      `, [id_rol]);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar estado del usuario (activar/desactivar)
  async toggleEstado(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const result = await query(`
        UPDATE usuario 
        SET estado = $1, updatedat = CURRENT_TIMESTAMP
        WHERE id_usuario = $2
        RETURNING id_usuario, estado
      `, [estado, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        message: `Usuario ${estado === 1 ? 'activado' : 'desactivado'} exitosamente`,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsuarioController();