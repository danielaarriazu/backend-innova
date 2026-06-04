# Guía de endpoints para Frontend
## Chatbot InnovaLab — Sprint 2 · Semana 3

**Base URL:** `https://chatbot-innova-backend.onrender.com`  
**Swagger UI (documentación interactiva):** `https://chatbot-innova-backend.onrender.com/api-docs`

---

## Emprendedores de prueba (sin base de datos)

Mientras no esté conectada la base de datos real, el backend responde con datos de prueba para estos tres emprendedores. Usar su `usuarioId` en los endpoints públicos:

| usuarioId | Negocio | Tiene FAQs | Para probar |
|-----------|---------|------------|-------------|
| 1 | Panadería García | Sí — Pedidos, Envíos, Pagos | "hacen envíos?", "cómo pago", "quiero encargar una torta" |
| 2 | Ferretería López | Sí — Garantías, Entregas, Devoluciones | "tienen garantía?", "hacen entregas?", "puedo devolver?" |
| 3 | Ropa & Accesorios Mía | No — sin FAQs | Activa el fallback de keywords genéricas |

---

## Dos tipos de usuarios en la app

| Usuario | Quién es | Necesita token |
|---------|----------|----------------|
| Emprendedor | Dueño del negocio — gestiona su panel | Sí — se loguea con `/api/auth/login` |
| Cliente del negocio | Quien escribe al chatbot — es anónimo | No — usa `?usuarioId=` |

---

## Consideración general — Iniciar la conversación

Lo primero que debe hacer el frontend al cargar el chat es crear una consulta. Esta consulta agrupa toda la conversación.

```
POST https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId={id}
Body: { "canal": "web" }
→ Guardar el consultaId que devuelve — se usa en todo el flujo
```

URLs de prueba:
- Panadería García → `POST https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId=1`
- Ferretería López → `POST https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId=2`
- Ropa & Accesorios Mía → `POST https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId=3`

---

## Auth — Registro y login del emprendedor

### POST `https://chatbot-innova-backend.onrender.com/api/auth/register` — Registrar emprendedor

```json
Body:
{
  "nombre": "María García",
  "email": "maria@negocio.com",
  "password": "MiPassword123",
  "telefono": "+5491112345678"
}
```

| Respuesta | Descripción |
|-----------|-------------|
| 201 | Usuario registrado exitosamente |
| 409 | El email ya está registrado |
| 400 | Campos requeridos faltantes |

---

### POST `https://chatbot-innova-backend.onrender.com/api/auth/login` — Iniciar sesión

```json
Body:
{
  "email": "maria@negocio.com",
  "password": "MiPassword123"
}

Respuesta exitosa:
{
  "token": "eyJ..."
}
```

Usar el token en el header de endpoints privados:
```
Authorization: Bearer eyJ...
```

---

## Catálogo

### GET `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId={id}` — Listar productos

**Botón UI: "Ver catálogo"** — se llama cuando el usuario toca este botón en el chat.  
Devuelve los productos activos para mostrarlos como opciones.

Campos disponibles: `nombre`, `descripcion`, `precio`, `stock`, `imagenUrl`, `activo`

URLs de prueba:
- Panadería García → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=1` → 4 productos (torta, medialunas, pan, facturas)
- Ferretería López → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=2` → 5 productos (pintura, taladro, cinta, tornillos, llave)
- Ropa & Accesorios Mía → `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=3` → 4 productos (remera, vestido, zapatillas, cartera)

| Botón | Acción |
|-------|--------|
| "Producto A", "Producto B"... | ir a GET `https://chatbot-innova-backend.onrender.com/api/catalog/productos/{id}` con el id del producto |
| "Volver al inicio" | solo frontend — no llama al backend |

---

### GET `https://chatbot-innova-backend.onrender.com/api/catalog/productos/{id}` — Detalle de un producto

**Botón UI: nombre del producto** — cuando el usuario selecciona un producto de la lista.  
Devuelve detalle completo: descripción, precio, stock, imagen.

| Botón | Acción |
|-------|--------|
| "Comprar ahora" | pendiente — flujo de presupuesto (sprint futuro) |
| "Ver otros productos" | repetir GET `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId={id}` |
| "Volver al inicio" | solo frontend — no llama al backend |

---

### POST `https://chatbot-innova-backend.onrender.com/api/catalog/productos` — Crear producto (requiere token)

