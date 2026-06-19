import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const { nombre, descripcion, precio, stock, urlImagen, activo } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (!nombre || precio === undefined) {
      res.status(400).json({ error: 'Los campos nombre y precio son obligatorios.' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const producto = await productService.crearProducto({
      usuarioId, nombre, descripcion, precio, stock, urlImagen, activo, ip, dispositivo
    });

    res.status(201).json({ success: true, message: 'Producto creado con éxito.', producto });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    
    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const productos = await productService.obtenerProductos(usuarioId);
    res.status(200).json({ success: true, productos });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const productoId = req.params.id;
    const { nombre, descripcion, precio, stock, urlImagen, activo } = req.body;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    const producto = await productService.actualizarProducto({
      usuarioId, productoId, nombre, descripcion, precio, stock, urlImagen, activo, ip, dispositivo
    });

    res.status(200).json({ success: true, message: 'Producto actualizado con éxito.', producto });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ error: 'El producto especificado no existe o no pertenece a tu catálogo.' });
        return;
      }
    }
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = req.usuario?.id;
    const productoId = req.params.id;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const dispositivo = req.headers['user-agent'];

    await productService.eliminarProducto({ usuarioId, productoId, ip, dispositivo });

    res.status(200).json({ success: true, message: 'Producto eliminado con éxito.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ error: 'El producto no fue encontrado o ya fue eliminado.' });
        return;
      }
    }
    next(error);
  }
};