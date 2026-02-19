const { getConnection, sql } = require('../config/database');

class RegistroPublicoController {
  // Registrar persona a evento (interno o externo)
  async registrarEvento(req, res, next) {
    try {
      const { link } = req.params;
      const { 
        tipo_registro, // 'interno' o 'externo'
        nombres, 
        apellidos, 
        email, 
        dpi, 
        telefono,
        // Para registro interno:
        id_cooperativa,
        id_comision,
        id_puesto,
        // Para registro externo:
        institucion,
        puesto
      } = req.body;

      const pool = await getConnection();

      // 1. Verificar que el evento existe y está publicado
      const eventoResult = await pool.request()
        .input('link', sql.VarChar(100), link)
        .query(`
          SELECT id_evento, nombre_evento
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

      // 2. Buscar o crear persona por DPI
      let personaResult = await pool.request()
        .input('dpi', sql.BigInt, dpi)
        .query('SELECT id_persona FROM persona WHERE dpi = @dpi');

      let idPersona;
      let nuevoPersona = false;

      if (personaResult.recordset.length > 0) {
        // Persona ya existe
        idPersona = personaResult.recordset[0].id_persona;
        
        // Actualizar datos de la persona
        await pool.request()
          .input('id', sql.Int, idPersona)
          .input('nombres', sql.VarChar(50), nombres)
          .input('apellidos', sql.VarChar(50), apellidos)
          .input('email', sql.VarChar(100), email || null)
          .input('telefono', sql.VarChar(20), telefono || null)
          .query(`
            UPDATE persona 
            SET nombres = @nombres,
                apellidos = @apellidos,
                email = @email,
                telefono = @telefono,
                updatedAt = GETDATE()
            WHERE id_persona = @id
          `);
      } else {
        // Crear nueva persona
        nuevoPersona = true;
        await pool.request()
          .input('nombres', sql.VarChar(50), nombres)
          .input('apellidos', sql.VarChar(50), apellidos)
          .input('email', sql.VarChar(100), email || null)
          .input('dpi', sql.BigInt, dpi)
          .input('telefono', sql.VarChar(20), telefono || null)
          .query(`
            INSERT INTO persona (nombres, apellidos, email, dpi, telefono, createdAt, updatedAt)
            VALUES (@nombres, @apellidos, @email, @dpi, @telefono, GETDATE(), GETDATE())
          `);

        // Obtener el ID de la persona recién creada
        personaResult = await pool.request()
          .input('dpi', sql.BigInt, dpi)
          .query('SELECT id_persona FROM persona WHERE dpi = @dpi');
        
        idPersona = personaResult.recordset[0].id_persona;
      }

      // 3. Procesar según tipo de registro
      let idRegistro;
      let tipoRegistro;

      if (tipo_registro === 'interno') {
        // REGISTRO INTERNO
        
        // Validar que no exista la misma combinación
        const duplicadoInterno = await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('id_cooperativa', sql.Int, id_cooperativa)
          .input('id_puesto', sql.Int, id_puesto)
          .input('id_comision', sql.Int, id_comision)
          .query(`
            SELECT id_interno 
            FROM registro_internos 
            WHERE id_persona = @id_persona 
              AND id_cooperativa = @id_cooperativa 
              AND id_puesto = @id_puesto
              AND id_comision = @id_comision
          `);

        if (duplicadoInterno.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás registrado con esta cooperativa, comisión y puesto'
          });
        }

        // Crear registro interno
        await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('id_cooperativa', sql.Int, id_cooperativa)
          .input('id_puesto', sql.Int, id_puesto)
          .input('id_comision', sql.Int, id_comision)
          .query(`
            INSERT INTO registro_internos (id_persona, id_cooperativa, id_puesto, id_comision, createdAt, updatedAt)
            VALUES (@id_persona, @id_cooperativa, @id_puesto, @id_comision, GETDATE(), GETDATE())
          `);

        // Obtener el ID del registro interno recién creado
        const internoResult = await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('id_cooperativa', sql.Int, id_cooperativa)
          .input('id_puesto', sql.Int, id_puesto)
          .input('id_comision', sql.Int, id_comision)
          .query(`
            SELECT TOP 1 id_interno 
            FROM registro_internos 
            WHERE id_persona = @id_persona 
              AND id_cooperativa = @id_cooperativa 
              AND id_puesto = @id_puesto
              AND id_comision = @id_comision
            ORDER BY createdAt DESC
          `);

        idRegistro = internoResult.recordset[0].id_interno;
        tipoRegistro = 'interno';

        // Verificar si ya está inscrito al evento con este registro interno
        const yaInscritoInterno = await pool.request()
          .input('id_evento', sql.Int, evento.id_evento)
          .input('id_interno', sql.Int, idRegistro)
          .query(`
            SELECT id_registro_evento 
            FROM registro_evento 
            WHERE id_evento = @id_evento AND id_interno = @id_interno
          `);

        if (yaInscritoInterno.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás inscrito a este evento con este registro'
          });
        }

        // Crear registro de evento
        await pool.request()
          .input('id_evento', sql.Int, evento.id_evento)
          .input('id_interno', sql.Int, idRegistro)
          .query(`
            INSERT INTO registro_evento (id_evento, id_interno, id_externo, createdAt, updatedAt)
            VALUES (@id_evento, @id_interno, NULL, GETDATE(), GETDATE())
          `);

      } else if (tipo_registro === 'externo') {
        // REGISTRO EXTERNO
        
        // Validar que no exista la misma combinación
        const duplicadoExterno = await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('institucion', sql.VarChar(50), institucion)
          .input('puesto', sql.VarChar(50), puesto)
          .query(`
            SELECT id_externo 
            FROM registro_externo 
            WHERE id_persona = @id_persona 
              AND institucion = @institucion 
              AND puesto = @puesto
          `);

        if (duplicadoExterno.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás registrado con esta institución y puesto'
          });
        }

        // Crear registro externo
        await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('institucion', sql.VarChar(50), institucion)
          .input('puesto', sql.VarChar(50), puesto)
          .query(`
            INSERT INTO registro_externo (id_persona, institucion, puesto, createdAt, updatedAt)
            VALUES (@id_persona, @institucion, @puesto, GETDATE(), GETDATE())
          `);

        // Obtener el ID del registro externo recién creado
        const externoResult = await pool.request()
          .input('id_persona', sql.Int, idPersona)
          .input('institucion', sql.VarChar(50), institucion)
          .input('puesto', sql.VarChar(50), puesto)
          .query(`
            SELECT TOP 1 id_externo 
            FROM registro_externo 
            WHERE id_persona = @id_persona 
              AND institucion = @institucion 
              AND puesto = @puesto
            ORDER BY createdAt DESC
          `);

        idRegistro = externoResult.recordset[0].id_externo;
        tipoRegistro = 'externo';

        // Verificar si ya está inscrito al evento con este registro externo
        const yaInscritoExterno = await pool.request()
          .input('id_evento', sql.Int, evento.id_evento)
          .input('id_externo', sql.Int, idRegistro)
          .query(`
            SELECT id_registro_evento 
            FROM registro_evento 
            WHERE id_evento = @id_evento AND id_externo = @id_externo
          `);

        if (yaInscritoExterno.recordset.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás inscrito a este evento con este registro'
          });
        }

        // Crear registro de evento
        await pool.request()
          .input('id_evento', sql.Int, evento.id_evento)
          .input('id_externo', sql.Int, idRegistro)
          .query(`
            INSERT INTO registro_evento (id_evento, id_interno, id_externo, createdAt, updatedAt)
            VALUES (@id_evento, NULL, @id_externo, GETDATE(), GETDATE())
          `);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Tipo de registro inválido. Debe ser "interno" o "externo"'
        });
      }

      res.status(201).json({
        success: true,
        message: `¡Registro exitoso! Te has inscrito al evento "${evento.nombre_evento}"`,
        data: {
          nuevo_persona: nuevoPersona,
          tipo: tipoRegistro,
          evento: evento.nombre_evento
        }
      });

    } catch (error) {
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
