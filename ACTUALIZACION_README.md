# ACTUALIZACIÓN DEL BACKEND - Sistema de Autenticación y Publicación de Eventos

## 📋 Cambios Implementados

### 1. **Sistema de Autenticación JWT**
- Login de usuarios con JWT
- Rutas protegidas con middleware de autenticación
- Gestión de roles (Administrador y Usuario)

### 2. **Sistema de Publicación de Eventos**
- Generar links públicos únicos para eventos
- Publicar/Despublicar eventos
- Vista pública de eventos para registro

### 3. **Registro Público Inteligente**
- Validación automática de personas existentes por DPI
- Si existe: actualiza datos y registra al evento
- Si no existe: crea persona y registra al evento
- Previene inscripciones duplicadas

## 🔧 Pasos de Actualización

### Paso 1: Actualizar Base de Datos

Ejecuta el script SQL en SQL Server Management Studio:

```bash
database_update.sql
```

Este script agregará:
- Campos `publicado` y `link_publico` a la tabla `evento`
- Campos `password`, `id_rol`, `nombre_completo`, `createdAt` a la tabla `usuario`
- Relación entre `usuario` y `rol`
- Roles por defecto (Administrador y Usuario)
- Usuario administrador por defecto

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`
- **⚠️ IMPORTANTE: Cambiar en producción**

### Paso 2: Instalar Nuevas Dependencias

```bash
cd inscripcion-backend
npm install bcryptjs jsonwebtoken nanoid@3.3.7
```

### Paso 3: Actualizar Variables de Entorno

Edita tu archivo `.env` y agrega:

```env
# JWT Secret para autenticación
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=24h

# URL del frontend (para CORS y links públicos)
FRONTEND_URL=http://localhost:3001
```

### Paso 4: Reemplazar Archivos

**Archivos a REEMPLAZAR:**

1. **src/routes/index.js** → Reemplazar con `src/routes/indexUpdated.js`
2. **src/routes/eventoRoutes.js** → Reemplazar con `src/routes/eventoRoutesUpdated.js`
3. **src/controllers/eventoController.js** → Reemplazar con `src/controllers/eventoControllerUpdated.js`

**Comandos:**
```bash
# Hacer backup de archivos originales
cp src/routes/index.js src/routes/index.js.backup
cp src/routes/eventoRoutes.js src/routes/eventoRoutes.js.backup
cp src/controllers/eventoController.js src/controllers/eventoController.js.backup

# Reemplazar con versiones actualizadas
mv src/routes/indexUpdated.js src/routes/index.js
mv src/routes/eventoRoutesUpdated.js src/routes/eventoRoutes.js
mv src/controllers/eventoControllerUpdated.js src/controllers/eventoController.js
```

### Paso 5: Verificar Estructura de Archivos

Asegúrate de tener estos archivos nuevos:

```
src/
├── controllers/
│   ├── authController.js                  ← NUEVO
│   └── registroPublicoController.js       ← NUEVO
├── middleware/
│   └── auth.js                            ← NUEVO
└── routes/
    ├── authRoutes.js                      ← NUEVO
    └── publicRoutes.js                    ← NUEVO
