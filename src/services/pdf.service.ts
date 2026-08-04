import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ItemPresupuesto, DatosNegocio } from '../types/pdf.types'; 

export async function generarPresupuestoFormal(
  numeroPresupuesto: number,
  clienteNombre: string,
  clienteTelefono: string, 
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
    const fechaString = `${dia}/${mes}/${anio}`; 

    const nombreLimpio = clienteNombre.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const fileName = `presupuesto_P-${numeroPresupuesto}_${nombreLimpio}_${fechaString.replace(/\//g, '-')}.pdf`;
    
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const filePath = path.join(tmpDir, fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // --- 2. ENCABEZADO CON DEGRADADO (GRADIENT) ---
    // Creamos un degradado horizontal de izquierda (x=40) a derecha (x=555)
    const colorPrimario = negocio.colorPrimario || '#13A8A2'; // Cyan/Teal
    const colorSecundario = negocio.colorSecundario || '#0A73B8'; // Azul EmprendeBot
    const headerGradient = doc.linearGradient(40, 40, 555, 40);
    headerGradient.stop(0, colorPrimario);
    headerGradient.stop(1, colorSecundario);

    doc.roundedRect(40, 40, 515, 80, 10).fill(headerGradient);
    
    // Textos del encabezado
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22);
    doc.text('EmprendeBot', 65, 55);
    
    doc.font('Helvetica').fontSize(11);
    doc.text('Asistente comercial', 65, 85);

    // --- 3. METADATOS DEL PRESUPUESTO ---
    const infoY = 150;
    doc.fillColor('#333333').fontSize(10);
    
    // Columna Izquierda
    doc.font('Helvetica-Bold').text('Presupuesto:', 40, infoY);
    doc.font('Helvetica').text(`P-${numeroPresupuesto}`, 120, infoY);
    
    doc.font('Helvetica-Bold').text('Fecha:', 40, infoY + 20);
    doc.font('Helvetica').text(fechaString, 120, infoY + 20);
    
    // Columna Derecha
    doc.font('Helvetica-Bold').text('Cliente:', 415, infoY);
    doc.font('Helvetica').text(clienteNombre || 'Sin registrar', 465, infoY, { width: 90 });
    
    doc.font('Helvetica-Bold').text('Teléfono:', 415, infoY + 20);
    doc.font('Helvetica').text(clienteTelefono || 'No informado', 465, infoY + 20, { width: 90 });
    // --- 4. ENCABEZADO DE LA TABLA ---
    let yPosition = 230;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666');
    doc.text('CONCEPTO', 40, yPosition);
    doc.text('CANT.', 320, yPosition, { width: 40, align: 'center' });
    doc.text('PRECIO', 380, yPosition, { width: 80, align: 'right' });
    doc.text('TOTAL', 475, yPosition, { width: 80, align: 'right' });
    
    // Línea separadora del encabezado
    yPosition += 15;
    doc.moveTo(40, yPosition).lineTo(555, yPosition).lineWidth(1).strokeColor('#E2E8F0').stroke();
    yPosition += 15;

    // --- 5. FILAS DE PRODUCTOS ---
    let totalPresupuesto = 0;
    let requireCotizacion = false;

    doc.font('Helvetica').fontSize(10).fillColor('#333333');

    items.forEach((item) => {
      // Paginación automática si nos quedamos sin espacio
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50; 
        doc.font('Helvetica').fontSize(10).fillColor('#333333');
      }

      const formatCurrency = (val: number) => `$${val.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;

      let textoNombre = item.nombre;
      let textoPrecio= '';
      let textoSubtotal = '';

      if (item.requiereCotizacion) {
        requireCotizacion = true;
        textoNombre = `${item.nombre} *`;
        textoPrecio = 'A cotizar';
        textoSubtotal = 'A cotizar';
      } else {
        const subtotal = item.cantidad * item.precioUnitario;
        totalPresupuesto += subtotal;
        textoPrecio = formatCurrency(item.precioUnitario);
        textoSubtotal = formatCurrency(subtotal);
      }

      doc.text(textoNombre, 40, yPosition, { width: 270 });
      doc.text(item.cantidad.toString(), 320, yPosition, { width: 40, align: 'center' });
      doc.text(textoPrecio, 380, yPosition, { width: 80, align: 'right' });
      doc.text(textoSubtotal, 475, yPosition, { width: 80, align: 'right' });

      yPosition += 25; 
    });

    // --- 6. CAJA DE ADVERTENCIA (AMARILLA) ---
    if (requireCotizacion) {
    yPosition += 10;
    doc.roundedRect(40, yPosition, 515, 45, 8).fill('#FFF9E6');
    
    // En lugar del emoji (que rompe la fuente), dibujamos un punto rojo sutil
    doc.circle(70, yPosition + 22, 3).fill('#EF4444'); 
    
    doc.fillColor('#B38600').font('Helvetica').fontSize(9);
    doc.text(
      'Los ítems marcados con un asterisco requieren una evaluación previa. Una vez realizada, te enviaremos una cotizacion personalizada.', 
      80, 
      yPosition + 18, 
      { width: 435, align: 'center' }
    );
    yPosition += 75;
  } else {
    yPosition += 10;
  }

    // --- 7. TOTALIZADOR ---
    doc.moveTo(40, yPosition).lineTo(555, yPosition).lineWidth(2).strokeColor('#2A3441').stroke();
    yPosition += 20;

    let etiquetaIzquierda = 'Total estimado';
    let textoMontoDerecha = '';
    let mostrarAclaracionMixta = false;

    if (requireCotizacion && totalPresupuesto === 0) {
      textoMontoDerecha = 'A cotizar';
    } else if (requireCotizacion && totalPresupuesto > 0) {
      etiquetaIzquierda = 'Subtotal parcial';
      textoMontoDerecha = `$${totalPresupuesto.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
      mostrarAclaracionMixta = true;
    } else {
      textoMontoDerecha = `$${totalPresupuesto.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
    }

    doc.fillColor('#2A3441').font('Helvetica-Bold').fontSize(14);
    doc.text(etiquetaIzquierda, 40, yPosition);

    doc.fillColor(colorPrimario).text(
      textoMontoDerecha,
      355, 
      yPosition, 
      { width: 200, align: 'right' }
    );

    if (mostrarAclaracionMixta) {
      yPosition += 18;
      doc.fillColor('#666666').font('Helvetica').fontSize(9);
      doc.text(
        ' * El subtotal parcial no incluye los productos a cotizar, cuyos precios finales se determinarán tras la evaluación.',
        40,
        yPosition,
        { width: 515, align: 'center' }
      );
    }

    // --- 8. PIE DE PÁGINA CENTRADO PERFECTAMENTE ---
    const footerY = 700; 
    
    doc.fillColor('#2A3441').font('Helvetica-Bold').fontSize(9);
    doc.text('Información importante', 40, footerY, { align: 'center', width: 515 });
    
    doc.font('Helvetica').fontSize(8).fillColor('#6C738E');
    doc.text('• El envío no está incluido en el presupuesto.', 40, footerY + 14, { align: 'center', width: 515 });
    doc.text('• Los precios están sujetos a modificaciones sin previo aviso.', 40, footerY + 26, { align: 'center', width: 515 });

    // Nombre del negocio
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#2A3441');
    doc.text(negocio.nombre || 'Nombre del Negocio', 40, footerY + 50, { align: 'center', width: 515 });

    // Bloques de contacto centrados (Cajas invisibles con alineación central)
    // El centro de la hoja es ~300. Posicionamos las cajas a los costados del centro.
    
    // Caja izquierda: WhatsApp
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#2A3441');
    doc.text('WhatsApp', 145, footerY + 70, { width: 150, align: 'center' });
    doc.font('Helvetica').fillColor('#6C738E');
    doc.text(negocio.telefono || 'No informado', 145, footerY + 82, { width: 150, align: 'center' });

    // Caja derecha: Horario
    doc.font('Helvetica-Bold').fillColor('#2A3441');
    doc.text('Horario', 300, footerY + 70, { width: 150, align: 'center' });
    doc.font('Helvetica').fillColor('#6C738E');
    doc.text(negocio.horario || 'Consultar', 300, footerY + 82, { width: 150, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
}