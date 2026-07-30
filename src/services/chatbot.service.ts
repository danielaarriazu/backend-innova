import prisma from '../lib/prisma';
import { enviarEventosQueue } from './telemetry.service'; 
import { TipoMensaje, RolEmisor, EstadoChat, EstadoConsulta, CerradaPor } from '@prisma/client';
import { crearYEnviarPresupuesto } from './presupuesto.service';
import { ChatbotPayload, DatosCliente } from '../types/chatbot.type';

const ACCIONES_QUE_INICIAN_PROCESO = [ 
  'MOSTRAR_CATALOGO',
  'MOSTRAR_FAQS',
  'MOSTRAR_HORARIOS',
  'DERIVAR_HUMANO',
  'SOLICITAR_PRESUPUESTO', 
];

const esNombreValido = (texto: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(texto.trim());
const esTelefonoValido = (texto: string) => /^\+?[0-9\s-]{8,15}$/.test(texto.trim());

export const gestionarInteraccion = async (payload: ChatbotPayload) => {
  const { accion, sessionId, botId, datosCliente, contexto } = payload;

  let consulta = await prisma.consulta.findFirst({
    where: { sessionId: sessionId, botId: botId }
  });

  let sesion = await prisma.sesionChat.findUnique({
    where: {
      botId_sessionId: { botId: botId, sessionId: sessionId }
    }
  });

  if (!sesion) {
    sesion = await prisma.sesionChat.create({
      data: { botId, sessionId, estado: EstadoChat.BOT_ACTIVO }
    });
  }

  if (!consulta) {
    try {
      consulta = await prisma.consulta.create({
          data: { sessionId, 
          botId, 
          tipoConsulta: 'BOT',
          asunto: 'INTERACCION_BOT',
          descripcion: 'El cliente inició el bot.'
        
        }
      });
    } catch (prismaError: any) {
      throw new Error(`Error al crear la consulta en Prisma: ${prismaError.message}`);
    }
  }

  if (!consulta) {
    throw new Error('Fallo crítico: No se pudo obtener ni crear la consulta en la BD');
  }

  if (consulta.estado === EstadoConsulta.NUEVA && ACCIONES_QUE_INICIAN_PROCESO.includes(accion)) {
    consulta = await prisma.consulta.update({
      where: { id: consulta.id },
      data: { 
        estado: EstadoConsulta.EN_PROCESO,
        descripcion: 'El cliente está recorriendo las opciones'
      
      },
    });
  }

  const esAccion = !datosCliente?.accion;
  const contenidoCliente = esAccion ? accion : (datosCliente.texto || '');
  
  await prisma.mensaje.create({
    data: {
      consultaId: consulta.id,
      emisor: RolEmisor.CLIENTE,
      tipoMensaje: esAccion ? TipoMensaje.ACCION : TipoMensaje.TEXTO,
      contenido: contenidoCliente
    }
  });

  // Si un humano está atendiendo, cortamos acá
  if (sesion.estado === EstadoChat.HUMANO_ATENDIENDO) {
    const mensajeBloqueo = consulta.tipoConsulta === 'COTIZACION'
      ? "En este momento el emprendedor está armando la cotización de tu presupuesto. Por favor aguarda, se contactará contigo a la brevedad."
      : "En este momento el emprendedor está revisando tu consulta. Por favor aguarda unos instantes.";

    return { 
      silenciado: true, 
      respuesta: mensajeBloqueo,
      botones: [],
      requiereInput: false,
      contexto: 'BLOQUEADO_POR_HUMANO'
    };
  }

  // Ejecutamos tu lógica original del bot
  const resultado = await procesarAccionBot(accion, sessionId, botId, datosCliente, contexto);

  // Guardamos la respuesta del bot en la BD
  if (resultado && typeof resultado.respuesta === 'string') {
    await prisma.mensaje.create({
      data: {
        consultaId: consulta.id,
        emisor: RolEmisor.BOT,
        tipoMensaje: TipoMensaje.TEXTO,
        contenido: resultado.respuesta
      }
    });
  }

  return resultado;
};

export const procesarAccionBot = async (
  accion: string,
  sessionId: string,
  botId: string,
  datosCliente?: any,
  contexto?: string
) => {
  // 1. Registrar eventos (ajusta esto si tenés más acciones que registrar)
  if (['MOSTRAR_CATALOGO', 'DERIVAR_HUMANO', 'SOLICITAR_PRESUPUESTO', 'MOSTRAR_FAQS', 'MOSTRAR_HORARIOS', 'ENVIAR_DATOS'].includes(accion)) {
    await enviarEventosQueue({
      botId,
      sessionId,
      tipoUsuario: 'ANONIMO',
      eventos: [{ tipo: `ACCION_${accion}`, fecha: new Date().toISOString() }]
    });
  }

  const bot = await prisma.configuracionBot.findUnique({ where: { id: botId } });
  const sesion = await prisma.sesionChat.findUnique({
    where: { botId_sessionId: { botId, sessionId } }
  });

  const contextoActual = sesion?.contexto || 'INICIO';

  const generarRespuesta = async () => {
    switch (accion) {
      case 'MOSTRAR_HORARIOS':
        return {
          respuesta: bot?.horarioAtencion || "Lunes a Viernes de 9:00 a 18:00 hs.",
          botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
          requiereInput: false
        };

      case 'MOSTRAR_FAQS':
        const faqs = await prisma.faq.findMany({
          where: { botId },
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
       const itemsCliente = (datosCliente?.items || []) as Array<{ productoId: string; cantidad: number }>;
        const productoIds = [...new Set(itemsCliente.map((item) => item.productoId))];
 
        const productosReales = await prisma.producto.findMany({
          where: { id: { in: productoIds }, botId, activo: true },
        });
 
        if (productosReales.length !== productoIds.length) {
          return {
            respuesta: "Uno o más productos del carrito ya no están disponibles. Volvé a revisar el catálogo.",
            botones: [{ id: 'btn_catalogo', texto: 'Ver Catálogo', accion: 'MOSTRAR_CATALOGO' }],
            requiereInput: false,
            contexto: 'INICIO'
          };
        }
 
        const productoPorIdSolicitud = new Map(productosReales.map((p) => [p.id, p]));
        const requiereCotizacion = itemsCliente.some(
          (item) => productoPorIdSolicitud.get(item.productoId)!.requiereCotizacion
        );
         const carritoValidado = itemsCliente.map((item) => ({
          productoId: item.productoId,
          cantidad: Number(item.cantidad) || 1,
        }));
         return {
          respuesta: "¡Excelente elección! Para poder armar tu presupuesto, por favor escribime tu *Nombre*.",
          botones: [],
          requiereInput: true,
          contexto: requiereCotizacion ? 'ESPERANDO_NOMBRE_COTIZACION' : 'ESPERANDO_NOMBRE_PRESUPUESTO',
          datosAcumulados: { carrito: carritoValidado } 
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

          if (!esNombreValido(nombreIngresado)) {
            return {
              respuesta: "Ese no parece un nombre válido. Por favor, ingresá solo letras (ejemplo: Juan o María).",
              botones: [],
              requiereInput: true,
              contexto: contextoActual, 
              datosAcumulados: datosCliente.datosAcumulados
            };
          }
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
          const telefonoIngresado = datosCliente.texto || '';
          
          if (!esTelefonoValido(telefonoIngresado)) {
            return {
              respuesta: "Ese número no parece válido. Por favor, ingresá solo números, entre 8 y 15 dígitos (ejemplo: 1123456789).",
              botones: [],
              requiereInput: true,
              contexto: contextoActual, 
              datosAcumulados: datosCliente.datosAcumulados 
            };
          }
          const nombreGuardado = datosCliente.datosAcumulados?.nombre || 'Cliente';
          const flujoDestino = contextoActual.split('ESPERANDO_TELEFONO_')[1];
          const carrito = (datosCliente.datosAcumulados?.carrito || []) as Array<{ productoId: string; cantidad: number }>;

          let descripcionConsulta = '';
          let requiereCotizacionManual = false;
          let total = 0;
          let productoPorId = new Map<string, { nombre: string; precio: any; requiereCotizacion: boolean }>();

          if (flujoDestino === 'DERIVAR_HUMANO') {
            descripcionConsulta = 'El cliente solicita atención personalizada y derivación a un representante.';
          } else {
             const productoIds = [...new Set(carrito.map((item) => item.productoId))];
             const productosReales = await prisma.producto.findMany({
              where: { id: { in: productoIds }, botId, activo: true },
            });
            productoPorId = new Map(productosReales.map((p) => [p.id, p]));
 
            requiereCotizacionManual = carrito.some(
              (item: any) => productoPorId.get(item.productoId)?.requiereCotizacion ?? true
            );
 
            descripcionConsulta = `Detalle de los productos solicitados:\n\n`;

            carrito.forEach((item) => {
               const producto = productoPorId.get(item.productoId);
              const nombre = producto?.nombre ?? 'Producto ya no disponible';
              if (!producto || producto.requiereCotizacion) {
                descripcionConsulta += `• ${item.cantidad}x ${nombre} (A cotizar)\n`;
              } else {
                const precio = Number(producto.precio);
                const subtotal = item.cantidad * precio;
                total += subtotal;
                descripcionConsulta += `• ${item.cantidad}x ${nombre} ($${precio} c/u) = $${subtotal}\n`;
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
            const esDerivacion = (flujoDestino === 'DERIVAR_HUMANO') || (flujoDestino === 'COTIZACION') || requiereCotizacionManual;
            
            const esIngresoDeDato = accion === 'ENVIAR_DATOS' || contextoActual?.startsWith('ESPERANDO_');
            const tipoMensajeCliente = esIngresoDeDato ? 'TEXTO' : 'ACCION';
            
            await prisma.$transaction(async (tx) => {
              const mensajeTelefono = await tx.mensaje.create({
                data: {
                  consultaId: consultaActiva.id,
                  emisor: 'CLIENTE', 
                  tipoMensaje: tipoMensajeCliente, 
                  contenido: telefonoIngresado
                }
              });

              await tx.lead.upsert({
                where: { 
                  consultaId: consultaActiva.id 
                },
                update: {
                  nombre: nombreGuardado,
                  telefono: telefonoIngresado,
                  mensajeId: mensajeTelefono.id 
                },
                create:{
                  nombre: nombreGuardado,
                  telefono: telefonoIngresado,
                  consultaId: consultaActiva.id,
                  mensajeId: mensajeTelefono.id
                }
              });

              await tx.consulta.update({
                where: { id: consultaActiva.id },
                data: {
                  tipoConsulta: tipoConsultaFinal,
                  asunto: esDerivacion ? 'Derivación de Chatbot' : 'Solicitud de Presupuesto/Cotización',
                  descripcion: descripcionConsulta,
                  derivada: esDerivacion, 
                  estado: esDerivacion ? EstadoConsulta.EN_PROCESO : EstadoConsulta.CERRADA,
                  cerradaPor: esDerivacion ? null : CerradaPor.BOT,
                  fechaCierre: esDerivacion ? null : new Date(),  
                }
              });
              
              if (esDerivacion) {
                await tx.sesionChat.update({
                  where: { botId_sessionId: { botId: botId, sessionId: sessionId } },
                  data: { estado: 'HUMANO_ATENDIENDO' } 
                });
              }
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
              let rutaPdfGenerado = null;

              try {
                const itemsPresupuesto = carrito.map((item: any) => {
                  const producto = productoPorId.get(item.productoId);
                  return {
                    nombre: producto?.nombre ?? 'Producto ya no disponible',
                    cantidad: Number(item.cantidad) || 1,
                    precioUnitario: producto && !producto.requiereCotizacion ? Number(producto.precio) : 0,
                  };
                });

                const presupuestoCreado = await crearYEnviarPresupuesto(
                  consultaActiva.id, 
                  itemsPresupuesto
                );
                 rutaPdfGenerado = presupuestoCreado.linkPdf;
                console.log(`[EXITO] PDF generado en: ${rutaPdfGenerado}`);

              } catch (error) {
                console.error("[ERROR] Falló la generación del PDF:", error);
              }

              if (requiereCotizacionManual || flujoDestino === 'COTIZACION') {
                msgExito = `¡Gracias ${nombreGuardado}! Como tu pedido incluye servicios a medida, hemos registrado la solicitud. El emprendedor armará una cotización personalizada y se contactará a la brevedad al ${telefonoIngresado}.`;
              } else {
                msgExito = `¡Excelente ${nombreGuardado}! Tu presupuesto estimado es de $${total}. Ya registramos tu pedido y el equipo se contactará al ${telefonoIngresado} para coordinar los detalles.`;
              }

              return {
                respuesta: msgExito,
                botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
                requiereInput: false,
                contexto: 'FINALIZADO',
                archivoAdjunto: rutaPdfGenerado
              };
            }
            
            return {
              respuesta: `¡Gracias ${nombreGuardado}! Hemos registrado tu solicitud correctamente.`,
              botones: [{ id: 'btn_volver', texto: 'Volver al menú', accion: 'VOLVER_MENU' }],
              requiereInput: false,
              contexto: 'FINALIZADO'
            };

          } catch (error) {
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
      case 'VOLVER_MENU': 
        return {
          respuesta: accion === 'INICIO' ? (bot?.mensajeBienvenida || "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?") : "¿En qué más puedo ayudarte?",
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

  const resultado = await generarRespuesta();

  if (resultado?.contexto && resultado.contexto !== contextoActual) {
    await prisma.sesionChat.update({
      where: { botId_sessionId: { botId, sessionId } },
      data: { contexto: resultado.contexto }
    });
  }

  return resultado;
};