```

### Paso 6: Reiniciar el Servidor

```bash
npm run dev
```

## 📚 Nuevos Endpoints

### **Autenticación**

#### POST /api/auth/login
Iniciar sesión
```json
{
  "username": "admin",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "nombre_completo": "Administrador del Sistema",
      "rol": "Administrador"
    }
  }
}
```

#### GET /api/auth/verify
Verificar token (requiere token en header)
```
Authorization: Bearer {token}
```

#### POST /api/auth/change-password
Cambiar contraseña (requiere token)
```json
{
  "currentPassword": "admin123",
  "newPassword": "nuevaContraseña123"
}
```

### **Publicación de Eventos**

#### POST /api/eventos/:id/publicar
Publicar evento y generar link público (requiere autenticación)

Respuesta:
```json
{
  "success": true,
  "message": "Evento publicado exitosamente",
  "data": {
    "publicado": true,
    "link_publico": "abc123xyz45",
    "url_completa": "http://localhost:3001/registro/abc123xyz45"
  }
}
```

#### POST /api/eventos/:id/despublicar
Despublicar evento (requiere autenticación)

### **Registro Público**

#### GET /api/public/evento/:link
Obtener información del evento por link público (NO requiere autenticación)

```bash
GET /api/public/evento/abc123xyz45
```

#### GET /api/public/cooperativas
Obtener cooperativas activas para el formulario público (NO requiere autenticación)

#### POST /api/public/registro/:link
Registrar persona a evento (NO requiere autenticación)

```json
{
  "nombres": "Juan Carlos",
  "apellidos": "García López",
  "email": "juan.garcia@email.com",
  "dpi": 1234567890123,
  "telefono": 12345678,
  "id_cooperativa": 1,
  "institucion": "",
  "puesto": "Gerente"
}
```

**Lógica Inteligente:**
- Si el DPI ya existe → Actualiza datos de la persona e inscribe al evento
- Si el DPI no existe → Crea la persona e inscribe al evento
- Si ya está inscrito → Devuelve error

## 🔐 Autenticación en Rutas

### Rutas Públicas (Sin autenticación):
- `POST /api/auth/login`
- `GET /api/public/evento/:link`
- `GET /api/public/cooperativas`
- `POST /api/public/registro/:link`
- `GET /api/health`

### Rutas Protegidas (Requieren autenticación):
- Todas las rutas de `/api/cooperativas`
- Todas las rutas de `/api/eventos` (excepto públicas)
- Todas las rutas de `/api/personas`
- Todas las rutas de `/api/registros`

### Cómo usar autenticación en peticiones:

```javascript
// Ejemplo con axios
const token = localStorage.getItem('token');

axios.get('http://localhost:3000/api/eventos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

```bash
# Ejemplo con curl
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/eventos
```

## 🧪 Pruebas

### 1. Probar Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Probar Publicación de Evento
```bash
# Primero crear un evento (requiere token)
curl -X POST http://localhost:3000/api/eventos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre_evento": "Evento de Prueba",
    "estado_evento": 1,
    "fecha_evento": "2026-03-15",
    "lugar_evento": "Salón Principal",
    "hora_evento": "09:00:00"
  }'

# Luego publicar (reemplazar {id} con el ID del evento)
curl -X POST http://localhost:3000/api/eventos/{id}/publicar \
  -H "Authorization: Bearer {token}"
```

### 3. Probar Registro Público
```bash
# Usar el link_publico obtenido en el paso anterior
curl -X POST http://localhost:3000/api/public/registro/{link_publico} \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "María",
    "apellidos": "González",
    "email": "maria@email.com",
    "dpi": 9876543210987,
    "telefono": 55555555,
    "id_cooperativa": 1,
    "puesto": "Secretaria"
  }'
```

## 🔄 Flujo Completo

1. **Administrador hace login** → Recibe token JWT
2. **Administrador crea evento** (usando token)
3. **Administrador publica evento** → Recibe link público único
4. **Administrador comparte link** con participantes
5. **Participantes acceden al link público** → Ven formulario de registro
6. **Participantes llenan formulario** → Sistema valida si existen por DPI
7. **Sistema registra automáticamente** → Si existe: actualiza y registra. Si no existe: crea y registra
8. **Administrador ve inscripciones** en el dashboard (usando token)

## ⚠️ Consideraciones de Seguridad

1. **Cambiar usuario/contraseña por defecto** inmediatamente en producción
2. **Usar HTTPS** en producción
3. **Generar JWT_SECRET aleatorio** y seguro
4. **No compartir tokens** en logs o repositorios
5. **Configurar CORS** apropiadamente para producción

## 📝 Próximos Pasos

Ahora que el backend está actualizado, el siguiente paso es actualizar el frontend para:

1. Implementar login y gestión de sesión
2. Proteger rutas del dashboard
3. Crear vista pública de registro
4. Agregar botón "Publicar Evento" en la gestión de eventos
5. Mostrar y copiar links públicos

¿Listo para actualizar el frontend?
