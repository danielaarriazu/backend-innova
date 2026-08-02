import prisma from '../lib/prisma';
import { registrarActividad } from './activity.service';
import { CreateProductInput, UpdateProductInput, DeleteProductInput, GetProductsInput } from '../types/product.types';

// Función auxiliar para validar la existencia del bot
const obtenerBotDeUsuario = async (usuarioId: string) => {
  const bot = await prisma.configuracionBot.findUnique({ where: { usuarioId } });
  if (!bot) throw new Error('BOT_NOT_FOUND');
  return bot;
};

const obtenerProductoDeUsuario = async (usuarioId: string, productoId: string) => {
  const bot = await obtenerBotDeUsuario(usuarioId);
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, botId: bot.id }
  });
  if (!producto) throw new Error('PRODUCT_NOT_FOUND');
  return producto;
};

export const crearProducto = async (data: CreateProductInput) => {
  const bot = await obtenerBotDeUsuario(data.usuarioId);
 
  const productoExistente = await prisma.producto.findFirst({
    where: { botId: bot.id, nombre: {
      equals: data.nombre.trim(),
      mode: 'insensitive'
    } 
  }
  });

  if (productoExistente) {
    throw new Error('PRODUCT_EXISTS');
  }

  const nuevoProducto = await prisma.producto.create({
    data: {
      botId: bot.id,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim(),
      precio: data.precio,
      requiereCotizacion: data.requiereCotizacion ?? false,
      stock: data.stock ?? 0,
      urlImagen: data.urlImagen?.trim(),
      activo: data.activo ?? true
    }
  });
 
  await registrarActividad(
    data.usuarioId,
    'CREACION_PRODUCTO',
    `El usuario agregó el producto: "${nuevoProducto.nombre}" al catálogo.`,
    data.ip,
    data.dispositivo
  );
 
  return nuevoProducto;
};

export const obtenerProducto = async (usuarioId: string, productoId: string) => {
  return obtenerProductoDeUsuario(usuarioId, productoId);
};

export const obtenerProductos = async (usuarioId: string, filtros: GetProductsInput) => {
  const bot = await obtenerBotDeUsuario(usuarioId);
 
  const { buscar, activo, page, limit } = filtros;
 
  const where = {
    botId: bot.id,
    ...(activo !== undefined ? { activo: activo === 'true' } : {}),
    ...(buscar && buscar.trim().length > 0
      ? { nombre: { contains: buscar.trim(), mode: 'insensitive' as const } }
      : {}),
  };
 
  const skip = (page - 1) * limit;
 
  const [productos, total] = await prisma.$transaction([
    prisma.producto.findMany({
      where,
      orderBy: { fechaCreacion: 'desc' },
      skip,
      take: limit,
    }),
    prisma.producto.count({ where }),
  ]);
 
  return {
    productos,
    total,
    page,
    limit,
    totalPaginas: Math.ceil(total / limit),
  };
};

export const actualizarProducto = async (data: UpdateProductInput) => {
  const productoExistente = await obtenerProductoDeUsuario(data.usuarioId, data.productoId);

  const precioFinal = data.precio !== undefined ? data.precio : productoExistente.precio;
  const requiereCotizacionFinal = data.requiereCotizacion
    ?? productoExistente.requiereCotizacion;

  if (!requiereCotizacionFinal && Number(precioFinal) <= 0) {
    throw new Error('FIXED_PRICE_REQUIRED');
  }
 
  const productoActualizado = await prisma.producto.update({
    where: { id: data.productoId },
    data: {
      nombre: data.nombre ? data.nombre.trim() : productoExistente.nombre,
      descripcion: data.descripcion !== undefined ? data.descripcion?.trim() : productoExistente.descripcion,
      precio: precioFinal,
      requiereCotizacion: requiereCotizacionFinal,
      stock: data.stock !== undefined ? data.stock : productoExistente.stock,
      urlImagen: data.urlImagen !== undefined ? data.urlImagen?.trim() : productoExistente.urlImagen,
      activo: data.activo !== undefined ? data.activo : productoExistente.activo
    }
  });

   await registrarActividad(
    data.usuarioId,
    'EDICION_PRODUCTO',
    `El usuario actualizó el producto: "${productoActualizado.nombre}".`,
    data.ip,
    data.dispositivo
  );
 
  return productoActualizado;
};
 
export const eliminarProducto = async (data: DeleteProductInput) => {
  const productoExistente = await obtenerProductoDeUsuario(data.usuarioId, data.productoId);
 
  await prisma.producto.delete({ where: { id: data.productoId } });
 
  await registrarActividad(
    data.usuarioId,
    'ELIMINACION_PRODUCTO',
    `El usuario eliminó el producto: "${productoExistente.nombre}" del catálogo.`,
    data.ip,
    data.dispositivo
  );
};