Solo lo usa el emprendedor desde su panel.

```json
Body:
{
  "nombre": "Torta de chocolate",
  "descripcion": "Torta húmeda 1kg",
  "precio": 4500,
  "stock": 5,
  "activo": true
}
```

---

## Chatbot

### POST `https://chatbot-innova-backend.onrender.com/api/chatbot/chat` — Enviar mensaje al bot

Cada mensaje de texto libre que escribe el usuario va a este endpoint.

```json
Body:
{
  "mensaje": "texto que escribió el usuario",
  "sessionId": "{consultaId}",
  "usuarioId": 1
}
```

**Ejemplos por emprendedor:**

```json
Panadería García:
{ "mensaje": "hacen envíos?", "sessionId": "cliente-1", "usuarioId": 1 }
→ responde con FAQ de Envíos

Ferretería López:
{ "mensaje": "tienen garantía?", "sessionId": "cliente-2", "usuarioId": 2 }
→ responde con FAQ de Garantías

Ropa & Accesorios Mía:
{ "mensaje": "hola", "sessionId": "cliente-3", "usuarioId": 3 }
→ fallback de keywords genéricas (sin FAQs)
```

**Respuesta del bot:**

```json
{
  "respuesta": "Sí, hacemos envíos dentro de un radio de 5km...",
  "sessionId": "cliente-1",
  "intencion": "faq:121",
  "fuente": "db"
}
```

| Campo `fuente` | Significado |
|----------------|-------------|
| `"db"` | Respondió con FAQs del emprendedor |
| `"fallback"` | Usó keywords genéricas (sin FAQs o sin DB) |

---

### POST `https://chatbot-innova-backend.onrender.com/api/chatbot/whatsapp-mock` — Simular mensaje de WhatsApp

Simula la llegada de un mensaje como si viniera de WhatsApp Web JS.  
La conexión real se implementa en sprints futuros.

```json
Body:
{
  "from": "5491112345678@c.us",
  "body": "Hola, ¿cuánto cuesta el producto X?",
  "usuarioId": 1
}
```

**Respuesta:**

```json
{
  "mock": true,
  "mensaje_entrante": { "from": "5491112345678@c.us", "body": "..." },
  "respuesta_bot": "¡Hola! Bienvenido a Panadería García...",
  "intencion_detectada": "saludo"
}
```

---

## Consultations

### POST `https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId={id}` — Crear consulta

Lo ejecuta el frontend automáticamente al cargar el chat por primera vez.

```json
Body: { "canal": "web" }

Respuesta:
{ "id": 42, "usuarioId": 1, "canal": "web", "estado": "nueva", ... }
```

Guardar el `id` devuelto como `consultaId` — se usa en todo el flujo.

---

### PATCH `https://chatbot-innova-backend.onrender.com/api/consultations/{id}/derivar` — Derivar a un agente

**Botón UI: "Necesito más ayuda"** — lo ejecuta el bot automáticamente.  
Cambia el estado de la consulta a `"derivada"`.

```json
Body: { "agente": "soporte" }
```

Después de derivar, el bot responde:  
*"Entendimos que necesita más ayuda. Puede dejar sus datos y nos comunicaremos con usted a la brevedad."*

| Botón | Acción |
|-------|--------|
| "Dejar mis datos" | flujo conversacional con POST `/api/chatbot/chat` |
| "Volver al inicio" | solo frontend — no llama al backend |

---

### PATCH `https://chatbot-innova-backend.onrender.com/api/consultations/{id}/cerrar` — Cerrar consulta

Lo ejecuta el bot automáticamente cuando el cliente termina la conversación.

---

### GET `https://chatbot-innova-backend.onrender.com/api/consultations` — Ver consultas (requiere token)

El emprendedor ve todas sus consultas desde el panel. Requiere `Authorization: Bearer {token}`.

---

### GET `https://chatbot-innova-backend.onrender.com/api/consultations/{id}` — Ver una consulta (requiere token)

El emprendedor ve una consulta específica con sus mensajes.

---

## WhatsApp Mock — Integración simulada

Módulo que simula la integración con WhatsApp Web JS para desarrollo.  
No requiere Puppeteer ni conexión real a WhatsApp.

### POST `https://chatbot-innova-backend.onrender.com/api/whatsapp/session/init` — Inicializar sesión

