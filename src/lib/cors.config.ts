import { CorsOptions } from 'cors';
 
const DEV_ORIGINS = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
 
function parseEnvOrigins(): string[] {
  const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
  return raw
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}
 
const ENV_ORIGINS = parseEnvOrigins();
 
const SELF_ORIGIN = process.env.RENDER_EXTERNAL_URL
  ? [process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')]
  : [];
 
const VERCEL_PREVIEW_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

const NETLIFY_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.netlify\.app$/;
 
// Cubre además cualquier dominio *.onrender.com, por si el backend cambia de nombre/URL.
const RENDER_ORIGIN_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/;
 
const ALLOWED_ORIGINS = [...new Set([...DEV_ORIGINS, ...ENV_ORIGINS, ...SELF_ORIGIN])];
 
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
 
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      VERCEL_PREVIEW_REGEX.test(origin) ||
      NETLIFY_REGEX.test(origin) ||
      RENDER_ORIGIN_REGEX.test(origin)
    ) {
      callback(null, true);
      return;
    }
 
    console.warn(`CORS bloqueó una solicitud desde origen no permitido: ${origin}`);
    callback(new Error('No permitido por CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
 