const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  // Login de usuario
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const pool = await getConnection();

      // Buscar usuario
      const result = await pool.request()
        .input('username', sql.VarChar(50), username)
        .query(`
          SELECT 
            u.id_usuario,
            u.username,
            u.password,
            u.nombre_completo,
            u.id_rol,
            u.estado,
            CAST(r.rolname AS VARCHAR(50)) as rolname
          FROM usuario u
          LEFT JOIN rol r ON u.id_rol = r.id_rol
          WHERE u.username = @username
        `);

      if (result.recordset.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Usuario o contraseña incorrectos'
        });
      }

      const user = result.recordset[0];

      // Verificar estado del usuario
      if (user.estado !== 1) {
        return res.status(401).json({
          success: false,
          error: 'Usuario inactivo'
        });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Usuario o contraseña incorrectos'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id_usuario,
          username: user.username,
          rol: user.rolname
        },
        process.env.JWT_SECRET || 'secret_key_default',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id_usuario,
            username: user.username,
            nombre_completo: user.nombre_completo,
            rol: user.rolname
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar token
  async verifyToken(req, res, next) {
    try {
      const user = req.user;
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            rol: user.rol
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cambiar contraseña
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const pool = await getConnection();

      // Obtener usuario
      const userResult = await pool.request()
        .input('id', sql.Int, userId)
        .query('SELECT password FROM usuario WHERE id_usuario = @id');

      if (userResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const user = userResult.recordset[0];

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña actual incorrecta'
        });
      }

      // Hash nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await pool.request()
        .input('id', sql.Int, userId)
        .input('password', sql.VarChar(255), hashedPassword)
        .query('UPDATE usuario SET password = @password WHERE id_usuario = @id');

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
