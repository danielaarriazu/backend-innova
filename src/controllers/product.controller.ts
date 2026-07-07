import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { GetProductsInput } from '../types/product.types';

const getRequestMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress,
  dispositivo: req.headers['user-agent'] as string | undefined,
});

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.file) {
      req.body.urlImagen = req.file.path;
    }

    const producto = await productService.crearProducto({
      usuarioId: req.usuario!.id,
      ...req.body,
      ...getRequestMeta(req),
    });

    res.status(201).json({ success: true, message: 'Producto creado con éxito.', producto });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
     const filtros = req.query as unknown as GetProductsInput;
    const productos = await productService.obtenerProductos(req.usuario!.id, filtros);
    res.status(200).json({ success: true, productos });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'BOT_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
      return;
    }
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.file) {
      req.body.urlImagen = req.file.path;
    }
    
    const producto = await productService.actualizarProducto({
      usuarioId: req.usuario!.id,
      productoId: req.params.id,
      ...req.body,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Producto actualizado con éxito.', producto });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'El producto no existe o no pertenece a tu catálogo.' });
        return;
      }
    }
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await productService.eliminarProducto({
      usuarioId: req.usuario!.id,
      productoId: req.params.id,
      ...getRequestMeta(req),
    });

    res.status(200).json({ success: true, message: 'Producto eliminado con éxito.' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'BOT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'Configuración de bot no encontrada.' });
        return;
      }
      if (error.message === 'PRODUCT_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'El producto no fue encontrado o ya fue eliminado.' });
        return;
      }
    }
    next(error);
  }
};