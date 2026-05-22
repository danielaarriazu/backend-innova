const pool = require('../config/db');

// ─────────────────────────────────────────────
// Textos del bot (fáciles de personalizar)
// ─────────────────────────────────────────────
const MENU_TEXTO = `
¿En qué te puedo ayudar? Elegí una opción:

1️⃣  Ver catálogo de productos
2️⃣  Consultar preguntas frecuentes
3️⃣  Dejar mis datos de contacto
4️⃣  Generar un presupuesto básico
5️⃣  Hablar con una persona
0️⃣  Volver al menú principal

Respondé con el número de la opción.`.trim();

const BIENVENIDA_TEXTO = (negocio) =>
  `¡Hola! Bienvenido/a a ${negocio || 'nuestro negocio'} 👋\n\n${MENU_TEXTO}`;

// ─────────────────────────────────────────────
// Helpers de DB
// ─────────────────────────────────────────────
async function getPaso(id_consulta) {
  const r = await pool.query('SELECT paso_actual, id_emprendedor FROM consulta WHERE id = $1', [id_consulta]);
  return r.rows[0] || null;
}

async function setPaso(id_consulta, paso) {
  await pool.query('UPDATE consulta SET paso_actual = $1 WHERE id = $2', [paso, id_consulta]);
}

async function guardarMensaje(id_consulta, origen, contenido) {
  await pool.query(
    'INSERT INTO mensaje (id_consulta, origen, contenido) VALUES ($1, $2, $3)',
    [id_consulta, origen, contenido]
  );
}

async function registrarEvento(id_emprendedor, id_consulta, tipo, detalle = {}) {
  await pool.query(
    'INSERT INTO evento (id_emprendedor, id_consulta, tipo, detalle) VALUES ($1, $2, $3, $4)',
    [id_emprendedor, id_consulta, tipo, JSON.stringify(detalle)]
  );
}

// ─────────────────────────────────────────────
// Lógica de cada paso
// ─────────────────────────────────────────────
async function manejarBienvenida(id_consulta, id_emprendedor) {
  const r = await pool.query('SELECT negocio FROM emprendedor WHERE id = $1', [id_emprendedor]);
  const negocio = r.rows[0]?.negocio;
  await setPaso(id_consulta, 'MENU');
  await registrarEvento(id_emprendedor, id_consulta, 'consulta_iniciada');
  return { respuesta: BIENVENIDA_TEXTO(negocio), paso: 'MENU' };
}

async function manejarMenu(texto, id_consulta, id_emprendedor) {
  const opcion = texto.trim();

  switch (opcion) {
    case '1':
      await setPaso(id_consulta, 'CATALOGO');
      return manejarCatalogo(id_consulta, id_emprendedor);

    case '2':
      await setPaso(id_consulta, 'FAQ');
      return manejarFaq(id_consulta, id_emprendedor);

    case '3':
      await setPaso(id_consulta, 'REGISTRO_NOMBRE');
      return {
        respuesta: 'Para dejarte los datos, primero necesito tu nombre. ¿Cómo te llamás?',
        paso: 'REGISTRO_NOMBRE',
      };

    case '4':
      await setPaso(id_consulta, 'PRESUPUESTO_PRODUCTO');
      return {
        respuesta: '¿Sobre qué producto o servicio querés el presupuesto?',
        paso: 'PRESUPUESTO_PRODUCTO',
      };

    case '5':
      await setPaso(id_consulta, 'DERIVADO');
      await pool.query("UPDATE consulta SET estado = 'derivada' WHERE id = $1", [id_consulta]);
      await registrarEvento(id_emprendedor, id_consulta, 'derivacion');
      return {
        respuesta: 'Entendido. En breve un miembro del equipo se va a comunicar con vos. Gracias por tu paciencia 🙏',
        paso: 'DERIVADO',
      };

    default:
      return {
        respuesta: `No entendí esa opción. Por favor respondé con un número del 1 al 5.\n\n${MENU_TEXTO}`,
        paso: 'MENU',
      };
  }
}

