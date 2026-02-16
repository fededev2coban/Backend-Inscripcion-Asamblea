Backend actualizado con nueva lógica de registro interno/externo para FEDECOVERA.

## 🎯 Cambios Principales V2 → V3

### **Nueva Estructura:**
- ✅ Persona se registra UNA sola vez por DPI
- ✅ Registro Interno: persona + cooperativa + comisión + puesto
- ✅ Registro Externo: persona + institución + puesto
- ✅ Una persona puede tener múltiples registros internos/externos
- ✅ Validación de duplicados por combinación completa

## 📦 Instalación

```bash
npm install
```

## ⚙️ Configuración

1. Copiar `.env.example` a `.env`
2. Configurar credenciales de SQL Server
3. Asegurarse que la base de datos `Asamblea2` existe

## 🚀 Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📋 Endpoints Nuevos

### **Catálogos**

#### GET /api/catalogos/comisiones
Obtener lista de comisiones (Administración, Vigilancia)

#### GET /api/catalogos/puestos
Obtener lista de puestos (Presidente, Vice, Secretario, Vocal)

### **Registro Público**

#### POST /api/public/registro/:link
Registrar persona a evento (interno o externo)

**Body (Interno):**
```json
{
  "tipo_registro": "interno",
  "nombres": "Juan",
  "apellidos": "García",
  "dpi": 1234567890123,
  "email": "juan@email.com",
  "telefono": "12345678",
  "id_cooperativa": 1,
  "id_comision": 1,
  "id_puesto": 1
}
```

**Body (Externo):**
```json
{
  "tipo_registro": "externo",
  "nombres": "María",
  "apellidos": "Pérez",
  "dpi": 9876543210987,
  "email": "maria@email.com",
  "telefono": "87654321",
  "institucion": "Ministerio de Agricultura",
  "puesto": "Directora"
}
```

### **Inscripciones**

#### GET /api/registros/evento/:id
Obtener todos los inscritos (separados en internos y externos)

#### GET /api/registros/evento/:id/stats
Obtener estadísticas del evento

## 🔄 Lógica de Validación

### **Registro Interno:**
1. Busca persona por DPI (crea si no existe)
2. Valida combinación: persona + cooperativa + comisión + puesto
3. Si existe → ERROR
4. Si no existe → Crea registro_interno y registro_evento

### **Registro Externo:**
1. Busca persona por DPI (crea si no existe)
2. Valida combinación: persona + institución + puesto
3. Si existe → ERROR
4. Si no existe → Crea registro_externo y registro_evento

## 📊 Estructura de Base de Datos

```
persona (id, nombres, apellidos, dpi, email, telefono)
  ├── registro_internos (id, id_persona, id_cooperativa, id_comision, id_puesto)
  └── registro_externo (id, id_persona, institucion, puesto)
       ↓
registro_evento (id, id_evento, id_interno OR id_externo)
```

## 🔐 Autenticación

Todas las rutas de administración requieren JWT token:

```
Authorization: Bearer {token}
```

## 📝 Notas Importantes

- DPI debe ser único en tabla persona
- Una persona puede tener múltiples registros internos con diferentes cooperativas/puestos
- Una persona puede tener múltiples registros externos
- No se permite duplicar la misma combinación exacta

## 🆕 Versión 3.0.0

- Nueva lógica de registros interno/externo
- Catálogos de comisiones y puestos
- Estadísticas mejoradas por comisión y cooperativa
- Validación mejorada de duplicados

---