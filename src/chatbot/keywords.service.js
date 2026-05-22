// Motor de chat por palabras clave — sin base de datos
// Sesiones en memoria: se reinician si el servidor se reinicia

const sesiones = new Map();

function getSesion(sessionId) {
  if (!sesiones.has(sessionId)) {
    sesiones.set(sessionId, {
      nombre: null,
      ultimoTema: null,
      noEntendidos: 0,
    });
  }
  return sesiones.get(sessionId);
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca tildes
    .replace(/[^a-z0-9\s]/g, '')     // saca caracteres especiales
    .trim();
}

function contiene(texto, palabras) {
  return palabras.some((p) => texto.includes(p));
}

function saludoPorHora() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return '¡Buenos días';
  if (h >= 12 && h < 20) return '¡Buenas tardes';
  return '¡Buenas noches';
}

// ─────────────────────────────────────────────
// Intenciones definidas
// ─────────────────────────────────────────────
const INTENCIONES = [
  {
    id: 'nombre',
    palabras: ['me llamo', 'mi nombre es', 'soy '],
    detectar(texto) {
      const patrones = [/me llamo ([a-záéíóú\s]+)/i, /mi nombre es ([a-záéíóú\s]+)/i, /^soy ([a-záéíóú\s]+)/i];
      for (const p of patrones) {
        const m = texto.match(p);
        if (m) return m[1].trim().split(' ')[0];
      }
      return null;
    },
    responder(sesion, texto) {
      const nombre = this.detectar(texto);
      if (nombre) {
        sesion.nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        return `¡Qué bueno conocerte, ${sesion.nombre}! 😊 ¿En qué puedo ayudarte hoy?`;
      }
      return null;
    },
  },

  {
    id: 'saludo',
    palabras: ['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'hi', 'buenass'],
    responder(sesion) {
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return (
        `${saludoPorHora()}${nombre}! 👋\n\n` +
        `Soy el asistente virtual. Puedo ayudarte con:\n\n` +
        `• Ver productos o servicios\n` +
        `• Consultar precios\n` +
        `• Pedir un presupuesto\n` +
        `• Datos de contacto\n` +
        `• Hablar con alguien del equipo\n\n` +
        `¿Qué necesitás?`
      );
    },
  },

  {
    id: 'catalogo',
    palabras: ['catalogo', 'productos', 'servicios', 'que tienen', 'que venden', 'que ofrecen', 'ver todo', 'mostrar', 'lista'],
    responder(sesion) {
      sesion.ultimoTema = 'catalogo';
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return (
        `Claro${nombre}! 📦 Nuestro catálogo está disponible en la sección de productos.\n\n` +
        `Podés consultarlo pidiendo información sobre un producto específico, o escribí "ver catálogo" para que el equipo te lo envíe completo.\n\n` +
        `¿Hay algún producto o servicio puntual que te interese?`
      );
    },
  },

  {
    id: 'precio',
    palabras: ['precio', 'precios', 'costo', 'costos', 'cuanto sale', 'cuanto cuesta', 'cuanto vale', 'cuanto cobran', 'tarifa', 'tarifas', 'valor'],
    responder(sesion) {
      sesion.ultimoTema = 'precio';
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return (
        `Buena pregunta${nombre} 💰 Los precios dependen del producto o servicio que elijas.\n\n` +
        `Si me decís qué estás buscando, te puedo dar una idea del costo o armarte un presupuesto.\n\n` +
        `¿Sobre qué producto o servicio querés saber el precio?`
      );
    },
  },

  {
    id: 'presupuesto',
    palabras: ['presupuesto', 'cotizacion', 'cotizar', 'quote', 'cuanto me saldria', 'cuanto me costaria', 'presupuestar'],
    responder(sesion) {
      sesion.ultimoTema = 'presupuesto';
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return (
        `¡Con gusto te armo un presupuesto${nombre}! 📝\n\n` +
        `Para poder ayudarte mejor, contame:\n` +
        `1. ¿Qué producto o servicio te interesa?\n` +
        `2. ¿Tenés alguna cantidad o especificación en mente?\n\n` +
        `Con esos datos te damos una respuesta rápida.`
      );
    },
  },

  {
    id: 'contacto',
    palabras: ['contacto', 'telefono', 'celular', 'llamar', 'whatsapp', 'comunicarme', 'hablar con', 'correo', 'email', 'mail', 'direccion', 'donde estan'],
    responder(sesion) {
      sesion.ultimoTema = 'contacto';
      return (
        `Podés contactarnos por los siguientes medios 📞\n\n` +
        `• WhatsApp: [número del negocio]\n` +
        `• Email: [email del negocio]\n` +
        `• Horario de atención: [horario]\n\n` +
        `¿Preferís que alguien del equipo se comunique con vos?`
      );
    },
  },

  {
    id: 'horario',
    palabras: ['horario', 'atienden', 'abierto', 'abren', 'cierran', 'cuando atienden', 'dias', 'lunes', 'sabado', 'domingo'],
    responder() {
      return (
        `Nuestro horario de atención es el siguiente 🕐\n\n` +
        `• Lunes a viernes: [horario]\n` +
        `• Sábados: [horario]\n\n` +
        `Fuera del horario, el bot sigue activo y podés dejar tu consulta. ` +
        `Te respondemos ni bien estemos disponibles. 😊`
      );
    },
  },

  {
    id: 'humano',
    palabras: ['persona', 'humano', 'asesor', 'vendedor', 'alguien', 'agente', 'equipo', 'hablar con una persona', 'quiero hablar'],
    responder(sesion) {
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return (
        `Entendido${nombre}, te comunico con alguien del equipo 🙋\n\n` +
        `En breve una persona se va a poner en contacto con vos. ` +
        `Si querés agilizarlo, podés dejarnos tu nombre y número de WhatsApp.`
      );
    },
  },

  {
    id: 'gracias',
    palabras: ['gracias', 'muchas gracias', 'grax', 'thank you', 'perfecto', 'genial', 'excelente', 'ok gracias', 'buenisimo'],
    responder(sesion) {
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return `¡De nada${nombre}! 😊 Si necesitás algo más, acá estoy.`;
    },
  },

  {
    id: 'despedida',
    palabras: ['chau', 'bye', 'adios', 'hasta luego', 'nos vemos', 'hasta pronto', 'me voy'],
    responder(sesion) {
      const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
      return `¡Hasta luego${nombre}! 👋 Fue un placer ayudarte. ¡Que tengas un buen día!`;
    },
  },
];

// ─────────────────────────────────────────────
// Función principal
// ─────────────────────────────────────────────
function procesarMensajeKeyword(sessionId, textoOriginal) {
  const sesion = getSesion(sessionId);
  const texto = normalizar(textoOriginal);

  // Caso especial: intención de nombre (tiene lógica de extracción propia)
  const intencionNombre = INTENCIONES.find((i) => i.id === 'nombre');
  const respuestaNombre = intencionNombre.responder(sesion, texto);
  if (respuestaNombre) {
    sesion.noEntendidos = 0;
    return { respuesta: respuestaNombre, sessionId, intencion: 'nombre' };
  }

  // Buscar la primera intención que coincida
  for (const intencion of INTENCIONES) {
    if (intencion.id === 'nombre') continue;
    if (contiene(texto, intencion.palabras)) {
      sesion.noEntendidos = 0;
      const respuesta = intencion.responder(sesion, texto);
      return { respuesta, sessionId, intencion: intencion.id };
    }
  }

  // Nadie entendió el mensaje
  sesion.noEntendidos += 1;

  // Si ya no entendió 2 veces seguidas, ofrecer derivación
  if (sesion.noEntendidos >= 2) {
    sesion.noEntendidos = 0;
    const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
    return {
      respuesta:
        `Parece que no te estoy ayudando bien${nombre} 😅 ` +
        `¿Querés que te comunique directamente con alguien del equipo?\n\n` +
        `Si preferís seguir por acá, podés preguntarme sobre:\n` +
        `• productos / precios / presupuesto / contacto / horario`,
      sessionId,
      intencion: 'derivacion_sugerida',
    };
  }

  // Primer no-entendido: respuesta suave con sugerencias
  const nombre = sesion.nombre ? `, ${sesion.nombre}` : '';
  return {
    respuesta:
      `Hmm, no entendí bien esa${nombre} 🤔 ¿Me lo podés decir de otra forma?\n\n` +
      `Por ejemplo podés escribir: "ver productos", "consultar precio", "pedir presupuesto" o "hablar con alguien".`,
    sessionId,
    intencion: 'no_entendido',
  };
}

module.exports = { procesarMensajeKeyword };
