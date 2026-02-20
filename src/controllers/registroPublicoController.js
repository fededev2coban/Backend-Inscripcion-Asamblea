const { query } = require('../config/database');

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

      // 1. Verificar que el evento existe y está publicado
      const eventoResult = await query(
        `SELECT id_evento, nombre_evento
         FROM evento 
         WHERE link_publico = $1 AND publicado = 1 AND estado_evento = 1`,
        [link]
      );

      if (eventoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado o no disponible para registro'
        });
      }

      const evento = eventoResult.rows[0];

      // 2. Buscar o crear persona por DPI
      let personaResult = await query(
        'SELECT id_persona FROM persona WHERE dpi = $1',
        [dpi]
      );

      let idPersona;
      let nuevoPersona = false;

      if (personaResult.rows.length > 0) {
        // Persona ya existe
        idPersona = personaResult.rows[0].id_persona;
        
        // Actualizar datos de la persona
        await query(
          `UPDATE persona 
           SET nombres = $1,
               apellidos = $2,
               email = $3,
               telefono = $4,
               updatedat = CURRENT_TIMESTAMP
           WHERE id_persona = $5`,
          [nombres, apellidos, email || null, telefono || null, idPersona]
        );
      } else {
        // Crear nueva persona
        nuevoPersona = true;
        const newPersona = await query(
          `INSERT INTO persona (nombres, apellidos, email, dpi, telefono, createdat, updatedat)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id_persona`,
          [nombres, apellidos, email || null, dpi, telefono || null]
        );
        
        idPersona = newPersona.rows[0].id_persona;
      }

      // 3. Procesar según tipo de registro
      let idRegistro;
      let tipoRegistro;

      if (tipo_registro === 'interno') {
        // REGISTRO INTERNO
        
        // Validar que no exista la misma combinación
        const duplicadoInterno = await query(
          `SELECT id_interno 
           FROM registro_internos 
           WHERE id_persona = $1 
             AND id_cooperativa = $2 
             AND id_puesto = $3
             AND id_comision = $4`,
          [idPersona, id_cooperativa, id_puesto, id_comision]
        );

        if (duplicadoInterno.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás registrado con esta cooperativa, comisión y puesto'
          });
        }

        // Crear registro interno
        const nuevoInterno = await query(
          `INSERT INTO registro_internos (id_persona, id_cooperativa, id_puesto, id_comision, createdat, updatedat)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id_interno`,
          [idPersona, id_cooperativa, id_puesto, id_comision]
        );

        idRegistro = nuevoInterno.rows[0].id_interno;
        tipoRegistro = 'interno';

        // Verificar si ya está inscrito al evento con este registro interno
        const yaInscritoInterno = await query(
          `SELECT id_registro_evento 
           FROM registro_evento 
           WHERE id_evento = $1 AND id_interno = $2`,
          [evento.id_evento, idRegistro]
        );

        if (yaInscritoInterno.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás inscrito a este evento con este registro'
          });
        }

        // Crear registro de evento
        await query(
          `INSERT INTO registro_evento (id_evento, id_interno, id_externo, createdat, updatedat)
           VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [evento.id_evento, idRegistro]
        );

      } else if (tipo_registro === 'externo') {
        // REGISTRO EXTERNO
        
        // Validar que no exista la misma combinación
        const duplicadoExterno = await query(
          `SELECT id_externo 
           FROM registro_externo 
           WHERE id_persona = $1 
             AND institucion = $2 
             AND puesto = $3`,
          [idPersona, institucion, puesto]
        );

        if (duplicadoExterno.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás registrado con esta institución y puesto'
          });
        }

        // Crear registro externo
        const nuevoExterno = await query(
          `INSERT INTO registro_externo (id_persona, institucion, puesto, createdat, updatedat)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id_externo`,
          [idPersona, institucion, puesto]
        );

        idRegistro = nuevoExterno.rows[0].id_externo;
        tipoRegistro = 'externo';

        // Verificar si ya está inscrito al evento con este registro externo
        const yaInscritoExterno = await query(
          `SELECT id_registro_evento 
           FROM registro_evento 
           WHERE id_evento = $1 AND id_externo = $2`,
          [evento.id_evento, idRegistro]
        );

        if (yaInscritoExterno.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Ya estás inscrito a este evento con este registro'
          });
        }

        // Crear registro de evento
        await query(
          `INSERT INTO registro_evento (id_evento, id_interno, id_externo, createdat, updatedat)
           VALUES ($1, NULL, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [evento.id_evento, idRegistro]
        );
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
      const result = await query(
        'SELECT id_cooperativa, name_cooperativa FROM cooperativa WHERE estado = 1 ORDER BY name_cooperativa'
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  // Métodos adicionales útiles para el registro público

  // Verificar si una persona ya está registrada en un evento
  async verificarRegistro(req, res, next) {
    try {
      const { link } = req.params;
      const { dpi } = req.query;

      // Obtener evento por link
      const eventoResult = await query(
        'SELECT id_evento FROM evento WHERE link_publico = $1 AND publicado = true',
        [link]
      );

      if (eventoResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Evento no encontrado'
        });
      }

      const idEvento = eventoResult.rows[0].id_evento;

      // Buscar persona por DPI
      const personaResult = await query(
        'SELECT id_persona FROM persona WHERE dpi = $1',
        [dpi]
      );

      if (personaResult.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            registrado: false,
            message: 'Persona no encontrada'
          }
        });
      }

      const idPersona = personaResult.rows[0].id_persona;

      // Verificar si tiene registros en el evento
      const registrosResult = await query(
        `SELECT 
          re.id_registro_evento,
          CASE 
            WHEN re.id_interno IS NOT NULL THEN 'interno'
            ELSE 'externo'
          END as tipo_registro
         FROM registro_evento re
         LEFT JOIN registro_internos ri ON re.id_interno = ri.id_interno
         LEFT JOIN registro_externo rex ON re.id_externo = rex.id_externo
         WHERE re.id_evento = $1 
           AND (ri.id_persona = $2 OR rex.id_persona = $2)`,
        [idEvento, idPersona]
      );

      res.json({
        success: true,
        data: {
          registrado: registrosResult.rows.length > 0,
          cantidad_registros: registrosResult.rows.length,
          registros: registrosResult.rows
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistroPublicoController();