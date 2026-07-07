# Chatbot InnovaLab - Backend

Backend del MVP de la plataforma de chatbot para PyMEs. Permite a emprendedores configurar un asistente virtual con catálogo de productos, preguntas frecuentes y analítica de comportamiento de usuarios.
 
## Tecnologías utilizadas

- **Runtime:** Node.js (v24+)
- **Lenguaje:** TypeScript 5
- **Framework Web:** Express 4
- **ORM:** Prisma ORM (v5)
- **Base de Datos:** PostgreSQL (Neon)
- **Autenticación:** JWT & Bcrypts 
- **Mensajería / Cola (Message Broker):** Upstash Redis (REST API)
- **Base de Datos Analítica (OLAP):** MotherDuck (DuckDB Node API v1.5.2-r.1)
- **Almacenamiento de imágenes:** Cloudinary
- **Validación:** Zod v4
- **Documentación:** Swagger / OpenAPI
- **Despliegue:** Render (CI/CD)

Prerequisitos
Antes de comenzar, asegurate de tener lo siguiente:

Node.js v24 o superior — Descargar
npm (incluido con Node.js)
Git
Una cuenta en Neon para PostgreSQL en la nube (plan gratuito disponible)
Una cuenta en Upstash para Redis REST API (plan gratuito disponible)
Una cuenta en MotherDuck para DuckDB en la nube (plan gratuito disponible)
Una cuenta en Cloudinary para almacenamiento de imágenes (plan gratuito disponible)

##  Estructura del Proyecto

\`\`\`text
backend-innova/
├── prisma/
│   ├── schema.prisma          # Modelos de base de datos
│   ├── migrations/            # Historial de migraciones SQL
│   └── seed.ts                # Datos iniciales (rubros)
├── src/
│   ├── app.ts                 # Express app: middlewares, rutas, CORS, rate limiting
│   ├── server.ts              # Punto de entrada del API server
│   ├── worker.ts              # Pipeline de telemetría (Redis → MotherDuck)
│   ├── controllers/           # Capa HTTP: parsea req/res, delega a services
│   ├── services/              # Capa de negocio: lógica, transacciones, validaciones de dominio
│   ├── middlewares/           # Auth, autorización, validación, errores, uploads
│   ├── routes/                # Definición de rutas y middleware stack por endpoint
│   ├── schema/                # Schemas Zod para validación de entradas
│   ├── types/                 # Interfaces TypeScript por dominio
│   └── lib/
│       └── prisma.ts          # Singleton de PrismaClient
├── swagger.yaml               # Especificación OpenAPI 3.0
├── render.yaml                # Configuración de deploy en Render
├── tsconfig.json              # Configuración del compilador TypeScript
└── package.json
\`\`\`

## Configuracion del entorno

Clona el repositorio.

1. Clona el repositorio.
2. Instala las dependencias del proyecto:
   \`\`\`bash
   npm install
   \`\`\`
3. Crea tu archivo `.env` en la raíz con tus credenciales de PostgreSQL y tu clave maestra para JWT:
   \`\`\`env
   NODE_ENV=development
   PORT=3000
   # Copiá la connection string desde el panel de Neon
   DATABASE_URL="tu_url_de_neon_aqui"
   # Generá una clave secreta fuerte. Ejemplo:
   # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET="tu_clave_generada_criptograficamente"
   # Obtenelos desde: Upstash Console → Tu database → REST API
   UPSTASH_REDIS_REST_URL="https://tu-url-upstash.io"
   UPSTASH_REDIS_REST_TOKEN="tu-token-upstash"
   # Obtenelo desde: app.motherduck.com → Settings → Access Tokens
   MOTHERDUCK_TOKEN="tu-token-motherduck"
   # Obtenelos desde: Cloudinary Console → Dashboard
   CLOUDINARY_CLOUD_NAME="tu_cloud_name"
   CLOUDINARY_API_KEY="tu_api_key"
   CLOUDINARY_API_SECRET="tu_api_secret"
   # URL exacta del frontend que va a consumir la API
   FRONTEND_URL="http://localhost:5173"
   \`\`\`
4. Sincroniza las tablas en tu base de datos y genera el cliente de Prisma:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`
5. Crear las tablas en la base de datos
   - Aplica todas las migraciones SQL pendientes a tu base de datos PostgreSQL:
     npx prisma migrate dev
6. Cargar datos iniciales (seed)
   - Precarga los rubros de negocio disponibles para la configuración del bot
     npm run seed
7. Levanta el proyecto. **Debes iniciar ambos procesos para que funcione completo**:
   - Para levantar solo la API:
     \`\`\`bash
     npm run dev
     \`\`\`
   - Para levantar el Worker de Analítica (abre otra terminal):
     \`\`\`bash
     npm run worker
     \`\`\`
   - Para levantar **ambos a la vez** (Simulación de producción con concurrently):
     \`\`\`bash
     npm start
     \`\`\`


## Módulos Implementados
### Autenticación y Gestión de Usuario
* Registro de emprendedor e inicialización automática de la configuración de su bot.
* Login seguro con generación de JWT válido por 24 horas.
* Modificación de contraseña con validaciones estrictas (longitud, mayúsculas, números y símbolos).
* Baja lógica de cuenta (Soft Delete) conservando métricas históricas.

### Registro de movimientios
* Registro integral de actividades en la base de datos para cada acción realizada en la API.
* Captura automática de tipo de movimiento, IP de origen y dispositivo (User-Agent).

### Configuración del Bot
   **Configuracion bot (`/api/bot`):**
    **GET:** Recupera la configuración actual.
    **PUT:** Actualiza los parámetros de comportamiento.

### FAQs y Categorías
* **Categorías FAQ (`/api/faq-categories`):**
  * **GET / POST / PUT / DELETE:** CRUD completo. Incluye protección de integridad relacional (`onDelete: Restrict`), impidiendo borrar una categoría si esta posee preguntas asociadas.
* **Preguntas Frecuentes - FAQs (`/api/faqs`):**
  * **GET / POST / PUT / DELETE:** Gestión integral permitiendo reasignación de categorías mediante Joins relacionales.

### Productos (`/api/products`):**
    * **GET / POST / PUT / DELETE:** Administración completa del inventario para que el bot pueda responder sobre él.

### Telemetría y Analítica (NUEVO)
* **Pipeline Asíncrono:** Captura eventos del frontend (clics, page views, embudo) sin bloquear la API principal, utilizando **Redis** como cola de mensajes.
* **Consumidor en Segundo Plano:** El `worker.ts` procesa los lotes y los inserta de forma segura en **MotherDuck**.
* **Unificación de Identidad:** Capacidad de rastrear a un usuario desde su visita anónima hasta su conversión, interceptando el JWT (Middleware opcional).
