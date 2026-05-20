const express = require('express');
const app = express();
const PORT = 3000;

// Creamos una ruta principal (Endpoint)
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde mi nuevo servidor Express!');
});

// Le decimos al servidor que escuche en el puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});