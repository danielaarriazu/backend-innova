export interface ItemPresupuesto {
  nombre: string;
  cantidad: number;
  precioUnitario: number; 
  requiereCotizacion?: boolean;
}

export interface DatosNegocio {
  nombre: string;
  telefono: string;
  horario: string;
  logoPath?: string; 
  direccion?: string;
  email?: string;
  colorPrimario?: string;
  colorSecundario?: string;
}