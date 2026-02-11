# Sistema de Inscripción a Eventos - Backend API

Backend RESTful API desarrollado con Node.js y Express para gestionar inscripciones de personas a eventos.

## 🚀 Características

- ✅ CRUD completo para Cooperativas, Eventos, Personas y Registros
- ✅ Validación de datos con express-validator
- ✅ Conexión a Microsoft SQL Server
- ✅ Variables de entorno para configuración
- ✅ Manejo de errores centralizado
- ✅ Logs con Morgan
- ✅ CORS habilitado

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- Microsoft SQL Server
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio o descargar los archivos

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Editar el archivo `.env` con tus credenciales:
```env
PORT=3000
NODE_ENV=development

DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_SERVER=localhost
DB_DATABASE=InscripcionAsamblea
DB_PORT=1433

DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

5. Ejecutar el script SQL para crear la base de datos

## 🎯 Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📚 Documentación de Endpoints

### Base URL
```
http://localhost:3000/api
```

---

## 🏢 Cooperativas

### Obtener todas las cooperativas
```http
GET /api/cooperativas
```

### Obtener cooperativas activas
```http
GET /api/cooperativas/activas
```

### Obtener cooperativa por ID
```http
GET /api/cooperativas/:id
```

### Crear cooperativa
```http
POST /api/cooperativas
Content-Type: application/json

{
  "name_cooperativa": "Cooperativa Ejemplo",
  "afiliado": 1,
  "estado": 1
}
```

### Actualizar cooperativa
```http
PUT /api/cooperativas/:id
Content-Type: application/json

{
  "name_cooperativa": "Cooperativa Actualizada",
  "estado": 1
}
```

### Eliminar cooperativa
```http
DELETE /api/cooperativas/:id
```

---

## 📅 Eventos

### Obtener todos los eventos
```http
GET /api/eventos
```

### Obtener eventos activos
```http
GET /api/eventos/activos
```

### Obtener eventos próximos
```http
GET /api/eventos/proximos
```

### Obtener evento por ID
```http
GET /api/eventos/:id
```

### Crear evento
```http
POST /api/eventos
Content-Type: application/json

{
  "nombre_evento": "Asamblea General 2026",
  "estado_evento": 1,
  "fecha_evento": "2026-03-15",
  "lugar_evento": "Salón Principal",
  "hora_evento": "09:00:00"
}
```

### Actualizar evento
```http
PUT /api/eventos/:id
Content-Type: application/json

{
  "nombre_evento": "Asamblea General 2026 - Actualizada",
  "fecha_evento": "2026-03-16",
  "hora_evento": "10:00:00"
}
```

### Eliminar evento
```http
DELETE /api/eventos/:id
```

---

## 👤 Personas

### Obtener todas las personas
```http
GET /api/personas
```

### Obtener persona por ID
```http
GET /api/personas/:id
```

### Buscar persona por DPI
```http
GET /api/personas/dpi/:dpi
```

### Obtener personas de una cooperativa
```http
GET /api/personas/cooperativa/:id_cooperativa
```

### Crear persona
```http
POST /api/personas
Content-Type: application/json

{
  "nombres": "Juan Carlos",
  "apellidos": "García López",
  "email": "juan.garcia@email.com",
  "dpi": 1234567890123,
  "telefono": "12345678",
  "id_cooperativa": 1,
  "institucion": "Institución Ejemplo",
  "puesto": "Gerente"
}
```

**Nota**: Si la persona pertenece a una cooperativa, proporcionar `id_cooperativa`. Si no pertenece a ninguna, proporcionar el nombre en `institucion`.

### Actualizar persona
```http
PUT /api/personas/:id
Content-Type: application/json

{
  "email": "nuevo.email@email.com",
  "telefono": 87654321,
  "puesto": "Director"
}
```

### Eliminar persona
```http
DELETE /api/personas/:id
```

---

## 📝 Registros de Eventos (Inscripciones)

### Obtener todos los registros
```http
GET /api/registros
```

### Obtener registro por ID
```http
GET /api/registros/:id
```

### Obtener registros de un evento
```http
GET /api/registros/evento/:id_evento
```

### Obtener estadísticas de un evento
```http
GET /api/registros/evento/:id_evento/stats
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "estadisticas": {
      "total_inscritos": 150,
      "total_cooperativas": 12,
      "inscritos_con_cooperativa": 140,
      "inscritos_sin_cooperativa": 10
    },
    "por_cooperativa": [
      {
        "name_cooperativa": "Cooperativa A",
        "cantidad": 45
      },
      {
        "name_cooperativa": "Cooperativa B",
        "cantidad": 38
      }
    ]
  }
}
```

### Obtener registros de una persona
```http
GET /api/registros/persona/:id_persona
```

### Inscribir persona a evento
```http
POST /api/registros
Content-Type: application/json

