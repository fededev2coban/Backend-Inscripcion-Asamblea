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
      // La persona ya existe, usar su ID --- CASO UPDATE ---
      idPersona = personaExistente.recordset[0].id_persona;
      // Actualizar datos de la persona (por si cambió algo)
      const updateRequest = pool.request()
        .input('id', sql.Int, idPersona)
        .input('nombres', sql.VarChar(50), nombres)
        .input('apellidos', sql.VarChar(50), apellidos)
        .input('email', sql.VarChar(100), email || null)
        .input('telefono', sql.VarChar(20), telefono || null)
        .input('id_cooperativa', sql.Int, id_cooperativa || null)
        .input('institucion', sql.VarChar(100), institucion || null)
        .input('puesto', sql.VarChar(50), puesto);

      await updateRequest.query(`
        UPDATE persona 
        SET nombres = @nombres, 
            apellidos = @apellidos, 
            email = @email, 
            telefono = @telefono, 
            id_cooperativa = @id_cooperativa, 
            institucion = @institucion, 
            puesto = @puesto
        WHERE id_persona = @id
      `);
    } else {
      // --- CASO INSERT ---
      // No incluimos id_persona porque es IDENTITY
      const insertResult = await pool.request()
        .input('nombres', sql.VarChar(50), nombres)
        .input('apellidos', sql.VarChar(50), apellidos)
        .input('email', sql.VarChar(100), email || null)
        .input('dpi', sql.BigInt, dpi)
        .input('telefono', sql.VarChar(20), telefono || null)
        .input('id_cooperativa', sql.Int, id_cooperativa || null)
        .input('institucion', sql.VarChar(100), institucion || null)
        .input('puesto', sql.VarChar(50), puesto)
        .query(`
          INSERT INTO persona (nombres, apellidos, email, dpi, telefono, id_cooperativa, institucion, puesto)
          VALUES (@nombres, @apellidos, @email, @dpi, @telefono, @id_cooperativa, @institucion, @puesto);
          SELECT SCOPE_IDENTITY() AS id;
        `);
      
      idPersona = insertResult.recordset[0].id;
    }

    // 3. Verificar inscripción al evento
    const registroExistente = await pool.request()
      .input('id_evento', sql.Int, evento.id_evento)
      .input('id_persona', sql.Int, idPersona)
      .query('SELECT id_registro_evento FROM registro_evento WHERE id_evento = @id_evento AND id_persona = @id_persona');

    if (registroExistente.recordset.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya estás inscrito a este evento' 
      });
    }

    // 4. Crear inscripción (Asegúrate que id_registro_evento NO sea identity, si lo es, quítalo del insert)
    // const maxRegIdResult = await pool.request()
    //   .query('SELECT ISNULL(MAX(id_registro_evento), 0) + 1 as nextId FROM registro_evento');
    // const nextRegId = maxRegIdResult.recordset[0].nextId;

    await pool.request()
      // .input('id_reg', sql.Int, nextRegId)
      .input('id_ev', sql.Int, evento.id_evento)
      .input('id_per', sql.Int, idPersona)
      .query(`
        INSERT INTO registro_evento ( id_evento, id_persona, createdAt, updatedAt)
        VALUES ( @id_ev, @id_per, GETDATE(), GETDATE())
      `);

    res.status(201).json({
      success: true,
      message: `¡Registro exitoso! Te has inscrito al evento "${evento.nombre_evento}"`,
      data: { 
        evento: evento.nombre_evento, 
        persona: `${nombres} ${apellidos}` },
        nuevo_registro: personaExistente.recordset.length === 0
    });

  } catch (error) {
    console.error(error); // Para que veas el error real en consola
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
