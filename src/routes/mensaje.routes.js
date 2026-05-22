const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mensaje.controller');

router.get('/consulta/:id_consulta', ctrl.getByConsulta);
router.post('/', ctrl.create);

module.exports = router;
