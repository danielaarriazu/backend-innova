import prisma from '../lib/prisma';
import { enviarEventosQueue } from './telemetry.service'; 
import { TipoMensaje, RolEmisor } from '@prisma/client';

export const procesarAccionBot = async (
  accion: string,
  sessionId: string,
  botId: string,
  datosCliente?: any,
  contextoActual?: string
) => {
  if (['MOSTRAR_CATALOGO', 'DERIVAR_HUMANO', 'SOLICITAR_PRESUPUESTO', 'MOSTRAR_FAQS', 'MOSTRAR_HORARIOS', 'ENVIAR_DATOS'].includes(accion)) {
    await enviarEventosQueue({
      botId,
      sessionId,
      tipoUsuario: 'ANONIMO',
      eventos: [{ tipo: `ACCION_${accion}`, fecha: new Date().toISOString() }]
    });
  }

   const bot = await prisma.configuracionBot.findUnique({ where: { id: botId } });

  switch (accion) {
    case 'MOSTRAR_HORARIOS':
      return {
        respuesta: bot?.horarioAtencion || "Lunes a Viernes de 9:00 a 18:00 hs.",
        botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
        requiereInput: false
      };

    case 'MOSTRAR_FAQS':
      const faqs = await prisma.faq.findMany({
        where: { botId, activa: true },
        include: { categoria: true }
      });
      const textoFaqs = faqs.map(f => `*${f.categoria.nombre}:* ${f.pregunta}\nR: ${f.respuesta}`).join('\n\n');
      
      return {
        respuesta: textoFaqs || "No hay preguntas frecuentes configuradas.",
        botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
        requiereInput: false
      };

    case 'MOSTRAR_CATALOGO':
      const productosDelBot = await prisma.producto.findMany({
        where: { 
          botId: botId, 
          activo: true 
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          precio: true,
          urlImagen: true
        }
      });

      if (productosDelBot.length === 0) {
        return {
          respuesta: "En este momento no tenemos productos disponibles en el catálogo.",
          botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
          requiereInput: false,
          contexto: 'INICIO'
        };
      }
      return {
        respuesta: "Acá tenés nuestro catálogo. Seleccioná lo que necesites.",
        botones: [], 
        requiereInput: false,
        contexto: 'VIENDO_CATALOGO',
        productos: productosDelBot
      };

    case 'SOLICITAR_PRESUPUESTO':
      const requiereCotizacion = datosCliente.items.some((item: any) => !item.precio || item.precio === 0);
      return {
        respuesta: "¡Excelente elección! Para poder armar tu presupuesto, por favor escribime tu *Nombre*.",
        botones: [],
        requiereInput: true,
        contexto: requiereCotizacion ? 'ESPERANDO_NOMBRE_COTIZACION' : 'ESPERANDO_NOMBRE_PRESUPUESTO',
        datosAcumulados: { carrito: datosCliente.items } 
      };

    case 'DERIVAR_HUMANO':
      return {
        respuesta: "Para derivar tu consulta a un representante, por favor decime tu *Nombre*.",
        botones: [],
        requiereInput: true,
        contexto: 'ESPERANDO_NOMBRE_DERIVAR_HUMANO'
      };

    case 'ENVIAR_DATOS':
      if (!datosCliente || !datosCliente.texto) {
        return { respuesta: "Por favor, ingresá el dato.", requiereInput: true, contexto: contextoActual };
      }
      console.log(` [DEBUG] Procesando ENVIAR_DATOS. Contexto actual: ${contextoActual}`);

      if (contextoActual?.startsWith('ESPERANDO_NOMBRE_')) {
        const nombreIngresado = datosCliente.texto;
        const flujoDestino = contextoActual.split('ESPERANDO_NOMBRE_')[1]; 

        const textoAccion = flujoDestino === 'DERIVAR_HUMANO' 
          ? 'derivación' 
          : flujoDestino.toLowerCase(); 

        return {
          respuesta: `¡Un gusto, ${nombreIngresado}! Para terminar de armar tu ${textoAccion}, ¿me podrías indicar un teléfono de contacto?`,
          botones: [],
          requiereInput: true,
          contexto: `ESPERANDO_TELEFONO_${flujoDestino}`,
          datosAcumulados: {
            ...datosCliente.datosAcumulados, 
            nombre: nombreIngresado          
          }
        };
      }

      if (contextoActual?.startsWith('ESPERANDO_TELEFONO_')) {
        const telefonoIngresado = datosCliente.texto;
        const nombreGuardado = datosCliente.datosAcumulados?.nombre || 'Cliente';
        const flujoDestino = contextoActual.split('ESPERANDO_TELEFONO_')[1];
        const carrito = datosCliente.datosAcumulados?.carrito || [];

        let descripcionConsulta = '';
        let requiereCotizacionManual = false;
        let total = 0;

        if (flujoDestino === 'DERIVAR_HUMANO')
          {
          descripcionConsulta = 'El cliente solicita atención personalizada y derivación a un representante.';
        } else {
          // bandera o precio 0
          requiereCotizacionManual = carrito.some((item: any) => 
            item.requiereCotizacion === true || Number(item.precio) === 0
          );

          descripcionConsulta = `Detalle de los productos solicitados:\n\n`;

          carrito.forEach((item: any) => {
            if (item.requiereCotizacion === true || Number(item.precio) === 0) {
              descripcionConsulta += `• ${item.cantidad}x ${item.nombre || 'Producto'} (A cotizar)\n`;
            } else {
              const subtotal = item.cantidad * Number(item.precio);
              total += subtotal;
              descripcionConsulta += `• ${item.cantidad}x ${item.nombre || 'Producto'} ($${item.precio} c/u) = $${subtotal}\n`;
            }
          });

          if (requiereCotizacionManual) {
            descripcionConsulta += `\nESTADO: CONTIENE PRODUCTOS A COTIZAR MANUALMENTE`;
          } else {
            descripcionConsulta += `\nTOTAL ESTIMADO: $${total}`;
          }
        }

        const tipoConsultaFinal = (flujoDestino === 'PRESUPUESTO' && requiereCotizacionManual) 
          ? 'COTIZACION' 
          : flujoDestino;
      try {
        const consultaActiva = await prisma.consulta.findFirst({
          where: { sessionId: sessionId, botId: botId }
        });

        if (!consultaActiva) {
          console.warn(`[WARN] No se encontró consulta activa para sessionId: ${sessionId}`);
          return {
            respuesta: "Perdón, se perdió el hilo de la conversación. Volvamos a empezar.",
            botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
            requiereInput: false,
            contexto: 'INICIO'
          };
        }
        const esDerivacion = (flujoDestino === 'DERIVAR_HUMANO') || requiereCotizacionManual;
        await prisma.$transaction(async (tx) => {
        const mensajeTelefono = await prisma.mensaje.create({
          data: {
            consultaId: consultaActiva.id,
            emisor: RolEmisor.CLIENTE,
            tipoMensaje: TipoMensaje.ACCION,
            contenido: telefonoIngresado
          }
        });

        await prisma.lead.create({
          data: {
            nombre: nombreGuardado,
            telefono: telefonoIngresado,
            consultaId: consultaActiva.id,
            mensajeId: mensajeTelefono.id 
          }
        });

        await prisma.consulta.update({
          where: { id: consultaActiva.id },
          data: {
            usuarioID: telefonoIngresado,
            clienteNombre: nombreGuardado,
            clienteTelefono: telefonoIngresado,
            tipoConsulta: tipoConsultaFinal,
            asunto: esDerivacion ? 'Derivación de Chatbot' : 'Solicitud de Presupuesto/Cotización',
            descripcion: descripcionConsulta,
            derivada: esDerivacion, 
            estado: 'NUEVA'    
          }
        });
      });

        await enviarEventosQueue({
          botId, sessionId, tipoUsuario: 'CLIENTE',
          eventos: [{ tipo: `LEAD_CAPTURADO_${tipoConsultaFinal}`, fecha: new Date().toISOString() }]
        });

        if (flujoDestino === 'DERIVAR_HUMANO') {
          return {
            respuesta: bot?.derivacionAutomatica || `¡Listo ${nombreGuardado}! Tu consulta fue enviada a nuestro equipo. Nos contactaremos al ${telefonoIngresado}.`,
            botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
            requiereInput: false,
            contexto: 'FINALIZADO'
          };
        }

        if (flujoDestino === 'PRESUPUESTO' || flujoDestino === 'COTIZACION') {
          let msgExito = '';

          // Acá cambiamos dinámicamente lo que lee el cliente
          if (requiereCotizacionManual || flujoDestino === 'COTIZACION') {
            msgExito = `¡Gracias ${nombreGuardado}! Como tu pedido incluye servicios a medida, hemos registrado la solicitud. El emprendedor armará una cotización personalizada y se contactará a la brevedad al ${telefonoIngresado}.`;
          } else {
            msgExito = `¡Excelente ${nombreGuardado}! Tu presupuesto estimado es de $${total}. Ya registramos tu pedido y el equipo se contactará al ${telefonoIngresado} para coordinar los detalles.`;
          }

          return {
            respuesta: msgExito,
            botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
            requiereInput: false,
            contexto: 'FINALIZADO'
          };
        }
      return {
          respuesta: `¡Gracias ${nombreGuardado}! Hemos registrado tu solicitud correctamente.`,
          botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
          requiereInput: false,
          contexto: 'FINALIZADO'
        };

        } catch (error) {
          // Acá capturamos si Prisma falla (ej: falta un campo en la tabla Lead)
          console.error("[ERROR FATAL] Falló la base de datos al guardar datos del cliente:", error);
          return {
            respuesta: "Ocurrió un error interno al guardar tus datos. Por favor, intentá de nuevo más tarde.",
            botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
            requiereInput: false,
            contexto: contextoActual
          };
        }
      }
      console.warn(`[WARN] Se alcanzó el final de ENVIAR_DATOS sin procesar. Revisa la variable contextoActual.`);
      return {
        respuesta: "Perdón, se perdió el hilo de la conversación. Volvamos a empezar.",
        botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
        requiereInput: false,
        contexto: 'INICIO'
      };

    case 'INICIO':
      return {
        respuesta: bot?.mensajeBienvenida || "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
        botones: [
          { id: 'btn_catalogo', texto: 'Ver Catálogo', accion: 'MOSTRAR_CATALOGO' },
          { id: 'btn_horarios', texto: 'Horarios de Atención', accion: 'MOSTRAR_HORARIOS' },
          { id: 'btn_faqs', texto: 'Preguntas Frecuentes', accion: 'MOSTRAR_FAQS' },
          { id: 'btn_atencion', texto: 'Atención Personalizada', accion: 'DERIVAR_HUMANO' }
        ],
        requiereInput: false,
        contexto: 'INICIO'
      };

    case 'VOLVER_MENU':
      // Esta acción se llama cuando el usuario cancela una operación o termina un flujo
      return {
        respuesta: "¿En qué más puedo ayudarte?",
        botones: [
          { id: 'btn_catalogo', texto: 'Ver Catálogo', accion: 'MOSTRAR_CATALOGO' },
          { id: 'btn_horarios', texto: 'Horarios de Atención', accion: 'MOSTRAR_HORARIOS' },
          { id: 'btn_faqs', texto: 'Preguntas Frecuentes', accion: 'MOSTRAR_FAQS' },
          { id: 'btn_atencion', texto: 'Atención Personalizada', accion: 'DERIVAR_HUMANO' }
        ],
        requiereInput: false,
        contexto: 'INICIO'
      };
   
    default:
      return {
        respuesta: "Acción no reconocida.",
        botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
        requiereInput: false
      };
  }
};
