# Chatbot InnovaLab - Backend

Este es el repositorio del backend para el MVP de la plataforma de chatbot y gestión de catálogos orientada a PyMEs. Desarrollado con una arquitectura robusta, escalable y con tipado estricto.

## Tecnologías utilizadas

- **Runtime:** Node.js (v24+)
- **Lenguaje:** TypeScript
- **Framework Web:** Express
- **ORM:** Prisma ORM (v5)
- **Base de Datos:** PostgreSQL (Alojada en la nube - Neon)
- **Autenticación:** JSON Web Tokens (JWT) & Bcrypt para encriptación de contraseñas
- **Herramientas de desarrollo:** TSX (TypeScript Execute)
* **Validación:** password-validator
* **Documentación:** Swagger / OpenAPI
* **Despliegue:** Render (CI/CD)

##  Estructura del Proyecto

```text
├── prisma/           # Esquemas de base de datos y modelos de Prisma
├── src/
│   ├── controllers/  # Lógica de negocio (Autenticación, Usuario, etc.)
│   ├── middlewares/  # Interceptores de seguridad (Autenticación JWT)
│   ├── routes/       # Definición de endpoints y enrutamiento modular
│   ├── services/     # Lógica de soporte (Historial de sesiones, Auditoría)
│   ├── utils/        # Logica de soporte para validar contraseñas seguras
    └── index.ts      # Punto de entrada del servidor Express
├── .env              # Variables de entorno (Ignorado en Git)
└── package.json      # Dependencias y scripts del proyecto

## Configuracion del entorno

Clona el repositorio.

Instala las dependencias del proyecto:
Bash
npm install

Configura tu archivo .env en la raíz con tus credenciales de PostgreSQL y tu clave secreta para JWT.
Envía las tablas a tu base de datos vacía y Genera el cliente local de Prisma:
Bash
npx prisma db push
npm install prisma@5 @prisma/client@5

Levanta el servidor en modo desarrollo:
Bash
npm run dev

## Módulos Implementados
### Autenticación y Gestión de Usuario
* Registro de emprendedor e inicialización automática de la configuración de su bot.
* Login seguro con generación de JWT válido por 24 horas.
* Modificación de contraseña con validaciones estrictas (longitud, mayúsculas, números y símbolos).
* Baja lógica de cuenta (Soft Delete) conservando métricas históricas.

### Registro de movimientios
* Registro integral de actividades en la base de datos para cada acción realizada en la API.
* Captura automática de tipo de movimiento, IP de origen y dispositivo (User-Agent).

### FAQs
  **Categorías FAQ (`/api/faq-categories`):**
    **GET:** Listado cronológico de categorías asociadas al bot del usuario.
    **POST:** Creación de nuevas categorías (Ej: "Envíos", "Medios de Pago").
    **PUT:** Edición del nombre de la categoría.
    **DELETE:** Baja de categoría. Incluye protección de integridad relacional (`onDelete: Restrict`), impidiendo borrar una categoría si esta posee preguntas asociadas.

  **Preguntas Frecuentes - FAQs (`/api/faqs`):**
    **GET:** Listado de preguntas frecuentes incluyendo el nombre de la categoría asociada (Join relacional).
    **POST:** Creación de pregunta, respuesta y asignación de palabras clave (*keywords*) para mejorar la coincidencia semántica del bot.
    **PUT:** Edición integral de la FAQ (permite reasignar de categoría).
    **DELETE:** Eliminación permanente de la pregunta.

