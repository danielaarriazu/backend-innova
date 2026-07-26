export interface ItemCarrito {
  nombre?: string;
  cantidad: number;
  precio?: number;
  requiereCotizacion?: boolean;
}

// Define la estructura de los datos acumulados en memoria
export interface DatosAcumulados {
  nombre?: string;
  carrito?: ItemCarrito[];
  [key: string]: any; 
}

export interface DatosCliente {
  texto?: string;
  accion?: boolean;
  items?: ItemCarrito[];
  datosAcumulados?: DatosAcumulados;
}

export interface ChatbotPayload {
  accion: string;
  sessionId: string;
  botId: string;
  datosCliente?: DatosCliente;
  contexto?: string;
}