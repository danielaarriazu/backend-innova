# Chatbot InnovaLab — Backend

Backend del MVP de InnovaLab, una plataforma multi-tenant que le permite a un emprendedor (PyME) configurar un chatbot para su negocio: catálogo de productos, preguntas frecuentes, mensaje de bienvenida y horarios, con derivación a un humano o generación de presupuestos/cotizaciones cuando el bot no puede resolver algo por sí solo.

> El motor del bot (`src/services/chatbot.service.ts`) es una **máquina de estados determinística** basada en acciones/botones fijos y en el contexto guardado por sesión — no usa un LLM ni IA generativa.

## Tecnologías utilizadas

- **Runtime:** Node.js (v20+, desarrollado con v24)
- **Lenguaje:** TypeScript 5 (`strict` mode)
- **Framework Web:** Express 4
- **ORM:** Prisma ORM (v5)
- **Base de Datos:** PostgreSQL (Neon) — con conexión *pooled* (`DATABASE_URL`) para runtime y conexión directa (`DIRECT_URL`) para migraciones
- **Autenticación:** JWT + bcryptjs, con verificación del estado de la cuenta en cada request (no solo la firma del token)
- **Mensajería / Cola:** Upstash Redis (REST API) — cola FIFO para telemetría
- **Almacenamiento de imágenes y PDFs:** Cloudinary
- **Generación de PDFs:** PDFKit (presupuestos/cotizaciones)
- **Validación:** Zod v4
- **Documentación:** Swagger / OpenAPI 3.0 (`/api-docs`)
- **Despliegue:** Render (Infra as Code vía `render.yaml`)

## Prerrequisitos

Antes de comenzar, asegurate de tener lo siguiente:

