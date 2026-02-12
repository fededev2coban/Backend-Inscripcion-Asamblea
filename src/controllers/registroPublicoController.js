const { getConnection, sql } = require('../config/database');

class RegistroPublicoController {
  // Registrar persona a evento público (con validación inteligente)
  async registrarEvento(req, res, next) {
    try {
      const { link } = req.params;
      const { 
        nombres, 
        apellidos, 
        email, 
        dpi, 
        telefono, 
        id_cooperativa, 
        institucion, 
        puesto 
      } = req.body;

      const pool = await getConnection();

      // 1. Verificar que el evento existe y está publicado
      const eventoResult = await pool.request()
        .input('link', sql.VarChar(100), link)
        .query(`
          SELECT id_evento, CAST(nombre_evento AS VARCHAR(100)) as nombre_evento
          FROM evento 
          WHERE link_publico = @link AND publicado = 1 AND estado_evento = 1
        `);

      if (eventoResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado o no disponible para registro'
        });
      }

      const evento = eventoResult.recordset[0];

      // 2. Verificar si la persona ya existe por DPI
      const personaExistente = await pool.request()
        .input('dpi', sql.BigInt, dpi)
        .query('SELECT id_persona FROM persona WHERE dpi = @dpi');

      let idPersona;

      if (personaExistente.recordset.length > 0) {
        // La persona ya existe, usar su ID
        idPersona = personaExistente.recordset[0].id_persona;
        
        // Actualizar datos de la persona (por si cambió algo)
        const updateRequest = pool.request()
          .input('id', sql.Int, idPersona)
          .input('nombres', sql.VarChar(50), nombres)
          .input('apellidos', sql.VarChar(50), apellidos)
          .input('puesto', sql.VarChar(50), puesto);

        const updates = [
          'nombres = @nombres',
          'apellidos = @apellidos',
          'puesto = @puesto'
        ];

        if (email) {
          updateRequest.input('email', sql.VarChar(100), email);
          updates.push('email = @email');
        }
        if (telefono) {
          updateRequest.input('telefono', sql.Int, parseInt(telefono));
          updates.push('telefono = @telefono');
        }
        if (id_cooperativa) {
          updateRequest.input('id_cooperativa', sql.Int, parseInt(id_cooperativa));
          updates.push('id_cooperativa = @id_cooperativa');
        }
        if (institucion) {
          updateRequest.input('institucion', sql.VarChar(100), institucion);
          updates.push('institucion = @institucion');
        }

        await updateRequest.query(`
          UPDATE persona 
          SET ${updates.join(', ')}
          WHERE id_persona = @id
        `);

      } else {
        // La persona no existe, crear nuevo registro
        const maxIdResult = await pool.request()
          .query('SELECT ISNULL(MAX(id_persona), 0) + 1 as nextId FROM persona');
        idPersona = maxIdResult.recordset[0].nextId;

        const createRequest = pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('nombres', sql.VarChar(50), nombres)
          .input('apellidos', sql.VarChar(50), apellidos)
          .input('dpi', sql.Int, parseInt(dpi))
          .input('puesto', sql.VarChar(50), puesto);

        if (email) createRequest.input('email', sql.VarChar(100), email);
        if (telefono) createRequest.input('telefono', sql.Int, parseInt(telefono));
        if (id_cooperativa) createRequest.input('id_cooperativa', sql.Int, parseInt(id_cooperativa));
        if (institucion) createRequest.input('institucion', sql.VarChar(100), institucion);

        await createRequest.query(`
          INSERT INTO persona (
            id_persona, nombres, apellidos, email, dpi, telefono, 
            id_cooperativa, institucion, puesto
          )
          VALUES (
            @id_persona, @nombres, @apellidos, @email, @dpi, @telefono,
            @id_cooperativa, @institucion, @puesto
          )
        `);
      }

      // 3. Verificar si ya está inscrito en este evento
      const registroExistente = await pool.request()
        .input('id_evento', sql.Int, evento.id_evento)
        .input('id_persona', sql.Int, idPersona)
        .query(`
          SELECT id_registro_evento 
          FROM registro_evento 
          WHERE id_evento = @id_evento AND id_persona = @id_persona
        `);

      if (registroExistente.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya estás inscrito a este evento'
        });
      }

      // 4. Crear el registro de inscripción
      const maxRegIdResult = await pool.request()
        .query('SELECT ISNULL(MAX(id_registro_evento), 0) + 1 as nextId FROM registro_evento');
      const nextRegId = maxRegIdResult.recordset[0].nextId;

      await pool.request()
        .input('id_registro_evento', sql.Int, nextRegId)
        .input('id_evento', sql.Int, evento.id_evento)
        .input('id_persona', sql.Int, idPersona)
        .query(`
          INSERT INTO registro_evento (id_registro_evento, id_evento, id_persona, createdAt, updatedAt)
          VALUES (@id_registro_evento, @id_evento, @id_persona, GETDATE(), GETDATE())
        `);

      res.status(201).json({
        success: true,
        message: `¡Registro exitoso! Te has inscrito al evento "${evento.nombre_evento}"`,
        data: {
          evento: evento.nombre_evento,
          persona: `${nombres} ${apellidos}`,
          nuevo_registro: personaExistente.recordset.length === 0
        }
      });

    } catch (error) {
      // Error de DPI duplicado (no debería pasar por la validación previa, pero por si acaso)
      if (error.message && error.message.includes('dpi')) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un registro con este DPI'
        });
      }
      next(error);
    }
  }

  // Obtener cooperativas activas para el formulario público
  async getCooperativasActivas(req, res, next) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .query('SELECT id_cooperativa, name_cooperativa FROM cooperativa WHERE estado = 1 ORDER BY name_cooperativa');
      
      res.json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistroPublicoController();
