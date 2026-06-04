import prisma from '../../config/db';
import { getMockProductos, getMockProducto } from '../../mocks/mock.data';

// — Métodos del UML: getNombre(), getPrecio(), hayStock(), isActivo() —

export const getNombre = (producto: { nombre: string }) => producto.nombre;
export const getPrecio = (producto: { precio: unknown }) =>
  producto.precio ? Number(producto.precio) : null;
export const hayStock = (producto: { stock: number | null }) =>
  producto.stock === null || producto.stock > 0;
export const isActivo = (producto: { activo: boolean }) => producto.activo;

export const listarProductos = async (usuarioId: number) => {
  try {
    const result = await prisma.producto.findMany({
      where: { usuarioId, activo: true },
      orderBy: { nombre: 'asc' },
    });
    return result.length > 0 ? result : getMockProductos(usuarioId);
  } catch {
    return getMockProductos(usuarioId);
  }
};

export const crearProducto = async (data: {
  usuarioId: number;
  nombre: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagenUrl?: string;
  activo?: boolean;
}) => {
  return prisma.producto.create({ data });
};

export const obtenerProducto = async (id: number) => {
  try {
    const result = await prisma.producto.findUnique({ where: { id } });
    return result ?? getMockProducto(id);
  } catch {
    return getMockProducto(id);
  }
};

export const actualizarProducto = async (id: number, data: Partial<{
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagenUrl: string;
  activo: boolean;
}>) => {
  return prisma.producto.update({ where: { id }, data });
};
