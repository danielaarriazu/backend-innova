import { generarPresupuestoFormal } from './src/services/pdf.service'; 

const itemsPrueba = [
  { nombre: 'Desarrollo Backend en Node.js', cantidad: 1, precioUnitario: 150000 },
  { nombre: 'Horas de consultoría técnica', cantidad: 5, precioUnitario: 12000 },
  { nombre: 'Mantenimiento mensual de servidor', cantidad: 1, precioUnitario: 35000 },
];

const misDatos = {
  nombre: 'Mi Emprendimiento Tech',
  telefono: '(54-11) 1234-5678',
  horario: 'Lunes a Viernes de 09:00 a 18:00 hs',
  // logoPath: './logo-prueba.png', // Descomentá esto si ponés una imagen en la carpeta
  email: 'ventas@miemprendimiento.com.ar',
  direccion: 'Lanús, Buenos Aires'
};

async function probar() {
  try {
    const ruta = await generarPresupuestoFormal(
      142, 
      'Secretaría General', 
      'Solicitud presupuesto para desarrollo', 
      itemsPrueba, 
      misDatos, 
      15
    );
    console.log(`✅ PDF generado con éxito en: ${ruta}`);
  } catch (error) {
    console.error('❌ Error generando el PDF:', error);
  }
}

probar();