{
  "id_evento": 1,
  "id_persona": 1
}
```

### Cancelar inscripción
```http
DELETE /api/registros/:id
```

---

## 🔍 Health Check

```http
GET /api/health
```

Respuesta:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2026-02-11T14:30:00.000Z"
}
```

---

## 📦 Estructura del Proyecto

```
inscripcion-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── cooperativaController.js
│   │   ├── eventoController.js
│   │   ├── personaController.js
│   │   └── registroEventoController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── validators/
│   │       ├── cooperativaValidator.js
│   │       ├── eventoValidator.js
│   │       ├── personaValidator.js
│   │       └── registroEventoValidator.js
│   ├── routes/
│   │   ├── cooperativaRoutes.js
│   │   ├── eventoRoutes.js
│   │   ├── personaRoutes.js
│   │   ├── registroEventoRoutes.js
│   │   └── index.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Validaciones

### Cooperativa
- `name_cooperativa`: Requerido, máximo 50 caracteres
- `afiliado`: Opcional, 0 o 1
- `estado`: Opcional, 0 o 1

### Evento
- `nombre_evento`: Requerido, máximo 100 caracteres
- `estado_evento`: Requerido, 0 o 1
- `fecha_evento`: Requerido, formato YYYY-MM-DD
- `lugar_evento`: Requerido, máximo 100 caracteres
- `hora_evento`: Requerido, formato HH:MM:SS

### Persona
- `nombres`: Requerido, máximo 50 caracteres
- `apellidos`: Requerido, máximo 50 caracteres
- `email`: Opcional, formato de email válido
- `dpi`: Requerido, número entero (único)
- `telefono`: Opcional, número entero
- `id_cooperativa`: Opcional (si pertenece a cooperativa)
- `institucion`: Opcional (si no pertenece a cooperativa)
- `puesto`: Requerido, máximo 50 caracteres

### Registro Evento
- `id_evento`: Requerido, debe existir
- `id_persona`: Requerido, debe existir
- No se permite registrar la misma persona dos veces al mismo evento

---

## 🛠️ Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **mssql**: Driver para SQL Server
- **express-validator**: Validación de datos
- **dotenv**: Gestión de variables de entorno
- **cors**: Habilitar CORS
- **morgan**: Logger HTTP

---

## 📝 Respuestas de la API

### Éxito
```json
{
  "success": true,
  "message": "Mensaje de éxito",
  "data": { /* datos */ }
}
```

### Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "details": "Detalles adicionales (solo en desarrollo)"
}
```

### Error de validación
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Mensaje de error",
      "param": "campo",
      "location": "body"
    }
  ]
}
```

---

## 🤝 Flujo de Inscripción

1. **Verificar/Crear Persona**: 
   - Buscar por DPI: `GET /api/personas/dpi/:dpi`
   - Si no existe, crear: `POST /api/personas`

2. **Seleccionar Evento**: 
   - Listar eventos próximos: `GET /api/eventos/proximos`

3. **Inscribir**: 
   - Crear registro: `POST /api/registros`

4. **Consultar Inscritos**: 
   - Ver inscritos: `GET /api/registros/evento/:id_evento`
   - Ver estadísticas: `GET /api/registros/evento/:id_evento/stats`

---

## 🐛 Solución de Problemas

### Error de conexión a SQL Server
- Verificar credenciales en `.env`
- Verificar que SQL Server esté corriendo
- Verificar configuración de red y firewall

### Puerto en uso
- Cambiar el puerto en `.env`
- Verificar procesos usando el puerto: `netstat -ano | findstr :3000`

### Errores de validación
- Verificar formato de datos según la documentación
- Revisar los logs en consola

---

## 📄 Licencia

ISC

---

## 👥 Autor

Desarrollado para el sistema de inscripción de personas a eventos.
