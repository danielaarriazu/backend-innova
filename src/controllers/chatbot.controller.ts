import { Request, Response } from 'express';
import { procesarAccionBot } from '../services/chatbot.service';
import prisma from '../lib/prisma';
import { TipoMensaje, RolEmisor } from '@prisma/client';
 
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
    const esAccion = !datosCliente?.texto;
    const contenidoCliente = esAccion ? accion : datosCliente.texto;
    await prisma.mensaje.create({
      data: {
        consultaId: consulta.id,
        emisor: 'CLIENTE',
        tipoMensaje: esAccion ? TipoMensaje.ACCION : TipoMensaje.TEXTO,
        contenido: contenidoCliente
      }
    });

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
