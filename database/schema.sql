-- ============================================================
-- Chatbot InnovaLab - Schema PostgreSQL (Supabase)
-- ============================================================

-- Usuarios que configuran su chatbot
CREATE TABLE IF NOT EXISTS emprendedor (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  negocio         VARCHAR(150),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Configuración del bot por emprendedor (1 a 1)
CREATE TABLE IF NOT EXISTS bot_config (
  id                      SERIAL PRIMARY KEY,
  id_emprendedor          INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  mensaje_bienvenida      TEXT DEFAULT '¡Hola! ¿En qué puedo ayudarte?',
  mensaje_derivacion      TEXT DEFAULT 'Te voy a comunicar con un humano, un momento...',
  mensaje_cierre          TEXT DEFAULT '¡Gracias por contactarnos!',
  activo                  BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMP DEFAULT NOW(),
  UNIQUE(id_emprendedor)
);

-- Catálogo de productos/servicios por emprendedor
CREATE TABLE IF NOT EXISTS producto (
  id              SERIAL PRIMARY KEY,
  id_emprendedor  INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  precio          NUMERIC(10, 2),
  categoria       VARCHAR(100),
  imagen_url      TEXT,
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Preguntas frecuentes por emprendedor
CREATE TABLE IF NOT EXISTS faq (
  id              SERIAL PRIMARY KEY,
  id_emprendedor  INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  pregunta        TEXT NOT NULL,
  respuesta       TEXT NOT NULL,
  categoria       VARCHAR(100),
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Personas que interactúan con el chatbot
CREATE TABLE IF NOT EXISTS cliente (
  id              SERIAL PRIMARY KEY,
  id_emprendedor  INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  nombre          VARCHAR(100),
  telefono        VARCHAR(30),
  email           VARCHAR(150),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Sesión de conversación (una por interacción)
CREATE TABLE IF NOT EXISTS consulta (
  id              SERIAL PRIMARY KEY,
  id_emprendedor  INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  id_cliente      INT REFERENCES cliente(id) ON DELETE SET NULL,
  canal           VARCHAR(50) DEFAULT 'web',  -- 'web' | 'whatsapp'
  estado          VARCHAR(30) DEFAULT 'abierta', -- 'abierta' | 'derivada' | 'cerrada'
  paso_actual     VARCHAR(50) DEFAULT 'BIENVENIDA', -- estado interno del chatbot
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Mensajes dentro de cada consulta
CREATE TABLE IF NOT EXISTS mensaje (
  id              SERIAL PRIMARY KEY,
  id_consulta     INT NOT NULL REFERENCES consulta(id) ON DELETE CASCADE,
  origen          VARCHAR(20) NOT NULL,  -- 'cliente' | 'bot' | 'humano'
  contenido       TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Log de eventos para analytics
CREATE TABLE IF NOT EXISTS evento (
  id              SERIAL PRIMARY KEY,
  id_emprendedor  INT NOT NULL REFERENCES emprendedor(id) ON DELETE CASCADE,
  id_consulta     INT REFERENCES consulta(id) ON DELETE SET NULL,
  tipo            VARCHAR(100) NOT NULL, -- 'consulta_iniciada' | 'producto_visto' | 'faq_consultada' | 'lead_registrado' | 'derivacion'
  detalle         JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Índices útiles para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_producto_emprendedor ON producto(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_faq_emprendedor ON faq(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_cliente_emprendedor ON cliente(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_consulta_emprendedor ON consulta(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_mensaje_consulta ON mensaje(id_consulta);
CREATE INDEX IF NOT EXISTS idx_evento_emprendedor ON evento(id_emprendedor);
