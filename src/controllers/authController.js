const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Buscar usuario (ADAPTADO A TU SCHEMA)
      const result = await query(`
        SELECT 
          u.id_usuario,
          u.username,
          u.password,
          u.nombre_completo,
          u.id_rol,
          u.estado,
          r.rolname
        FROM usuario u
        LEFT JOIN rol r ON u.id_rol = r.id_rol
        WHERE u.username = $1
      `, [username]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Usuario o contraseña incorrectos'
        });
      }

      const user = result.rows[0];

      if (user.estado !== 1) {
        return res.status(401).json({
          success: false,
          error: 'Usuario inactivo'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Usuario o contraseña incorrectos'
        });
      }

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

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const userResult = await query(
        'SELECT password FROM usuario WHERE id_usuario = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const user = userResult.rows[0];

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Contraseña actual incorrecta'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE usuario SET password = $1, updatedat = CURRENT_TIMESTAMP WHERE id_usuario = $2',
        [hashedPassword, userId]
      );

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
