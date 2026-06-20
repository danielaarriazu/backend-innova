# Chatbot InnovaLab - Backend

Este es el repositorio del backend para el MVP de la plataforma de chatbot y gestión de catálogos orientada a PyMEs. Desarrollado con una arquitectura robusta, escalable y con tipado estricto incluyendo un pipeline de datos analíticos para rastreo de embudos de conversión.
 
## Tecnologías utilizadas

- **Runtime:** Node.js (v24+)
- **Lenguaje:** TypeScript
- **Framework Web:** Express
- **ORM:** Prisma ORM (v5)
- **Base de Datos:** PostgreSQL (Alojada en la nube - Neon)
- **Autenticación:** JSON Web Tokens (JWT) & Bcrypt para encriptación de contraseñas
- **Mensajería / Cola (Message Broker):** Upstash Redis (REST API)
- **Base de Datos Analítica (OLAP):** MotherDuck (DuckDB Node API v1.5.2-r.1)
- **Herramientas de desarrollo:** TSX (TypeScript Execute)
- **Validación:** password-validator
- **Documentación:** Swagger / OpenAPI
- **Despliegue:** Render (CI/CD)

##  Estructura del Proyecto

\`\`\`text
├── prisma/           # Esquemas de base de datos (Nomenclatura estándar camelCase)
├── src/
│   ├── controllers/  # Capa Web: Parsea peticiones HTTP (req/res) y delega al servicio
│   ├── lib/          # Instancias Singleton (ej: prisma.ts para evitar fugas de conexión)
│   ├── middlewares/  # Interceptores: Manejo centralizado de errores, Auth y Rate Limiting
│   ├── routes/       # Definición de endpoints y enrutamiento modular
│   ├── services/     # Capa de Negocio: Reglas puras, transacciones ACID y auditoría
│   ├── types/        # Interfaces y tipos estrictos para TypeScript
│   ├── utils/        # Lógica de soporte 
│   ├── app.ts        # Configuración de Express, CORS y Swagger
│   ├── server.ts     # Punto de entrada de la API (API Server)
│   └── worker.ts     # Proceso en segundo plano para consumo de telemetría (Data Pipeline)
├── .env              # Variables de entorno (Ignorado en Git)
└── package.json      # Dependencias y scripts del proyecto
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
   DATABASE_URL="tu_url_de_neon_aqui"
   JWT_SECRET="tu_clave_generada_criptograficamente"
   UPSTASH_REDIS_REST_URL="https://tu-url-upstash.io"
   UPSTASH_REDIS_REST_TOKEN="tu-token-upstash"
   MOTHERDUCK_TOKEN="tu-token-motherduck"
   \`\`\`
4. Sincroniza las tablas en tu base de datos y genera el cliente de Prisma:
   \`\`\`bash
   npx prisma migrate dev
   \`\`\`
5. Levanta el proyecto. **Debes iniciar ambos procesos para que funcione completo**:
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
