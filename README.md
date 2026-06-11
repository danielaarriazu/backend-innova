# Chatbot de Atención Comercial — InnovaLab

Área Backend de un chatbot para pequeños emprendimientos que permite a los clientes consultar catálogos, resolver dudas frecuentes y ser derivados a atención humana, todo desde una interfaz conversacional.

Proyecto académico desarrollado en **InnovaLab · Sprint 1**.

---

## Demo en vivo

[chatbot-innova-backend.onrender.com/demo](https://chatbot-innova-backend.onrender.com/demo)

El demo incluye:
- Modo **cliente visitante** — interactúa con el chatbot sin autenticación
- Modo **emprendedor** — panel de administración con JWT simulado
- 3 negocios de prueba: Panadería García, Ferretería López, Ropa & Accesorios Mía

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Lenguaje | TypeScript |
| Framework | Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken) |
| Documentación API | Swagger (swagger-jsdoc + swagger-ui-express) |
| Deploy | Render |

---

## Módulos

```
src/
├── modules/
│   ├── auth/           → login, registro, validación JWT
│   ├── catalog/        → productos por emprendedor
│   ├── chatbot/        → procesamiento de mensajes y keywords
│   ├── consultations/  → ciclo de vida de conversaciones
│   └── whatsapp/       → simulación de mensajes entrantes
├── mocks/              → datos de prueba sin base de datos
└── server.ts
```

---

## Endpoints disponibles

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login con email y password, devuelve JWT |
| `POST` | `/api/auth/register` | Registro de nuevo usuario emprendedor |

### Chatbot
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/chatbot/chat` | Envía un mensaje y recibe respuesta del bot |

### Catálogo
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/catalog/productos?usuarioId={id}` | Lista productos de un emprendedor |
| `GET` | `/api/catalog/productos/{id}` | Detalle de un producto |

### Consultas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/consultations?usuarioId={id}` | Crea una consulta y devuelve el mensaje de bienvenida |
| `GET` | `/api/consultations` | Lista consultas del emprendedor autenticado (requiere JWT) |
| `PATCH` | `/api/consultations/{id}/derivar` | Deriva la consulta a atención humana |
| `PATCH` | `/api/consultations/{id}/cerrar` | Cierra la consulta |

### WhatsApp (simulación)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/whatsapp/webhook` | Simula mensaje entrante de WhatsApp |

### Documentación
| Endpoint | Descripción |
|----------|-------------|
| `/api-docs` | Swagger UI con todos los endpoints documentados |

---

## Flujo de una conversación

```
POST /api/consultations?usuarioId=1
  → Crea CONSULTA · devuelve mensajeBienvenida desde ConfiguracionBot

POST /api/chatbot/chat  (por cada mensaje)
  → Guarda MENSAJE del cliente y respuesta del bot

PATCH /api/consultations/{id}/derivar   ← si el cliente pide atención humana
PATCH /api/consultations/{id}/cerrar    ← al terminar la conversación
```

Ver [flujo-completo.md](./flujo-completo.md) para el detalle completo con entidades y endpoints de tracking pendientes.

---

## Cómo correr el proyecto localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# completar DATABASE_URL y JWT_SECRET

# 3. Generar cliente de Prisma
npm run prisma:generate

# 4. Ejecutar migraciones
npm run prisma:migrate

# 5. Iniciar en modo desarrollo
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.  
La documentación Swagger en `http://localhost:3000/api-docs`.

> **Sin base de datos:** el sistema tiene un fallback a datos mock en `src/mocks/mock.data.ts`. El demo en Render funciona con estos datos.

---

## Modelo de datos (DER simplificado)

```
USUARIO (emprendedor)
  ├─ 1:1 → CONFIGURACION_BOT   (bienvenida, horario, tono, menú)
  ├─ 1:N → SESION_USUARIO       (sesiones activas)
  ├─ 1:N → PRODUCTO             (catálogo del negocio)
  ├─ 1:N → CATEGORIA_FAQ
  │           └─ 1:N → FAQ      (preguntas frecuentes)
  └─ 1:N → CONSULTA             (conversaciones)
                ├─ N:1 → ESTADO_CONSULTA
                ├─ 1:N → MENSAJE
                │           └─ 1:N → ADJUNTO
                ├─ 0:1 → LEAD
                ├─ N:M → PRODUCTO   (via CONSULTA_PRODUCTO)
                └─ N:M → FAQ        (via CONSULTA_FAQ)
```

---

## Equipo

Proyecto desarrollado por la alumna Sandra Lopez, área backend, **Grupo 16** en el marco del curso **InnovaLab**.