```json
Body: { "sessionId": "emprendedor_1" }

Respuesta:
{ "message": "Sesión emprendedor_1 inicializada", "status": "connected" }
```

---

### GET `https://chatbot-innova-backend.onrender.com/api/whatsapp/session/{sessionId}/status` — Estado de la sesión

```
Respuesta:
{ "sessionId": "emprendedor_1", "status": "connected" }
```

---

### POST `https://chatbot-innova-backend.onrender.com/api/whatsapp/send` — Enviar mensaje simulado

```json
Body:
{
  "to": "5491112345678",
  "body": "Hola, ¿cómo puedo ayudarte?",
  "sessionId": "emprendedor_1"
}

Respuesta:
{ "success": true, "to": "5491112345678", "body": "...", "sentAt": "2026-06-03T..." }
```

---

### POST `https://chatbot-innova-backend.onrender.com/api/whatsapp/receive` — Simular mensaje entrante

```json
Body:
{
  "from": "5491198765432",
  "body": "¿Cuáles son sus precios?"
}

Respuesta:
{ "received": true, "message": { "from": "...", "body": "...", "timestamp": "..." } }
```

---

## Resumen — Tabla de endpoints por botón/acción

| Botón / Acción UI | Método | Endpoint | Token | Quién lo ejecuta |
|-------------------|--------|----------|-------|------------------|
| Cargar el chat | POST | `https://chatbot-innova-backend.onrender.com/api/consultations?usuarioId=` | No | Frontend al iniciar |
| "Ver catálogo" | GET | `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=` | No | Cliente |
| Producto específico | GET | `https://chatbot-innova-backend.onrender.com/api/catalog/productos/:id` | No | Cliente |
| "Ver otros productos" | GET | `https://chatbot-innova-backend.onrender.com/api/catalog/productos?usuarioId=` | No | Cliente |
| Texto libre del usuario | POST | `https://chatbot-innova-backend.onrender.com/api/chatbot/chat` | No | Cliente |
| Mensaje desde WhatsApp | POST | `https://chatbot-innova-backend.onrender.com/api/chatbot/whatsapp-mock` | No | Simulación |
| "Necesito más ayuda" | PATCH | `https://chatbot-innova-backend.onrender.com/api/consultations/:id/derivar` | No | Bot automático |
| "No" al final del flujo | PATCH | `https://chatbot-innova-backend.onrender.com/api/consultations/:id/cerrar` | No | Bot automático |
| Registrarse | POST | `https://chatbot-innova-backend.onrender.com/api/auth/register` | No | Emprendedor |
| Iniciar sesión | POST | `https://chatbot-innova-backend.onrender.com/api/auth/login` | No | Emprendedor |
| Ver consultas (panel) | GET | `https://chatbot-innova-backend.onrender.com/api/consultations` | **Sí** | Emprendedor |
| Ver consulta (panel) | GET | `https://chatbot-innova-backend.onrender.com/api/consultations/:id` | **Sí** | Emprendedor |
| Agregar producto | POST | `https://chatbot-innova-backend.onrender.com/api/catalog/productos` | **Sí** | Emprendedor |
| Init sesión WhatsApp | POST | `https://chatbot-innova-backend.onrender.com/api/whatsapp/session/init` | No | Emprendedor |
| Estado sesión WhatsApp | GET | `https://chatbot-innova-backend.onrender.com/api/whatsapp/session/:id/status` | No | Emprendedor |
| "Comprar ahora" | — | pendiente (sprint futuro) | — | — |
| "Volver al inicio" | — | solo frontend | — | — |

---

## Notas generales

**¿Cómo obtener el token?**
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
→ devuelve: { "token": "eyJ..." }

Usar en el header:
Authorization: Bearer eyJ...
```

**consultaId**
- Se crea al inicio con `POST /api/consultations?usuarioId={id}`
- Guardar en `localStorage` del cliente
- Se usa en todo el flujo: mensajes, leads, cerrar, derivar

**usuarioId**
- Es el ID del emprendedor dueño del chatbot
- Lo pasa el frontend en los endpoints públicos como `?usuarioId=1`
- Sin `usuarioId` el chatbot responde con keywords genéricas (modo demo)

**Campo `_mock: true` en respuestas sin DB**
- Aparece cuando la base de datos no está conectada
- Indica que el dato es simulado — no se guardó en ningún lado

---

*Documento — InnovaLab Sprint 2 Semana 3 · 03/06/2026*