- [Node.js](https://nodejs.org) v20 o superior
- npm (incluido con Node.js)
- Git
- Una cuenta en [Neon](https://neon.tech) para PostgreSQL en la nube (plan gratuito disponible)
- Una cuenta en [Upstash](https://upstash.com) para Redis REST API (plan gratuito disponible)
- Una cuenta en [Cloudinary](https://cloudinary.com) para almacenamiento de imágenes/PDFs (plan gratuito disponible)
- Un OAuth Client ID de [Google Cloud Console](https://console.cloud.google.com/apis/credentials), si vas a probar el login con Google

## Estructura del proyecto

```text
backend-innova/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   ├── migrations/            # Historial de migraciones SQL
│   └── seed.ts                # Datos iniciales (rubros de negocio)
├── src/
│   ├── app.ts                 # Express app: CORS, rate limiting, montaje de rutas, Swagger
│   ├── server.ts              # Punto de entrada del proceso API
│   ├── worker.ts              # Punto de entrada del proceso worker (Redis → PostgreSQL)
│   ├── controllers/           # Capa HTTP: parsea req/res, delega a services
│   ├── services/              # Capa de negocio: lógica, transacciones, reglas de dominio
│   ├── middlewares/           # Auth, autorización por rol, validación, errores, uploads
│   ├── routes/                # Definición de rutas y middleware stack por endpoint
│   ├── schema/                # Schemas Zod para validación de entradas
│   ├── types/                 # Interfaces TypeScript por dominio
│   ├── data/                  # Catálogos estáticos (ej. FAQs sugeridas)
│   ├── utils/                 # Funciones puras (slugs, normalización de texto)
│   └── lib/                   # Prisma singleton, configuración de CORS
├── tests/                     # Tests (test runner nativo de Node, vía tsx)
├── swagger.yaml               # Especificación OpenAPI 3.0
├── render.yaml                # Configuración de deploy en Render
├── tsconfig.json
└── package.json
```

## Configuración del entorno

1. Cloná el repositorio:
   ```bash
   git clone https://github.com/danielaarriazu/backend-innova.git
   cd backend-innova
   ```

2. Instalá las dependencias:
   ```bash
   npm install
   ```

3. Creá tu archivo `.env` en la raíz (armalo a partir de esta plantilla):
   ```env
   NODE_ENV=development
   PORT=3000

   # Neon → Dashboard del proyecto → Connection Details
   # "Pooled connection" para DATABASE_URL, "Direct connection" para DIRECT_URL
   DATABASE_URL="postgresql://usuario:password@host-pooler.neon.tech/dbname?sslmode=require"
   DIRECT_URL="postgresql://usuario:password@host.neon.tech/dbname?sslmode=require"

   # Generá una clave secreta fuerte. Ejemplo:
   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET="tu_clave_generada_criptograficamente"

   # Upstash Console → tu database → REST API
   UPSTASH_REDIS_REST_URL="https://tu-url-upstash.io"
   UPSTASH_REDIS_REST_TOKEN="tu-token-upstash"

   # Cloudinary Console → Dashboard
   CLOUDINARY_CLOUD_NAME="tu_cloud_name"
   CLOUDINARY_API_KEY="tu_api_key"
   CLOUDINARY_API_SECRET="tu_api_secret"

   # URL(s) del frontend que consumen la API (separadas por coma si son varias)
   FRONTEND_URLS="http://localhost:5173"

   # Solo si vas a probar el login con Google
   GOOGLE_CLIENT_ID="tu_client_id.apps.googleusercontent.com"
   ```

5. Generá el cliente de Prisma y aplicá las migraciones:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
   Esto crea las tablas en tu base de Neon y, si es la primera vez, corre automáticamente el seed (rubros de negocio). Para volver a cargarlo manualmente en cualquier momento:
   ```bash
   npx prisma db seed
   ```

6. Levantá el proyecto. **Necesitás los dos procesos corriendo para que el sistema funcione completo** (el worker es el que efectivamente persiste la telemetría):
   - API (con recarga automática):
     ```bash
     npm run dev
     ```
   - Worker de telemetría, en otra terminal:
     ```bash
     npm run worker
     ```
   - Alternativa, simulando producción — **requiere compilar antes**, porque usa los artefactos de `dist/` en vez de correr desde `src/` con `tsx`:
     ```bash
     npm run build
     npm start
     ```

7. Verificá que todo esté arriba:
   ```bash
   curl http://localhost:3000/health
   ```
   La documentación interactiva de la API queda disponible en `http://localhost:3000/api-docs`.

8. Corré los tests:
   ```bash
   npm test
   ```

## Módulos implementados

### Autenticación y cuenta
- Registro de emprendedor con inicialización automática de su `ConfiguracionBot` (nace inactiva hasta cargar los datos mínimos del negocio).
- Login con JWT (24h) y login con Google (verificación de ID Token).
- Cambio de contraseña y baja lógica de cuenta (soft delete, conserva métricas históricas).

### Configuración del bot (`/api/bot`)
- Lectura/edición de los datos del negocio (nombre, horario, mensajes, colores, logo).
- Activación automática del bot apenas están cargados nombre, teléfono y rubro.
- Slug público autogenerado, personalizable una única vez (`/api/bot/slug`).

### Categorías de FAQ y FAQs (`/api/faq-categories`, `/api/faqs`)
- CRUD completo, con protección de integridad relacional (`onDelete: Restrict`: no se puede borrar una categoría con preguntas asociadas).
- Catálogo de preguntas frecuentes sugeridas para arrancar un bot nuevo con contenido (`/api/faqs/suggestions`).

### Productos (`/api/products`)
- CRUD completo con imagen (Cloudinary), filtros y paginación.
- Marca `requiereCotizacion` por producto: define si el bot puede vender ese ítem con precio automático o si siempre deriva a una cotización manual.

### Motor conversacional (`/api/chatbot/chat`)
- Máquina de estados por sesión (`SesionChat.contexto`): catálogo, FAQs, captura de datos de contacto, armado de carrito y derivación a un humano o a un presupuesto según corresponda.
- Se apaga automáticamente mientras el emprendedor tiene la conversación tomada manualmente.

### Consultas y mensajería (`/api/consultations`, `/api/mensajes`)
- Bandeja de conversaciones del emprendedor, con cambio de estado (`nueva` → `en_proceso` → `resuelta`/`cerrada`) y toma de control manual del chat.
- Historial de mensajes por sesión, accesible tanto por el visitante anónimo como por el emprendedor.

### Presupuestos / cotizaciones (`/api/presupuestos`)
- Generación de PDF formal (PDFKit) y subida a Cloudinary, tanto para presupuestos originados por el bot como cotizados manualmente por el emprendedor.
- Al marcar un presupuesto `CONCRETADO`, cierra automáticamente la consulta asociada y reactiva el bot para esa sesión.

### Endpoints públicos (`/api/public/chatbot/{slug}/...`)
- Sin autenticación — son los que consume directamente el widget embebido en la web del negocio: inicialización, catálogo, FAQs, creación de consultas/mensajes/presupuestos y captura de contacto.

### Telemetría
- `POST /api/telemetry` responde `200` de inmediato y encola el evento en Redis (`lpush`), sin bloquear al usuario.
- `worker.ts` consume la cola cada 10 segundos y persiste los eventos en PostgreSQL (tabla `eventos_telemetry`), reencolando ante cualquier error de inserción.

### Auditoría
- Registro de actividad (`RegistroActividad`) para acciones relevantes (login, cambios de configuración, edición de slug), con IP y dispositivo — de forma *fire-and-forget*, nunca bloquea la operación principal.

---

Documentación adicional: especificación completa de la API en [`swagger.yaml`](./swagger.yaml) / `/api-docs`.