# Backend V3.1 - Sistema con Control de Asistencia y Reportes

Backend completo con control de asistencia, bitácora y generación de reportes Excel/PDF para FEDECOVERA.

## 🎉 Nuevas Funcionalidades V3.1

### ✅ **Control de Asistencia:**
- Estado de asistencia (registrado, asistio, no_asistio)
- Marcación individual y masiva
- Bitácora completa de cambios
- Fecha y usuario que marcó asistencia

### ✅ **Generación de Reportes:**
- Exportar a Excel con logo y formato FEDECOVERA
- Exportar a PDF con tabla de firmas
- Solo incluye participantes que asistieron
- Descarga directa desde el frontend

### ✅ **Sistema de Bitácora:**
- Registro de todos los cambios de estado
- Quién registró, quién marcó asistencia
- Historial completo de acciones

## 📦 Instalación

```bash
npm install
```

**Nuevas dependencias:**
- `exceljs` - Generación de archivos Excel
- `pdfkit` - Generación de archivos PDF

## ⚙️ Actualización de Base de Datos

**Ejecutar en orden:**

1. **BD_Asamblea.sql** (si es instalación nueva)
2. **datos_iniciales.sql** (insertar catálogos)
3. **actualizacion_asistencia.sql** ⭐ **NUEVO**

El script `actualizacion_asistencia.sql` agrega:
- Columnas de asistencia en `registro_evento`
- Tabla `bitacora_asistencia`
- Vista `vw_reporte_asistencia`
- Procedimiento `sp_marcar_asistencia`

## 📋 Nuevos Endpoints

### **Asistencia:**

#### POST /api/asistencia/:id/marcar
Marcar asistencia individual

**Body:**
```json
{
  "estado_asistencia": "asistio", // o "no_asistio"
  "notas": "Llegó tarde" // opcional
}
```

#### POST /api/asistencia/masiva
Marcar asistencia masiva

**Body:**
```json
{
  "registros": [1, 2, 3, 4],
  "estado_asistencia": "asistio"
}
```

#### GET /api/asistencia/evento/:id_evento
Obtener lista de asistencia

**Response:**
```json
{
  "success": true,
  "data": {
    "asistieron": [...],
    "registrados": [...],
    "no_asistieron": [...],
    "estadisticas": {
      "total_registrados": 100,
      "total_asistieron": 85,
      "total_no_asistieron": 5,
      "total_pendientes": 10,
      "porcentaje_asistencia": "85.00"
    }
  }
}
```

### **Reportes:**

#### GET /api/reportes/asistencia/:id_evento/excel
Descargar reporte Excel (solo asistentes)

#### GET /api/reportes/asistencia/:id_evento/pdf
Descargar reporte PDF (solo asistentes)

## 📊 Estructura de Datos

### **registro_evento (ACTUALIZADO):**
```sql
id_registro_evento INT PRIMARY KEY
id_evento INT
id_interno INT NULL
id_externo INT NULL
estado_asistencia VARCHAR(20) DEFAULT 'registrado' -- registrado, asistio, no_asistio
fecha_asistencia DATETIME NULL
id_usuario_registro INT NULL
id_usuario_asistencia INT NULL
notas VARCHAR(500) NULL
createdAt DATETIME
updatedAt DATETIME
```

### **bitacora_asistencia (NUEVA):**
```sql
id_bitacora INT PRIMARY KEY IDENTITY
id_registro_evento INT
accion VARCHAR(50)
estado_anterior VARCHAR(20)
estado_nuevo VARCHAR(20)
id_usuario INT
fecha_accion DATETIME
observaciones VARCHAR(500)
```

## 🔄 Flujo de Control de Asistencia

1. **Admin selecciona evento**
2. **Ve lista de registrados pendientes**
3. **Marca asistencia uno por uno o masivamente**
4. **Sistema registra:**
   - Estado actual
   - Fecha y hora
   - Usuario que marcó
   - Notas (si las hay)
5. **Se genera bitácora automáticamente**
6. **Al finalizar, genera reporte Excel o PDF**

## 📝 Formato de Reportes

### **Excel:**
- Logo FEDECOVERA
- Información del evento
- Tabla con:
  - No.
  - Nombres y Apellidos
  - DPI
  - Cooperativa/Institución
  - Cargo/Puesto
  - Columna para Firma
- Fecha de generación

### **PDF:**
- Mismo formato que Excel
- Optimizado para impresión
- Líneas para firmas
- Paginación automática

## 🆕 Versión 3.1.0

- Control de asistencia completo
- Exportación Excel/PDF
- Sistema de bitácora
- Vista de reportes optimizada
- Procedimientos almacenados

---

Desarrollado para FEDECOVERA
