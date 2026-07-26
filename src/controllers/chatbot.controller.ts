import { Request, Response } from 'express';
import { procesarAccionBot } from '../services/chatbot.service';
import prisma from '../lib/prisma';
import { TipoMensaje, RolEmisor, EstadoChat } from '@prisma/client';
 
export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accion, sessionId, botId, datosCliente, contexto} = req.body;
 
    if (!accion || !sessionId || !botId) {
      res.status(400).json({ error: 'Faltan parámetros: accion, sessionId, botId' });
      return;
    }
    
    let consulta = await prisma.consulta.findFirst({
      where: { sessionId: sessionId, botId: botId }
    });

    let sesion = await prisma.sesionChat.findUnique({
      where: {
        botId_sessionId: {
          botId: botId,
          sessionId: sessionId 
        }
      }
    });

    if (!sesion) {
      sesion = await prisma.sesionChat.create({
        data: {
          botId: botId,
          sessionId: sessionId,
          estado: EstadoChat.BOT_ACTIVO
        }
      });
    }

    if (!consulta) {
      try {
        consulta = await prisma.consulta.create({
          data: {
            sessionId: sessionId,
            botId: botId,
            tipoConsulta: 'BOT', 
          }
        });
      } catch (prismaError: any) {
        throw new Error(`Error al crear la consulta en Prisma: ${prismaError.message}`);
      }
    }

    if (!consulta) {
      throw new Error('Fallo crítico: No se pudo obtener ni crear la consulta en la BD');
    }

    // Determinamos si es un botón (ACCION) o si escribió texto (TEXTO)
    const esAccion = !datosCliente?.accion;
    const contenidoCliente = esAccion ? accion : datosCliente.texto;
    await prisma.mensaje.create({
      data: {
        consultaId: consulta.id,
        emisor: RolEmisor.CLIENTE,
        tipoMensaje: esAccion ? TipoMensaje.ACCION : TipoMensaje.TEXTO,
        contenido: contenidoCliente
      }
    });

    if (sesion.estado === EstadoChat.HUMANO_ATENDIENDO) {
      res.status(200).json({ 
        silenciado: true, 
        mensaje: "El mensaje fue recibido y será leído por el humano." 
      });
      return; // Cortamos la ejecución acá, el bot no responde
    }
    
    const resultado = await procesarAccionBot(accion, sessionId, botId, datosCliente, contexto);

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
    res.status(200).json(resultado);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Error interno' });
  }
};
