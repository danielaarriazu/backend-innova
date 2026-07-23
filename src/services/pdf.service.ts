import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface ItemPresupuesto {
  nombre: string;
  cantidad: number;
  precioUnitario: number; 
}

// Nueva interfaz para los datos del emprendedor
export interface DatosNegocio {
  nombre: string;
  telefono: string;
  horario: string;
  logoPath?: string; // Ruta local a la imagen del logo
  direccion?: string;
  email?: string;
}

export async function generarPresupuestoFormal(
  numeroPresupuesto: number,
  clienteNombre: string,
  clienteReferencia: string,
  items: ItemPresupuesto[],
  negocio: DatosNegocio,
  validezDias: number = 10
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Usamos márgenes más estrechos para aprovechar la hoja como en la imagen
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // --- 1. CONFIGURACIÓN DEL NOMBRE DEL ARCHIVO ---
    const fechaParaArchivo = new Date();
    // Formato DD-MM-YYYY
    const dia = fechaParaArchivo.getDate().toString().padStart(2, '0');
    const mes = (fechaParaArchivo.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaParaArchivo.getFullYear();
    const fechaString = `${dia}-${mes}-${anio}`;

    // Limpiamos el nombre del cliente: reemplazamos espacios por guiones bajos y quitamos caracteres especiales
    const nombreLimpio = clienteNombre.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    // Generamos el nombre final según tu formato
    const fileName = `presupuesto N${numeroPresupuesto} ${nombreLimpio}_${fechaString}.pdf`;
    const filePath = path.join(process.cwd(), fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- 1. ENCABEZADO (Logo y Fecha) ---
    const topY = 50;
    
    // Logo (si existe la ruta)
    if (negocio.logoPath && fs.existsSync(negocio.logoPath)) {
      doc.image(negocio.logoPath, 40, topY, { width: 100 });
    } else {
      // Placeholder si no hay logo (Color Secundario)
      doc.fillColor('#255F80').font('Helvetica-Bold').fontSize(24).text(negocio.nombre, 40, topY);
    }

    // Título "Presupuesto" subrayado debajo del logo (Color Secundario)
    doc.fillColor('#255F80').fontSize(12).font('Helvetica-Bold').text('Presupuesto', 40, topY + 70, { underline: true });

    // Fecha alineada a la derecha (Color Texto)
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date();
    const textoFecha = `Buenos Aires, ${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} de ${fechaActual.getFullYear()}`;
    
    doc.fillColor('#6C738E').fontSize(10).font('Helvetica-Bold').text(textoFecha, 200, topY + 70, { align: 'right' });
    doc.moveDown(2);

    // --- 2. DATOS DEL CLIENTE Y REFERENCIA ---
    const startClienteY = doc.y;
    // (Color Secundario para destacar al cliente)
    doc.fillColor('#255F80').font('Helvetica-Bold').text(`Para: ${clienteNombre}`, 40, startClienteY);
    doc.moveDown(0.5);
    
    // Referencia alineada a la derecha (Color Texto)
    const refY = doc.y;
    doc.fillColor('#6C738E').font('Helvetica-Bold').text(`Ref: ${clienteReferencia}`, 200, refY, { align: 'right' });
    doc.moveDown(1.5);

    // Texto introductorio (Color Texto)
    doc.fillColor('#6C738E').font('Helvetica');
    doc.text(`Este presupuesto tiene una vigencia de ${validezDias} días, a partir de la fecha de emisión.`, { align: 'left' });
    doc.moveDown(1);

    // --- 3. TABLA DE PRODUCTOS ---
    // Definimos las columnas (coordenadas X)
    const tableTop = doc.y;
    const colItemX = 40;
    const colCantX = 80;
    const colDescX = 130;
    const colUniX = 380;
    const colTotalX = 460;
    const tableWidth = 515; // Hasta el margen derecho (555)

    // Fondo para el encabezado (Color Primario)
    doc.rect(colItemX, tableTop, tableWidth, 20).fill('#13A8A2'); 
    
    // Textos del encabezado (Blanco puro)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
    const textY = tableTop + 5;
    doc.text('Item', colItemX, textY, { width: 40, align: 'center' });
    doc.text('Cant', colCantX, textY, { width: 50, align: 'center' });
    doc.text('Descripción', colDescX, textY, { width: 250, align: 'center' });
    doc.text('Unitario', colUniX, textY, { width: 80, align: 'center' });
    doc.text('Total', colTotalX, textY, { width: 95, align: 'center' });

    // Dibujar líneas verticales y bordes de la tabla (Color Chips)
    doc.strokeColor('#1372A8').lineWidth(1);
    doc.moveTo(colCantX, tableTop).lineTo(colCantX, tableTop + 20).stroke();
    doc.moveTo(colDescX, tableTop).lineTo(colDescX, tableTop + 20).stroke();
    doc.moveTo(colUniX, tableTop).lineTo(colUniX, tableTop + 20).stroke();
    doc.moveTo(colTotalX, tableTop).lineTo(colTotalX, tableTop + 20).stroke();
    doc.rect(colItemX, tableTop, tableWidth, 20).stroke(); // Borde exterior

    // Filas de datos
    let yPosition = tableTop + 20;
    let totalPresupuesto = 0;
    
    // Texto de los ítems (Color Secundario para buena legibilidad)
    doc.fillColor('#255F80').font('Helvetica').fontSize(9);

    items.forEach((item, index) => {
      const subtotal = item.cantidad * item.precioUnitario;
      totalPresupuesto += subtotal;

      const rowHeight = 25; // Altura fija por fila

      // Dibujar celda (borde horizontal inferior y borde exterior heredando el Color Chips)
      doc.rect(colItemX, yPosition, tableWidth, rowHeight).stroke();
      
      // Líneas verticales de la fila
      doc.moveTo(colCantX, yPosition).lineTo(colCantX, yPosition + rowHeight).stroke();
      doc.moveTo(colDescX, yPosition).lineTo(colDescX, yPosition + rowHeight).stroke();
      doc.moveTo(colUniX, yPosition).lineTo(colUniX, yPosition + rowHeight).stroke();
      doc.moveTo(colTotalX, yPosition).lineTo(colTotalX, yPosition + rowHeight).stroke();

      // Textos de la fila
      const cellTextY = yPosition + 7;
      doc.font('Helvetica-Bold').text((index + 1).toString(), colItemX, cellTextY, { width: 40, align: 'center' });
      doc.font('Helvetica-Bold').text(item.cantidad.toString(), colCantX, cellTextY, { width: 50, align: 'center' });
      
      doc.font('Helvetica-Bold').text(item.nombre, colDescX + 5, cellTextY, { width: 240, align: 'left' });
      
      // Formato moneda
      doc.font('Helvetica-Bold').text('$', colUniX + 5, cellTextY);
      doc.text(item.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 }), colUniX, cellTextY, { width: 70, align: 'right' });
      
      doc.text('$', colTotalX + 5, cellTextY);
      doc.text(subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 }), colTotalX, cellTextY, { width: 85, align: 'right' });

      yPosition += rowHeight;
    });

    // --- 4. PIE DE PÁGINA (Datos del Negocio) ---
    // Posicionamos el footer en la parte inferior de la página
    const footerY = 750;
    
    // Línea separadora del footer (Color Texto)
    doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).lineWidth(0.5).strokeColor('#6C738E').stroke();

    // Textos del footer (Color Texto)
    doc.fillColor('#6C738E').font('Helvetica').fontSize(8);
    
    // Construimos la línea de contacto
    const lineaContacto = `${negocio.nombre} - Tel./WhatsApp: ${negocio.telefono} - Horario: ${negocio.horario}`;
    doc.text(lineaContacto, 40, footerY, { align: 'center', width: 515 });
    
    if (negocio.direccion || negocio.email) {
      const lineaExtra = `${negocio.direccion ? negocio.direccion + ' - ' : ''}${negocio.email ? 'E-mail: ' + negocio.email : ''}`;
      doc.text(lineaExtra, 40, footerY + 12, { align: 'center', width: 515 });
    }

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}