# Ejemplos de Peticiones cURL

## Cooperativas

### Listar todas las cooperativas
```bash
curl -X GET http://localhost:3000/api/cooperativas
```

### Crear cooperativa
```bash
curl -X POST http://localhost:3000/api/cooperativas \
  -H "Content-Type: application/json" \
  -d '{
    "name_cooperativa": "Cooperativa San Marcos",
    "afiliado": 1,
    "estado": 1
  }'
```

### Actualizar cooperativa
```bash
curl -X PUT http://localhost:3000/api/cooperativas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name_cooperativa": "Cooperativa San Marcos Actualizada",
    "estado": 1
  }'
```

### Obtener cooperativa por ID
```bash
curl -X GET http://localhost:3000/api/cooperativas/1
```

### Eliminar cooperativa
```bash
curl -X DELETE http://localhost:3000/api/cooperativas/1
```

---

## Eventos

### Listar todos los eventos
```bash
curl -X GET http://localhost:3000/api/eventos
```

### Listar eventos próximos
```bash
curl -X GET http://localhost:3000/api/eventos/proximos
```

### Crear evento
```bash
curl -X POST http://localhost:3000/api/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_evento": "Asamblea General 2026",
    "estado_evento": 1,
    "fecha_evento": "2026-03-15",
    "lugar_evento": "Salón Principal - Centro de Convenciones",
    "hora_evento": "09:00:00"
  }'
```

### Actualizar evento
```bash
curl -X PUT http://localhost:3000/api/eventos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_evento": "2026-03-16",
    "hora_evento": "10:00:00"
  }'
```

### Obtener evento por ID
```bash
curl -X GET http://localhost:3000/api/eventos/1
```

### Eliminar evento
```bash
curl -X DELETE http://localhost:3000/api/eventos/1
```

---

## Personas

### Listar todas las personas
```bash
curl -X GET http://localhost:3000/api/personas
```

### Crear persona con cooperativa
```bash
curl -X POST http://localhost:3000/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "María Elena",
    "apellidos": "Rodríguez Pérez",
    "email": "maria.rodriguez@email.com",
    "dpi": 2987654321098,
    "telefono": 55443322,
    "id_cooperativa": 1,
    "puesto": "Gerente General"
  }'
```

### Crear persona sin cooperativa (con institución)
```bash
curl -X POST http://localhost:3000/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Carlos Alberto",
    "apellidos": "Martínez López",
    "email": "carlos.martinez@email.com",
    "dpi": 1234567890123,
    "telefono": 12345678,
    "institucion": "Ministerio de Agricultura",
    "puesto": "Director de Proyectos"
  }'
```

### Buscar persona por DPI
```bash
curl -X GET http://localhost:3000/api/personas/dpi/2987654321098
```

### Obtener personas de una cooperativa
```bash
curl -X GET http://localhost:3000/api/personas/cooperativa/1
```

### Actualizar persona
```bash
curl -X PUT http://localhost:3000/api/personas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.email@email.com",
    "telefono": 87654321,
    "puesto": "Directora Ejecutiva"
  }'
```

### Obtener persona por ID
```bash
curl -X GET http://localhost:3000/api/personas/1
```

### Eliminar persona
```bash
curl -X DELETE http://localhost:3000/api/personas/1
```

---

## Registros de Eventos (Inscripciones)

### Listar todos los registros
```bash
curl -X GET http://localhost:3000/api/registros
```

### Inscribir persona a evento
```bash
curl -X POST http://localhost:3000/api/registros \
  -H "Content-Type: application/json" \
  -d '{
    "id_evento": 1,
    "id_persona": 1
  }'
```

### Obtener registros de un evento
```bash
curl -X GET http://localhost:3000/api/registros/evento/1
```

### Obtener estadísticas de un evento
```bash
curl -X GET http://localhost:3000/api/registros/evento/1/stats
```

### Obtener registros de una persona
```bash
curl -X GET http://localhost:3000/api/registros/persona/1
```

### Cancelar inscripción
```bash
curl -X DELETE http://localhost:3000/api/registros/1
```

### Obtener registro por ID
```bash
curl -X GET http://localhost:3000/api/registros/1
```

---

## Health Check

```bash
curl -X GET http://localhost:3000/api/health
```

---

## Flujo Completo de Inscripción

### 1. Crear una cooperativa
```bash
curl -X POST http://localhost:3000/api/cooperativas \
  -H "Content-Type: application/json" \
  -d '{
    "name_cooperativa": "Cooperativa Ejemplo",
    "afiliado": 1,
    "estado": 1
  }'
```

### 2. Crear un evento
```bash
curl -X POST http://localhost:3000/api/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_evento": "Asamblea Anual 2026",
    "estado_evento": 1,
    "fecha_evento": "2026-04-20",
    "lugar_evento": "Auditorio Central",
    "hora_evento": "14:00:00"
  }'
```

### 3. Registrar una persona
```bash
curl -X POST http://localhost:3000/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Ana Patricia",
    "apellidos": "Gómez Hernández",
    "email": "ana.gomez@email.com",
    "dpi": 3456789012345,
    "telefono": 98765432,
    "id_cooperativa": 1,
    "puesto": "Tesorera"
  }'
```

### 4. Inscribir persona al evento
```bash
curl -X POST http://localhost:3000/api/registros \
  -H "Content-Type: application/json" \
  -d '{
    "id_evento": 1,
    "id_persona": 1
  }'
```

### 5. Verificar inscripción
```bash
curl -X GET http://localhost:3000/api/registros/evento/1
```

### 6. Ver estadísticas del evento
```bash
curl -X GET http://localhost:3000/api/registros/evento/1/stats
```