async function manejarCatalogo(id_consulta, id_emprendedor) {
  const r = await pool.query(
    'SELECT nombre, descripcion, precio, categoria FROM producto WHERE id_emprendedor = $1 AND activo = true ORDER BY categoria, nombre',
    [id_emprendedor]
  );

  await registrarEvento(id_emprendedor, id_consulta, 'producto_visto');

  if (r.rows.length === 0) {
    await setPaso(id_consulta, 'MENU');
    return {
      respuesta: 'Todavía no hay productos cargados en el catálogo.\n\n' + MENU_TEXTO,
      paso: 'MENU',
    };
  }

  const lista = r.rows
    .map((p) => `• *${p.nombre}* ${p.precio ? `- $${p.precio}` : ''}\n  ${p.descripcion || ''}`)
    .join('\n\n');

  await setPaso(id_consulta, 'MENU');
  return {
    respuesta: `📦 *Nuestro catálogo:*\n\n${lista}\n\n¿Necesitás algo más?\n\n${MENU_TEXTO}`,
    paso: 'MENU',
  };
}

async function manejarFaq(id_consulta, id_emprendedor) {
  const r = await pool.query(
    'SELECT id, pregunta, respuesta FROM faq WHERE id_emprendedor = $1 AND activo = true ORDER BY id',
    [id_emprendedor]
  );

  await registrarEvento(id_emprendedor, id_consulta, 'faq_consultada');

  if (r.rows.length === 0) {
    await setPaso(id_consulta, 'MENU');
    return {
      respuesta: 'Todavía no hay preguntas frecuentes cargadas.\n\n' + MENU_TEXTO,
      paso: 'MENU',
    };
  }

  const lista = r.rows.map((f, i) => `${i + 1}. ${f.pregunta}`).join('\n');

  // guardamos las FAQs en el contexto de la sesión para usarlas en el siguiente paso
  await pool.query(
    "UPDATE consulta SET paso_actual = $1 WHERE id = $2",
    [`FAQ_DETALLE:${r.rows.map(f => f.id).join(',')}`, id_consulta]
  );

  return {
    respuesta: `❓ *Preguntas frecuentes:*\n\n${lista}\n\nRespondé con el número de la pregunta, o *0* para volver al menú.`,
    paso: 'FAQ_DETALLE',
    faqs: r.rows,
  };
}

async function manejarFaqDetalle(texto, id_consulta, id_emprendedor, pasoActual) {
  if (texto.trim() === '0') {
    await setPaso(id_consulta, 'MENU');
    return { respuesta: MENU_TEXTO, paso: 'MENU' };
  }

  // extraemos los IDs de FAQs del paso guardado: "FAQ_DETALLE:1,2,3"
  const idsStr = pasoActual.split(':')[1] || '';
  const ids = idsStr.split(',').map(Number);
  const indice = parseInt(texto.trim(), 10) - 1;

  if (isNaN(indice) || indice < 0 || indice >= ids.length) {
    return {
      respuesta: `Opción inválida. Respondé con un número entre 1 y ${ids.length}, o *0* para volver al menú.`,
      paso: 'FAQ_DETALLE',
    };
  }

  const r = await pool.query('SELECT pregunta, respuesta FROM faq WHERE id = $1', [ids[indice]]);
  const faq = r.rows[0];

  await registrarEvento(id_emprendedor, id_consulta, 'faq_consultada', { faq_id: ids[indice] });
  await setPaso(id_consulta, 'MENU');

  return {
    respuesta: `❓ *${faq.pregunta}*\n\n${faq.respuesta}\n\n¿Necesitás algo más?\n\n${MENU_TEXTO}`,
    paso: 'MENU',
  };
}

async function manejarRegistro(texto, paso, id_consulta, id_emprendedor) {
  // Guardamos datos del cliente en la sesión usando el campo paso_actual como mini-contexto
  // Formato: REGISTRO_TELEFONO:NombreDelCliente
  if (paso === 'REGISTRO_NOMBRE') {
    const nombre = texto.trim();
    await setPaso(id_consulta, `REGISTRO_TELEFONO:${nombre}`);
    return {
      respuesta: `Gracias, ${nombre}! ¿Cuál es tu número de teléfono o WhatsApp?`,
      paso: 'REGISTRO_TELEFONO',
    };
  }

  if (paso.startsWith('REGISTRO_TELEFONO')) {
    const nombre = paso.split(':')[1] || 'Cliente';
    const telefono = texto.trim();

    // Crear o recuperar el cliente
    let clienteId;
    const existing = await pool.query(
      'SELECT id FROM cliente WHERE id_emprendedor = $1 AND telefono = $2',
      [id_emprendedor, telefono]
    );

    if (existing.rows.length > 0) {
      clienteId = existing.rows[0].id;
    } else {
      const nuevo = await pool.query(
        'INSERT INTO cliente (id_emprendedor, nombre, telefono) VALUES ($1, $2, $3) RETURNING id',
        [id_emprendedor, nombre, telefono]
      );
      clienteId = nuevo.rows[0].id;
    }

    // Asociar cliente a la consulta
    await pool.query('UPDATE consulta SET id_cliente = $1 WHERE id = $2', [clienteId, id_consulta]);
    await registrarEvento(id_emprendedor, id_consulta, 'lead_registrado', { nombre, telefono });
    await setPaso(id_consulta, 'MENU');

    return {
      respuesta: `¡Perfecto, ${nombre}! Guardamos tus datos. En breve nos comunicamos.\n\n¿Necesitás algo más?\n\n${MENU_TEXTO}`,
      paso: 'MENU',
    };
  }
}

