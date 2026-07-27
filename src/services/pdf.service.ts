import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
// Importamos las interfaces desde el nuevo archivo de tipos
import { ItemPresupuesto, DatosNegocio } from '../types/pdf.types'; 

export async function generarPresupuestoFormal(
  numeroPresupuesto: number,
  clienteNombre: string,
  clienteReferencia: string,
  items: ItemPresupuesto[],
  negocio: DatosNegocio,
  validezDias: number = 10
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // --- 1. CONFIGURACIÓN DEL ARCHIVO Y DIRECTORIO ---
    const fechaParaArchivo = new Date();
    const dia = fechaParaArchivo.getDate().toString().padStart(2, '0');
    const mes = (fechaParaArchivo.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaParaArchivo.getFullYear();
    const fechaString = `${dia}-${mes}-${anio}`;

    const nombreLimpio = clienteNombre.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const fileName = `presupuesto_N${numeroPresupuesto}_${nombreLimpio}_${fechaString}.pdf`;
    
    // Guardar en una subcarpeta temporal
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = path.join(tmpDir, fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- FUNCIONES AUXILIARES DE DIBUJO ---
    const dibujarEncabezadoTabla = (y: number) => {
      doc.rect(40, y, 515, 20).fill('#13A8A2'); 
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
      const textY = y + 5;
      doc.text('Item', 40, textY, { width: 40, align: 'center' });
      doc.text('Cant', 80, textY, { width: 50, align: 'center' });
      doc.text('Descripción', 130, textY, { width: 250, align: 'center' });
      doc.text('Unitario', 380, textY, { width: 80, align: 'center' });
      doc.text('Total', 460, textY, { width: 95, align: 'center' });

      doc.strokeColor('#1372A8').lineWidth(1);
      doc.moveTo(80, y).lineTo(80, y + 20).stroke();
      doc.moveTo(130, y).lineTo(130, y + 20).stroke();
      doc.moveTo(380, y).lineTo(380, y + 20).stroke();
      doc.moveTo(460, y).lineTo(460, y + 20).stroke();
      doc.rect(40, y, 515, 20).stroke(); 
      return y + 20;
    };

    const dibujarPieDePagina = () => {
      const footerY = 750;
      doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).lineWidth(0.5).strokeColor('#6C738E').stroke();
      doc.fillColor('#6C738E').font('Helvetica').fontSize(8);
      const lineaContacto = `${negocio.nombre} - Tel./WhatsApp: ${negocio.telefono} - Horario: ${negocio.horario}`;
      doc.text(lineaContacto, 40, footerY, { align: 'center', width: 515 });
      if (negocio.direccion || negocio.email) {
        const lineaExtra = `${negocio.direccion ? negocio.direccion + ' - ' : ''}${negocio.email ? 'E-mail: ' + negocio.email : ''}`;
        doc.text(lineaExtra, 40, footerY + 12, { align: 'center', width: 515 });
      }
    };

    // --- 2. ENCABEZADO Y DATOS ---
    const topY = 50;
    if (negocio.logoPath && fs.existsSync(negocio.logoPath)) {
      doc.image(negocio.logoPath, 40, topY, { width: 100 });
    } else {
      doc.fillColor('#255F80').font('Helvetica-Bold').fontSize(24).text(negocio.nombre, 40, topY);
    }

    doc.fillColor('#255F80').fontSize(12).font('Helvetica-Bold').text('Presupuesto', 40, topY + 70, { underline: true });

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const fechaActual = new Date();
    const textoFecha = `Buenos Aires, ${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} de ${fechaActual.getFullYear()}`;
    
    doc.fillColor('#6C738E').fontSize(10).font('Helvetica-Bold').text(textoFecha, 200, topY + 70, { align: 'right' });
    doc.moveDown(2);

    const startClienteY = doc.y;
    doc.fillColor('#255F80').font('Helvetica-Bold').text(`Para: ${clienteNombre}`, 40, startClienteY);
    doc.moveDown(0.5);
    
    const refY = doc.y;
    doc.fillColor('#6C738E').font('Helvetica-Bold').text(`Ref: ${clienteReferencia}`, 200, refY, { align: 'right' });
    doc.moveDown(1.5);

    doc.fillColor('#6C738E').font('Helvetica');
    doc.text(`Este presupuesto tiene una vigencia de ${validezDias} días, a partir de la fecha de emisión.`, { align: 'left' });
    doc.moveDown(1);

    // --- 3. TABLA DE PRODUCTOS ---
    let yPosition = dibujarEncabezadoTabla(doc.y);
    let totalPresupuesto = 0;
    
    doc.fillColor('#255F80').font('Helvetica').fontSize(9);

    items.forEach((item, index) => {
      // Paginación automática
      if (yPosition > 680) {
        dibujarPieDePagina();
        doc.addPage();
        yPosition = dibujarEncabezadoTabla(50);
        doc.fillColor('#255F80').font('Helvetica').fontSize(9);
      }

      const subtotal = item.cantidad * item.precioUnitario;
      totalPresupuesto += subtotal;
      const rowHeight = 25; 

      doc.rect(40, yPosition, 515, rowHeight).stroke();
      doc.moveTo(80, yPosition).lineTo(80, yPosition + rowHeight).stroke();
      doc.moveTo(130, yPosition).lineTo(130, yPosition + rowHeight).stroke();
      doc.moveTo(380, yPosition).lineTo(380, yPosition + rowHeight).stroke();
      doc.moveTo(460, yPosition).lineTo(460, yPosition + rowHeight).stroke();

      const cellTextY = yPosition + 7;
      doc.font('Helvetica-Bold').text((index + 1).toString(), 40, cellTextY, { width: 40, align: 'center' });
      doc.font('Helvetica-Bold').text(item.cantidad.toString(), 80, cellTextY, { width: 50, align: 'center' });
      doc.font('Helvetica-Bold').text(item.nombre, 135, cellTextY, { width: 240, align: 'left' });
      
      doc.font('Helvetica-Bold').text('$', 385, cellTextY);
      doc.text(item.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 }), 380, cellTextY, { width: 70, align: 'right' });
      
      doc.text('$', 465, cellTextY);
      doc.text(subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 }), 460, cellTextY, { width: 85, align: 'right' });

      yPosition += rowHeight;
    });

    // --- CÁLCULO Y RENDERIZADO DEL TOTAL A PAGAR ---
    doc.rect(380, yPosition, 175, 25).fill('#13A8A2').stroke();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11);
    doc.text('TOTAL', 380, yPosition + 7, { width: 80, align: 'center' });
    doc.text('$', 465, yPosition + 7);
    doc.text(totalPresupuesto.toLocaleString('es-AR', { minimumFractionDigits: 2 }), 460, yPosition + 7, { width: 85, align: 'right' });

    // --- 4. PIE DE PÁGINA FINAL ---
    dibujarPieDePagina();

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}