async function manejarPresupuesto(texto, paso, id_consulta, id_emprendedor) {
  if (paso === 'PRESUPUESTO_PRODUCTO') {
    const producto = texto.trim();

    // Buscar si existe ese producto en el catálogo
    const r = await pool.query(
      "SELECT nombre, precio, descripcion FROM producto WHERE id_emprendedor = $1 AND activo = true AND LOWER(nombre) LIKE $2",
      [id_emprendedor, `%${producto.toLowerCase()}%`]
    );

    await registrarEvento(id_emprendedor, id_consulta, 'presupuesto_solicitado', { producto });
    await setPaso(id_consulta, 'MENU');

    if (r.rows.length > 0) {
      const p = r.rows[0];
      return {
        respuesta: `💰 *Presupuesto estimado:*\n\n*${p.nombre}*\n${p.descripcion || ''}\nPrecio: $${p.precio}\n\nPara confirmar o pedir más detalles, dejá tus datos (opción 3) o hablá con nosotros (opción 5).\n\n${MENU_TEXTO}`,
        paso: 'MENU',
      };
    }

    return {
      respuesta: `No encontramos "${producto}" en nuestro catálogo. Podés ver todos los productos disponibles en la opción 1, o hablar con nosotros (opción 5).\n\n${MENU_TEXTO}`,
      paso: 'MENU',
    };
  }
}

// ─────────────────────────────────────────────
// Función principal: procesar un mensaje
// ─────────────────────────────────────────────
async function procesarMensaje(id_consulta, texto_usuario) {
  const consultaData = await getPaso(id_consulta);
  if (!consultaData) throw new Error('Consulta no encontrada');

  const { paso_actual, id_emprendedor } = consultaData;

  // Guardar el mensaje del usuario en la BD
  await guardarMensaje(id_consulta, 'cliente', texto_usuario);

  let resultado;

  // El "0" siempre vuelve al menú (excepto si ya está en MENU o BIENVENIDA)
  if (texto_usuario.trim() === '0' && paso_actual !== 'MENU' && paso_actual !== 'BIENVENIDA') {
    await setPaso(id_consulta, 'MENU');
    resultado = { respuesta: MENU_TEXTO, paso: 'MENU' };
  } else if (paso_actual === 'BIENVENIDA') {
    resultado = await manejarBienvenida(id_consulta, id_emprendedor);
  } else if (paso_actual === 'MENU') {
    resultado = await manejarMenu(texto_usuario, id_consulta, id_emprendedor);
  } else if (paso_actual === 'CATALOGO') {
    resultado = await manejarCatalogo(id_consulta, id_emprendedor);
  } else if (paso_actual === 'FAQ') {
    resultado = await manejarFaq(id_consulta, id_emprendedor);
  } else if (paso_actual.startsWith('FAQ_DETALLE')) {
    resultado = await manejarFaqDetalle(texto_usuario, id_consulta, id_emprendedor, paso_actual);
  } else if (paso_actual === 'REGISTRO_NOMBRE' || paso_actual.startsWith('REGISTRO_TELEFONO')) {
    resultado = await manejarRegistro(texto_usuario, paso_actual, id_consulta, id_emprendedor);
  } else if (paso_actual.startsWith('PRESUPUESTO')) {
    resultado = await manejarPresupuesto(texto_usuario, paso_actual, id_consulta, id_emprendedor);
  } else if (paso_actual === 'DERIVADO') {
    resultado = {
      respuesta: 'Tu consulta ya fue derivada a nuestro equipo. En breve te contactamos.',
      paso: 'DERIVADO',
    };
  } else {
    // Estado desconocido → reiniciar al menú
    await setPaso(id_consulta, 'MENU');
    resultado = { respuesta: MENU_TEXTO, paso: 'MENU' };
  }

  // Guardar la respuesta del bot en la BD
  await guardarMensaje(id_consulta, 'bot', resultado.respuesta);

  return resultado;
}

module.exports = { procesarMensaje };
